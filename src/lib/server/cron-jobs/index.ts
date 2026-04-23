import { generateEmargementJ1 } from './emargement-j1';

export interface CronJobResult {
	name: string;
	processed: number;
	errors: number;
	details: string[];
}

export interface CronJob {
	name: string;
	run: () => Promise<CronJobResult>;
}

export const dailyJobs: CronJob[] = [
	{
		name: 'emargement-j1',
		run: generateEmargementJ1
	}
];
