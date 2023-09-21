import { useMemo } from 'react';

import { useGetLocalStorage, useSetLocalStorage } from '@/components/hooks';
import { useSelectedHeaders } from '@/manage-wells/shared/ChooseHeadersDialog';
import { ALWAYS_VISIBLE_HEADERS, INITIAL_ASSUMPTIONS, INITIAL_HEADERS, allAssumptionKeys } from '@/scenarios/shared';

import { allHeaderKeys, getAssumptionLabel, getHeaderLabel } from './ScenarioPage/index';

const ASSUMPTIONS_STORAGE_KEY = `INPT_CURRENT_SCENARIO_ASSUMPTIONS_V2`;
const HEADERS_STORAGE_KEY = `INPT_CURRENT_SCENARIO_HEADERS_V1`;

export function useHeaderSelection(_allHeaders, headerSelection?, alwaysVisibleHeaders?) {
	const allHeaders = useMemo(() => _allHeaders ?? [...allHeaderKeys, ...allAssumptionKeys], [_allHeaders]);
	const [headers, assumptions] = useMemo(() => {
		const headersSet = new Set(allHeaders);
		return [
			allHeaderKeys.filter((key) => headersSet.has(key)),
			allAssumptionKeys.filter((key) => headersSet.has(key)),
		];
	}, [allHeaders]);

	const initialHeaders = useGetLocalStorage(HEADERS_STORAGE_KEY, INITIAL_HEADERS);
	const initialAssumptions = useGetLocalStorage(ASSUMPTIONS_STORAGE_KEY, INITIAL_ASSUMPTIONS);
	const [selectedHeaders, selectHeaders, , setHeaders] = useSelectedHeaders({
		initialKeys: initialHeaders,
		allKeys: allHeaderKeys,
		getLabel: getHeaderLabel,
		maxHeaders: headers.length,
		alwaysVisibleHeaders: useMemo(
			() => [...ALWAYS_VISIBLE_HEADERS, ...(alwaysVisibleHeaders ?? [])],
			[alwaysVisibleHeaders]
		),
	});
	const [_selectedAssumptions, selectAssumptions, , setAssumptions] = useSelectedHeaders({
		initialKeys: initialAssumptions,
		allKeys: allAssumptionKeys,
		getLabel: getAssumptionLabel,
		maxHeaders: INITIAL_ASSUMPTIONS.length,
		title: 'Search Assumption',
		feat: 'assumptions',
	});
	const selectedAssumptions = useMemo(
		() => allAssumptionKeys.filter((key) => _selectedAssumptions.some((assKey) => assKey === key)),
		[_selectedAssumptions]
	);
	useSetLocalStorage(HEADERS_STORAGE_KEY, selectedHeaders);
	useSetLocalStorage(ASSUMPTIONS_STORAGE_KEY, selectedAssumptions);

	return (
		headerSelection ?? {
			assumptions,
			headers,
			selectAssumptions,
			selectHeaders,
			selectedAssumptions,
			selectedHeaders,
			setAssumptions,
			setHeaders,
		}
	);
}
