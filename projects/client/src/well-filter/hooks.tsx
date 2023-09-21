/* eslint react/jsx-key: warn */
// TODO remove "hooks" file, organize them all in 'utils' or 'shared' file
import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import { ListItem } from '@material-ui/core';
import { compareDesc } from 'date-fns';
import _ from 'lodash-es';
import { useCallback, useMemo } from 'react';
import { useMutation, useQuery } from 'react-query';

import { usePagination } from '@/components';
import { useDerivedState, useFilteredArray, useSelectionFilter } from '@/components/hooks';
import { Button, Divider, MenuIconButton, MenuItem } from '@/components/v2';
import { genericErrorAlert, infoAlert, warningAlert, withLoadingBar } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { queryClient } from '@/helpers/query-cache';
import { getApi, postApi, putApi } from '@/helpers/routing';

import {
	WELL_FILTERS_QUERY_KEY,
	WellsFilter,
	WellsFilterScope,
	getLightFilterTotalWells,
	getLightFilterWellIds,
	getWellIdsFilters,
} from './utils';
import { showWellFilter } from './well-filter';

export function useFilteredWellsByWellFilterDialog(allWellIds) {
	const [wellIds, filterTo, , reset] = useFilteredArray(allWellIds);
	const filter = useCallback(async () => {
		try {
			const filteredWellsIds = await showWellFilter({ wells: allWellIds });
			if (filteredWellsIds) {
				filterTo(filteredWellsIds);
			}
		} catch (error) {
			genericErrorAlert(error);
		}
	}, [allWellIds, filterTo]);
	return [wellIds, filter, reset, null];
}

const EMPTY_ARRAY = [];

export const DEFAULT_MAX_FILTERS_TO_SHOW = 10;

export async function getLightWells({ project = null, skip, take, headers, filters = [] }) {
	return postApi('/filters/lightFilterWells', {
		project,
		skip,
		take,
		selectedWellHeaders: headers,
		filters,
	});
}

export async function fetchSavedFilters(projectId, maxFilters = DEFAULT_MAX_FILTERS_TO_SHOW) {
	try {
		if (!projectId) {
			return [];
		}

		const filters = await getApi(`/filters/getSaveFilters/${projectId}`, { limit: maxFilters });

		// HACK: Sort by name for now so that all lists are ordered the same
		return (filters ?? []).sort(compareDesc);
	} catch (error) {
		return genericErrorAlert(error);
	}
}

export async function updateSavedFilter(filterId, filter) {
	try {
		if (!filterId || !filter) {
			return null;
		}

		return putApi(`/filters/updateFilter/${filterId}`, { filter });
	} catch (error) {
		return genericErrorAlert(error);
	}
}

export function useLightWellFilter({
	wells = 'ALL_WELLS',
	companyOnly,
}: {
	wells?: WellsFilterScope;
	companyOnly?: boolean;
}) {
	const { project } = useAlfa();
	const initialFilter = useMemo(() => getWellIdsFilters(wells), [wells]);
	const [filters, setFilters] = useDerivedState(initialFilter);

	const filter = useCallback(async () => {
		try {
			const newFilters = await showWellFilter({
				wells,
				returnFilters: true,
				altProject: companyOnly ? null : undefined, // sending null for altProject will make it use company only wells
			});
			if (newFilters) {
				setFilters(newFilters);
			}
		} catch (error) {
			genericErrorAlert(error);
		}
	}, [wells, companyOnly, setFilters]);

	const reset = useCallback(() => {
		setFilters(initialFilter);
	}, [initialFilter, setFilters]);

	const filtered = filters !== initialFilter;

	const getWellIds = useCallback(
		() => getLightFilterWellIds({ filters, project: companyOnly ? null : project?._id }),
		[filters, project, companyOnly]
	);

	return { filters, filter, reset, filtered, getWellIds, setFilters };
}

export function useLightFilterWellIdsQuery(
	{
		filters,
		companyOnly,
	}: {
		filters: WellsFilter[];
		companyOnly?: boolean;
	},
	{ enabled = true } = {}
) {
	const { project } = useAlfa();
	const projectId = project?._id;
	return useQuery(
		[...WELL_FILTERS_QUERY_KEY, 'wellIds', filters, { companyOnly, projectId }],
		() => getLightFilterWellIds({ filters, project: companyOnly ? null : project?._id }),
		{
			enabled: enabled && !companyOnly, // disabled for company only, well ids can be a lot
		}
	);
}

export function useLightPaginatedWellIds({ filters, project = null, loading }) {
	const totalWellsQueryKey = ['well-filter', 'light-filter', 'total-wells'];
	const { data: total = Infinity } = useQuery(
		totalWellsQueryKey,
		() => getLightFilterTotalWells({ project, filters }),
		{
			enabled: loading,
		}
	);
	const pagination = usePagination({ total, itemsPerPage: 10000 });
	const skip = pagination.startIndex;
	const take = pagination.itemsPerPage;
	// Unsure
	const filterWellQueryKey = ['well-filter', 'filter-well'];

	const { data: wellsIds = EMPTY_ARRAY } = useQuery(
		filterWellQueryKey,
		() => getLightFilterWellIds({ project, filters, skip, take }),
		{
			enabled: loading,
		}
	);
	return Object.assign([pagination, wellsIds], { pagination, wellsIds });
}

export function useFilteredByWellFilter(
	allWellIds: string[],
	{ drillDown = false, requireAtLeastOne = false, removedWells = EMPTY_ARRAY as string[] } = {}
) {
	const displayFilterWellDialog = showWellFilter;
	const [wellIds, filterTo, , reset] = useFilteredArray(allWellIds);
	// Unsure
	const { isLoading: filterActive, mutateAsync: filter } = useMutation(async () => {
		try {
			const filtered = wellIds.length !== allWellIds.length;
			const wellsToFilter = removedWells?.length
				? allWellIds.filter((well) => !removedWells.includes(well))
				: allWellIds;

			const filteredWellsIds = await displayFilterWellDialog({
				wells: drillDown && filtered ? wellIds : wellsToFilter,
			});

			if (requireAtLeastOne) {
				if (filteredWellsIds?.length) {
					filterTo(filteredWellsIds);
				} else if (filteredWellsIds !== null) {
					warningAlert('There must be at least one well after filtering');
				}
			} else if (filteredWellsIds) {
				filterTo(filteredWellsIds);
			}
		} catch (error) {
			genericErrorAlert(error);
		}
	});

	return Object.assign([wellIds, filter, reset, null, filterActive] as const, {
		wellIds,
		filter,
		reset,
		filterTo,
		filterActive,
	});
}

export function useFilteredByWellFilterAndSelection(allWellIds) {
	const displayFilterWellDialog = showWellFilter;
	const selection = useSelectionFilter(allWellIds);
	const { filterTo, filterOut, filteredArray: wellIds, resetFilter } = selection;
	const filter = useCallback(async () => {
		try {
			const filteredWellsIds = await displayFilterWellDialog({ wells: wellIds });
			if (filteredWellsIds) {
				filterTo(filteredWellsIds);
			}
		} catch (error) {
			genericErrorAlert(error);
		}
	}, [displayFilterWellDialog, filterTo, wellIds]);
	const filtered = wellIds.length !== allWellIds.length;
	return { wellIds, filter, filterTo, filterOut, selection, filtered, resetFilter };
}

export function useSelectedByWellFilter(allWellIds) {
	const displayFilterWellDialog = showWellFilter;
	const selection = useSelectionFilter(allWellIds);
	const { filterTo, filterOut, filteredArray: wellIds, resetFilter } = selection;
	const { select } = selection;
	const filter = useCallback(async () => {
		try {
			const filteredWellsIds = await displayFilterWellDialog({ wells: wellIds });
			if (filteredWellsIds) {
				select(filteredWellsIds);
			}
		} catch (error) {
			genericErrorAlert(error);
		}
	}, [displayFilterWellDialog, select, wellIds]);
	const filtered = wellIds.length !== allWellIds.length;
	return { wellIds, filter, filterTo, filterOut, selection, filtered, resetFilter };
}

export function useSavedFilters(maxFilters = DEFAULT_MAX_FILTERS_TO_SHOW) {
	const { project } = useAlfa();
	const key = [...WELL_FILTERS_QUERY_KEY, project?._id, maxFilters];
	return useQuery(key, () => fetchSavedFilters(project?._id, maxFilters), { enabled: !!project });
}

export function useSingleWellFilterSelection(wellId, maxFilters = 5) {
	const filtersQuery = useSavedFilters(maxFilters);
	const { data, isLoading, isFetching } = filtersQuery;

	const { mutateAsync: toggleFilter, isLoading: isToggling } = useMutation(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		async ({ toAdd, wellFilter }: { toAdd?: boolean; wellFilter?: any }) => {
			const { _id: filterId, filter } = wellFilter;
			const include = filter.include ?? [];

			const newFilter = { ...filter };
			if (toAdd && !include.includes(wellId)) {
				newFilter.include = [...include, wellId];
			} else if (!toAdd && include.length && include.includes(wellId)) {
				newFilter.include = include.filter((id) => id !== wellId);
			} else {
				infoAlert('No changes made');
				return;
			}

			await withLoadingBar(
				updateSavedFilter(filterId, newFilter),
				`Successfully ${toAdd ? 'added' : 'removed'} well ${toAdd ? 'to' : 'from'} filter`
			);

			queryClient.invalidateQueries(WELL_FILTERS_QUERY_KEY);
		}
	);

	const FiltersButton = (
		<MenuIconButton color='secondary' icon={faChevronDown} size='small'>
			<MenuItem disabled>
				{isLoading || !data?.length ? 'No Saved Filters' : 'Add / Remove This Well From Filters'}
			</MenuItem>

			{!isLoading && !!data?.length && (
				<>
					<Divider />

					{_.map(data, (wellFilter) => (
						<ListItem
							css={`
								align-items: center;
								display: flex;
								justify-content: space-between;
							`}
						>
							<span css='font-weight: 500'>{_.truncate(wellFilter.name, { length: 20 })}</span>

							<div>
								<Button
									color='primary'
									disabled={isToggling || isFetching}
									onClick={() => toggleFilter({ toAdd: true, wellFilter })}
									size='small'
								>
									Add
								</Button>

								<Button
									color='warning'
									disabled={isToggling || isFetching}
									onClick={() => toggleFilter({ wellFilter })}
									size='small'
								>
									Remove
								</Button>
							</div>
						</ListItem>
					))}
				</>
			)}
		</MenuIconButton>
	);

	return { FiltersButton };
}

export function useLightFilterTotalQuery(
	{ filters, companyOnly }: { filters: WellsFilter[]; companyOnly?: boolean },
	{ enabled = true } = {}
) {
	const { project } = useAlfa();
	const projectId = project?._id;
	return useQuery(
		[WELL_FILTERS_QUERY_KEY, 'total', filters, { companyOnly, projectId }],
		() => getLightFilterTotalWells({ filters, project: companyOnly ? null : projectId }),
		{ enabled }
	);
}
