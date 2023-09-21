import { useCallback, useMemo } from 'react';

import { SyncResolver } from '@/helpers/promise';

import { useNewValueOnChange } from './useNewValueOnChange';
import { useSet } from './useSet';

const EMPTY_ARRAY = [];

export interface Selection<T = string> {
	all: T[] | Set<T>;
	allSize: number;
	selectedSet: Set<T>;
	setSelectedSet: (newValue: SyncResolver<Set<T> | T[], [Set<T>]>) => void;
	isSelected: (p: T) => boolean;
	select: (items: T | T[]) => void;
	deselect: (items: T | T[]) => void;
	toggle: (item: T) => void;
	selectAll: () => void;
	deselectAll: () => void;
	toggleAll: () => void;
	allSelected: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
type ArrayOrSet<T = any> = Array<T> | Set<T>;

function getLength(arrOrSet: ArrayOrSet) {
	if ('size' in arrOrSet) {
		return arrOrSet.size;
	}
	return arrOrSet.length;
}

export function useSelection(
	all: string[] | Set<string> | undefined = EMPTY_ARRAY,
	initialSelected: string[] | undefined = undefined
): Selection {
	const [set, add, remove, toggle, setSet, clear] = useSet<string>(
		useNewValueOnChange(initialSelected ?? [], [all, initialSelected])
	);
	const allSize = Array.isArray(all) ? all.length : all.size;
	const allSelected = set.size === allSize && allSize > 0;
	const isSelected = useCallback((el) => set.has(el), [set]);
	const selectAll = useCallback(
		() =>
			setSet((p) => {
				if (p.size && p.size === getLength(all)) {
					return p;
				}
				return new Set(all);
			}),
		[all, setSet]
	);
	const toggleAll = useCallback(() => {
		setSet((p) => (p.size === allSize ? [] : all));
	}, [all, allSize, setSet]);

	return useMemo(
		() => ({
			all,
			allSize,
			selectedSet: set,
			setSelectedSet: setSet,
			isSelected,
			select: add,
			deselect: remove,
			toggle,
			selectAll,
			deselectAll: clear,
			toggleAll,
			allSelected,
		}),
		[all, allSize, set, setSet, isSelected, add, remove, toggle, selectAll, clear, toggleAll, allSelected]
	);
}
