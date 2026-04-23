import {
	fromDate,
	parseDateTime,
	today,
	toCalendarDate,
	toZoned
} from '@internationalized/date';

/** Civil timezone for formation séances (France, DST-aware). */
export const FORMATION_SCHEDULE_TIMEZONE = 'Europe/Paris';

/**
 * Converts datetime strings from the séance UI into UTC ISO strings for `timestamptz`.
 * - Naive `YYYY-MM-DDTHH:mm:ss` (no offset) → wall time in {@link FORMATION_SCHEDULE_TIMEZONE}.
 * - Values with `Z` or a numeric UTC offset → absolute instant (unchanged semantics).
 */
export function seanceFormInputToUtcIso(input: string): string {
	const trimmed = input.trim();
	if (!trimmed) {
		throw new Error('Empty datetime');
	}
	if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(trimmed)) {
		const ms = Date.parse(trimmed);
		if (Number.isNaN(ms)) {
			throw new Error('Invalid absolute datetime');
		}
		return new Date(ms).toISOString();
	}
	const cdt = parseDateTime(trimmed);
	const zoned = toZoned(cdt, FORMATION_SCHEDULE_TIMEZONE);
	return zoned.toAbsoluteString();
}

/** `YYYY-MM-DD` calendar key for a stored instant, in {@link FORMATION_SCHEDULE_TIMEZONE}. */
export function seanceCalendarDateKeyParis(isoUtc: string): string {
	const z = fromDate(new Date(isoUtc), FORMATION_SCHEDULE_TIMEZONE);
	const c = toCalendarDate(z);
	return `${c.year}-${String(c.month).padStart(2, '0')}-${String(c.day).padStart(2, '0')}`;
}

/** Today's date key in {@link FORMATION_SCHEDULE_TIMEZONE} (for list/calendar grouping). */
export function todayCalendarKeyParis(): string {
	const t = today(FORMATION_SCHEDULE_TIMEZONE);
	return `${t.year}-${String(t.month).padStart(2, '0')}-${String(t.day).padStart(2, '0')}`;
}
