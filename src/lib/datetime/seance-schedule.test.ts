import { describe, expect, it } from 'vitest';
import { seanceFormInputToUtcIso, seanceCalendarDateKeyParis } from './seance-schedule';

describe('seanceFormInputToUtcIso', () => {
	it('interprets naive datetime as Europe/Paris (CEST in April)', () => {
		const utc = seanceFormInputToUtcIso('2026-04-09T09:00:00');
		expect(utc).toMatch(/^2026-04-09T07:00:00/);
	});

	it('interprets naive datetime as Europe/Paris (CET in January)', () => {
		const utc = seanceFormInputToUtcIso('2026-01-15T09:00:00');
		expect(utc).toMatch(/^2026-01-15T08:00:00/);
	});

	it('passes through explicit Z as UTC instant', () => {
		const utc = seanceFormInputToUtcIso('2026-04-09T07:00:00Z');
		expect(utc).toBe('2026-04-09T07:00:00.000Z');
	});
});

describe('seanceCalendarDateKeyParis', () => {
	it('uses Paris civil date for the instant', () => {
		expect(seanceCalendarDateKeyParis('2026-04-09T07:00:00.000Z')).toBe('2026-04-09');
	});
});
