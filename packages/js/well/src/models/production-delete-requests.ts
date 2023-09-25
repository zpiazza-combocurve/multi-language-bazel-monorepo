import { Resolution } from './resolution';

// These interfaces were taken from internal-api\src\wells\shared.ts
// TODO: refactor internal-api to use this copy of the file and delete the original
export interface IDeleteAllProductionData {
	monthly: boolean;
	daily: boolean;
	wells: string[];
}

export interface IDeleteSelectedProductionData {
	resolution: Resolution;
	deletions: {
		[key: string]: number[]; // well id with bucket indices to delete
	};
}

export interface IDeleteWithInputProductionData {
	monthly: boolean;
	daily: boolean;
	wells: string[];
	range?: {
		start: Date;
		end: Date;
	};
	relative?: {
		offset: number;
		units: 'day' | 'month' | 'year';
		wellHeaderField: string;
	};
}
