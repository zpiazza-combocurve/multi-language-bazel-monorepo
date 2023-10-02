import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { getValidFilters, parseBoolean, parseObjectId, validatePaginationFilters } from '@src/helpers/validation';
import { getUrlData } from '@src/helpers/express';
import { ISort } from '@src/helpers/mongo-queries';

import { castQuery, getFilterQuery, NumberParser, parseCursor, SortParser } from '../query';
import {
	getCursorPaginationData,
	getPaginationData,
	getPaginationDataWithTotal,
	getPaginationHeaders,
} from '../pagination';
import { getDeleteHeaders } from '../delete';
import { IErrorRecordStatus } from '../multi-status';

import { CreateDSRequest, UpdateDSRequest } from './models/requests';
import { filterableFields, sortableFields } from './models/fields';
import { validateCreationRequest, validateUpdateRequest } from './validations/requests';
import { DirectionalSurveysService } from './service';
import { DSResponse } from './models/responses';

const { NO_CONTENT } = StatusCodes;

type Locals = { service: DirectionalSurveysService };

const DEFAULT_PAGE_SIZE = 25;
export const DS_READ_RECORD_LIMIT = 100;

export const getDirectionalSurveyHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, DS_READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getDSCount(filters);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getDirectionalSurveys = async (req: Request, res: Response<DSResponse[]>): Promise<void> => {
	const { service } = res.locals as Locals;
	const { query } = req;

	validatePaginationFilters(query);

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, DS_READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
		sort: { parse: SortParser(sortableFields), defaultValue: { id: -1 } as ISort },
		cursor: { parse: parseCursor, defaultValue: undefined },
		measures: { parse: parseBoolean, defaultValue: true },
	};

	const { skip, take, sort, cursor: cursorQuery, measures } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const {
		result,
		hasNext,
		cursor: cursorNext,
	} = await service.getDirectionalSurveys(skip, take, sort, filters, measures, cursorQuery);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const getDirectionalSurveyByID = async (req: Request, res: Response<DSResponse | null>): Promise<void> => {
	const { service } = res.locals as Locals;
	const { id } = req.params;

	const getID = parseObjectId(id);
	const ds = await service.getDSByID(getID);

	res.status(ds !== null ? 200 : 404).json(ds);
};

export const postDirectionalSurvey = async (req: Request, res: Response<IErrorRecordStatus>): Promise<void> => {
	const { service } = res.locals as Locals;

	const requestDS: CreateDSRequest = req.body;

	requestDS.wellCount = await service.countWells(requestDS.chosenID, requestDS.projectID);

	const validationResult = validateCreationRequest(requestDS);
	if (validationResult.hasErrors()) {
		res.status(400).json({
			code: 400,
			errors: validationResult.getErrorEntries(),
			status: 'error',
		});

		return;
	}

	const response = await service.createDirectionalSurveys(requestDS);
	res.status(response.code).json(response);
};

export const deleteDirectionalSurvey = async (req: Request, res: Response): Promise<void> => {
	const { service } = res.locals as Locals;
	const { id } = req.params;

	const deletedID = parseObjectId(id);
	const deleteCount = await service.deleteDSByID(deletedID);

	res.status(NO_CONTENT).set(getDeleteHeaders(deleteCount)).end();
};

export const putDirectionalSurvey = async (req: Request, res: Response<IErrorRecordStatus>): Promise<void> => {
	const { service } = res.locals as Locals;
	const { id } = req.params;

	const updateID = parseObjectId(id);
	const requestDS: UpdateDSRequest = req.body;

	const validationResult = validateUpdateRequest(requestDS);
	if (validationResult.hasErrors()) {
		res.status(400).json({
			code: 400,
			errors: validationResult.getErrorEntries(),
			status: 'error',
		});

		return;
	}

	const output = await service.updateDirectionalSurvey(requestDS, updateID);
	res.status(output.code).send(output);
};
