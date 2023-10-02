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
	ApiEscalation,
	filterableFields,
	READ_RECORD_LIMIT,
	sortableFields,
	toEscalation,
	WRITE_RECORD_LIMIT,
} from './fields/escalations';
import {
	checkModelDuplicates,
	EscalationCollisionError,
	EscalationNotFoundError,
	parseApiEscalation,
} from './validation';
import { EscalationService } from './service';

const { MULTI_STATUS, NO_CONTENT, OK } = StatusCodes;

type Locals = { service: EscalationService; project: BaseProjectResolved; econModelService: EconModelService };

const DEFAULT_PAGE_SIZE = 25;
const IS_TRANSACTIONAL = false;

export const getEscalationsHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getEscalationsCount(filters, project);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getEscalationById = async (req: Request, res: Response<ApiEscalation>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const escalationId = parseObjectId(id);

	const escalation = await service.getById(escalationId, project);
	if (!escalation) {
		throw new EscalationNotFoundError(
			`No escalation model was found with id \`${id}\` in project \`${project._id}:${project.name}\``,
		);
	}

	res.status(OK).json(escalation);
};

export const getEscalations = async (req: Request, res: Response<ApiEscalation[]>): Promise<void> => {
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
	} = await service.getEscalations(skip, take, sort, filters, project, cursorQuery);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const postEscalations = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiEscalations = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid escalation model data structure', `[${index}]`);
			}
			return parseApiEscalation(element, index);
		}),
	);

	apiEscalations = await service.checkWells(apiEscalations, project._id, errorAggregator);
	apiEscalations = await service.checkScenarios(apiEscalations, project._id, errorAggregator);

	const names = apiEscalations.map((escalation) => escalation?.name);
	const existingNames = await service.getExistingNames(names.filter(notNil), project._id);

	apiEscalations = apiEscalations.filter(notNil).map((escalation, index) =>
		errorAggregator.catch(() => {
			const existName = escalation.name && existingNames.includes(escalation.name);
			if (existName) {
				throw new EscalationCollisionError(
					`Escalation with name \`${escalation?.name}\` already exists in project \`${project._id}\``,
					`[${index}]`,
				);
			}
			return escalation;
		}),
	);

	apiEscalations = checkModelDuplicates(apiEscalations, errorAggregator);

	const escalations = apiEscalations.map((escalation) => escalation && toEscalation(escalation, project._id));

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const successResponse = await service.create(escalations);
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const putEscalations = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiEscalations = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid escalation model data structure', `[${index}]`);
			}
			return parseApiEscalation(element, index);
		}),
	);

	apiEscalations = await service.checkScenarios(apiEscalations, project._id, errorAggregator);
	apiEscalations = await service.checkWells(apiEscalations, project._id, errorAggregator);
	apiEscalations = checkModelDuplicates(apiEscalations, errorAggregator);

	const escalations = apiEscalations.map((escalation) => escalation && toEscalation(escalation, project._id));

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const successResponse = await service.upsert(escalations, project._id);

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const deleteEscalationById = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const escalationId = parseObjectId(id);

	const deleteCount = await service.deleteEscalationIdById(escalationId, project);

	res.status(NO_CONTENT).set(getDeleteHeaders(deleteCount)).end();
};
