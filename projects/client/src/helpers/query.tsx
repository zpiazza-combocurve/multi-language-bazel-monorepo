import { useEffect, useRef } from 'react';
import * as React from 'react';
import { QueryKey, UseQueryOptions, UseQueryResult, useIsFetching, useQuery } from 'react-query';

import { useLoadingBar } from './alerts';
import { queryClient } from './query-cache';
import { ValueOrFunction, resolveValueOrFunction } from './utilities';

/**
 * @example
 * 	import { WithQuery } from '@/helpers/query';
 *
 * 	<WithQuery queryKey='foo' queryFn={() => getApi()}>
 * 		{(query) => <></>}
 * 	</WithQuery>;
 */
export function WithQuery<T>({
	children,
	...queryOptions
}: UseQueryOptions<T> & {
	children: ValueOrFunction<React.ReactNode, [UseQueryResult<T>]>;
}) {
	const query = useQuery(queryOptions);
	return <>{resolveValueOrFunction(children, query)}</>;
}

/** @deprecated Using a boolean for this is not a good practice, use `invalidateQueries` directly */
export function useInvalidateQuery(key: QueryKey, refresh) {
	const refreshRef = useRef(refresh);

	useEffect(() => {
		if (refreshRef.current !== refresh) {
			queryClient.invalidateQueries(key);
			refreshRef.current = refresh;
		}
	}, [refresh, key]);
}

export function UseQueryLoadingBar() {
	const isFetching = useIsFetching(); // https://react-query.tanstack.com/reference/useIsFetching
	useLoadingBar(!!isFetching);
	return null;
}
