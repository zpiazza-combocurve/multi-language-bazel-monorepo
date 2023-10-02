import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { castQuery, getFilterQuery, NumberParser, parseCursor, SortParser } from '@src/api/v1/query';
import {
	getCursorPaginationData,
	getPaginationData,
	getPaginationDataWithTotal,
	getPaginationHeaders,
} from '@src/api/v1/pagination';
import { getValidFilters, parseObjectId, validatePaginationFilters } from '@src/helpers/validation';
import { BaseProjectResolved } from '@src/api/v1/projects/fields';
import { getUrlData } from '@src/helpers/express';
import { IEconRun } from '@src/models/econ/econ-runs';
import { ISort } from '@src/helpers/mongo-queries';

import { ApiEconRunData, filterableFields, READ_RECORD_LIMIT, sortableFields } from './fields';
import { EconOneLinerNotFoundError } from './validation';
import { EconRunDataService } from './service';

const { OK } = StatusCodes;

type Locals = {
	service: EconRunDataService;
	project: BaseProjectResolved;
	scenarioId: Types.ObjectId;
	econRun: Pick<IEconRun, 'id' | 'runDate'>;
	scenarioName: string;
};

const DEFAULT_PAGE_SIZE = 25;

export const getEconRunDataHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service, project, scenarioId, econRun } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getEconRunDataCount(filters, project, scenarioId, econRun);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getEconRunData = async (req: Request, res: Response<ApiEconRunData[]>): Promise<void> => {
	const { service, project, scenarioId, econRun } = res.locals as Locals;
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
	} = await service.getEconRunData(skip, take, sort, filters, project, scenarioId, econRun, cursorQuery);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const getEconRunDataById = async (req: Request, res: Response<ApiEconRunData>): Promise<void> => {
	const { service, project, scenarioId, econRun, scenarioName } = res.locals as Locals;
	const { id } = req.params;

	const econRunDataId = parseObjectId(id);

	const econRunData = await service.getById(econRunDataId, project, scenarioId, econRun);
	if (!econRunData) {
		throw new EconOneLinerNotFoundError(
			`No econ run data was found with id \`${id}\` in project \`${project._id}:${project.name}\`, scenario \`${scenarioId}:${scenarioName}\` and econ run \`${econRun.id}\``,
		);
	}

	res.status(OK).json(econRunData);
};

export const getEconRunsComboNames = async (req: Request, res: Response<string[]>): Promise<void> => {
	const { service, project, scenarioId, econRun } = res.locals as Locals;

	const comboNames = await service.getEconRunComboNames(project, scenarioId, econRun);
	if (!comboNames) {
		throw new EconOneLinerNotFoundError(`There were no combo names found for econ run \`${econRun.id}\``);
	}

	res.status(OK).json(comboNames);
};
