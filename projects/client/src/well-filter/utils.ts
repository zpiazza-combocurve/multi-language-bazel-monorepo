import { useCallback } from 'react';
import { useQueryClient } from 'react-query';

import SimpleSaveDialog from '@/components/misc/SimpleSaveDialog';
import { confirmationAlert, genericErrorAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { withDialog } from '@/helpers/dialog';
import { postApi } from '@/helpers/routing';

const showSaveFilterDialog = withDialog(SimpleSaveDialog);

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export type WellsFilter = any;
export type WellsFilterScope = 'ALL_WELLS' | string[];

// from getInitialFilters https://github.com/insidepetroleum/main-combocurve/blob/master/client/src/well-filter/well-filter.js#L57 // TODO remove duplication, find better name?
export function getWellIdsFilters(wells?: WellsFilterScope) {
	if (Array.isArray(wells)) {
		return [
			{
				_id: 0,
				name: 'Initial wells',
				excludeAll: true,
				include: wells.length ? wells : undefined,
			},
		];
	}
	return [];
}

export async function getLightFilterTotalWells({
	project,
	filters,
}: {
	project?: string | null;
	filters: WellsFilter[];
}): Promise<number> {
	const { count } = await postApi('/filters/lightFilterWellsCount', { filters, project });
	return count;
}

export async function getLightFilterWellIds({
	project = null,
	filters,
	skip,
	take,
}: {
	filters: WellsFilter[];
	project?: string | null;
	skip?: number;
	take?: number;
}): Promise<string[]> {
	const ids = await postApi('/filters/lightFilterWellsIds', {
		filters,
		project,
		skip,
		take,
	});
	return ids;
}

export const WELL_FILTERS_QUERY_KEY = ['well-filters'];

export async function saveWellIdsAsFilter({ wellIds, projectId, queryClient }) {
	const name = await showSaveFilterDialog({ label: 'Filter Name', title: 'Save Filter' });

	if (!name) {
		return;
	}

	try {
		await postApi('/filters/saveFilter', {
			projectId,
			name,
			filter: { excludeAll: true, include: wellIds },
		});
		confirmationAlert(`${name} Saved`);
		queryClient.invalidateQueries(WELL_FILTERS_QUERY_KEY);
	} catch (error) {
		genericErrorAlert(error);
	}
}

export function useSaveWellIdsAsFilter() {
	const { project } = useAlfa();
	const queryClient = useQueryClient();

	return useCallback(
		(wellIds) => saveWellIdsAsFilter({ wellIds, projectId: project?._id, queryClient }),
		[queryClient, project]
	);
}
