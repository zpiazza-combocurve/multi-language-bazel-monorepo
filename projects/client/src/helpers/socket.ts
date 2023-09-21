import { useEffect } from 'react';

import { useCallbackRef } from '@/components/hooks/useCallbackRef';
import { useAlfa } from '@/helpers/alfa';

import { defer } from './promise';

const defaultHandler = (resolve) => resolve;

type BoundSocket<T> = Promise<T> & { socketName: string; unbind: () => void };

/**
 * Handle a socket connection, unbinds when resolved/rejected const {CompanyPusher} = useAlfa();
 *
 * @example
 * 	import { useAlfa } from 'alfa';
 * 	import { handleSocket } from '/@helpers/socket';
 *
 * 	const { CompanyPusher } = useAlfa();
 *
 * 	const message = await handleSocket(
 * 		CompanyPusher,
 * 		'my-unique-socket-name',
 * 		(resolve, reject) =>
 * 			({ final, error, message }) => {
 * 				if (final) {
 * 					if (error) {
 * 						reject(error);
 * 					} else {
 * 						resolve(message);
 * 					}
 * 				}
 * 			}
 * 	);
 */
export function handleSocket<T>(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	Pusher: any,
	socketName: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	handler: (resolveCb: (value?: T) => void, rejectCb: (value: any) => void) => (value: any) => void = defaultHandler
): BoundSocket<T> {
	let bound = false;
	const { promise, resolve: resolve_, reject: reject_ } = defer<T>();

	function resolve(value: T) {
		if (!bound) {
			return;
		}
		unbind();
		resolve_(value);
	}

	function reject(value: Error) {
		if (!bound) {
			return;
		}
		unbind();
		reject_(value);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const cb = handler(resolve as any, reject); // TODO resolve as any here

	const realHandler = (value) => {
		if (!bound) {
			return null;
		}
		return cb(value);
	};

	function unbind() {
		if (bound) {
			Pusher.unbind(socketName, realHandler);
		}
	}

	Pusher.bind(socketName, realHandler);
	bound = true;

	return Object.assign(promise, { unbind, socketName });
}

/**
 * Hook version of handleSocket
 *
 * @example
 * 	import { useAlfa } from 'alfa';
 * 	import { useSocket } from '@/helpers/socket';
 *
 * 	useSocket('my-unique-socket-name', ({ final, error, message }) => {
 * 		if (final) {
 * 			if (error) {
 * 				onError(error);
 * 			} else {
 * 				onCompleted(message);
 * 			}
 * 		}
 * 	});
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function useSocket(socketName: string | false, listener: (payload: any) => void, userScoped = false) {
	const { Pusher, CompanyPusher } = useAlfa();
	const pusher = userScoped ? Pusher : CompanyPusher;

	const listenerConst = useCallbackRef(listener);

	useEffect(() => {
		if (socketName === false) {
			// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
			return () => {};
		}
		pusher.bind(socketName, listenerConst);
		return () => pusher.unbind(socketName, listenerConst);
	}, [pusher, socketName, listenerConst]);
}
