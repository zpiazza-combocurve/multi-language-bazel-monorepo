import _ from 'lodash';
import { useMemo, useRef } from 'react';

/**
 * @param value The value to be memoized (usually a dependency list)
 * @returns A memoized version of the value as long as it remains deeply equal
 * @see original code https://github.com/kentcdodds/use-deep-compare-effect/blob/main/src/index.ts#L28-L43
 */
export function useDeepCompareMemoize<T>(value: T) {
	const ref = useRef<T>(value);
	const signalRef = useRef<number>(0);

	if (!_.isEqual(value, ref.current)) {
		ref.current = value;
		signalRef.current += 1;
	}

	// eslint-disable-next-line react-hooks/exhaustive-deps
	return useMemo(() => ref.current, [signalRef.current]);
}
