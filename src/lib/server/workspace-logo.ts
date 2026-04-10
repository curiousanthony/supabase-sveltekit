import sharp from 'sharp';

/** Matches upload route MIME allowlist (Sharp `metadata().format`). */
const SUPPORTED_SHARP_INPUT = new Set(['jpeg', 'png', 'webp', 'svg']);

const MAX_EDGE_PX = 512;

export class WorkspaceLogoProcessingError extends Error {
	readonly code: 'invalid' | 'processing';

	constructor(message: string, code: 'invalid' | 'processing') {
		super(message);
		this.name = 'WorkspaceLogoProcessingError';
		this.code = code;
	}
}

/**
 * Resize and normalize a workspace logo to PNG for storage, PDFKit, and email footers.
 * Caller must enforce max input size and MIME allowlist.
 */
export async function processWorkspaceLogoUpload(input: Buffer): Promise<Buffer> {
	if (!input.length) {
		throw new WorkspaceLogoProcessingError('Fichier image invalide.', 'invalid');
	}

	let meta: sharp.Metadata;
	try {
		meta = await sharp(input, { failOn: 'truncated' }).metadata();
	} catch {
		throw new WorkspaceLogoProcessingError(
			'Image illisible ou corrompue. Utilisez JPEG, PNG, WebP ou SVG.',
			'invalid'
		);
	}

	const fmt = meta.format;
	if (!fmt || !SUPPORTED_SHARP_INPUT.has(fmt)) {
		throw new WorkspaceLogoProcessingError(
			'Format non pris en charge. Utilisez JPEG, PNG, WebP ou SVG.',
			'invalid'
		);
	}

	try {
		const { data, info } = await sharp(input, { failOn: 'truncated' })
			.rotate()
			.resize({
				width: MAX_EDGE_PX,
				height: MAX_EDGE_PX,
				fit: 'inside',
				withoutEnlargement: true
			})
			.png({ compressionLevel: 9, effort: 10 })
			.toBuffer({ resolveWithObject: true });

		if (info.width < 1 || info.height < 1) {
			throw new WorkspaceLogoProcessingError('Image invalide.', 'invalid');
		}
		return data;
	} catch (e) {
		if (e instanceof WorkspaceLogoProcessingError) throw e;
		console.error('[workspace-logo] Sharp processing error:', e);
		throw new WorkspaceLogoProcessingError(
			"Impossible de traiter l'image. Essayez une autre photo ou exportez en PNG.",
			'processing'
		);
	}
}
