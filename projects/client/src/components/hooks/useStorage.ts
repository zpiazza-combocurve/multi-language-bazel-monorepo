import { isEqual } from 'lodash';
import { useEffect, useMemo, useState } from 'react';

import { getVersionedKey, local } from '@/helpers/storage';
import { coloredDebugWithTrace } from '@/helpers/utilities';

type Options = {
	/** If versions mismatches will discard the values */
	version?: number | string;
	debugging?: boolean;
};

export function useGetLocalStorage<T>(
	key: string | null | undefined,
	initial: T,
	{ version = undefined }: Options = {}
) {
	return useMemo(() => {
		if (!key) {
			return initial;
		}

		const value = local.getItem(getVersionedKey(key, version));

		if (value === undefined || value === null) {
			return initial;
		}
		return value as T;
	}, [initial, key, version]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function useSetLocalStorage(key: string | null | undefined, value: any, { version = undefined }: Options = {}) {
	useEffect(() => {
		if (!key) {
			return;
		}

		local.setItem(getVersionedKey(key, version), value);
	}, [key, value, version]);
}

/**
 * Will remember last state using the local storage: `useState` + local storage.
 *
 * @example
 * 	const [state, setState] = useState(defaultValue);
 * 	// with local storage
 * 	const [state, setState] = useLocalStorageState('KEY_TO_SAVE_LOCAL_STORAGE', defaultValue);
 */
export function useLocalStorageState<T>(
	localStorageKey: string,
	initialValue: T,
	{ version = undefined, debugging = false }: Options = {}
) {
	const [state, setState] = useState(useGetLocalStorage(localStorageKey, initialValue, { version }));
	useSetLocalStorage(localStorageKey, state, { version });

	const _setState = (value) => {
		if (debugging) {
			coloredDebugWithTrace({
				message: 'Debugging message from call of setState in useLocalStorageState',
				bgColor: 'red',
				textColor: 'white',
				payload: {
					prevValue: state,
					newValue: value,
				},
			});
		}
		if (!isEqual(value, state)) {
			setState(value);
		}
	};
	return [state, _setState] as const;
}
