import { useCallback, useMemo } from 'react';

import { useSet } from './useSet';

/**
 * @example
 * 	const [filteredWellIds, filterTo, filterOut, reset] = useFilteredArray(wellIds);
 *
 * 	<>
 * 		Current Filter: {filteredWellIds.length}
 * 		<Button onClick={() => filterTo(selectedWellIds)}>Filter To</Button>
 * 		<Button onClick={() => filterOut(selectedWellIds)}>Filter Out</Button>
 * 		<Button onClick={() => reset()}>Reset</Button>
 * 	</>;
 */
export function useFilteredArray(ids: string[]) {
	const { set, remove: filterOut, setSet: filterTo } = useSet(ids);
	const reset = useCallback(() => filterTo(ids), [filterTo, ids]);
	const filteredArray = useMemo(() => ids.filter((id) => set.has(id)), [ids, set]);
	return [filteredArray, filterTo, filterOut, reset] as const;
}
