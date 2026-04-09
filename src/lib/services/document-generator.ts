import { db } from '$lib/db';
import { formations, formationDocuments, formationApprenants, formationFormateurs, workspaces, contacts, formateurs, modules, seances, emargements } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSupabaseAdmin } from '$lib/server/supabase-admin';
import { buildConvention, type ConventionData } from './document-templates/convention';
import { buildConvocation, type ConvocationData } from './document-templates/convocation';
import { buildCertificat, type CertificatData } from './document-templates/certificat';
import { buildFeuilleEmargement, type FeuilleEmargementData, type EmargementEntry } from './document-templates/feuille-emargement';
import { buildDevis, type DevisData } from './document-templates/devis';
import { buildOrdreMission, type OrdreMissionData } from './document-templates/ordre-mission';
import {
	type WorkspaceIdentity,
	type FormationData,
	type ClientData,
	type LearnerData,
	fullName,
	formatDateFr,
	PDF_TIMEZONE
} from './document-templates/shared';

function assertNeverDocumentType(x: never): never {
	throw new Error(`Type de document non géré : ${String(x)}`);
}

interface PdfMakeModule {
	setFonts(fonts: Record<string, Record<string, string>>): void;
	createPdf(docDefinition: import('pdfmake/interfaces').TDocumentDefinitions): {
		getBuffer(): Promise<Buffer>;
	};
}

export type DocumentType =
	| 'convention'
	| 'convocation'
	| 'feuille_emargement'
	| 'certificat'
	| 'attestation'
	| 'devis'
	| 'ordre_mission';

const BUCKET = 'formation-documents';
const HOURS_PER_DAY = 7;

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
			logoUrl: true,
			tvaRate: true,
			defaultPaymentTerms: true,
			defaultDevisValidityDays: true,
			defaultCancellationTerms: true
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
						const mimeType = data.type || 'image/png';
						const supportedByPdfkit = mimeType === 'image/png' || mimeType === 'image/jpeg';
						if (supportedByPdfkit) {
							const buffer = await data.arrayBuffer();
							const base64 = Buffer.from(buffer).toString('base64');
							logoBase64 = `data:${mimeType};base64,${base64}`;
						}
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
		logoBase64,
		tvaRate: ws.tvaRate ? parseFloat(ws.tvaRate) : 20,
		defaultPaymentTerms: ws.defaultPaymentTerms ?? null,
		defaultDevisValidityDays: ws.defaultDevisValidityDays ?? 30,
		defaultCancellationTerms: ws.defaultCancellationTerms ?? null
	};
}

async function fetchFormationData(formationId: string): Promise<{
	formation: FormationData;
	workspaceId: string;
	client: ClientData | null;
	moduleList: { name: string; duree: number | null }[];
	prixConvenu: number | null;
	prixPublic: number | null;
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
			prixPublic: true,
			prixConvenu: true
		},
		with: {
			client: {
				columns: { legalName: true, siret: true }
			},
			company: {
				columns: { name: true, siret: true, address: true }
			},
			modules: {
				columns: { name: true, durationHours: true },
				orderBy: (m, { asc }) => [asc(m.orderIndex)]
			}
		}
	});

	if (!f) throw new Error('Formation introuvable');

	const client: ClientData | null = f.client
		? {
				name: f.client.legalName ?? '—',
				legalName: f.client.legalName ?? null,
				siret: f.client.siret != null ? String(f.client.siret) : null,
				address: null
			}
		: f.company
			? {
					name: f.company.name ?? '—',
					legalName: f.company.name ?? null,
					siret: f.company.siret ?? null,
					address: f.company.address ?? null
				}
			: null;

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
		client,
		moduleList: (f.modules ?? []).map((m) => ({
			name: m.name ?? '—',
			duree: m.durationHours ? parseFloat(m.durationHours) : null
		})),
		prixConvenu: f.prixConvenu ? parseFloat(f.prixConvenu) : null,
		prixPublic: f.prixPublic ? parseFloat(f.prixPublic) : null
	};
}

async function generatePdfBuffer(docDefinition: import('pdfmake/interfaces').TDocumentDefinitions): Promise<Buffer> {
	const { createRequire } = await import('node:module');
	const esmRequire = createRequire(import.meta.url);
	// pdfmake 0.3.7: CJS singleton with setFonts/createPdf/getBuffer API
	const pdfmake = esmRequire('pdfmake/js/index.js') as PdfMakeModule;

	pdfmake.setFonts({
		Helvetica: {
			normal: 'Helvetica',
			bold: 'Helvetica-Bold',
			italics: 'Helvetica-Oblique',
			bolditalics: 'Helvetica-BoldOblique'
		}
	});

	const doc = pdfmake.createPdf(docDefinition);
	return await doc.getBuffer();
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
	const { formation, workspaceId, client, moduleList, prixConvenu, prixPublic } = await fetchFormationData(formationId);
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

			const apprenants = await db.query.formationApprenants.findMany({
				where: eq(formationApprenants.formationId, formationId),
				columns: { id: true }
			});

			const prixTotal = prixConvenu ?? prixPublic ?? null;
			const prixParJour = prixTotal !== null && formation.duree
				? Math.round((prixTotal / (formation.duree / HOURS_PER_DAY)) * 100) / 100
				: null;

			const conventionData: ConventionData = {
				workspace,
				formation,
				client,
				pricing: {
					prixTotal,
					prixParJour,
					nbParticipants: apprenants.length || null
				},
				modules: moduleList
			};
			docDefinition = buildConvention(conventionData);
			title = `Convention - ${formation.name}`;
			break;
		}

		case 'convocation': {
			if (!options?.contactId) throw new Error('Contact ID requis pour la convocation');

			const enrollment = await db.query.formationApprenants.findFirst({
				where: and(eq(formationApprenants.formationId, formationId), eq(formationApprenants.contactId, options.contactId))
			});
			if (!enrollment) throw new Error('Ce contact n\'est pas inscrit à cette formation');

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
						minute: '2-digit',
						timeZone: PDF_TIMEZONE
					}),
					endTime: new Date(s.endAt).toLocaleTimeString('fr-FR', {
						hour: '2-digit',
						minute: '2-digit',
						timeZone: PDF_TIMEZONE
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

			const certEnrollment = await db.query.formationApprenants.findFirst({
				where: and(eq(formationApprenants.formationId, formationId), eq(formationApprenants.contactId, options.contactId))
			});
			if (!certEnrollment) throw new Error('Ce contact n\'est pas inscrit à cette formation');

			const contact = await db.query.contacts.findFirst({
				where: eq(contacts.id, options.contactId),
				columns: { firstName: true, lastName: true, email: true }
			});
			if (!contact) throw new Error('Contact introuvable');

			const certEmargementRows = await db
				.select({
					signedAt: emargements.signedAt,
					startAt: seances.startAt,
					endAt: seances.endAt
				})
				.from(emargements)
				.innerJoin(seances, eq(emargements.seanceId, seances.id))
				.where(
					and(eq(emargements.contactId, options.contactId), eq(seances.formationId, formationId))
				);

			let attendedHours = 0;
			for (const e of certEmargementRows) {
				if (e.signedAt) {
					const hours =
						(new Date(e.endAt).getTime() - new Date(e.startAt).getTime()) / (1000 * 60 * 60);
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

		case 'feuille_emargement': {
			if (!options?.seanceId) throw new Error('Séance requise pour la feuille d\'émargement');

			const seance = await db.query.seances.findFirst({
				where: and(eq(seances.id, options.seanceId), eq(seances.formationId, formationId)),
				columns: { id: true, startAt: true, endAt: true, location: true, formateurId: true }
			});
			if (!seance) throw new Error('Séance introuvable ou n\'appartient pas à cette formation');

			let formateurName: string | null = null;
			if (seance.formateurId) {
				const f = await db.query.formateurs.findFirst({
					where: eq(formateurs.id, seance.formateurId),
					with: { user: { columns: { firstName: true, lastName: true } } }
				});
				if (f?.user) formateurName = fullName(f.user.firstName, f.user.lastName);
			}

			const seanceEmargements = await db.query.emargements.findMany({
				where: eq(emargements.seanceId, options.seanceId),
				columns: { signedAt: true, signerType: true, period: true, contactId: true, formateurId: true },
				with: {
					contact: { columns: { firstName: true, lastName: true } },
					formateur: { with: { user: { columns: { firstName: true, lastName: true } } } }
				}
			});

			const entries: EmargementEntry[] = seanceEmargements.map((e) => {
				const name = e.signerType === 'apprenant' && e.contact
					? fullName(e.contact.firstName, e.contact.lastName)
					: e.signerType === 'formateur' && e.formateur?.user
						? fullName(e.formateur.user.firstName, e.formateur.user.lastName)
						: '—';
			return {
				name,
				contactId: e.contactId,
				signerType: e.signerType,
				period: e.period,
				signedAt: e.signedAt
			};
			});

			const emargementData: FeuilleEmargementData = {
				workspace,
				formation,
				seance: {
					date: seance.startAt.slice(0, 10),
					startAt: seance.startAt,
					endAt: seance.endAt,
					location: seance.location
				},
				formateurName,
				entries
			};
			docDefinition = buildFeuilleEmargement(emargementData);
			title = `Feuille d'émargement - ${formatDateFr(seance.startAt)} - ${formation.name}`;
			relatedSeanceId = options.seanceId;
			suffix = options.seanceId.slice(0, 8);
			break;
		}

		case 'devis': {
			if (!client) throw new Error('Client requis pour générer un devis');

			const devisApprenants = await db.query.formationApprenants.findMany({
				where: eq(formationApprenants.formationId, formationId),
				columns: { id: true }
			});

			const prixHT = prixConvenu ?? prixPublic ?? 0;
			const tvaRate = workspace.tvaRate;
			const tva = Math.round((prixHT * tvaRate / 100) * 100) / 100;
			const prixTTC = prixHT + tva;
			const prixParJourDevis = formation.duree
				? Math.round((prixHT / (formation.duree / HOURS_PER_DAY)) * 100) / 100
				: null;

			const devisData: DevisData = {
				workspace,
				formation,
				client,
				pricing: {
					prixHT,
					tvaRate,
					tva,
					prixTTC,
					prixParJour: prixParJourDevis,
					nbParticipants: devisApprenants.length || null
				},
				validityDays: workspace.defaultDevisValidityDays,
				paymentTerms: workspace.defaultPaymentTerms,
				cancellationTerms: workspace.defaultCancellationTerms,
				modules: moduleList,
				generatedAt: new Date().toISOString()
			};
			docDefinition = buildDevis(devisData);
			title = `Devis - ${formation.name}`;
			break;
		}

		case 'ordre_mission': {
			if (!options?.formateurId) throw new Error('Formateur requis pour l\'ordre de mission');

			const ff = await db.query.formationFormateurs.findFirst({
				where: and(
					eq(formationFormateurs.formationId, formationId),
					eq(formationFormateurs.formateurId, options.formateurId)
				),
				columns: { tjm: true, numberOfDays: true, deplacementCost: true, hebergementCost: true },
				with: {
					formateur: {
						columns: { id: true },
						with: { user: { columns: { firstName: true, lastName: true } } }
					}
				}
			});
			if (!ff) throw new Error('Ce formateur n\'est pas associé à cette formation');

			const formateurData = ff.formateur?.user
				? { firstName: ff.formateur.user.firstName, lastName: ff.formateur.user.lastName, specialite: null }
				: { firstName: null, lastName: null, specialite: null };

			const ordreMissionData: OrdreMissionData = {
				workspace,
				formation,
				formateur: formateurData,
				mission: {
					tjm: ff.tjm ? parseFloat(ff.tjm) : null,
					numberOfDays: ff.numberOfDays ? parseFloat(ff.numberOfDays) : null,
					deplacementCost: ff.deplacementCost ? parseFloat(ff.deplacementCost) : null,
					hebergementCost: ff.hebergementCost ? parseFloat(ff.hebergementCost) : null
				},
				modules: moduleList,
				generatedAt: new Date().toISOString()
			};
			docDefinition = buildOrdreMission(ordreMissionData);
			const fName = fullName(formateurData.firstName, formateurData.lastName);
			title = `Ordre de mission - ${fName} - ${formation.name}`;
			relatedFormateurId = options.formateurId;
			suffix = options.formateurId.slice(0, 8);
			break;
		}

		case 'attestation':
			throw new Error('Génération de type "attestation" pas encore implémentée');
		default:
			return assertNeverDocumentType(type);
	}

	const pdfBuffer = await generatePdfBuffer(docDefinition);
	const storagePath = await uploadToStorage(pdfBuffer, formationId, type, suffix);

	const [doc] = await db
		.insert(formationDocuments)
		.values({
			formationId,
			type,
			title,
			status: 'genere',
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
