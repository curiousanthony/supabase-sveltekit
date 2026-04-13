import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyCronSecret } from '$lib/server/cron-auth';
import { dailyJobs, type CronJobResult } from '$lib/server/cron-jobs';

export const GET: RequestHandler = async ({ request }) => {
	if (!verifyCronSecret(request)) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const results: CronJobResult[] = [];

	for (const job of dailyJobs) {
		try {
			const result = await job.run();
			results.push(result);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			console.error(`[cron/daily] Job "${job.name}" crashed:`, err);
			results.push({ name: job.name, processed: 0, errors: 1, details: [`Crash: ${message}`] });
		}
	}

	return json({ ok: true, results });
};
