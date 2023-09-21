import { useCallback, useEffect } from 'react';

/**
 * @example
 * 	import { useSubscribeToCustomEvent } from '@/helpers/pub-sub';
 *
 * 	...
 *
 * 	const handler = useCallback((payload) => {
 * 	doSomething(payload);
 * 	}, []);
 * 	useSubscribeToCustomEvent('custom-event-name', handler);
 */
export const useSubscribeToCustomEvent = <Payload>(event: string, handler: (payload: Payload) => void) => {
	const listener = useCallback((e: Event) => handler((e as CustomEvent).detail), [handler]);

	useEffect(() => {
		document.addEventListener(event, listener);

		return () => {
			document.removeEventListener(event, listener);
		};
	}, [listener, event]);
};

/**
 * @example
 * 	import { useDispatchCustomEvent } from '@/helpers/pub-sub';
 *
 * 	...
 *
 * 	const dispatch = useDispatchCustomEvent();
 *
 * 	...
 *
 * 	const onClick = () => {
 * 	dispatch('custom-event-name', { a: 'a', b: 'b' });
 * 	};
 */
export const useDispatchCustomEvent = () => {
	const dispatch = useCallback(<Payload>(event: string, payload: Payload) => {
		document.dispatchEvent(new CustomEvent(event, { detail: payload }));
	}, []);

	return dispatch;
};
