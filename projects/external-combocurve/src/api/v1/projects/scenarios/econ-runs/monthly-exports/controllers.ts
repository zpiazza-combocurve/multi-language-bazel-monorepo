import { Request, Response } from 'express';
import { Types } from 'mongoose';

import { castQuery, getFilterQuery, NumberParser } from '@src/api/v1/query';
import { getPaginationData, getPaginationDataWithTotal, getPaginationHeaders } from '@src/api/v1/pagination';
import { BaseProjectResolved } from '@src/api/v1/projects/fields';
import { getUrlData } from '@src/helpers/express';
import { getValidFilters } from '@src/helpers/validation';
import { IEconRun } from '@src/models/econ/econ-runs';

import { ApiJob, ApiMonthlyExport, CONCURRENCY_LIMIT, filterableFields, READ_RECORD_LIMIT } from './fields';
import { EconMonthlyService } from './service';

type Locals = {
	service: EconMonthlyService;
	project: BaseProjectResolved;
	scenarioId: Types.ObjectId;
	econRun: Pick<IEconRun, 'id' | 'runDate'>;
};

const DEFAULT_PAGE_SIZE = 100;

export const getEconMonthlyHead = async (req: Request, res: Response<void>): Promise<void> => {
	const { service, project, scenarioId, econRun } = res.locals as Locals;
	const { query } = req;

	const castQueryOptions = {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
	};

	const { skip, take } = castQuery(query, castQueryOptions);
	const { filters } = getValidFilters(getFilterQuery(query, castQueryOptions), filterableFields);

	const count = await service.getEconMonthlyCount(filters, project, scenarioId, econRun);

	const urlData = getUrlData(req);
	const paginationData = getPaginationDataWithTotal(urlData, skip, take, count);

	res.set(getPaginationHeaders(paginationData)).end();
};

export const getMonthlyExportById = async (req: Request, res: Response<ApiMonthlyExport>): Promise<void> => {
	const { service, project, scenarioId, econRun } = res.locals as Locals;
	const { id } = req.params;

	const { skip, take, concurrency } = castQuery(req.query, {
		skip: { parse: NumberParser(0), defaultValue: 0 },
		take: { parse: NumberParser(1, READ_RECORD_LIMIT), defaultValue: DEFAULT_PAGE_SIZE },
		concurrency: { parse: NumberParser(0, CONCURRENCY_LIMIT), defaultValue: 0 },
	});

	const { result, hasNext } = await service.getMonthlyExportById(
		id,
		skip,
		take,
		project,
		scenarioId,
		econRun,
		concurrency,
	);

	const urlData = getUrlData(req);
	const paginationData = getPaginationData(urlData, skip, take, hasNext);

	res.set(getPaginationHeaders(paginationData)).json(result);
};

export const createMonthlyExport = async (req: Request, res: Response<ApiJob>): Promise<void> => {
	const { service, project, scenarioId, econRun } = res.locals as Locals;

	const { filters } = getValidFilters(req.query, filterableFields);

	const apiJob = await service.createMonthlyExport(filters, project, scenarioId, econRun);

	res.json(apiJob);
};
