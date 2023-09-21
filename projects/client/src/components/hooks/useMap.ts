import produce, { Draft } from 'immer';
import { useCallback, useState } from 'react';

/**
 * Hook wrapper over Map
 *
 * @example
 * 	const { state, set } = useMap<string, string>();
 *
 * 	set('foo', 'bar');
 * 	state.get('foo'); // 'bar'
 *
 * @note work in progress
 */
export function useMap<K, V>() {
	const [state, setState] = useState(() => new Map<K, V>());

	const set = useCallback((key: K, value: V) => {
		setState((p) =>
			produce(p, (draft) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				draft.set(key as any as Draft<K>, value as any as Draft<V>);
			})
		);
	}, []);

	return { state, setState, set };
}
