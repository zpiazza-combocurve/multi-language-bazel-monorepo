import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { castQuery, getFilterQuery, NumberParser, parseCursor, SortParser } from '@src/api/v1/query';
import {
	checkRecordCount,
	getValidFilters,
	isObject,
	parseObjectId,
	RequestStructureError,
	validatePaginationFilters,
} from '@src/helpers/validation';
import {
	getCursorPaginationData,
	getPaginationData,
	getPaginationDataWithTotal,
	getPaginationHeaders,
} from '@src/api/v1/pagination';
import { getResponseFromErrors, IMultiStatusResponse, mergeResponses, withCounts } from '@src/api/v1/multi-status';
import { getDeleteHeaders } from '@src/api/v1/delete';
import { getUrlData } from '@src/helpers/express';
import { ISort } from '@src/helpers/mongo-queries';
import { notNil } from '@src/helpers/typing';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { BaseProjectResolved } from '../../fields';
import { EconModelService } from '../service';

import {
	ApiRisking,
	filterableFields,
	READ_RECORD_LIMIT,
	sortableFields,
	toRisking,
	WRITE_RECORD_LIMIT,
} from './fields/risking';
import { checkModelDuplicates, parseApiRisking, RiskingCollisionError, RiskingNotFoundError } from './validation';
import { RiskingService } from './service';

const { MULTI_STATUS, NO_CONTENT, OK } = StatusCodes;

type Locals = { service: RiskingService; project: BaseProjectResolved; econModelService: EconModelService };

const DEFAULT_PAGE_SIZE = 25;
const IS_TRANSACTIONAL = false;

export const getRiskingsHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getRiskingsCount(filters, project);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getRiskingById = async (req: Request, res: Response<ApiRisking>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const riskingId = parseObjectId(id);

	const risking = await service.getById(riskingId, project);
	if (!risking) {
		throw new RiskingNotFoundError(
			`No risking model was found with id \`${id}\` in project \`${project._id}:${project.name}\``,
		);
	}

	res.status(OK).json(risking);
};

export const getRiskings = async (req: Request, res: Response<ApiRisking[]>): Promise<void> => {
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
	} = await service.getRiskings(skip, take, sort, filters, project, cursorQuery);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const postRiskings = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiRiskings = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid risking model data structure', `[${index}]`);
			}
			return parseApiRisking(element, index);
		}),
	);

	apiRiskings = await service.checkWells(apiRiskings, project._id, errorAggregator);
	apiRiskings = await service.checkScenarios(apiRiskings, project._id, errorAggregator);

	const names = apiRiskings.map((risking) => risking?.name);
	const existingNames = await service.getExistingNames(names.filter(notNil), project._id);

	apiRiskings = apiRiskings.filter(notNil).map((risking, index) =>
		errorAggregator.catch(() => {
			const existName = risking.name && existingNames.includes(risking.name);
			if (existName) {
				throw new RiskingCollisionError(
					`Risking with name \`${risking?.name}\` already exists in project \`${project._id}\``,
					`[${index}]`,
				);
			}
			return risking;
		}),
	);

	apiRiskings = checkModelDuplicates(apiRiskings, errorAggregator);

	const riskings = apiRiskings.map((risking) => risking && toRisking(risking, project._id));

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const successResponse = await service.create(riskings);
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const putRiskings = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiRiskings = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid risking model data structure', `[${index}]`);
			}
			return parseApiRisking(element, index);
		}),
	);

	apiRiskings = await service.checkScenarios(apiRiskings, project._id, errorAggregator);
	apiRiskings = await service.checkWells(apiRiskings, project._id, errorAggregator);
	apiRiskings = checkModelDuplicates(apiRiskings, errorAggregator);

	const riskings = apiRiskings.map((risking) => risking && toRisking(risking, project._id));

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const successResponse = await service.upsert(riskings, project._id);

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const deleteRiskingById = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const riskingId = parseObjectId(id);

	const deleteCount = await service.deleteRiskingIdById(riskingId, project);

	res.status(NO_CONTENT).set(getDeleteHeaders(deleteCount)).end();
};
