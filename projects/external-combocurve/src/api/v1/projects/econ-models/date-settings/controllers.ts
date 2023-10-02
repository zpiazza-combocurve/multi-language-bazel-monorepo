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
	ApiDateSettings,
	filterableFields,
	READ_RECORD_LIMIT,
	sortableFields,
	toDateSettings,
	WRITE_RECORD_LIMIT,
} from './fields/date-settings';
import {
	checkModelDuplicates,
	DateSettingsCollisionError,
	DateSettingsNotFoundError,
	parseApiDateSettings,
} from './validation';
import { DateSettingsService } from './service';

const { MULTI_STATUS, NO_CONTENT, OK } = StatusCodes;

type Locals = { service: DateSettingsService; project: BaseProjectResolved; econModelService: EconModelService };

const DEFAULT_PAGE_SIZE = 25;
const IS_TRANSACTIONAL = false;

export const getDateSettingsHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getDateSettingsCount(filters, project);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getDateSettingsById = async (req: Request, res: Response<ApiDateSettings>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const DateSettingsModelId = parseObjectId(id);

	const DateSettingsModel = await service.getById(DateSettingsModelId, project);
	if (!DateSettingsModel) {
		throw new DateSettingsNotFoundError(
			`No DateSettings model was found with id \`${id}\` in project \`${project._id}:${project.name}\``,
		);
	}

	res.status(OK).json(DateSettingsModel);
};

export const getDateSettings = async (req: Request, res: Response<ApiDateSettings[]>): Promise<void> => {
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
	} = await service.getDateSettings(skip, take, sort, filters, project, cursorQuery);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const postDateSettings = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiDateSettingsModels = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid DateSettings model data structure', `[${index}]`);
			}
			return parseApiDateSettings(element, index);
		}),
	);

	apiDateSettingsModels = await service.checkWells(apiDateSettingsModels, project._id, errorAggregator);
	apiDateSettingsModels = await service.checkScenarios(apiDateSettingsModels, project._id, errorAggregator);

	const names = apiDateSettingsModels.map((DateSettingsModel) => DateSettingsModel?.name);
	const existingNames = await service.getExistingNames(names.filter(notNil), project._id);

	apiDateSettingsModels = apiDateSettingsModels.filter(notNil).map((DateSettingsModel, index) =>
		errorAggregator.catch(() => {
			const existName = DateSettingsModel.name && existingNames.includes(DateSettingsModel.name);
			if (existName) {
				throw new DateSettingsCollisionError(
					`DateSettings model with name \`${DateSettingsModel?.name}\` already exists in project \`${project._id}\``,
					`[${index}]`,
				);
			}
			return DateSettingsModel;
		}),
	);

	apiDateSettingsModels = checkModelDuplicates(apiDateSettingsModels, errorAggregator);

	const DateSettingsModels = apiDateSettingsModels.map(
		(DateSettingsModel) => DateSettingsModel && toDateSettings(DateSettingsModel, project._id),
	);

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const successResponse = await service.create(DateSettingsModels);
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const putDateSettings = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiDateSettingsModels = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid DateSettings model data structure', `[${index}]`);
			}
			return parseApiDateSettings(element, index);
		}),
	);

	apiDateSettingsModels = await service.checkScenarios(apiDateSettingsModels, project._id, errorAggregator);
	apiDateSettingsModels = await service.checkWells(apiDateSettingsModels, project._id, errorAggregator);
	apiDateSettingsModels = checkModelDuplicates(apiDateSettingsModels, errorAggregator);

	const DateSettingsModels = apiDateSettingsModels.map(
		(DateSettingsModel) => DateSettingsModel && toDateSettings(DateSettingsModel, project._id),
	);

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const successResponse = await service.upsert(DateSettingsModels, project._id);

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const deleteDateSettingsById = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const DateSettingsModelId = parseObjectId(id);

	const deleteCount = await service.deleteDateSettingsById(DateSettingsModelId, project);

	res.status(NO_CONTENT).set(getDeleteHeaders(deleteCount)).end();
};
