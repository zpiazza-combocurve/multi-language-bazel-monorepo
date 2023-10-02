import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { castQuery, getFilterQuery, NumberParser, parseCursor, SortParser } from '@src/api/v1/query';
import {
	getCursorPaginationData,
	getPaginationData,
	getPaginationDataWithTotal,
	getPaginationHeaders,
} from '@src/api/v1/pagination';
import { getValidFilters, parseObjectId, validatePaginationFilters } from '@src/helpers/validation';
import { getUrlData } from '@src/helpers/express';
import { ISort } from '@src/helpers/mongo-queries';

import { BaseProjectResolved } from '../fields';

import { ApiTypeCurve, filterableFields, READ_RECORD_LIMIT, sortableFields } from './fields/type-curve';
import { ApiTypeCurveRepWell } from './fields/type-curve-rep-wells';
import { ApiTypeCurveVolumeFit } from './fields/type-curve-volume-fits';
import { TypeCurveNotFoundError } from './validation';
import { TypeCurveService } from './service';

const { OK } = StatusCodes;

type Locals = { service: TypeCurveService; project: BaseProjectResolved };

const DEFAULT_PAGE_SIZE = 25;

export const getTypeCurvesHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getTypeCurvesCount(filters, project);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getTypeCurves = async (req: Request, res: Response<ApiTypeCurve[]>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	validatePaginationFilters(query);

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
		sort: { parse: SortParser(sortableFields), defaultValue: { id: -1 } as ISort },
		cursor: { parse: parseCursor, defaultValue: undefined },
	};

	const { skip, take, sort, cursor: cursorQuery } = castQuery(query, castQueryOptions);

	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const {
		result,
		hasNext,
		cursor: cursorNext,
	} = await service.getTypeCurves(skip, take, sort, filters, project, cursorQuery);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const getTypeCurveById = async (req: Request, res: Response<ApiTypeCurve>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const typeCurveId = parseObjectId(id);

	const typeCurve = await service.getById(typeCurveId, project);
	if (!typeCurve) {
		throw new TypeCurveNotFoundError(
			`No type curve was found with id \`${id}\` in project \`${project._id}:${project.name}\``,
		);
	}

	res.status(OK).json(typeCurve);
};

export const getTypeCurveDailyFits = async (req: Request, res: Response<ApiTypeCurveVolumeFit[]>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;
	const { query } = req;

	res.status(OK).json(await getVolumeFits(query, service, project, id, 'daily'));
};

export const getTypeCurveMonthlyFits = async (req: Request, res: Response<ApiTypeCurveVolumeFit[]>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;
	const { query } = req;

	res.status(OK).json(await getVolumeFits(query, service, project, id, 'monthly'));
};

export const getWellsRep = async (req: Request, res: Response<ApiTypeCurveRepWell[]>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;
	const { query } = req;

	const typeCurveId = parseObjectId(id);

	const typeCurve = await service.exists(typeCurveId, project._id);
	if (!typeCurve) {
		throw new TypeCurveNotFoundError(
			`No type curve was found with id \`${id}\` in project \`${project._id}:${project.name}\``,
		);
	}
	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);

	const wellReps = await service.getWellsRep(id, { skip, limit: take });
	res.status(OK).json(wellReps);
};

const getVolumeFits = async (
	query: Record<string, unknown>,
	service: TypeCurveService,
	project: BaseProjectResolved,
	typeCurveId: string,
	type: 'monthly' | 'daily',
): Promise<ApiTypeCurveVolumeFit[]> => {
	const id = parseObjectId(typeCurveId);

	const typeCurve = await service.exists(id, project._id);
	if (!typeCurve) {
		throw new TypeCurveNotFoundError(
			`No type curve was found with id \`${id}\` in project \`${project._id}:${project.name}\``,
		);
	}
	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);

	return await service.getVolumeFits(typeCurveId, type, { skip, limit: take });
};
