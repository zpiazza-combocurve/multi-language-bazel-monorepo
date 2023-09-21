import { differenceInCalendarDays } from 'date-fns';

import { useRecentArticles } from '@/knowledge-base/api';

const ITEM_NEW_IF_LESS_THAN_DAYS = 14;

const useKnowledgeBaseAPI = () => {
	const { data: recentArticles } = useRecentArticles();

	const newArticles = (recentArticles || []).filter(
		({ createdTime }) => differenceInCalendarDays(new Date(), new Date(createdTime)) < ITEM_NEW_IF_LESS_THAN_DAYS
	);

	return {
		recentArticles: recentArticles || [],
		newArticles,
	};
};

export default useKnowledgeBaseAPI;
