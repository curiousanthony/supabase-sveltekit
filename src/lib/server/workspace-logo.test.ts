import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { processWorkspaceLogoUpload, WorkspaceLogoProcessingError } from './workspace-logo';

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
