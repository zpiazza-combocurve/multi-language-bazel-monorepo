/* eslint-disable jest/expect-expect */
import { renderHookExt } from './hook-test-helper';
import { useSelectionFilter } from './useSelectionFilter';

describe('hooks/useSelection', () => {
	test('filterOut on selection', () => {
		const { act, check } = renderHookExt(useSelectionFilter, { initialProps: [1, 2, 3, 4, 5] });
		check({ selectedSet: new Set([]), filteredSet: new Set([1, 2, 3, 4, 5]) });
		act(({ select }) => select(3));
		check({ selectedSet: new Set([3]), filteredSet: new Set([1, 2, 3, 4, 5]) });
		act(({ filterOut }) => filterOut());
		check({ selectedSet: new Set([]), filteredSet: new Set([1, 2, 4, 5]) });
	});
	test('filterTo on selection', () => {
		const { act, check } = renderHookExt(useSelectionFilter, { initialProps: [1, 2, 3, 4, 5] });
		check({ selectedSet: new Set([]), filteredSet: new Set([1, 2, 3, 4, 5]) });
		act(({ select }) => select([3, 4]));
		check({ selectedSet: new Set([3, 4]), filteredSet: new Set([1, 2, 3, 4, 5]) });
		act(({ filterTo }) => filterTo());
		check({ selectedSet: new Set([]), filteredSet: new Set([3, 4]) });
	});
});
