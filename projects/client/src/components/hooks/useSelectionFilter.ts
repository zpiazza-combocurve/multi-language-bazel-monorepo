import { useCallback, useMemo } from 'react';

import { Selection, useSelection } from './useSelection';
import { useSet } from './useSet';

export interface SelectionFilter extends Selection {
	filteredArray: string[];
	filteredSet: Set<string>;
	filterTo(elements?: string[]): void;
	filterOut(elements?: string[]): void;
	resetFilter(): void;
}

export function useSelectionFilter(all: string[]) {
	const { set: filteredSet, setSet, remove } = useSet(all);
	const {
		allSelected,
		deselect,
		deselectAll,
		isSelected,
		select,
		selectAll,
		selectedSet,
		setSelectedSet,
		toggle,
		toggleAll,
	} = useSelection(filteredSet);
	const filterTo = useCallback(
		(elements?) => {
			setSet(elements ?? selectedSet);
			deselectAll();
		},
		[deselectAll, selectedSet, setSet]
	);
	const filterOut = useCallback(
		(elements?) => {
			remove(elements ?? selectedSet);
			deselectAll();
		},
		[deselectAll, remove, selectedSet]
	);
	const resetFilter = useCallback(() => {
		setSet(all);
	}, [all, setSet]);
	const filteredArray = useMemo(() => all.filter((id) => filteredSet.has(id)), [all, filteredSet]);
	return useMemo(
		() => ({
			all,
			allSize: all?.length,
			allSelected,
			deselect,
			deselectAll,
			filterOut,
			filterTo,
			filteredArray,
			filteredSet,
			isSelected,
			resetFilter,
			select,
			selectAll,
			selectedSet,
			setSelectedSet,
			toggle,
			toggleAll,
		}),
		[
			all,
			allSelected,
			deselect,
			deselectAll,
			filterOut,
			filterTo,
			filteredArray,
			filteredSet,
			isSelected,
			resetFilter,
			select,
			selectAll,
			selectedSet,
			setSelectedSet,
			toggle,
			toggleAll,
		]
	);
}
