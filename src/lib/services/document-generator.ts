import { db } from '$lib/db';
import { formations, formationDocuments, workspaces, contacts, formateurs, modules, seances, emargements } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSupabaseAdmin } from '$lib/server/supabase-admin';
import { buildConvention, type ConventionData } from './document-templates/convention';
import { buildConvocation, type ConvocationData } from './document-templates/convocation';
import { buildCertificat, type CertificatData } from './document-templates/certificat';
import type { WorkspaceIdentity, FormationData, ClientData, LearnerData } from './document-templates/shared';

export type DocumentType =
	| 'convention'
	| 'convocation'
	| 'feuille_emargement'
	| 'certificat'
	| 'attestation'
	| 'devis'
	| 'ordre_mission';

const BUCKET = 'formation-documents';

export interface GenerateDocumentResult {
	documentId: string;
	storagePath: string;
}

async function fetchWorkspaceIdentity(workspaceId: string): Promise<WorkspaceIdentity> {
	const ws = await db.query.workspaces.findFirst({
		where: eq(workspaces.id, workspaceId),
		columns: {
			name: true,
			legalName: true,
			siret: true,
			address: true,
			city: true,
			postalCode: true,
			phone: true,
			email: true,
			website: true,
			nda: true,
			signatoryName: true,
			signatoryRole: true,
			showReferralCta: true,
			logoUrl: true
		}
	});

	if (!ws) throw new Error('Workspace introuvable');

	let logoBase64: string | null = null;
	if (ws.logoUrl) {
		try {
			const admin = getSupabaseAdmin();
			if (admin) {
				const pathMatch = ws.logoUrl.match(/workspace-logos\/(.+)$/);
				if (pathMatch) {
					const { data } = await admin.storage
						.from('workspace-logos')
						.download(pathMatch[1]);
					if (data) {
						const buffer = await data.arrayBuffer();
						const base64 = Buffer.from(buffer).toString('base64');
						const mimeType = data.type || 'image/png';
						logoBase64 = `data:${mimeType};base64,${base64}`;
					}
				}
			}
		} catch {
			// Logo fetch failed — continue without it
		}
	}

	return {
		name: ws.name,
		legalName: ws.legalName,
		siret: ws.siret,
		address: ws.address,
		city: ws.city,
		postalCode: ws.postalCode,
		phone: ws.phone,
		email: ws.email,
		website: ws.website,
		nda: ws.nda,
		signatoryName: ws.signatoryName,
		signatoryRole: ws.signatoryRole,
		showReferralCta: ws.showReferralCta ?? true,
		logoBase64
	};
}

async function fetchFormationData(formationId: string): Promise<{
	formation: FormationData;
	workspaceId: string;
	client: ClientData | null;
	moduleList: { name: string; duree: number | null }[];
}> {
	const f = await db.query.formations.findFirst({
		where: eq(formations.id, formationId),
		columns: {
			name: true,
			description: true,
			dateDebut: true,
			dateFin: true,
			duree: true,
			modalite: true,
			location: true,
			type: true,
			objectifs: true,
			prerequis: true,
			publicVise: true,
			workspaceId: true,
			prixTotal: true,
			prixParJour: true
		},
		with: {
			client: {
				columns: { name: true, legalName: true, siret: true }
			},
			modules: {
				columns: { name: true, duree: true },
				orderBy: (m, { asc }) => [asc(m.orderIndex)]
			}
		}
	});

	if (!f) throw new Error('Formation introuvable');

	return {
		formation: {
			name: f.name ?? '—',
			description: f.description,
			dateDebut: f.dateDebut,
			dateFin: f.dateFin,
			duree: f.duree,
			modalite: f.modalite,
			location: f.location,
			type: f.type,
			objectifs: f.objectifs,
			prerequis: f.prerequis,
			publicVise: f.publicVise
		},
		workspaceId: f.workspaceId,
		client: f.client
			? {
					name: f.client.name ?? '—',
					legalName: f.client.legalName ?? null,
					siret: f.client.siret ?? null,
					address: null
				}
			: null,
		moduleList: (f.modules ?? []).map((m) => ({ name: m.name ?? '—', duree: m.duree }))
	};
}

async function generatePdfBuffer(docDefinition: import('pdfmake/interfaces').TDocumentDefinitions): Promise<Buffer> {
	const PdfPrinter = (await import('pdfmake')).default;

	const printer = new PdfPrinter({
		Helvetica: {
			normal: 'Helvetica',
			bold: 'Helvetica-Bold',
			italics: 'Helvetica-Oblique',
			bolditalics: 'Helvetica-BoldOblique'
		}
	});

	const pdfDoc = printer.createPdfKitDocument(docDefinition);

	return new Promise<Buffer>((resolve, reject) => {
		const chunks: Uint8Array[] = [];
		pdfDoc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
		pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
		pdfDoc.on('error', reject);
		pdfDoc.end();
	});
}

async function uploadToStorage(
	buffer: Buffer,
	formationId: string,
	type: string,
	suffix?: string
): Promise<string> {
	const admin = getSupabaseAdmin();
	if (!admin) throw new Error('Supabase admin not configured');

	const timestamp = Date.now();
	const fileName = suffix
		? `${formationId}/${type}_${suffix}_${timestamp}.pdf`
		: `${formationId}/${type}_${timestamp}.pdf`;

	const { error } = await admin.storage.from(BUCKET).upload(fileName, buffer, {
		contentType: 'application/pdf',
		upsert: false
	});

	if (error) throw new Error(`Upload failed: ${error.message}`);
	return fileName;
}

export async function generateDocument(
	type: DocumentType,
	formationId: string,
	userId: string,
	options?: { contactId?: string; formateurId?: string; seanceId?: string }
): Promise<GenerateDocumentResult> {
	const { formation, workspaceId, client, moduleList } = await fetchFormationData(formationId);
	const workspace = await fetchWorkspaceIdentity(workspaceId);

	let docDefinition: import('pdfmake/interfaces').TDocumentDefinitions;
	let title: string;
	let relatedContactId: string | null = options?.contactId ?? null;
	let relatedFormateurId: string | null = options?.formateurId ?? null;
	let relatedSeanceId: string | null = options?.seanceId ?? null;
	let suffix: string | undefined;

	switch (type) {
		case 'convention': {
			if (!client) throw new Error('Client requis pour générer une convention');

			const apprenantCount = await db.query.contacts.findMany({
				where: eq(contacts.id, formationId)
			});

			const conventionData: ConventionData = {
				workspace,
				formation,
				client,
				pricing: {
					prixTotal: null,
					prixParJour: null,
					nbParticipants: apprenantCount.length || null
				},
				modules: moduleList
			};
			docDefinition = buildConvention(conventionData);
			title = `Convention - ${formation.name}`;
			break;
		}

		case 'convocation': {
			if (!options?.contactId) throw new Error('Contact ID requis pour la convocation');

			const contact = await db.query.contacts.findFirst({
				where: eq(contacts.id, options.contactId),
				columns: { firstName: true, lastName: true, email: true }
			});
			if (!contact) throw new Error('Contact introuvable');

			const formationSeances = await db.query.seances.findMany({
				where: eq(seances.formationId, formationId),
				columns: { startAt: true, endAt: true, location: true },
				orderBy: (s, { asc }) => [asc(s.startAt)]
			});

			const convocationData: ConvocationData = {
				workspace,
				formation,
				learner: contact,
				seances: formationSeances.map((s) => ({
					date: s.startAt.slice(0, 10),
					startTime: new Date(s.startAt).toLocaleTimeString('fr-FR', {
						hour: '2-digit',
						minute: '2-digit'
					}),
					endTime: new Date(s.endAt).toLocaleTimeString('fr-FR', {
						hour: '2-digit',
						minute: '2-digit'
					}),
					location: s.location
				}))
			};
			docDefinition = buildConvocation(convocationData);
			title = `Convocation - ${contact.firstName ?? ''} ${contact.lastName ?? ''} - ${formation.name}`;
			suffix = options.contactId.slice(0, 8);
			break;
		}

		case 'certificat': {
			if (!options?.contactId) throw new Error('Contact ID requis pour le certificat');

			const contact = await db.query.contacts.findFirst({
				where: eq(contacts.id, options.contactId),
				columns: { firstName: true, lastName: true, email: true }
			});
			if (!contact) throw new Error('Contact introuvable');

			const learnerEmargements = await db.query.emargements.findMany({
				where: and(
					eq(emargements.contactId, options.contactId)
				),
				columns: { signedAt: true, seanceId: true },
				with: {
					seance: {
						columns: { startAt: true, endAt: true, formationId: true }
					}
				}
			});

			const relevantEmargements = learnerEmargements.filter(
				(e) => e.seance?.formationId === formationId
			);

			let attendedHours = 0;
			for (const e of relevantEmargements) {
				if (e.signedAt && e.seance) {
					const hours =
						(new Date(e.seance.endAt).getTime() - new Date(e.seance.startAt).getTime()) /
						(1000 * 60 * 60);
					attendedHours += hours;
				}
			}

			const certificatData: CertificatData = {
				workspace,
				formation,
				learner: contact,
				attendance: {
					totalHours: formation.duree ?? 0,
					attendedHours: Math.round(attendedHours * 10) / 10
				}
			};
			docDefinition = buildCertificat(certificatData);
			title = `Certificat - ${contact.firstName ?? ''} ${contact.lastName ?? ''} - ${formation.name}`;
			suffix = options.contactId.slice(0, 8);
			break;
		}

		case 'feuille_emargement':
		case 'attestation':
		case 'devis':
		case 'ordre_mission':
			throw new Error(`Génération de type "${type}" pas encore implémentée`);
	}

	const pdfBuffer = await generatePdfBuffer(docDefinition);
	const storagePath = await uploadToStorage(pdfBuffer, formationId, type, suffix);

	const [doc] = await db
		.insert(formationDocuments)
		.values({
			formationId,
			type,
			title,
			status: 'draft',
			storagePath,
			generatedAt: new Date().toISOString(),
			generatedBy: userId,
			relatedContactId,
			relatedFormateurId,
			relatedSeanceId
		})
		.returning({ id: formationDocuments.id });

	return {
		documentId: doc.id,
		storagePath
	};
}

export async function getDocumentSignedUrl(storagePath: string, expiresIn = 3600): Promise<string> {
	const admin = getSupabaseAdmin();
	if (!admin) throw new Error('Supabase admin not configured');

	const { data, error } = await admin.storage
		.from(BUCKET)
		.createSignedUrl(storagePath, expiresIn);

	if (error || !data?.signedUrl) throw new Error('Failed to create signed URL');
	return data.signedUrl;
}
