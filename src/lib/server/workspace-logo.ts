import sharp from 'sharp';

/** Matches upload route MIME allowlist (Sharp `metadata().format`). */
const SUPPORTED_SHARP_INPUT = new Set(['jpeg', 'png', 'webp', 'svg']);

const MAX_EDGE_PX = 512;
/** Cap decoded pixels before resize to limit Sharp CPU/memory (decompression bombs). */
const LIMIT_INPUT_PIXELS = 4096 * 4096;

/**
 * Extract the storage object path for a workspace logo public URL.
 * Returns null if the URL does not point at `bucketId` or the key is not under this workspace.
 */
export function resolveWorkspaceLogoStorageObjectPath(
	logoUrl: string,
	bucketId: string,
	workspaceId: string
): string | null {
	const marker = `/${bucketId}/`;
	const idx = logoUrl.indexOf(marker);
	if (idx === -1) return null;
	let pathPart = logoUrl.slice(idx + marker.length);
	const q = pathPart.indexOf('?');
	if (q !== -1) pathPart = pathPart.slice(0, q);
	let path: string;
	try {
		path = decodeURIComponent(pathPart);
	} catch {
		return null;
	}
	if (!path || path.includes('..')) return null;
	const expectedPrefix = `${workspaceId}/`;
	if (!path.startsWith(expectedPrefix)) return null;
	const rest = path.slice(expectedPrefix.length);
	if (!rest || rest.includes('/')) return null;
	return path;
}

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
		meta = await sharp(input, {
			failOn: 'truncated',
			limitInputPixels: LIMIT_INPUT_PIXELS
		}).metadata();
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
		const { data, info } = await sharp(input, {
			failOn: 'truncated',
			limitInputPixels: LIMIT_INPUT_PIXELS
		})
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
