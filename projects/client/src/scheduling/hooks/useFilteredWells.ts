import { useState } from 'react';
import { useQuery } from 'react-query';

import { useDebouncedMemo, useLocalStorageState } from '@/components/hooks';
import { postApi } from '@/helpers/routing';

import { AssignmentsApi } from '../ScheduleLandingPage/WellTable/api/AssignmentsApi';

export const useFilteredWells = (
	scheduleId: Inpt.ObjectId,
	wellIds: string[] | Inpt.ObjectId<'well'>[] | undefined,
	storageKey: string
) => {
	const [filters, setHeaderFilters] = useLocalStorageState<Record<string, string>>(`${storageKey}-${scheduleId}`, {});

	const headerFilters = useDebouncedMemo(() => filters, [filters], 500);

	const { data: filteredWellIds } = useQuery(
		['wells-ids-by-search', wellIds, headerFilters],
		() =>
			filters && Object.values(filters)?.some((filterValue) => !!filterValue)
				? postApi('/well/getWellsBySearch', {
						wells: wellIds,
						search: filters,
				  })
				: (Promise.resolve(wellIds) as Promise<string[]>),
		{
			keepPreviousData: false,
			placeholderData: [],
			enabled: !!wellIds?.length,
		}
	);

	return { filteredWellIds, filters, setHeaderFilters };
};

export const usePreviewFilteredWells = (
	scheduleId: Inpt.ObjectId,
	wellIds: string[],
	sortQuery,
	npvData: { [key: string]: { npv: number; priority: number } }
) => {
	const [filters, setHeaderFilters] = useState<Record<string, string>>({});
	const [nonProducingWells, setNonProducingWells] = useState<string[] | null>(null);

	const headerFilters = useDebouncedMemo(() => filters, [filters], 500);

	const { data: filteredWellIds } = useQuery(
		['wells-ids-by-search-preview', wellIds, headerFilters, sortQuery, npvData],
		async () => {
			const assignmentsApi = new AssignmentsApi(scheduleId);
			const nonProducingWells = await assignmentsApi.getIds({
				wellIds,
				notProducing: true,
				sort: sortQuery,
			});
			setNonProducingWells(nonProducingWells);

			// Sort on client side because npv and priority are not in the database
			if (['npv', 'priority'].includes(sortQuery?.field)) {
				nonProducingWells.sort((a, b) => {
					const aField = npvData?.[a]?.[sortQuery.field] || 0;
					const bField = npvData?.[b]?.[sortQuery.field] || 0;

					if (sortQuery.direction === 'asc') return aField - bField;
					return bField - aField;
				});
			}

			if (filters && Object.values(filters)?.some((filterValue) => !!filterValue)) {
				return postApi('/well/getWellsBySearch', {
					wells: nonProducingWells,
					search: filters,
				});
			}

			return Promise.resolve(nonProducingWells) as Promise<string[]>;
		},
		{
			keepPreviousData: false,
			placeholderData: null,
			enabled: !!wellIds?.length,
		}
	);

	return { filteredWellIds, filters, setHeaderFilters, nonProducingWells };
};
