// https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Promise.jsm/Deferred
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function defer<T = any, E = Error>() {
	const result = {} as {
		promise: Promise<T>;
		resolve: (value: T) => void;
		reject: (error: E) => void;
	};
	result.promise = new Promise((s, r) => {
		result.resolve = s;
		result.reject = r;
	});
	return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export type SyncResolver<T, P extends any[] = []> = T | ((...rest: P) => T);
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export type Resolver<T, P extends any[] = []> = T | ((...rest: P) => Promise<T> | T);
export type Setter<T> = (newValue: SyncResolver<T, [T]>) => void;

/** @deprecated Use '@/helpers/utilities'.resolveValueOrFunction instead */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function resolveSyncValue<T, P extends any[] = never>(fn: SyncResolver<T, P>, ...params: P): T {
	if (typeof fn === 'function') {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		return fn(...params);
	}
	return fn;
}

/** @deprecated Use '@/helpers/utilities'.resolveValueOrFunction instead and wrap it in a Promise.resolve call */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function resolveValue<T, P extends any[] = []>(fn: Resolver<T, P>, ...params: P): Promise<T> {
	return Promise.resolve(resolveSyncValue(fn, ...params));
}
