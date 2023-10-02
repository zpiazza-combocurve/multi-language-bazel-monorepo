import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { castQuery, getFilterQuery, NumberParser, parseCursor, SortParser } from '@src/api/v1/query';
import { checkRecordCount, getValidFilters, parseObjectId, validatePaginationFilters } from '@src/helpers/validation';
import {
	getCursorPaginationData,
	getPaginationData,
	getPaginationDataWithTotal,
	getPaginationHeaders,
} from '@src/api/v1/pagination';
import { getUrlData } from '@src/helpers/express';
import { ISort } from '@src/helpers/mongo-queries';
import { notNil } from '@src/helpers/typing';

import { createFinalMultiResponse, emptyResponse, IMultiStatusResponse } from '../../multi-status';
import { BaseProjectResolved } from '../fields';
import { getDeleteHeaders } from '../../delete';
import { ValidationErrorAggregator } from '../../multi-error';

import { ApiScenario, filterableDeleteDbFields, filterableFields, READ_RECORD_LIMIT, sortableFields } from './fields';
import { parseScenarioPayload, ScenarioNotFoundError } from './validation';
import { ScenarioService } from './service';

const { MULTI_STATUS, NO_CONTENT, OK } = StatusCodes;

type Locals = { service: ScenarioService; project: BaseProjectResolved };

const DEFAULT_PAGE_SIZE = 25;

export const SCENARIO_WRL = 20;
export const SCENARIO_RRL = 200;

export const getScenariosHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getScenariosCount(filters, project);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getScenarios = async (req: Request, res: Response<ApiScenario[]>): Promise<void> => {
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
	} = await service.getScenarios(skip, take, sort, filters, project, cursorQuery);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const getScenarioById = async (req: Request, res: Response<ApiScenario>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const scenarioId = parseObjectId(id);

	const scenario = await service.getById(scenarioId, project);
	if (!scenario) {
		throw new ScenarioNotFoundError(
			`No scenario was found with id \`${id}\` in project \`${project._id}:${project.name}\``,
		);
	}

	res.status(OK).json(scenario);
};

export const upsertScenario = async (req: Request, res: Response): Promise<void> => {
	const { project, service } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, SCENARIO_WRL);

	const errors = new ValidationErrorAggregator();
	let successResponse: IMultiStatusResponse = emptyResponse;

	const namesHash = new Set<string>(await service.getNames(project._id));
	const models = parseScenarioPayload(data, namesHash, errors);

	if (models.some(notNil)) {
		successResponse = await service.upsertScenarios(project._id, models.filter(notNil));
	}

	res.status(MULTI_STATUS).json(createFinalMultiResponse(successResponse, errors));
};

export const deleteScenarios = async (req: Request, res: Response): Promise<void> => {
	const { project, service } = res.locals as Locals;
	const { filters } = getValidFilters(req.query, filterableDeleteDbFields);

	const deletedCount = await service.deleteScenarios(project._id, filters);

	res.status(NO_CONTENT).set(getDeleteHeaders(deletedCount)).end();
};
