import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Wrapper over useEffect + setInterval
 *
 * @example
 * 	// without useInterval
 *
 * 	import { useEffect, useRef } from 'react';
 *
 * 	import { useInterval } from '@/components/hooks';
 *
 * 	const propsRef = useRef({});
 * 	// needs to be a ref so it doesn't unmount/mount the hook each time properties changes
 * 	propsRef.current = { params };
 * 	useEffect(() => {
 * 		const interval = setInterval(() => {
 * 			const { params } = propsRef;
 * 			// finally we can use the props
 * 		}, 1000);
 * 		return () => {
 * 			clearInterval(interval);
 * 		};
 * 	}, []);
 *
 * 	// with useInterval
 * 	useInterval(() => {
 * 		// just use the props as you'd normally do, no need for refs or other shenanigans
 * 		console.log({ params }); // display updated props
 * 	}, 1000);
 *
 * 	// to disable the hook don't pass the timeout property or pass a falsy value
 * 	useInterval(
 * 		() => {
 * 			// ...
 * 		},
 * 		disabled ? 0 : 1000
 * 	);
 */
export function useInterval(cb: () => void, timeout: number) {
	const cbRef = useRef<() => void>();
	cbRef.current = cb;

	const [refreshKey, setRefreshKey] = useState({});

	useEffect(() => {
		if (timeout) {
			const id = setInterval(() => cbRef.current?.(), timeout);
			return () => clearInterval(id);
		}
		return undefined;
	}, [timeout, refreshKey]);

	const resetInterval = useCallback(() => {
		setRefreshKey({});
	}, []);

	return { resetInterval };
}
