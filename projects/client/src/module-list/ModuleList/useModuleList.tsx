import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';

import { usePagination } from '@/components/Pagination';
import { useCallbackRef } from '@/components/hooks';
import { Pagination } from '@/components/hooks/usePagination';
import { counter } from '@/helpers/Counter';
import { useDebouncedValue } from '@/helpers/debounce';

import { FilterResult, Item, ItemsFetcher } from '../types';
import { useForceDebounce } from './useForceDebounce';

// TODO might be useful for other places?
function useUnknownPagination() {
	const [total, setTotal] = useState(Infinity);
	const pagination = usePagination({ total });
	return { pagination, setTotal };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
function getCleanFilters<F = any>(dirtyFilters: F) {
	if (dirtyFilters) {
		return Object.keys(dirtyFilters).reduce((acc, curr) => {
			const filterValue = dirtyFilters[curr];

			if (filterValue !== null && filterValue !== undefined) {
				return {
					...acc,
					[curr]: dirtyFilters[curr],
				};
			}
			return acc;
		}, {} as F);
	}

	return {} as F;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export type ModuleListBag<T extends Item, F = any> = FilterResult<T> & {
	filters: F;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	setFilters: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	initialFilters: any;
	loading: boolean;
	loaded: boolean;
	runFilters(): void;
	pagination: Pagination;
	resetFilters(): void;
	totalItems: number;
	loadingIds?: boolean;
	loadedIds?: boolean;
	ids?: string[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function useModuleList<T extends Item, F = any>(
	fetchItems: ItemsFetcher<F, T>,
	initialFilters: F,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	fetchIds = undefined as any
): ModuleListBag<T, F> {
	const {
		state: filters,
		setState: setFilters,
		debouncedState: debouncedFilters,
		forceSet,
	} = useForceDebounce(initialFilters);

	const cleanFilters = useMemo(() => getCleanFilters(filters), [filters]);
	const cleanDebouncedFilters = useMemo(() => getCleanFilters(debouncedFilters), [debouncedFilters]);

	const queryClient = useQueryClient();

	const { pagination, setTotal } = useUnknownPagination();
	const { page } = pagination;

	const fetchItemsRef = useCallbackRef(fetchItems); // simpler api if doesn't need to be wrapped in callbacks and whatnot
	const fetchItemIdsRef = useCallbackRef(fetchIds);

	const queryKey = useMemo(() => [counter.nextId('__inpt_random_query')], []);
	const {
		data: value,
		isSuccess: loaded,
		isFetching: loading,
	} = useQuery(
		[queryKey, { page: useDebouncedValue(page, 500), cleanDebouncedFilters }],
		() => fetchItemsRef({ ...cleanDebouncedFilters, page }),
		{
			onSuccess: (result) => {
				setTotal(result.totalItems);
			},
			keepPreviousData: true,
		}
	);

	const {
		data: ids,
		isSuccess: loadedIds,
		isFetching: loadingIds,
	} = useQuery(
		[queryKey, { cleanDebouncedFilters }, 'ids'],
		() => fetchItemIdsRef({ ...cleanDebouncedFilters, page }),
		{
			keepPreviousData: true,
			enabled: !!fetchIds,
			select: (data) => data.map(({ _id }) => _id),
		}
	);

	const runFilters = useCallback(() => {
		queryClient.invalidateQueries(queryKey);
		forceSet();
	}, [forceSet, queryClient, queryKey]);

	const resetFilters = useCallbackRef(() => setFilters(initialFilters));

	return {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		...value!,
		filters: cleanFilters,
		setFilters,
		loading,
		loaded,
		runFilters,
		pagination,
		resetFilters,
		initialFilters,
		totalItems: pagination.total,
		loadedIds,
		loadingIds,
		...(ids ? { ids } : {}),
	};
}
