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
	ApiEmission,
	filterableFields,
	READ_RECORD_LIMIT,
	sortableFields,
	toEmission,
	WRITE_RECORD_LIMIT,
} from './fields/emission';
import { checkModelDuplicates, EmissionCollisionError, EmissionNotFoundError, parseApiEmission } from './validation';
import { EmissionService } from './service';

const { OK, NO_CONTENT, MULTI_STATUS } = StatusCodes;
type Locals = { service: EmissionService; project: BaseProjectResolved; econModelService: EconModelService };

const DEFAULT_PAGE_SIZE = 25;

export const getEmissionsHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getEmissionsCount(filters, project);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getEmissionById = async (req: Request, res: Response<ApiEmission>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const emissionModelId = parseObjectId(id);

	const emissionModel = await service.getById(emissionModelId, project);
	if (!emissionModel) {
		throw new EmissionNotFoundError(
			`No Emission model was found with id \`${id}\` in project \`${project._id}:${project.name}\``,
		);
	}

	res.status(OK).json(emissionModel);
};

export const getEmissions = async (req: Request, res: Response<ApiEmission[]>): Promise<void> => {
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
	} = await service.getEmissions(skip, take, sort, filters, project, cursorQuery);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const postEmissions = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiEmissionModels = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid Emission model data structure', `[${index}]`);
			}
			return parseApiEmission(element, index);
		}),
	);

	apiEmissionModels = await service.checkWells(apiEmissionModels, project._id, errorAggregator);
	apiEmissionModels = await service.checkScenarios(apiEmissionModels, project._id, errorAggregator);

	const names = apiEmissionModels.map((emissionModel) => emissionModel?.name);
	const existingNames = await service.getExistingNames(names.filter(notNil), project._id);

	apiEmissionModels = apiEmissionModels.filter(notNil).map((emissionModel, index) =>
		errorAggregator.catch(() => {
			const existName = emissionModel.name && existingNames.includes(emissionModel.name);
			if (existName) {
				throw new EmissionCollisionError(
					`Emission Model with name \`${emissionModel?.name}\` already exists in project \`${project._id}\``,
					`[${index}]`,
				);
			}
			return emissionModel;
		}),
	);

	apiEmissionModels = checkModelDuplicates(apiEmissionModels, errorAggregator);

	const emissionModels = apiEmissionModels.map(
		(emissionModel) => emissionModel && toEmission(emissionModel, project._id),
	);

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const successResponse = await service.create(emissionModels);
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const putEmissions = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	let apiEmissionModels = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid Emission model data structure', `[${index}]`);
			}
			return parseApiEmission(element, index);
		}),
	);

	apiEmissionModels = await service.checkScenarios(apiEmissionModels, project._id, errorAggregator);
	apiEmissionModels = await service.checkWells(apiEmissionModels, project._id, errorAggregator);
	apiEmissionModels = checkModelDuplicates(apiEmissionModels, errorAggregator);

	const emissionModels = apiEmissionModels.map(
		(emissionModel) => emissionModel && toEmission(emissionModel, project._id),
	);

	const successResponse = await service.upsert(emissionModels, project._id);

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());
	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};

export const deleteEmissionById = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service, project } = res.locals as Locals;
	const { id } = req.params;

	const emissionModelId = parseObjectId(id);

	const deleteCount = await service.deleteEmissionById(emissionModelId, project);

	res.status(NO_CONTENT).set(getDeleteHeaders(deleteCount)).end();
};
