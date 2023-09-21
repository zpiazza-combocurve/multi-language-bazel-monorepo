import { difference } from 'lodash-es';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useQuery } from 'react-query';

import { useCallbackRef, useDebouncedState } from '@/components/hooks';
import { useDialog } from '@/helpers/dialog';
import { intersect } from '@/helpers/math';
import { postApi } from '@/helpers/routing';
import { AssumptionKey } from '@/inpt-shared/constants';
import * as api from '@/scenarios/api';
import { ASSUMPTION_NAMES_BY_KEY, INCREMENTAL_COLUMN, getWellsAssignmentMap } from '@/scenarios/shared';
import { showWellFilter } from '@/well-filter/well-filter';

import { FilterAssumptionDialog, FilterByOwnershipDialog, FilterByPSeriesDialog } from './filters/index';

export function useAssumptionFilter({ scenarioId, allAssignments }) {
	const [filterAssumptionDialog, showFilterAssumptionDialog] = useDialog(FilterAssumptionDialog);
	const [filterPSeriesDialog, showFilterPSeriesDialog] = useDialog(FilterByPSeriesDialog);
	const [filterOwnershipDialog, showFilterOwnershipDialog] = useDialog(FilterByOwnershipDialog);

	const [assumptionFilters, setAssumptionFilters] = useState<
		| {
				[assKey in AssumptionKey]?: Awaited<ReturnType<typeof showFilterAssumptionDialog>>;
		  }
		| undefined
	>();

	const allAssignmentIdsFilteredByAssumptions = useMemo(
		() =>
			intersect(
				Object.values(assumptionFilters || {}).map(
					(value) => (value?.scenarioWellAssignments as string[]) ?? []
				)
			) || allAssignments?.map(({ _id }) => _id),
		[assumptionFilters, allAssignments]
	);

	const filterAssumption = useCallback(
		async (assumptionKey: AssumptionKey) => {
			const getAssumptionNamesByKey = {
				[assumptionKey]: api.getAssumptionNamesByAssumptionKey,
				[AssumptionKey.forecast]: api.getForecastNames,
				[AssumptionKey.schedule]: api.getScheduleNames,
			}[assumptionKey];

			const { models: allModels, lookups: allLookups } = await getAssumptionNamesByKey(scenarioId, assumptionKey);

			const dialogResult = await showFilterAssumptionDialog({
				allAssignments,
				assumptionName: ASSUMPTION_NAMES_BY_KEY[assumptionKey],
				allModels,
				allLookups,
				filterState: assumptionFilters?.[assumptionKey]?.models,
			});

			if (!dialogResult) {
				return;
			}
			setAssumptionFilters((draft = {}) => ({ ...draft, [assumptionKey]: dialogResult }));
		},
		[allAssignments, scenarioId, showFilterAssumptionDialog, assumptionFilters]
	);

	const removeAssumptionFilters = useCallback(() => {
		setAssumptionFilters(undefined);
	}, []);

	const choosePSeriesFilter = useCallback(
		async (assumptionKey) => {
			const dialogResult = await showFilterPSeriesDialog();
			if (!dialogResult) {
				return;
			}
			const scenarioWellAssignments = await api.getAssignmentIdsByPSeriesRange(scenarioId, dialogResult);
			setAssumptionFilters((draft = {}) => ({
				...draft,
				[assumptionKey]: { ...dialogResult, scenarioWellAssignments },
			}));
		},
		[showFilterPSeriesDialog, scenarioId]
	);

	const chooseOwnershipFilter = useCallback(
		async (assumptionKey) => {
			// const unassignedCount = await api.getUnassignedOwnershipCount(scenarioId);
			const { models: allModels, lookups: allLookups } = await api.getAssumptionNamesByAssumptionKey(
				scenarioId,
				assumptionKey
			);
			const assignmentIdsWithAssumptions = [
				...allModels,
				...allLookups.map((lookup) => ({ lookup: true, ...lookup })),
			]
				.map(({ scenarioWellAssignments }) => scenarioWellAssignments)
				.flat();
			const allAssignmentIds = allAssignments.map(({ _id }) => _id);
			const unassigned = difference(allAssignmentIds, assignmentIdsWithAssumptions);
			const unassignedCount = unassigned.length;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			const dialogResult: any = await showFilterOwnershipDialog({
				allAssignmentsCount: allAssignments.length,
				unassignedCount,
			});
			if (!dialogResult) {
				return;
			}
			const scenarioWellAssignments = await api.getAssignmentIdsByOwnershipRange(scenarioId, dialogResult);
			setAssumptionFilters((draft = {}) => ({
				...draft,
				[assumptionKey]: {
					...dialogResult,
					scenarioWellAssignments: dialogResult.getUnassigned ? unassigned : scenarioWellAssignments,
				},
			}));
		},
		[showFilterOwnershipDialog, scenarioId, allAssignments]
	);

	const filterBy = useCallbackRef(({ assumptionKey }) => {
		({
			[assumptionKey]: filterAssumption,
			[AssumptionKey.forecastPSeries]: choosePSeriesFilter,
			[AssumptionKey.ownershipReversion]: chooseOwnershipFilter,
		})[assumptionKey](assumptionKey);
	});

	const clearFilter = useCallback(
		({ assumptionKey }: { assumptionKey: AssumptionKey }) => {
			setAssumptionFilters(({ [assumptionKey]: _excluded, ...assFilters } = {}) => assFilters);
		},
		[setAssumptionFilters]
	);

	return {
		filterDialogs: (
			<>
				{filterAssumptionDialog}
				{filterPSeriesDialog}
				{filterOwnershipDialog}
			</>
		),
		filterBy,
		clearFilter,
		allAssignmentIdsFilteredByAssumptions,
		removeAssumptionFilters,
		assumptionFilters,
	};
}

export function useSortAndFilter(scenario, initialSort, scopedIds?: Inpt.ObjectId<'well'>[]) {
	const { wells: _wellIds, _id: scenarioId } = scenario;
	const wellIds = scopedIds ?? _wellIds;
	// sort
	const [sorting, setSorting] = useState(initialSort);
	const { data: sortedAssignmentsData, isFetching: isSorting } = api.useSortedAssignments(scenarioId, sorting);

	const assignments = sortedAssignmentsData || [];
	// filter

	// well filter
	const [filteredWellIds, setFilteredWellIds] = useState(wellIds);
	const filterWells = showWellFilter;
	// header filter (inline table column)
	const headerFiltersRef = useRef<{ [key: string]: { setValue: (value: string) => void } }>({});
	const [debouncedHeaderFilters, setHeaderFilters, headerFilters] = useDebouncedState(200, {});

	const { data: headerFilteredWellIds } = useQuery(
		['wells-ids-by-search', wellIds, debouncedHeaderFilters],
		() =>
			debouncedHeaderFilters && Object.values(debouncedHeaderFilters)?.some((filterValue) => !!filterValue)
				? postApi('/well/getWellsBySearch', {
						wells: wellIds,
						search: debouncedHeaderFilters,
				  })
				: (Promise.resolve(wellIds) as Promise<string[]>),
		{ keepPreviousData: true }
	);
	const [incrementalFilter, setIncrementalFilter] = useState('');

	const filterHeader = useCallbackRef(({ headerKey, value }) => {
		if (headerKey === INCREMENTAL_COLUMN.key) {
			setIncrementalFilter(value?.trim());
		} else {
			setHeaderFilters((prevHeaderFilters) => ({ ...prevHeaderFilters, [headerKey]: value }));
		}
	});

	// assumption filter
	const {
		allAssignmentIdsFilteredByAssumptions,
		filterDialogs,
		filterBy,
		clearFilter,
		removeAssumptionFilters,
		assumptionFilters,
	} = useAssumptionFilter({
		scenarioId,
		allAssignments: assignments,
	});

	// remove all filters
	const removeFilters = useCallback(() => {
		Object.values(headerFiltersRef.current).forEach(({ setValue }) => setValue(''));
		setHeaderFilters({});
		setFilteredWellIds(wellIds);
		removeAssumptionFilters();
	}, [wellIds, removeAssumptionFilters, setFilteredWellIds, setHeaderFilters]);

	const [sortedFilteredAssignments, sortedFilteredAssignmentIds] = useMemo(() => {
		const filteredWellIdsSet = new Set(filteredWellIds);
		const filteredAssignmentIdsSet = new Set(allAssignmentIdsFilteredByAssumptions);
		const headerFilteredWellIdsSet = new Set(headerFilteredWellIds);
		const _sortedFilteredAssignments =
			sortedAssignmentsData?.filter(({ _id, well, index }) => {
				if (!filteredWellIdsSet.has(well) || !headerFilteredWellIdsSet.has(well)) {
					return false;
				}
				if (!(allAssignmentIdsFilteredByAssumptions ? filteredAssignmentIdsSet.has(_id) : true)) {
					return false;
				}
				if (!incrementalFilter) {
					return true;
				}
				if (!index && (incrementalFilter === '-' || incrementalFilter === '0')) {
					return true;
				}
				return index && index.toString() === incrementalFilter;
			}) || [];
		const ids = _sortedFilteredAssignments.map(({ _id }) => _id);
		return [_sortedFilteredAssignments, ids];
	}, [
		filteredWellIds,
		sortedAssignmentsData,
		allAssignmentIdsFilteredByAssumptions,
		incrementalFilter,
		headerFilteredWellIds,
	]);

	const sortedFilteredWellIds = useMemo(
		() => getWellsAssignmentMap(sortedFilteredAssignments).wellIds,
		[sortedFilteredAssignments]
	);

	const handleFilter = async () => {
		const filtered = await filterWells({
			type: 'filter',
			isFiltered: Boolean(sortedFilteredWellIds?.length),
			wells: sortedFilteredWellIds,
			totalWells: sortedFilteredWellIds
				? `${sortedFilteredWellIds.length} filtered wells`
				: `${wellIds.length} wells in scenario`,
		});
		if (filtered !== null) {
			setFilteredWellIds(filtered);
		}
	};

	return {
		allAssignments: assignments,
		assumptionFilters,
		clearFilter,
		filterBy,
		filterDialogs,
		filterHeader,
		filteredWellIds: sortedFilteredWellIds, // TODO: rename
		handleFilter,
		headerFilters,
		headerFiltersRef,
		incrementalFilter,
		isSorting,
		normalFilteredWellIds: filteredWellIds, // TODO: rename
		removeFilters,
		setFilteredWellIds,
		setSorting,
		sortedFilteredAssignmentIds,
		sorting,
	};
}
