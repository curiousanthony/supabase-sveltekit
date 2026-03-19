import type { SupabaseClient } from '@supabase/supabase-js';

export interface UploadResult {
	storagePath: string;
	publicUrl?: string;
}

export async function uploadQuestDocument(
	supabase: SupabaseClient,
	file: File,
	subActionId: string
): Promise<UploadResult> {
	const ext = file.name.split('.').pop() ?? 'bin';
	const storagePath = `${subActionId}/${Date.now()}.${ext}`;

	const { error } = await supabase.storage
		.from('quest-documents')
		.upload(storagePath, file, { upsert: true });

	if (error) throw new Error(`Upload failed: ${error.message}`);

	return { storagePath };
}

export async function deleteQuestDocument(
	supabase: SupabaseClient,
	storagePath: string
): Promise<void> {
	const { error } = await supabase.storage.from('quest-documents').remove([storagePath]);
	if (error) throw new Error(`Delete failed: ${error.message}`);
}

export async function getQuestDocumentUrl(
	supabase: SupabaseClient,
	storagePath: string
): Promise<string> {
	const { data, error } = await supabase.storage
		.from('quest-documents')
		.createSignedUrl(storagePath, 3600);
	if (error || !data?.signedUrl) throw new Error('Could not generate download URL');
	return data.signedUrl;
}

export async function uploadInvoicePdf(
	supabase: SupabaseClient,
	file: File,
	invoiceId: string
): Promise<UploadResult> {
	const storagePath = `${invoiceId}/${Date.now()}.pdf`;

	const { error } = await supabase.storage
		.from('formation-invoices')
		.upload(storagePath, file, { upsert: true });

	if (error) throw new Error(`Upload failed: ${error.message}`);

	return { storagePath };
}

export async function uploadSignatureImage(
	supabase: SupabaseClient,
	dataUrl: string,
	emargementId: string
): Promise<UploadResult> {
	const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
	const buffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
	const storagePath = `${emargementId}/${Date.now()}.png`;

	const { error } = await supabase.storage
		.from('emargement-signatures')
		.upload(storagePath, buffer, { contentType: 'image/png', upsert: true });

	if (error) throw new Error(`Signature upload failed: ${error.message}`);

	const {
		data: { publicUrl }
	} = supabase.storage.from('emargement-signatures').getPublicUrl(storagePath);

	return { storagePath, publicUrl };
}
