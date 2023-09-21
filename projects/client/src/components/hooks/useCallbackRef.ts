import { useCallback, useRef } from 'react';

/**
 * @see https://github.com/reactjs/rfcs/blob/useevent/text/0000-useevent.md
 * @see https://github.com/reactjs/rfcs/pull/220
 * @see https://github.com/facebook/react/issues/14099
 * @see https://github.com/scottrippey/react-use-event-hook
 * @see https://github.com/Volune/use-event-callback
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function useCallbackRef<T extends undefined | ((...arsg: any[]) => any)>(cb: T): NonNullable<T> {
	const ref = useRef(cb);
	ref.current = cb;
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	return useCallback((...args) => ref.current?.(...args), []);
}
