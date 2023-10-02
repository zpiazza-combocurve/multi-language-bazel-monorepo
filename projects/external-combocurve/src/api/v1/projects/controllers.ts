import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import {
	checkRecordCount,
	getValidFilters,
	isObject,
	parseObjectId,
	RequestStructureError,
	validatePaginationFilters,
} from '@src/helpers/validation';
import { getUrlData } from '@src/helpers/express';
import { ISort } from '@src/helpers/mongo-queries';
import { notNil } from '@src/helpers/typing';

import { castQuery, getFilterQuery, NumberParser, parseCursor, SortParser } from '../query';
import {
	getCursorPaginationData,
	getPaginationData,
	getPaginationDataWithTotal,
	getPaginationHeaders,
} from '../pagination';
import { getResponseFromErrors, IMultiStatusResponse, mergeResponses, withCounts } from '../multi-status';
import { ValidationErrorAggregator } from '../multi-error';

import {
	ApiProject,
	filterableFields,
	READ_RECORD_LIMIT,
	sortableFields,
	toIProject,
	WRITE_RECORD_LIMIT,
} from './fields';
import { checkDuplicates, parseApiProjects, ProjectCollisionError, ProjectNotFoundError } from './validation';
import { ProjectService } from './service';

const { MULTI_STATUS, OK } = StatusCodes;

type Locals = { service: ProjectService };

const DEFAULT_PAGE_SIZE = 25;
const IS_TRANSACTIONAL = false;

export const getProjectsHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getProjectsCount(filters);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getProjects = async (req: Request, res: Response<ApiProject[]>): Promise<void> => {
	const { service } = res.locals as Locals;
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

	const { result, hasNext, cursor: cursorNext } = await service.getProjects(skip, take, sort, filters, cursorQuery);

	const urlData = getUrlData(req);
	const paginationData =
		cursorNext != undefined && (cursorQuery != undefined || query.skip === undefined)
			? getCursorPaginationData(urlData, cursorNext, take, hasNext)
			: getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const getProjectById = async (req: Request, res: Response<ApiProject>): Promise<void> => {
	const { service } = res.locals as Locals;
	const { id } = req.params;

	const projectId = parseObjectId(id);

	const project = await service.getById(projectId);
	if (!project) {
		throw new ProjectNotFoundError(`No project was found with id \`${id}\``);
	}

	res.status(OK).json(project);
};

export const postProjects = async (req: Request, res: Response<IMultiStatusResponse>): Promise<void> => {
	const { service } = res.locals as Locals;

	const data = Array.isArray(req.body) ? req.body : [req.body];

	checkRecordCount(data, WRITE_RECORD_LIMIT);

	const errorAggregator = new ValidationErrorAggregator();

	const apiProjects = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid project data structure', `[${index}]`);
			}
			return parseApiProjects(element, index);
		}),
	);

	let projects = apiProjects.map((project) => project && toIProject(project));
	projects = checkDuplicates(projects, errorAggregator);

	const projectNameCollisions = await service.getProjectNameCollisions(
		projects.filter(notNil).map(({ name }) => name),
	);

	projects = projects.map((project, indexInList) =>
		errorAggregator.catch(() => {
			if (project === undefined) {
				return undefined;
			}

			const { name } = project;

			if (!projectNameCollisions.includes(name)) {
				return project;
			}

			throw new ProjectCollisionError(`Project named \`${name}\` already exist`, `[${indexInList}]`);
		}),
	);

	if (IS_TRANSACTIONAL) {
		errorAggregator.throwAll();
	}

	const successResponse = await service.create(projects);

	const errorsResponse = getResponseFromErrors(errorAggregator.getErrorEntries());

	const finalResponse = withCounts(mergeResponses(errorsResponse, successResponse));
	res.status(MULTI_STATUS).json(finalResponse);
};
