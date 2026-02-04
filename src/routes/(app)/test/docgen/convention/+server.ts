import { buildConventionPdf } from '$lib/docgen/pdf.js';
import { dummyFormationDocData } from '$lib/docgen/dummy-data.js';

/**
 * GET /test/docgen/convention
 * Generates the Convention de formation PDF with dummy data (no storage).
 * Query: ?download=1 to force download (Content-Disposition: attachment).
 */
export const GET = async ({ url }) => {
	const pdfBytes = buildConventionPdf(dummyFormationDocData);
	const forceDownload = url.searchParams.get('download') === '1';

	return new Response(pdfBytes, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': forceDownload
				? 'attachment; filename="convention-formation.pdf"'
				: 'inline; filename="convention-formation.pdf"'
		}
	});
};
