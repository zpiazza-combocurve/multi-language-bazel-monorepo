import _, { intersection } from 'lodash-es';
import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'react-query';

import { useCallbackRef } from '@/components/hooks';
import { withLoadingBar } from '@/helpers/alerts';
import { useDebouncedValue } from '@/helpers/debounce';
import { postApi } from '@/helpers/routing';

const DEFAULT_FILTER_BODY = {
	forecastType: [],
	status: [],
	wellName: '',
	warning: null,
};

const FILTER_DEBOUNCE = 1000;

const EMPTY_ARRAY = [];

const validObjValues = (obj) => _.some(_.values(obj), (value) => !!value?.length || (!Array.isArray(value) && value));

const phaseFilterApi = (forecastId, body) => postApi(`/forecast/deterministic/${forecastId}/phase-filter`, body);
const wellFilterApi = (forecastId, body) => postApi(`/forecast/deterministic/${forecastId}/well-filter`, body);

const useGridFilter = ({ forecastId, wellIds }) => {
	const [_phaseFilters, setPhaseFilters] = useState({});
	const [_wellFilters, setWellFilters] = useState({});
	const [sorting, setSorting] = useState([{ field: 'well_name', direction: 1 }]);

	// debounce filter values
	const phaseFilters = useDebouncedValue(_phaseFilters, FILTER_DEBOUNCE);
	const wellFilters: Record<string, string[]> = useDebouncedValue(_wellFilters, FILTER_DEBOUNCE);

	const phaseFilterActive = useMemo(() => validObjValues(phaseFilters), [phaseFilters]);
	const wellFilterActive = useMemo(() => !!Object.keys(wellFilters).length, [wellFilters]);

	const { data: sortedWellIds, isFetching: loadingSortedWells } = useQuery(
		['forecast', 'grid-filter', 'sorted-wells', sorting, wellIds],
		() => postApi('/filters/sort-well-ids', { wellIds, sorting }),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		{ placeholderData: [], select: (data: Array<any>) => data?.map((well) => well._id) ?? [], enabled: !!wellIds }
	);

	// runs phase filter api which combines phase specific filters requiring a phase
	const { data: phaseFilterWellIds, isFetching: loadingPhaseFilterWells } = useQuery(
		['forecast', 'grid-filter', 'phase-filter', phaseFilters, wellIds],
		() => phaseFilterApi(forecastId, { ...phaseFilters, wells: wellIds }),
		{ enabled: phaseFilterActive, placeholderData: null }
	);

	const wellFilterWellIds = useMemo(() => {
		if (wellFilterActive) {
			// sorting not guaranteed, takes a matrix of wellIds and intersects them all in parallel
			return intersection(..._.values(wellFilters));
		}
		return null;
	}, [wellFilterActive, wellFilters]);

	// sorts the wells between the two types of filters
	const filteredWellIds = useMemo(() => {
		if (phaseFilterWellIds && wellFilterWellIds) {
			// guarantee sorting
			return intersection(sortedWellIds, intersection(phaseFilterWellIds, wellFilterWellIds));
		}
		if (phaseFilterWellIds || wellFilterWellIds) {
			return intersection(sortedWellIds, phaseFilterWellIds || wellFilterWellIds);
		}
		return null;
	}, [phaseFilterWellIds, sortedWellIds, wellFilterWellIds]);

	const outputIds = useMemo(() => filteredWellIds ?? sortedWellIds ?? EMPTY_ARRAY, [filteredWellIds, sortedWellIds]);

	const setPhaseFilterByKey = useCallbackRef((key, value) =>
		setPhaseFilters((curFilters) => ({ ...curFilters, [key]: value }))
	);

	const setWellFilterByKey = useCallbackRef((key, value) =>
		setWellFilters((curFilters) => ({ ...curFilters, [key]: value }))
	);

	const clearFilters = useCallbackRef(() => {
		setPhaseFilters({});
		setWellFilters({});
	});

	const { mutateAsync: applyWellNameFilter, isLoading: loadingWellNameFilter } = useMutation(
		async (search: string) => {
			const body = { ...DEFAULT_FILTER_BODY, wellName: search, wells: wellIds };
			const results = await withLoadingBar(wellFilterApi(forecastId, { ...body, wells: wellIds }));
			setWellFilterByKey('nameSearch', results);
		}
	);

	return {
		applyWellNameFilter,
		clearFilters,
		filterActive: phaseFilterActive || wellFilterActive,
		loadingWells: loadingSortedWells || loadingPhaseFilterWells || loadingWellNameFilter,
		setPhaseFilterByKey,
		setWellFilterByKey,
		wellIds: outputIds,
		sorting,
		setSorting,
		phaseFilters,
	};
};

export default useGridFilter;
