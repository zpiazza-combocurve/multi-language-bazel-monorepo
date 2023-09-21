import { useEffect, useRef } from 'react';

import { useCallbackRef } from './useCallbackRef';

export function useOnWillUnmount(onWillUnmount?: () => void) {
	const onWillUnmountRef = useCallbackRef(onWillUnmount);
	useEffect(() => {
		return onWillUnmountRef;
	}, [onWillUnmountRef]);
}

export function useLifecycle<P extends object>(
	{
		onDidMount,
		onDidUpdate,
		onWillUnmount,
	}: { onDidMount?(): void; onDidUpdate?(prevProps: P): void; onWillUnmount?(): void },
	props?: P
) {
	const isFirstRender = useRef(true);
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const prevProps = useRef<P>(props!);

	useEffect(() => {
		if (isFirstRender.current) {
			onDidMount?.();
			isFirstRender.current = false;
		} else {
			// TODO check props haven't changed
			onDidUpdate?.(prevProps.current);
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			prevProps.current = props!;
		}
	});

	useOnWillUnmount(onWillUnmount);
}
