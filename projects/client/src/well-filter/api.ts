import { getApi, postApi } from '@/helpers/routing';
import { Filter } from '@/inpt-shared/filters/shared';

import { LightFilterWellsResponseModel } from './types';

export const lightFilterWells = (
	project: Inpt.ObjectId<'project'> | undefined,
	filters: Filter[],
	selectedWellHeaders: string[],
	selectedProjectHeaders: string[],
	existingWells: Inpt.ObjectId<'well'>[],
	sorting: { field: string; direction: 1 | -1 }[] | undefined,
	skip = 0,
	take = 25,
	getCount = true
): Promise<LightFilterWellsResponseModel> =>
	postApi('/filters/lightFilterWells', {
		project,
		filters,
		selectedWellHeaders,
		selectedProjectHeaders,
		existingWells,
		sorting,
		skip,
		take,
		getCount,
	});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getWellsIds = (project, filters, sorting): Promise<any> =>
	postApi('/filters/getWellsIds', {
		filters,
		project,
		sorting,
	});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSavedFilters = (projectId?: Inpt.ObjectId<'project'> | string): Promise<any> => {
	return getApi(`/filters/getSaveFilters/${projectId}`);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getFilterSettings = (projectId?: Inpt.ObjectId<'project'> | string): Promise<any> => {
	return getApi(`/filter-settings`, projectId ? { project: projectId } : {});
};
