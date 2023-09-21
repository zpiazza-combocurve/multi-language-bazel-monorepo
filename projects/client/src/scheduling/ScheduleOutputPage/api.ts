import { IServerSideGetRowsRequest } from 'ag-grid-community';

import { postApi } from '@/helpers/routing';

import { Resolution } from './ScheduleOutputGraphs/hooks/useOutputGraph';

export type WellOutput = {
	_id: string;
	output: {
		FPD: number;
		events: {
			activityStepIdx: number;
			activityStepName: string;
			demob: {
				end: number;
				start: number;
			};
			mob: {
				end: number;
				start: number;
			};
			resourceIdx: number;
			resourceName: string;
			work: {
				end: number;
				start: number;
			};
		}[];
	};
	well: { [key: string]: string };
};

type Outputs = { wells: WellOutput[] };

export type WellDeliveryData = {
	wellDeliveryData: {
		[key: string]: {
			[key: string]: number;
		};
	}[];
	filteredWellIds: string[];
	allPeriods: string[];
	highestValue: number;
};

export type WellsInProductionData = {
	wellsInProductionByPeriod: { [key: string]: string[] };
	allPeriods: string[];
};

export function getWellOutputs(
	scheduleId: Inpt.ObjectId<'schedule'>,
	wellIds: string[],
	request?: IServerSideGetRowsRequest
): Promise<Outputs> {
	return postApi(`/schedules/${scheduleId}/wellOutputs`, { request, wellIds });
}

export function getWellDeliveryData(
	scheduleId: Inpt.ObjectId<'schedule'>,
	wellIds: string[],
	resolution: Resolution
): Promise<WellDeliveryData> {
	return postApi(`/schedules/${scheduleId}/wellDeliveryData`, { wellIds, resolution });
}

export function getWellsInProduction(
	scheduleId: Inpt.ObjectId<'schedule'>,
	wellIds: string[],
	resolution: Resolution,
	timeRange?: { start: string; end: string }
): Promise<WellsInProductionData> {
	return postApi(`/schedules/${scheduleId}/wellsInProduction`, { wellIds, resolution, timeRange });
}
