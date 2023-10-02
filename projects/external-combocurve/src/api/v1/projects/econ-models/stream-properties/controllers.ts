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
	ApiStreamProperties,
	filterableFields,
	READ_RECORD_LIMIT,
	sortableFields,
	toStreamProperties,
	WRITE_RECORD_LIMIT,
} from './fields/stream-properties';
import {
	checkModelDuplicates,
	parseApiStreamProperties,
	StreamPropertiesCollisionError,
	StreamPropertiesNotFoundError,
} from './validation';
import { StreamPropertiesService } from './service';

const { MULTI_STATUS, NO_CONTENT, OK } = StatusCodes;

type Locals = { service: StreamPropertiesService; project: BaseProjectResolved; econModelService: EconModelService };

const DEFAULT_PAGE_SIZE = 25;
const IS_TRANSACTIONAL = false;

export const getStreamPropertiesHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getStreamPropertiesCount(filters, project);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getStreamPropertiesById = async (req: Request, res: Response<ApiStreamProperties>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const streamPropertiesId = parseObjectId(id);

	const streamProperties = await service.getById(streamPropertiesId, project);
	if (!streamProperties) {
		throw new StreamPropertiesNotFoundError(
			`No Stream Properties model was found with id \`${id}\` in project \`${project._id}:${project.name}\``,
		);
	}

	res.status(OK).json(streamProperties);
};

export const getStreamProperties = async (req: Request, res: Response<ApiStreamProperties[]>): Promise<void> => {
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
	} = await service.getStreamProperties(skip, take, sort, filters, project, cursorQuery);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const postStreamProperties = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiStreamProperties = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid Stream Properties model data structure', `[${index}]`);
			}
			return parseApiStreamProperties(element, index);
		}),
	);

	apiStreamProperties = await service.checkWells(apiStreamProperties, project._id, errorAggregator);
	apiStreamProperties = await service.checkScenarios(apiStreamProperties, project._id, errorAggregator);

	const names = apiStreamProperties.map((streamProperties) => streamProperties?.name);
	const existingNames = await service.getExistingNames(names.filter(notNil), project._id);

	apiStreamProperties = apiStreamProperties.filter(notNil).map((streamProperties, index) =>
		errorAggregator.catch(() => {
			const existName = streamProperties.name && existingNames.includes(streamProperties.name);
			if (existName) {
				throw new StreamPropertiesCollisionError(
					`Stream Properties model with name \`${streamProperties?.name}\` already exists in project \`${project._id}\``,
					`[${index}]`,
				);
			}
			return streamProperties;
		}),
	);

	apiStreamProperties = checkModelDuplicates(apiStreamProperties, errorAggregator);

	const streamProperties = apiStreamProperties.map(
		(streamProperties) => streamProperties && toStreamProperties(streamProperties, project._id),
	);

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const successResponse = await service.create(streamProperties);
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const putStreamProperties = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiStreamProperties = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid Stream Properties model data structure', `[${index}]`);
			}
			return parseApiStreamProperties(element, index);
		}),
	);

	apiStreamProperties = await service.checkScenarios(apiStreamProperties, project._id, errorAggregator);
	apiStreamProperties = await service.checkWells(apiStreamProperties, project._id, errorAggregator);
	apiStreamProperties = checkModelDuplicates(apiStreamProperties, errorAggregator);

	const streamProperties = apiStreamProperties.map(
		(streamProperties) => streamProperties && toStreamProperties(streamProperties, project._id),
	);

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const successResponse = await service.upsert(streamProperties, project._id);

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const deleteStreamPropertiesById = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const streamPropertiesId = parseObjectId(id);

	const deleteCount = await service.deleteStreamPropertiesById(streamPropertiesId, project);

	res.status(NO_CONTENT).set(getDeleteHeaders(deleteCount)).end();
};
