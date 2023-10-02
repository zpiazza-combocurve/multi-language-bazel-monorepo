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
	ApiOwnershipReversion,
	filterableFields,
	READ_RECORD_LIMIT,
	sortableFields,
	toOwnershipReversion,
	WRITE_RECORD_LIMIT,
} from './fields/ownership-reversions';
import {
	checkDuplicates,
	OwnershipReversionCollisionError,
	OwnershipReversionNotFoundError,
	parseApiOwnershipReversion,
} from './validation';
import { OwnershipReversionService } from './service';

const { MULTI_STATUS, NO_CONTENT, OK } = StatusCodes;

type Locals = { service: OwnershipReversionService; project: BaseProjectResolved; econModelService: EconModelService };

const DEFAULT_PAGE_SIZE = 25;
const IS_TRANSACTIONAL = false;

export const getOwnershipReversionsHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getOwnershipReversionsCount(filters, project);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getOwnershipReversionById = async (req: Request, res: Response<ApiOwnershipReversion>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const ownershipReversionId = parseObjectId(id);

	const ownershipReversion = await service.getById(ownershipReversionId, project);
	if (!ownershipReversion) {
		throw new OwnershipReversionNotFoundError(
			`No ownership reversion was found with id \`${id}\` in project \`${project._id}:${project.name}\``,
		);
	}

	res.status(OK).json(ownershipReversion);
};

export const getOwnershipReversions = async (req: Request, res: Response<ApiOwnershipReversion[]>): Promise<void> => {
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
	} = await service.getOwnershipReversions(skip, take, sort, filters, project, cursorQuery);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const postOwnershipReversions = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiOwnershipReversions = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid ownership reversions data structure', `[${index}]`);
			}
			return parseApiOwnershipReversion(element, index);
		}),
	);

	apiOwnershipReversions = await service.checkWells(apiOwnershipReversions, project._id, errorAggregator);
	apiOwnershipReversions = await service.checkScenarios(apiOwnershipReversions, project._id, errorAggregator);

	const names = apiOwnershipReversions.map((ownershipReversion) => ownershipReversion?.name);
	const existingNames = await service.getExistingNames(names.filter(notNil), project._id);

	apiOwnershipReversions = apiOwnershipReversions.filter(notNil).map((ownershipReversion, index) =>
		errorAggregator.catch(() => {
			const existName = ownershipReversion.name && existingNames.includes(ownershipReversion.name);
			if (existName) {
				throw new OwnershipReversionCollisionError(
					`Ownership reversion with name \`${ownershipReversion?.name}\` already exists in project \`${project._id}\``,
					`[${index}]`,
				);
			}
			return ownershipReversion;
		}),
	);

	apiOwnershipReversions = checkDuplicates(apiOwnershipReversions, errorAggregator);

	const ownershipReversions = apiOwnershipReversions.map(
		(ownershipReversions) => ownershipReversions && toOwnershipReversion(ownershipReversions, project._id),
	);

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const successResponse = await service.create(ownershipReversions);
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const putOwnershipReversions = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiOwnershipReversions = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid ownership reversion data structure', `[${index}]`);
			}
			return parseApiOwnershipReversion(element, index);
		}),
	);

	apiOwnershipReversions = await service.checkScenarios(apiOwnershipReversions, project._id, errorAggregator);
	apiOwnershipReversions = await service.checkWells(apiOwnershipReversions, project._id, errorAggregator);
	apiOwnershipReversions = checkDuplicates(apiOwnershipReversions, errorAggregator);

	const ownershipReversions = apiOwnershipReversions.map(
		(ownershipReversion) => ownershipReversion && toOwnershipReversion(ownershipReversion, project._id),
	);

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const successResponse = await service.upsert(ownershipReversions, project._id);

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const deleteOwnershipReversion = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const escalationModelId = parseObjectId(id);

	const deleteCount = await service.deleteOwnershipReversionById(escalationModelId, project);

	res.status(NO_CONTENT).set(getDeleteHeaders(deleteCount)).end();
};
