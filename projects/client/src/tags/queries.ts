import { UseQueryOptions, useQuery } from 'react-query';

import { getApi } from '@/helpers/routing';

const TAGS_QUERY_CACHE_TIME = 5 * 60 * 1000; // 5 minute(s) in milliseconds
const TAGS_QUERY_STALE_TIME = 1 * 60 * 1000; // 1 minute(s) in milliseconds

export const TAGS_QUERY_KEYS = {
	all: ['tags'],
	list: () => [...TAGS_QUERY_KEYS.all, 'list'],
	listAllTags: () => [...TAGS_QUERY_KEYS.list(), 'all'],
	listFeatTags: (variables) => [...TAGS_QUERY_KEYS.list(), 'all', variables],
};

type GetAllTagsQuery = Inpt.Api.Tags.PopulatedTag[];

export const useGetAllTags = () =>
	useQuery<GetAllTagsQuery>(TAGS_QUERY_KEYS.listAllTags(), () => getApi('/tags'), {
		cacheTime: TAGS_QUERY_CACHE_TIME,
		staleTime: TAGS_QUERY_STALE_TIME,
	});

type GetFeatTagsQuery = Inpt.ObjectId<'tag'>[];

type GetFeatTagsQueryVariables = {
	feat: string;
	featId: Inpt.ObjectId | undefined;
};

export const useGetFeatTags = (variables: GetFeatTagsQueryVariables, options?: UseQueryOptions<GetFeatTagsQuery>) =>
	useQuery<GetFeatTagsQuery>(
		TAGS_QUERY_KEYS.listFeatTags(variables),
		() => getApi(`/tags/${variables.feat}/${variables.featId}`),
		{
			...options,
			enabled: options?.enabled || !!variables.featId,
			cacheTime: TAGS_QUERY_CACHE_TIME,
			staleTime: TAGS_QUERY_STALE_TIME,
		}
	);
