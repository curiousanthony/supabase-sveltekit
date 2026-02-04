import { jsPDF } from 'jspdf';
import type { FormationDocData } from './types.js';
import { CONVENTION_TEMPLATE } from './convention-template.js';

const PLACEHOLDER_REGEX = /\{(\w+)\}/g;

/**
 * Replaces {variable_name} placeholders in a string with values from data.
 */
export function replacePlaceholders(
	template: string,
	data: Record<string, string>
): string {
	return template.replace(PLACEHOLDER_REGEX, (_, key) => data[key] ?? `{${key}}`);
}

/**
 * Builds a PDF from the Convention de formation template filled with the given data.
 * Returns PDF as ArrayBuffer (no Supabase Storage used).
 */
export function buildConventionPdf(data: FormationDocData): ArrayBuffer {
	const text = replacePlaceholders(CONVENTION_TEMPLATE, data as unknown as Record<string, string>);

	const doc = new jsPDF({ unit: 'mm', format: 'a4' });
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	const margin = 20;
	const maxWidth = pageWidth - margin * 2;
	const lineHeight = 6;
	const fontSize = 10;
	const fontSizeTitle = 14;

	doc.setFontSize(fontSize);

	let y = margin;
	const lines = text.split('\n');

	for (const line of lines) {
		const isTitle = line === 'CONVENTION DE FORMATION PROFESSIONNELLE';
		if (isTitle) {
			doc.setFontSize(fontSizeTitle);
			doc.setFont('helvetica', 'bold');
		}

		const split = doc.splitTextToSize(line.trim() || ' ', maxWidth);
		for (const part of split) {
			if (y > pageHeight - margin) {
				doc.addPage();
				y = margin;
			}
			doc.text(part, margin, y);
			y += lineHeight;
		}

		if (isTitle) {
			doc.setFontSize(fontSize);
			doc.setFont('helvetica', 'normal');
			y += lineHeight * 0.5;
		}
	}

	return doc.output('arraybuffer');
}
