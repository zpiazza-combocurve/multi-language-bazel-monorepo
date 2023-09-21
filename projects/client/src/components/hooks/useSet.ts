import { useCallback } from 'react';

import { SyncResolver } from '@/helpers/promise';

import { useDerivedState } from './useDerivedState';

function joinSet<T>(set: Set<T> | T[], arr: T | T[]) {
	const newSet = new Set(set);
	if (arr instanceof Set) {
		arr.forEach((item) => newSet.add(item));
	} else if (Array.isArray(arr)) {
		arr.forEach((item) => newSet.add(item));
	} else {
		newSet.add(arr);
	}
	return newSet;
}

function removeSet<T>(set: Set<T> | T[], arr: T | T[]) {
	const newSet = new Set(set);
	if (arr instanceof Set) {
		arr.forEach((item) => newSet.delete(item));
	} else if (Array.isArray(arr)) {
		arr.forEach((item) => newSet.delete(item));
	} else {
		newSet.delete(arr);
	}
	return newSet;
}

function forceSet<T>(value: T[] | Set<T>): Set<T> {
	return Array.isArray(value) ? new Set(value) : value;
}

const emptyArray = [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function useSet<T = any>(initialSet: T[] | Set<T> = emptyArray as T[]) {
	const [set, setSet_] = useDerivedState(() => forceSet(initialSet), [initialSet]);

	const setSet = useCallback(
		(value: SyncResolver<Set<T> | T[], [Set<T>]>) =>
			typeof value === 'function' ? setSet_((p) => forceSet(value(p))) : setSet_(forceSet(value)),
		[setSet_]
	);
	const add = useCallback((items: T[] | T) => setSet_((prevSet) => joinSet(prevSet, items)), [setSet_]);
	const remove = useCallback((items: T[] | T) => setSet_((prevSet) => removeSet(prevSet, items)), [setSet_]);
	const toggle = useCallback(
		(item: T) => setSet_((prevSet) => (prevSet.has(item) ? removeSet(prevSet, item) : joinSet(prevSet, item))),
		[setSet_]
	);
	const clear = useCallback(() => setSet_(new Set()), [setSet_]);

	return Object.assign([set, add, remove, toggle, setSet, clear] as const, {
		set,
		add,
		remove,
		toggle,
		setSet,
		clear,
	});
}
