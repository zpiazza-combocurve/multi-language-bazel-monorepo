// TODO rename file to react-query-configuration or similar

import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect, useState } from 'react';
import { QueryClient, QueryObserver, type QueryKey, type QueryOptions } from 'react-query';

import { useCallbackRef } from '@/components/hooks/useCallbackRef';
import { useDeepCompareMemoize } from '@/components/hooks/useDeepCompareMemoize';
import { useHotkey } from '@/components/hooks/useHotkey';
import { genericErrorAlert } from '@/helpers/alerts';

import { getApi, postApi } from './routing';

const DEFAULT_CACHE_TIME = 5 * 60 * 1000;

// Default values when utilizing the cache
export const DEFAULT_QUERY_OPTIONS = {
	staleTime: DEFAULT_CACHE_TIME,
	cacheTime: DEFAULT_CACHE_TIME,
	refetchOnMount: true,
};

/**
 * Default query handler
 *
 * @example
 * 	const useTypeCurveHeaders = (id) =>
 * 		useQuery(['tc', id, 'get', `/type-curves/${id}/view`, { headers: ['well_name'] }]);
 */
export async function defaultQueryFn({ queryKey }) {
	const [, , method, url, params] = queryKey;
	if (method === 'get') {
		return getApi(url, params);
	}
	if (method === 'post') {
		return postApi(url, params);
	}
	// TODO Leaving this console.log here to bring attention to the issue. This seems like react-query issue, error occurs in company wells page when using the `useReactQueryEvent` hook, it seems to be calling the `queryFn` for some reason
	// eslint-disable-next-line no-console
	console.error(`Invalid method ${method} from query "${queryKey}"`);
	return null;
}

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			queryFn: defaultQueryFn,
			refetchOnWindowFocus: false,
			refetchOnMount: false,
			cacheTime: 0,
			retry: false,
			onError: (err) => {
				genericErrorAlert(err as Error);
			},
		},
		mutations: {
			onError: (err) => {
				genericErrorAlert(err as Error);
			},
		},
	},
});

export function HiddenReactQueryDevTools() {
	const [shown, setShown] = useState(false);
	useHotkey('ctrl+shift+g', () => {
		setShown((p) => !p);
		return false;
	});
	if (!shown) {
		return null;
	}
	return <ReactQueryDevtools initialIsOpen={false} />;
}

/**
 * Allows to subscribe to queries
 *
 * @example
 * 	useReactQueryEvent(['well-headers'], () => {
 * 		// refresh data outside of react-query, eg ag grid
 * 	});
 *
 * @see https://react-query.tanstack.com/reference/QueryObserver
 */
export function useReactQueryEvent(queryKey: QueryKey, fn: () => void) {
	const fnRef = useCallbackRef(fn);
	const memoizedKey = useDeepCompareMemoize(queryKey);
	useEffect(() => {
		const observer = new QueryObserver(queryClient, { queryKey: memoizedKey });
		return observer.subscribe(() => {
			fnRef();
		});
	}, [fnRef, memoizedKey]);
}

type RequiredKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Already included in react query v4
 *
 * @deprecated
 * @see https://tanstack.com/query/v4/docs/react/reference/QueryClient#queryclientensurequerydata
 */
export function ensureQuery<TData>(query: RequiredKeys<QueryOptions<TData>, 'queryKey'>) {
	return queryClient.ensureQueryData(query);
}
