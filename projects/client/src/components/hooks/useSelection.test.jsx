/* eslint-disable jest/expect-expect */
import { renderHookExt } from './hook-test-helper';
import { useSelection } from './useSelection';

describe('hooks/useSelection', () => {
	test('should work', () => {
		const { act, check, result } = renderHookExt(useSelection, { initialProps: [1, 2, 3, 4, 5] });
		check({ selectedSet: new Set([]) });
		act(({ selectAll }) => selectAll());
		check({ allSelected: true, selectedSet: new Set([1, 2, 3, 4, 5]) });
		expect(result.current.isSelected(3)).toBe(true);
		act(({ deselectAll }) => deselectAll());
		check({ selectedSet: new Set([]) });
		expect(result.current.isSelected(3)).toBe(false);
	});
	test('should reset selection when elements changes', () => {
		const { act, check, rerender } = renderHookExt(useSelection, { initialProps: [1, 2, 3, 4, 5] });
		act(({ selectAll }) => selectAll());
		check({ selectedSet: new Set([1, 2, 3, 4, 5]) });
		rerender([1, 2, 3]);
		check({ selectedSet: new Set([]) });
	});
	test('toggleAll twice', () => {
		const { act, check } = renderHookExt(useSelection, { initialProps: [1, 2, 3, 4, 5] });
		check({ allSelected: false, selectedSet: new Set([]) });
		act(({ toggleAll }) => toggleAll());
		check({ allSelected: true, selectedSet: new Set([1, 2, 3, 4, 5]) });
		act(({ toggleAll }) => toggleAll());
		check({ allSelected: false, selectedSet: new Set([]) });
	});
	test('toggleAll with some elements already selected', () => {
		const { act, check } = renderHookExt(useSelection, { initialProps: [1, 2, 3, 4, 5] });
		act(({ select }) => select(1));
		check({ allSelected: false, selectedSet: new Set([1]) });
		act(({ toggleAll }) => toggleAll());
		check({ allSelected: true, selectedSet: new Set([1, 2, 3, 4, 5]) });
	});
});
