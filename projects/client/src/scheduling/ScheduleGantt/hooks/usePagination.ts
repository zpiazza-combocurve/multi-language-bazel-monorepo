import { useCallback, useEffect, useMemo, useState } from 'react';

import { genericErrorAlert } from '@/helpers/alerts';

import { getGanttPaginationInfo } from '../api';

export const usePagination = ({ scheduleId }) => {
	const [isReady, setIsReady] = useState(false);

	const [numberOfWells, setNumberOfWells] = useState(0);
	const [pages, setPages] = useState<{ start: number; end: number }[]>([]);
	const [currentPage, setCurrentPage] = useState(0);

	const onNextPage = useCallback(() => setCurrentPage((p) => p + 1), [setCurrentPage]);
	const onPrevPage = useCallback(() => setCurrentPage((p) => p - 1), [setCurrentPage]);
	const onChangePage = useCallback((p) => setCurrentPage(p), [setCurrentPage]);

	const startIndex = useMemo(() => pages[currentPage]?.start, [pages, currentPage]);
	const endIndex = useMemo(() => pages[currentPage]?.end, [pages, currentPage]);
	const numberOfPages = useMemo(() => pages?.length, [pages]);

	useEffect(() => {
		const getGanttPagination = async () => {
			try {
				const ganttPaginationInfo = await getGanttPaginationInfo(scheduleId);

				setNumberOfWells(ganttPaginationInfo.total);
				setPages(ganttPaginationInfo.pages);
			} catch (error) {
				genericErrorAlert(error, 'Failed to retrieve the data');
			} finally {
				setIsReady(true);
			}
		};

		getGanttPagination();
	}, [scheduleId]);

	return {
		isReady,
		currentPage,
		numberOfPages,
		startIndex,
		endIndex,
		numberOfWells,

		onPrevPage,
		onNextPage,
		onChangePage,
	};
};
