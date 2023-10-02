import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { castQuery, getFilterQuery, NumberParser, parseCursor, SortParser } from '@src/api/v1/query';
import { checkRecordCount, getValidFilters, parseObjectId, validatePaginationFilters } from '@src/helpers/validation';
import { createFinalMultiResponse, emptyResponse, IMultiStatusResponse } from '@src/api/v1/multi-status';
import { GENERAL_OPTIONS_KEY, IGeneralOptions } from '@src/models/econ/general-options';
import {
	getCursorPaginationData,
	getPaginationData,
	getPaginationDataWithTotal,
	getPaginationHeaders,
} from '@src/api/v1/pagination';
import { getDeleteHeaders } from '@src/api/v1/delete';
import { getUrlData } from '@src/helpers/express';
import { ISort } from '@src/helpers/mongo-queries';
import { notNil } from '@src/helpers/typing';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { EconChecks, EconModelService } from '../service';
import { BaseProjectResolved } from '../../fields';

import {
	ApiGeneralOptionsType,
	filterableFields,
	getRequestFromDocument,
	sortableFields,
} from './fields/econ-function';
import { GeneralOptionsNotFoundError, parseGeneralOptionsPayload } from './validation';
import { GeneralOptionsService } from './service';

type Locals = {
	service: GeneralOptionsService;
	project: BaseProjectResolved;
	econModelService: EconModelService;
};
const { MULTI_STATUS, NO_CONTENT, OK } = StatusCodes;
const DEFAULT_PAGE_SIZE = 25;
export const GENERAL_OPTIONS_WRL = 500;
export const GENERAL_OPTIONS_RRL = 200;

export const getGeneralOptionsCount = async (req: Request, res: Response<void>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, GENERAL_OPTIONS_RRL), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getCount(filters, project);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getGeneralOptionsById = async (req: Request, res: Response<ApiGeneralOptionsType>): Promise<void> => {
	const { econModelService, project } = res.locals as Locals;
	const { id } = req.params;

	const econID = parseObjectId(id);

	const output = await econModelService.getById(econID, GENERAL_OPTIONS_KEY, project);
	if (!output) {
		throw new GeneralOptionsNotFoundError(`GeneralOptions with id ${id} not found`);
	}

	res.status(OK).json(getRequestFromDocument(output as IGeneralOptions));
};

export const getGeneralOptions = async (req: Request, res: Response<ApiGeneralOptionsType[]>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	validatePaginationFilters(query);

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, GENERAL_OPTIONS_RRL), defaultValue: DEFAULT_PAGE_SIZE },
		sort: { parse: SortParser(sortableFields), defaultValue: { id: -1 } as ISort },
		cursor: { parse: parseCursor, defaultValue: undefined },
	};

	const { skip, take, sort, cursor: cursorQuery } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const {
		result,
		hasNext,
		cursor: cursorNext,
	} = await service.getPaginated(skip, take, sort, filters, project, cursorQuery);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const postGeneralOptions = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	await upsertGeneralOptions(req, res, EconChecks.All, (validMoldes: ApiGeneralOptionsType[]) =>
		service.create(validMoldes, project._id),
	);
};

export const putGeneralOptions = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const updateChecks = EconChecks.Duplicates | EconChecks.Wells | EconChecks.Scenarios;
	await upsertGeneralOptions(req, res, updateChecks, (validMoldes: ApiGeneralOptionsType[]) =>
		service.upsert(validMoldes, project._id),
	);
};

/**
 * POST or PUT General options
 * @param req the HTTP request
 * @param res the HTTP response
 * @param checks the checks to perform on payload (on update it's done few checks than on create)
 * @param targetFN the function to call to create or update the data
 */
const upsertGeneralOptions = async (
	req: Request,
	res: Response<IMultiStatusResponse>,
	checks: number,
	targetFN: (models: ApiGeneralOptionsType[]) => Promise<IMultiStatusResponse>,
): Promise<void> => {
	const { project, econModelService } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, GENERAL_OPTIONS_WRL);

	const errors = new ValidationErrorAggregator();
	let successResponse: IMultiStatusResponse = emptyResponse;

	const models = parseGeneralOptionsPayload(data, errors);

	if (models.some(notNil)) {
		const validOnes = await econModelService.econChecks(GENERAL_OPTIONS_KEY, models, project._id, errors, checks);

		if (validOnes.some(notNil)) {
			successResponse = await targetFN(validOnes.map((m) => m as ApiGeneralOptionsType));
		}
	}

	res.status(MULTI_STATUS).json(createFinalMultiResponse(successResponse, errors));
};

export const deleteGeneralOptionsById = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { id } = req.params;
	const { econModelService, project } = res.locals as Locals;

	const econID = parseObjectId(id);
	const deleteCount = await econModelService.deleteById(econID, GENERAL_OPTIONS_KEY, project);

	res.status(NO_CONTENT).set(getDeleteHeaders(deleteCount)).end();
};
