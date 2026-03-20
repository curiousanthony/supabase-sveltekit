import { getSupabaseAdmin } from '$lib/server/supabase-admin';

function getAdmin() {
	const admin = getSupabaseAdmin();
	if (!admin) throw new Error('Supabase admin client not configured');
	return admin;
}

export interface UploadResult {
	storagePath: string;
	publicUrl?: string;
}

const BUCKETS = {
	questDocuments: 'quest-documents',
	invoices: 'formation-invoices',
	signatures: 'emargement-signatures'
} as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadQuestDocument(
	file: File,
	subActionId: string
): Promise<UploadResult> {
	if (file.size > MAX_FILE_SIZE) {
		throw new Error('Le fichier dépasse la taille maximale de 10 Mo');
	}

	const ext = file.name.split('.').pop() ?? 'bin';
	const storagePath = `${subActionId}/${Date.now()}.${ext}`;

	const admin = getAdmin();
	const { error } = await admin.storage
		.from(BUCKETS.questDocuments)
		.upload(storagePath, file, {
			contentType: file.type,
			upsert: true
		});

	if (error) throw new Error(`Erreur d'upload: ${error.message}`);

	return { storagePath };
}

export async function deleteQuestDocument(storagePath: string): Promise<void> {
	const admin = getAdmin();
	const { error } = await admin.storage
		.from(BUCKETS.questDocuments)
		.remove([storagePath]);

	if (error) throw new Error(`Erreur de suppression: ${error.message}`);
}

export async function getQuestDocumentUrl(storagePath: string): Promise<string> {
	const admin = getAdmin();
	const { data } = await admin.storage
		.from(BUCKETS.questDocuments)
		.createSignedUrl(storagePath, 3600);

	if (!data?.signedUrl) throw new Error('Impossible de générer le lien');
	return data.signedUrl;
}

export async function uploadInvoicePdf(
	file: File,
	invoiceId: string
): Promise<UploadResult> {
	if (file.size > MAX_FILE_SIZE) {
		throw new Error('Le fichier dépasse la taille maximale de 10 Mo');
	}

	const storagePath = `${invoiceId}/${Date.now()}.pdf`;

	const admin = getAdmin();
	const { error } = await admin.storage
		.from(BUCKETS.invoices)
		.upload(storagePath, file, {
			contentType: 'application/pdf',
			upsert: true
		});

	if (error) throw new Error(`Erreur d'upload: ${error.message}`);

	return { storagePath };
}

export async function getInvoiceDocumentUrl(storagePath: string): Promise<string> {
	const admin = getAdmin();
	const { data } = await admin.storage
		.from(BUCKETS.invoices)
		.createSignedUrl(storagePath, 3600);

	if (!data?.signedUrl) throw new Error('Impossible de générer le lien');
	return data.signedUrl;
}

export async function uploadSignatureImage(
	dataUrl: string,
	emargementId: string
): Promise<UploadResult> {
	const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
	const buffer = Buffer.from(base64Data, 'base64');
	const storagePath = `${emargementId}/${Date.now()}.png`;

	const admin = getAdmin();
	const { error } = await admin.storage
		.from(BUCKETS.signatures)
		.upload(storagePath, buffer, {
			contentType: 'image/png',
			upsert: true
		});

	if (error) throw new Error(`Erreur d'upload signature: ${error.message}`);

	const { data: urlData } = admin.storage
		.from(BUCKETS.signatures)
		.getPublicUrl(storagePath);

	return { storagePath, publicUrl: urlData.publicUrl };
}

export async function deleteStorageFile(bucket: keyof typeof BUCKETS, path: string): Promise<void> {
	const admin = getAdmin();
	const { error } = await admin.storage
		.from(BUCKETS[bucket])
		.remove([path]);

	if (error) throw new Error(`Erreur de suppression: ${error.message}`);
}

export function validateFileType(file: File, acceptedTypes: string[] | null): boolean {
	if (!acceptedTypes || acceptedTypes.length === 0) return true;

	return acceptedTypes.some((type) => {
		if (type.endsWith('/*')) {
			const prefix = type.slice(0, -2);
			return file.type.startsWith(prefix);
		}
		return file.type === type;
	});
}
