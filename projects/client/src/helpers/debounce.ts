import { debounce } from 'lodash-es';
import { useEffect, useMemo, useRef, useState } from 'react';

export { debounce };

const DEFAULT_TIMEOUT = 500;

/**
 * @example
 * 	const fn = useDebounce(() => expensiveOperation(), 250);
 * 	useEffect(() => {
 * 		fn();
 * 		fn();
 * 		return () => {
 * 			fn.cancel();
 * 		};
 * 	}, []);
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function useDebounce<T extends undefined | ((...params: any[]) => any)>(fn: T, timeout = DEFAULT_TIMEOUT) {
	const fnRef = useRef<T>(fn);
	fnRef.current = fn;
	return useMemo(
		() => debounce<NonNullable<T>>(((...params) => fnRef.current?.(...params)) as NonNullable<T>, timeout),
		[timeout]
	);
}

/**
 * @example
 * 	const [state, setState] = useState({});
 * 	const debouncedState = useDebouncedValue(state, 200);
 */
export function useDebouncedValue<T>(value: T, delay = DEFAULT_TIMEOUT) {
	const [debouncedValue, _setDebouncedValue] = useState(value);
	const setDebouncedValue = useMemo(() => debounce(_setDebouncedValue, delay), [delay]);

	useEffect(() => {
		setDebouncedValue(value);
		return () => setDebouncedValue.cancel();
	}, [setDebouncedValue, value]);

	return debouncedValue;
}

/**
 * @example
 * 	useDebouncedEffect(
 * 		async () => {
 * 			setState(await fetchData(search));
 * 		},
 * 		[search],
 * 		200
 * 	);
 */
export function useDebouncedEffect(fn, deps, timeout = DEFAULT_TIMEOUT) {
	// TODO add this hook to the eslint configuration for react-hooks/exhaustive-deps
	const debouncedFn = useDebounce(fn, timeout);
	useEffect(() => {
		debouncedFn();
	}, [debouncedFn, deps]);
}
