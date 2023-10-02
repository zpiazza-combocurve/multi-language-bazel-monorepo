import { Types } from 'mongoose';
import url from 'url';

import { IUrlData } from '@src/helpers/express';

export class InvalidIdError extends Error {
	expected = true;
	name = InvalidIdError.name;

	constructor(message?: string) {
		super(message);
	}
}

export type CursorType = string | number | Types.ObjectId;

export interface IPaginationData {
	cursor?: CursorType;
	skip?: number;
	take: number;
	total?: number;
	next?: string;
	prev?: string;
	first: string;
	last?: string;
}

export interface IPageData<T> {
	result: T[];
	hasNext: boolean;
	cursor?: CursorType | null;
}

export interface IPageDataObject<T> {
	result: T;
	hasNext: boolean;
}

const getPageUrl = ({ protocol, host, pathname, query }: IUrlData, skip: number, take: number) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { cursor, ...restQuery } = query;
	return url.format({ protocol, host, pathname, query: { ...restQuery, skip, take } });
};

const getCursorPageUrl = ({ protocol, host, pathname, query }: IUrlData, cursor: string | undefined, take: number) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { cursor: prevCursor, ...nextQuery } = query;

	if (cursor) {
		nextQuery.cursor = cursor;
	}

	return url.format({ protocol, host, pathname, query: { ...nextQuery, take } });
};

const nextPageUrl = (urlData: IUrlData, skip: number, take: number, total?: number): string | undefined => {
	if (total !== undefined && skip + take >= total) {
		return undefined;
	}
	return getPageUrl(urlData, skip + take, take);
};

const nextCursorPageUrl = (urlData: IUrlData, cursor: string, take: number): string | undefined =>
	getCursorPageUrl(urlData, cursor, take);

const prevPageUrl = (urlData: IUrlData, skip: number, take: number): string | undefined =>
	skip > 0 ? getPageUrl(urlData, Math.max(skip - take, 0), take) : undefined;

const firstPageUrl = (urlData: IUrlData, take: number): string => getPageUrl(urlData, 0, take);

const firstCursorPageUrl = (urlData: IUrlData, take: number): string => getCursorPageUrl(urlData, undefined, take);

const lastPageUrl = (urlData: IUrlData, skip: number, take: number, total: number): string => {
	const remainingPages = Math.ceil((total - skip) / take);
	const lastSkip = (remainingPages - 1) * take + skip;
	return getPageUrl(urlData, Math.max(lastSkip, 0), take);
};

export const getCursorPaginationData = (
	urlData: IUrlData,
	cursor: CursorType,
	take: number,
	hasNext: boolean,
): IPaginationData => {
	const cursor64 = Buffer.from(cursor.toString()).toString('base64');
	return {
		cursor: cursor64,
		take,
		next: hasNext ? nextCursorPageUrl(urlData, cursor64, take) : undefined,
		first: firstCursorPageUrl(urlData, take),
	};
};

export const getPaginationData = (
	urlData: IUrlData,
	skip: number,
	take: number,
	hasNext: boolean,
): IPaginationData => ({
	skip,
	take,
	next: hasNext ? nextPageUrl(urlData, skip, take) : undefined,
	prev: prevPageUrl(urlData, skip, take),
	first: firstPageUrl(urlData, take),
});

export const getPaginationDataWithTotal = (
	urlData: IUrlData,
	skip: number,
	take: number,
	total: number,
): IPaginationData => ({
	skip,
	take,
	total,
	next: nextPageUrl(urlData, skip, take, total),
	prev: prevPageUrl(urlData, skip, take),
	first: firstPageUrl(urlData, take),
	last: lastPageUrl(urlData, skip, take, total),
});

export const getPaginationHeaders = ({ total, next, prev, first, last }: IPaginationData): Record<string, string> => {
	// Link HTTP header reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Link
	const links = Object.entries({ next, prev, first, last })
		.filter(([, link]) => link)
		.map(([rel, link]) => `<${link}>;rel="${rel}"`)
		.join(',');
	return {
		Link: links,
		...(total === undefined ? {} : { 'X-Query-Count': total.toString() }),
	};
};
