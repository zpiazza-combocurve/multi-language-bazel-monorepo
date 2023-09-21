import _ from 'lodash-es';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDebouncedValue } from '@/helpers/debounce';

const usePagination = (dataIn, itemsPerPageIn) => {
	const [data, setData] = useState(dataIn ?? []);
	const [itemsPerPage, setItemsPerPage] = useState(itemsPerPageIn ?? 5);
	const [_page, setPage] = useState(0);

	const page = useDebouncedValue(_page, 200);

	const length = useMemo(() => data?.length || 0, [data]);
	const pageTotal = useMemo(() => Math.ceil(length / itemsPerPage), [length, itemsPerPage]);

	const cachedIndex = useRef({
		lowerIndex: _page * itemsPerPage + 1,
		upperIndex: (_page + 1) * itemsPerPage,
	});

	cachedIndex.current = {
		lowerIndex: _page * itemsPerPage + 1,
		upperIndex: (_page + 1) * itemsPerPage,
	};

	const canMove = useCallback(
		(direction) => _page + direction > -1 && _page + direction < pageTotal,
		[_page, pageTotal]
	);

	// use debounced page value for calculating the indices
	const dataLowerIndex = useMemo(() => page * itemsPerPage + 1, [page, itemsPerPage]);
	const dataUpperIndex = useMemo(
		() => (page + 1 > -1 && page + 1 < pageTotal ? (page + 1) * itemsPerPage : length),
		[pageTotal, page, itemsPerPage, length]
	);

	const curPageData = useMemo(
		() => data.slice(dataLowerIndex - 1, dataUpperIndex),
		[data, dataLowerIndex, dataUpperIndex]
	);

	const prevPageData = useMemo(
		() => (canMove(-1) ? data.slice(dataLowerIndex - itemsPerPage - 1, dataLowerIndex - 1) : []),
		[canMove, data, dataLowerIndex, itemsPerPage]
	);

	const nextPageData = useMemo(
		() => (canMove(1) ? data.slice(dataUpperIndex, dataUpperIndex + itemsPerPage) : []),
		[canMove, data, dataUpperIndex, itemsPerPage]
	);

	const getPageDataFromCurrent = useCallback(
		(pages): string[][] => {
			// if pages is positive, we are grabbing pages ahead; if negative, grab pages before
			if (!Number.isFinite(pages) || pages === 0) {
				throw new Error('Invalid number of pages requested');
			}

			const usePagesBefore = pages < 0;
			const referenceIndex = usePagesBefore ? dataLowerIndex - 1 : dataUpperIndex;
			const ids = usePagesBefore
				? data.slice(Math.max(referenceIndex + itemsPerPage * pages, 0), referenceIndex)
				: data.slice(referenceIndex, referenceIndex + itemsPerPage * pages);

			if (!ids?.length) {
				return [];
			}

			return usePagesBefore
				? _.map(_.chunk(_.reverse(ids), itemsPerPage), (pageData) => _.reverse(pageData as string[]))
				: _.chunk(ids, itemsPerPage);
		},
		[data, dataLowerIndex, dataUpperIndex, itemsPerPage]
	);

	const movePage = useCallback(
		(direction) => {
			if (canMove(direction)) {
				setPage((curPage) => curPage + direction);
			}
		},
		[canMove]
	);

	const safeSetIpp = useCallback((input) => {
		const trueLowerIndex = cachedIndex.current.lowerIndex - 1;
		setPage((trueLowerIndex - (trueLowerIndex % input)) / input);
		setItemsPerPage(input);
	}, []);

	useEffect(() => {
		if (cachedIndex.current.lowerIndex > dataIn.length) {
			setPage(0);
		}

		setData(dataIn);
	}, [dataIn]);

	useEffect(() => {
		safeSetIpp(itemsPerPageIn);
	}, [itemsPerPageIn, safeSetIpp]);

	return {
		canMove,
		curPage: _page + 1,
		curPageData,
		getPageDataFromCurrent,
		itemsPerPage,
		length,
		lowerIndex: dataLowerIndex,
		movePage,
		nextPageData,
		pageTotal,
		prevPageData,
		setItemsPerPage: safeSetIpp,
		setPage,
		upperIndex: dataUpperIndex,
	};
};

export default usePagination;
