import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import {
	processWorkspaceLogoUpload,
	resolveWorkspaceLogoStorageObjectPath,
	WorkspaceLogoProcessingError
} from './workspace-logo';

describe('processWorkspaceLogoUpload', () => {
	it('returns PNG buffer for a small JPEG input', async () => {
		const jpeg = await sharp({
			create: {
				width: 120,
				height: 80,
				channels: 3,
				background: { r: 200, g: 100, b: 50 }
			}
		})
			.jpeg()
			.toBuffer();

		const out = await processWorkspaceLogoUpload(jpeg);
		expect(out.length).toBeGreaterThan(0);
		const meta = await sharp(out).metadata();
		expect(meta.format).toBe('png');
		expect(meta.width).toBeLessThanOrEqual(512);
		expect(meta.height).toBeLessThanOrEqual(512);
	});

	it('throws on empty buffer', async () => {
		await expect(processWorkspaceLogoUpload(Buffer.alloc(0))).rejects.toThrow(
			WorkspaceLogoProcessingError
		);
	});
});

describe('resolveWorkspaceLogoStorageObjectPath', () => {
	const bucket = 'workspace-logos';
	const ws = '11111111-1111-1111-1111-111111111111';

	it('returns object key when URL matches workspace prefix', () => {
		const url = `https://x.supabase.co/storage/v1/object/public/${bucket}/${ws}/abc.png`;
		expect(resolveWorkspaceLogoStorageObjectPath(url, bucket, ws)).toBe(`${ws}/abc.png`);
	});

	it('returns null for wrong workspace prefix', () => {
		const url = `https://x.supabase.co/storage/v1/object/public/${bucket}/other/abc.png`;
		expect(resolveWorkspaceLogoStorageObjectPath(url, bucket, ws)).toBeNull();
	});

	it('strips query string', () => {
		const url = `https://x.supabase.co/storage/v1/object/public/${bucket}/${ws}/abc.png?v=1`;
		expect(resolveWorkspaceLogoStorageObjectPath(url, bucket, ws)).toBe(`${ws}/abc.png`);
	});
});
