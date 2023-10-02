import { Request, Response } from 'express';

import { getUrlData } from '@src/helpers/express';
import { getValidFilters } from '@src/helpers/validation';
import { ISort } from '@src/helpers/mongo-queries';

import { castQuery, getFilterQuery, NumberParser, parseCursor } from '../query';
import { getCursorPaginationData, getPaginationData, getPaginationHeaders } from '../pagination';

import { ApiWellMapping, filterableReadFields, READ_RECORD_LIMIT } from './fields';
import { WellMappingService } from './service';

type Locals = { service: WellMappingService };

const DEFAULT_PAGE_SIZE = 1000;
export const IS_TRANSACTIONAL = false;

export const getWellMappings = async (req: Request, res: Response<ApiWellMapping[]>): Promise<void> => {
	const { service } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
		cursor: { parse: parseCursor, defaultValue: undefined },
	};

	const { take, cursor } = castQuery(query, castQueryOptions);
	const sort = { id: -1 } as ISort;

	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableReadFields);

	const { result, hasNext, cursor: nextCursor } = await service.getWellMappings({ take, sort, filters, cursor });

	const urlData = getUrlData(req);
	const paginationData =
		nextCursor != undefined
			? getCursorPaginationData(urlData, nextCursor, take, hasNext)
			: getPaginationData(urlData, 0, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};
