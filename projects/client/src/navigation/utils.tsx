import { useQuery, type QueryOptions } from 'react-query';
import { defer, useParams, type LoaderFunctionArgs } from 'react-router-dom';

import { queryClient } from '@/helpers/query-cache';
import { assert } from '@/helpers/utilities';

import { BreadcrumbLink } from './Breadcrumbs';
import { type UseMatchesMatch } from './types';

type RequiredKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * @example
 * 	const getDocQuery = (id) => ({ queryKey: ['doc', id], queryFn: () => getApi(`/docs/${id}`) });
 * 	const routes = [
 * 		{
 * 			path: ':docId',
 * 			loader: createQueriesLoader(({ params }) => [getDocQuery(params.docId)]),
 * 		},
 * 	];
 */
export function createQueriesLoader(
	getQueries: (loaderArgs: LoaderFunctionArgs) => RequiredKeys<QueryOptions, 'queryKey'>[]
) {
	return (loaderArgs: LoaderFunctionArgs) => {
		return defer({
			...getQueries(loaderArgs).map((query) => queryClient.ensureQueryData(query)),
		});
	};
}

/**
 * @example
 * 	const getDocQuery = (id) => ({ queryKey: ['doc', id], queryFn: () => getApi(`/docs/${id}`) });
 *
 * 	const routes = [
 * 		{
 * 			path: ':docId',
 * 			handle: {
 * 				breadcrumb: createReactRouterBreadcrumb('docId', getDocQuery),
 * 			},
 * 		},
 * 	];
 */
export function createReactRouterBreadcrumb(
	idParamKey: string,
	getQuery: (id: string) => QueryOptions<{ name: string }>
) {
	function Breadcrumb({ match }: { match: UseMatchesMatch }) {
		const { [idParamKey]: id } = useParams();
		assert(id, 'id is not defined');

		const { data } = useQuery({ ...getQuery(id), suspense: true });

		return <BreadcrumbLink label={data?.name ?? ''} path={match.pathname} />;
	}

	return (match: UseMatchesMatch) => <Breadcrumb match={match} />;
}
