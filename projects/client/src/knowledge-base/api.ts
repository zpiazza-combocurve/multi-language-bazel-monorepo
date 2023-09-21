import { useQuery, useQueryClient } from 'react-query';

import { getApi } from '@/helpers/routing';

const KNOWLEDGE_BASE_API = '/knowledge-base';

export const useGetRootCategoryTree = () => {
	const queryClient = useQueryClient();

	const queryKey = ['knowledge-base', 'root-categories'];

	const query = useQuery(queryKey, () => getApi(`${KNOWLEDGE_BASE_API}/root-categories`));

	const reload = () => queryClient.invalidateQueries(queryKey);

	return {
		...query,
		reload,
	};
};

export const useArticles = ({ categoryId }) => {
	const queryClient = useQueryClient();

	const queryKey = ['knowledge-base', 'articles', categoryId];

	const query = useQuery(queryKey, () => getApi(`${KNOWLEDGE_BASE_API}/articles`, { categoryId }));

	const reload = () => queryClient.invalidateQueries(queryKey);

	return {
		...query,
		reload,
	};
};

export const useSearchArticles = ({ searchText }) => {
	const queryClient = useQueryClient();

	const queryKey = ['knowledge-base', 'articles', 'search'];

	const query = useQuery(queryKey, () => getApi(`${KNOWLEDGE_BASE_API}/articles/search`, { searchText }));

	const reload = () => queryClient.invalidateQueries(queryKey);

	return {
		...query,
		reload,
	};
};

export const useArticleById = ({ articleId }) => {
	const queryClient = useQueryClient();

	const queryKey = ['knowledge-base', 'articles', articleId];

	const query = useQuery(queryKey, () => getApi(`${KNOWLEDGE_BASE_API}/articles/${articleId}`));

	const reload = () => queryClient.invalidateQueries(queryKey);

	return {
		...query,
		reload,
	};
};

export const useRecentArticles = () => {
	const queryClient = useQueryClient();

	const queryKey = ['knowledge-base', 'recent-articles'];

	const query = useQuery(queryKey, () => getApi(`${KNOWLEDGE_BASE_API}/recent-articles`));

	const reload = () => queryClient.invalidateQueries(queryKey);

	return {
		...query,
		reload,
	};
};
