import { inRange } from 'lodash-es';
import { useCallback, useMemo, useState } from 'react';

import { useDerivedState } from './useDerivedState';

export const DEFAULT_ITEMS_PER_PAGE = 50;

/**
 * Standard interface for handling pagination. Components dealing with pagination should expect to be passed a
 * `pagination` property with these types
 *
 * @see `@/components/Pagination` for the components that actually uses it
 */
export type Pagination = {
	itemsPerPage: number;
	onChangeItemsPerPage: (newIpp: number) => void;
	page: number;
	totalPages: number;

	startIndex: number;
	endIndex: number;

	total: number;

	onPrevPage: () => void;
	onNextPage: () => void;
	onChangePage: (page: number) => void;
};

export function usePagination({
	total,
	initialIndex = 0,
	itemsPerPage: itemsPerPageIn = DEFAULT_ITEMS_PER_PAGE,
}: {
	total: number;
	initialIndex?: number;
	itemsPerPage?: number;
}): Pagination {
	const [itemsPerPage, onChangeItemsPerPage] = useState(itemsPerPageIn);

	const [page, setPage] = useDerivedState(
		// inRange does not include the end index
		() => Math.floor((inRange(initialIndex, 0, Math.max(total, 0)) ? initialIndex : 0) / itemsPerPage),
		[total, itemsPerPage, initialIndex]
	);
	const totalPages = Math.floor((total + itemsPerPage - 1) / itemsPerPage);

	const onNextPage = useCallback(() => setPage((p) => p + 1), [setPage]);
	const onPrevPage = useCallback(() => setPage((p) => p - 1), [setPage]);
	const onChangePage = useCallback((p) => setPage(p), [setPage]);

	const startIndex = itemsPerPage * page;
	const endIndex = Math.min(itemsPerPage * (page + 1), total) - 1;

	return {
		itemsPerPage,
		onChangeItemsPerPage,

		page,
		totalPages,

		startIndex,
		endIndex,
		total,

		onPrevPage,
		onNextPage,
		onChangePage,
	};
}

function sortedSlice<T>(arr: T[], lower: number, upper: number, revert = false) {
	if (!arr) return [];
	if (revert) {
		return arr.slice(arr.length - upper, arr.length - lower).reverse();
	}
	return arr.slice(lower, upper);
}

export function usePaginatedArray<T>(
	array: T[],
	{
		revert = false,
		itemsPerPage = undefined,
		initialId = undefined,
	}: { itemsPerPage?: number; revert?: boolean; initialId?: T } = {},
	refresh = false
) {
	const pagination = usePagination({
		total: array?.length || 0,
		itemsPerPage,
		initialIndex: initialId !== undefined ? array.indexOf(initialId) : undefined,
	});
	const { startIndex, endIndex } = pagination;
	return [
		useMemo(
			() => sortedSlice(array, startIndex, endIndex + 1, revert),
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[array, endIndex, revert, startIndex, refresh]
		),
		pagination,
	] as const;
}
