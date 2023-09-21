import { useEffect, useRef } from 'react';

import { renderProp } from '@/components/shared';

/** Component<->hooks helpers */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function Hook<T extends any[], R>({
	hook: useHook,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	props = [] as any,
	children = undefined,
}: {
	hook: (...args: T) => R;
	props?: T extends [] ? never : T;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	children: undefined | ((result: R) => any);
}) {
	const results = useHook(...props);

	return renderProp(children ?? null, results);
}

/**
 * Used for having the previous reference to a value (e.g. function) for a functional-based components (to have logic
 * like prevState/prevProps)
 */
export function usePrevious<T>(value: T) {
	const ref = useRef<T>();

	useEffect(() => {
		ref.current = value;
	});

	return ref.current;
}

/**
 * Returns a memoized value if the dependency doesn't change (according to the comparison function) or a newly computed
 * value otherwise. Similar to useMemo, but with a custom comparison function for the dependency.
 *
 * @example
 * 	const memoizedSquares = useCustomCompareMemo(
 * 		() => array.map((v) => v * v),
 * 		array,
 * 		(a, b) => a.length === b.length && a.every((v, i) => v === b[i])
 * 	);
 *
 * @example
 * 	const memoizedFullName = useCustomCompareMemo(
 * 		() => `${user.firstName} ${user.lastName}`,
 * 		user,
 * 		(a, b) => a.email === b.email
 * 	);
 */
export function useCustomCompareMemo<TValue, TDependency>(
	factory: () => TValue,
	dependency: TDependency,
	compare: (a: TDependency, b: TDependency) => boolean
) {
	const prevDepRef = useRef<TDependency | undefined>(undefined);
	const prevValueRef = useRef<TValue | undefined>(undefined);

	if (prevDepRef.current !== undefined && compare(dependency, prevDepRef.current)) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		return prevValueRef.current!;
	}

	prevDepRef.current = dependency;
	prevValueRef.current = factory();
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	return prevValueRef.current!;
}
