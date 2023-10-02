import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { ACTUAL_FORECAST_KEY, ACTUAL_FORECAST_NAME, IActualOrForecast } from '@src/models/econ/actual-forecast';
import {
	FieldNameError,
	FieldNameFilterError,
	RecordCountError,
	RequestStructureError,
	RequiredFieldError,
	TypeError,
	ValidationError,
} from '@src/helpers/validation';
import { getErrorStatus, getMultiErrorStatus } from '@src/helpers/test/multi-status';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { IMultiStatusResponse } from '@src/api/v1/multi-status';
import { ISort } from '@src/helpers/mongo-queries';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import {
	ACTUAL_FORECAST_RRL,
	ACTUAL_FORECAST_WRL,
	getActualForecastById,
	getActualForecastCount,
	getActualForecasts,
	postActualOrForecast,
} from './controllers';
import { ApiActualForecast, getRequestFromDocument } from './fields/actual-forecast';
import { ActualForecastNotFoundError } from './validation';

import { mockExpress } from '@test/express-mocks';

const { MULTI_STATUS } = StatusCodes;

jest.mock('@src/helpers/request');

interface ApiRequest extends Request {
	originalUrl: string;
}

interface ApiResponse extends Response {
	locals: {
		econModelService: {
			getById: jest.Mock;
		};
		service: {
			getCount: jest.Mock;
			getPaginated: jest.Mock;
			create: jest.Mock;
			upsert: jest.Mock;
		};
		project: {
			_id: Types.ObjectId;
		};
	};
	set: jest.Mock;
	status: jest.Mock;
	json: jest.Mock;
	end: jest.Mock;
}

interface itContext {
	req: ApiRequest;
	res: ApiResponse;
	econService: {
		getById: jest.Mock;
		econChecks: jest.Mock;
	};
	service: {
		getCount: jest.Mock;
		getPaginated: jest.Mock;
		create: jest.Mock;
		upsert: jest.Mock;
	};
	project: { _id: Types.ObjectId };
}

interface paginatedParams {
	sort: ISort;
	filters: ApiQueryFilters;
	cursor?: string | undefined | null;
	link?: string | undefined;
	result?: ApiActualForecast[];
	hasNext?: boolean;
}

const configureContext = (): itContext => {
	const mockReqRes = mockExpress();
	const ctx: itContext = {
		req: mockReqRes.req as ApiRequest,
		res: mockReqRes.res as ApiResponse,
		econService: {
			getById: jest.fn(),
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			econChecks: jest.fn((a, models, b, c, d) => models),
		},
		service: {
			getCount: jest.fn(),
			getPaginated: jest.fn(),
			create: jest.fn(),
			upsert: jest.fn(),
		},
		project: { _id: Types.ObjectId('5e272bed4b97ed00132f2271') },
	};

	ctx.req.originalUrl = `projects/${ctx.project._id}/econ-models/actual-forecast`;

	ctx.res.end = jest.fn();
	ctx.res.set = jest.fn(() => ctx.res);
	ctx.res.json = jest.fn();
	ctx.res.status = jest.fn(() => ctx.res);

	ctx.res.locals = {
		econModelService: ctx.econService,
		service: ctx.service,
		project: ctx.project,
	};

	return ctx;
};

const generateEconModels = (qtd: number): IActualOrForecast[] => {
	const result: IActualOrForecast[] = [];

	while (--qtd >= 0) {
		result.push({
			_id: Types.ObjectId('5e272bed4b97ed00132f2271'),
			createdAt: new Date(),
			updatedAt: new Date(),
			project: Types.ObjectId('5e272bed4b97ed00132f2271'),
			assumptionKey: ACTUAL_FORECAST_KEY,
			assumptionName: ACTUAL_FORECAST_NAME,
			econ_function: {
				production_vs_fit_model: {
					ignore_hist_prod: 'no',
					replace_actual: {
						oil: { never: '' },
						gas: { never: '' },
						water: { never: '' },
					},
				},
			},
			options: {},
			copiedFrom: Types.ObjectId('5e272bed4b97ed00132f2271'),
			name: 'test',
			unique: false,
		} as IActualOrForecast);
	}

	return result;
};

const createValidRequest = (): Record<string, unknown> => {
	return {
		name: 'test',
		unique: false,
		actualOrForecast: {
			ignoreHistoryProd: false,
			replaceActualWithForecast: {
				oil: { never: false },
				gas: { never: false },
				water: { never: false },
			},
		},
	};
};

describe('v1/projects/econ-models/actual-forecast/controller', () => {
	describe('getActualForecastCount', () => {
		let ctx: itContext;

		beforeEach(() => {
			ctx = configureContext();
		});

		const baseTest = async (count: number, link: string, filters: ApiQueryFilters = {}): Promise<void> => {
			ctx.service.getCount.mockReturnValue(count);

			await getActualForecastCount(ctx.req, ctx.res);

			expect(ctx.service.getCount).toHaveBeenLastCalledWith(filters, ctx.project);
			expect(ctx.res.set).toHaveBeenLastCalledWith({
				Link: link,
				'X-Query-Count': `${count}`,
			});
		};

		it('should throw validation error when skip and take are invalid', async () => {
			ctx.service.getCount.mockReturnValue(0);

			await testSkipAndTakeErrors(ctx.req, ctx.res, getActualForecastCount, 20000);

			expect(ctx.res.set).not.toHaveBeenCalled();
		});

		it('runs correctly with no query and count 0', async () => {
			const linkExpect =
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=0&take=25>;rel="last"`;

			baseTest(0, linkExpect);
		});

		it('runs correctly with no query and count 51', async () => {
			const linkExpect =
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=25&take=25>;rel="next",` +
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=50&take=25>;rel="last"`;

			baseTest(51, linkExpect);
		});

		it('runs correctly with skip 25 and count 51', async () => {
			ctx.req.query = { skip: '25' };
			const linkExpect =
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=0&take=25>;rel="first",` +
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=50&take=25>;rel="last"`;

			baseTest(51, linkExpect);
		});

		it('runs correctly with skip 30, take 10, and count 35', async () => {
			ctx.req.query = { skip: '30', take: '10' };
			const linkExpect =
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=30&take=10>;rel="last"`;

			baseTest(35, linkExpect);
		});

		it('runs correctly with skip 30, take 10, name default1, and count 35', async () => {
			ctx.req.query = { skip: '30', take: '10', name: 'default1' };
			const linkExpect =
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=30&take=10>;rel="last"`;

			baseTest(35, linkExpect, { name: ['default1'] });
		});

		it('throws an error with skip 30, take 10, name test, a b, and count 35', async () => {
			ctx.req.query = { skip: '30', take: '10', name: 'test', a: 'b' };
			ctx.service.getCount.mockReturnValue(35);

			const serviceCallTimes = ctx.service.getCount.mock.calls.length;

			await expect(getActualForecastCount(ctx.req, ctx.res)).rejects.toThrow(FieldNameFilterError);

			expect(ctx.service.getCount.mock.calls.length).toBe(serviceCallTimes);
		});
	});

	describe('getActualForecasts', () => {
		let ctx: itContext;
		let params: paginatedParams;

		beforeEach(() => {
			ctx = configureContext();

			params = {
				sort: { id: -1 },
				filters: {},
				hasNext: false,
				result: [],
			};
		});

		afterEach(() => {
			jest.clearAllMocks();
		});

		it('throws validation error for skip and take', async () => {
			testSkipAndTakeErrors(ctx.req, ctx.res, getActualForecasts, ACTUAL_FORECAST_RRL);

			expect(ctx.res.set).not.toHaveBeenCalled();
		});

		it('throws validation error for skip and cursor', async () => {
			ctx.req.query = { skip: '10', cursor: '123456789012345678901234' };
			await expect(getActualForecasts(ctx.req, ctx.res)).rejects.toThrow(ValidationError);
		});

		const basicTest = async (): Promise<void> => {
			ctx.service.getPaginated.mockReturnValue({
				result: params.result,
				hasNext: params.hasNext,
				cursor: params.cursor,
			});

			await getActualForecasts(ctx.req, ctx.res);

			expect(ctx.service.getPaginated).toHaveBeenLastCalledWith(
				Number(ctx.req.query.skip || 0),
				Number(ctx.req.query.take || 25),
				params.sort,
				params.filters,
				ctx.project,
				params.cursor,
			);
			expect(ctx.res.set).toHaveBeenLastCalledWith({
				Link: params.link,
			});
			expect(ctx.res.json).toHaveBeenLastCalledWith(params.result);
		};

		// Basic functionality test
		it('returns empty array when no actual or forecast are found', async () => {
			params.link = `<http://www.localhost.com/${ctx.req.originalUrl}?skip=0&take=25>;rel="first"`;
			basicTest();
		});

		it('returns array of 3 actual or forecast when 3 are found', async () => {
			params.result = generateEconModels(3).map((m) => getRequestFromDocument(m));
			params.link = `<http://www.localhost.com/${ctx.req.originalUrl}?skip=0&take=25>;rel="first"`;

			basicTest();
		});

		it('returns correct pagination links when only skip is provided', async () => {
			ctx.req.query = { skip: '25' };

			params.hasNext = true;
			params.result = generateEconModels(25).map((m) => getRequestFromDocument(m));
			params.link =
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=0&take=25>;rel="first"`;

			basicTest();
		});

		it('returns correct pagination links when skip and take are provided', async () => {
			ctx.req.query = { skip: '30', take: '10' };

			params.result = generateEconModels(5).map((m) => getRequestFromDocument(m));
			params.link =
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=0&take=10>;rel="first"`;

			basicTest();
		});

		it('filters by name when name is provided', async () => {
			ctx.req.query = { skip: '30', take: '10', name: 'default1' };

			params.result = generateEconModels(5).map((m) => getRequestFromDocument(m));
			params.filters = { name: ['default1'] };
			params.link =
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=0&take=10>;rel="first"`;

			basicTest();
		});

		it('filters by name and unique when name and unique are provided', async () => {
			ctx.req.query = { skip: '30', take: '10', name: 'default1', unique: 'false', sort: '-name' };

			params.result = generateEconModels(5).map((m) => getRequestFromDocument(m));
			params.filters = { name: ['default1'], unique: ['false'] };
			params.sort = { name: -1 };
			params.link =
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=0&take=10>;rel="first"`;

			basicTest();
		});

		it('sorts by name ascending when sort is +name', async () => {
			ctx.req.query = { take: '10', name: 'default1', sort: '+name' };

			params.result = generateEconModels(15).map((m) => getRequestFromDocument(m));
			params.hasNext = true;
			params.filters = { name: ['default1'] };
			params.sort = { name: 1 };
			params.link =
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=10&take=10>;rel="next",` +
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=0&take=10>;rel="first"`;

			basicTest();
		});

		it('sorts by name descending when sort is -name', async () => {
			ctx.req.query = { take: '10', name: 'default1', sort: '-name' };

			params.result = generateEconModels(15).map((m) => getRequestFromDocument(m));
			params.hasNext = true;
			params.filters = { name: ['default1'] };
			params.sort = { name: -1 };
			params.link =
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=10&take=10>;rel="next",` +
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=0&take=10>;rel="first"`;

			basicTest();
		});

		it('can paginate by cursor when cursor is provided', async () => {
			ctx.req.query = { take: '10', cursor: Buffer.from('123456789012345678901234').toString('base64') };

			params.cursor = '123456789012345678901234';
			params.link = `<http://www.localhost.com/${ctx.req.originalUrl}?take=10>;rel="first"`;

			basicTest();
		});
	});

	describe('getActualForecastByID', () => {
		let ctx: itContext;

		beforeEach(() => {
			ctx = configureContext();
		});

		afterEach(() => {
			jest.clearAllMocks();
		});

		it('throws ActualForecastNotFoundError when not found', async () => {
			ctx.req.params = { id: Types.ObjectId().toString() };
			ctx.econService.getById.mockReturnValue(null);

			await expect(getActualForecastById(ctx.req, ctx.res)).rejects.toThrow(ActualForecastNotFoundError);
		});

		it('returns when found', async () => {
			const output = generateEconModels(1)[0];

			ctx.req.params = { id: Types.ObjectId().toString() };
			ctx.res.locals.econModelService.getById.mockReturnValue(output);

			await getActualForecastById(ctx.req, ctx.res);

			expect(ctx.res.json).toHaveBeenCalledWith(getRequestFromDocument(output));
		});

		it('throws an error when ID is invalid', async () => {
			ctx.req.params = { id: 'invalid_id' };

			await expect(getActualForecastById(ctx.req, ctx.res)).rejects.toThrow(TypeError);
		});
	});

	describe('postActualOrForecast', () => {
		let ctx: itContext;

		beforeEach(() => {
			ctx = configureContext();
			ctx.service.create.mockImplementation(
				(models: ApiActualForecast[]) =>
					({
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						results: models.map((_: ApiActualForecast) => ({
							status: 'created',
							code: 201,
						})),
						failedCount: 0,
						successCount: models.length,
					}) as IMultiStatusResponse,
			);
		});

		afterEach(() => {
			jest.clearAllMocks();
		});

		it('returns an error for invalid payload', async () => {
			ctx.req.body = 1;

			await postActualOrForecast(ctx.req, ctx.res);

			expect(ctx.res.status).toHaveBeenCalledWith(MULTI_STATUS);
			expect(ctx.res.json).toHaveBeenCalledWith({
				generalErrors: [],
				results: [
					getErrorStatus(
						RequestStructureError.name,
						'Invalid Actual or Forecast model data structure',
						'[0]',
					),
				],
				successCount: 0,
				failedCount: 1,
			});
		});

		it('throws an error when record count exceeds the limit', async () => {
			ctx.req.body = [...Array(ACTUAL_FORECAST_WRL + 1).keys()].map(() => ({}));
			await expect(postActualOrForecast(ctx.req, ctx.res)).rejects.toThrow(RecordCountError);
		});

		it('returns an error for invalid field name', async () => {
			ctx.req.body = { a: 'b', ...createValidRequest() };

			await postActualOrForecast(ctx.req, ctx.res);

			expect(ctx.res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(ctx.res.json).toHaveBeenLastCalledWith({
				generalErrors: [],
				results: [
					getMultiErrorStatus([
						{ name: FieldNameError.name, message: '`a` is not a valid field name', location: '[0]' },
					]),
				],
				successCount: 0,
				failedCount: 1,
			});
		});

		it('returns an error for missing required fields', async () => {
			ctx.req.body = {};

			await postActualOrForecast(ctx.req, ctx.res);

			expect(ctx.res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(ctx.res.json).toHaveBeenLastCalledWith({
				generalErrors: [],
				results: [
					getMultiErrorStatus([
						{
							name: RequiredFieldError.name,
							message: 'Missing required field: `name`',
							location: '[0]',
						},
						{
							name: RequiredFieldError.name,
							message: 'Missing required field: `unique`',
							location: '[0]',
						},
						{
							name: RequiredFieldError.name,
							message: 'Missing required field: `actualOrForecast`',
							location: '[0]',
						},
					]),
				],
				successCount: 0,
				failedCount: 1,
			});
		});

		it('returns a successful response for multiple actual or forecast input', async () => {
			ctx.req.body = [createValidRequest(), createValidRequest(), createValidRequest()];

			await postActualOrForecast(ctx.req, ctx.res);

			expect(ctx.res.status).toHaveBeenLastCalledWith(MULTI_STATUS);
			expect(ctx.res.json).toHaveBeenLastCalledWith({
				results: [
					{ code: 201, status: 'created' },
					{ code: 201, status: 'created' },
					{ code: 201, status: 'created' },
				],
				successCount: 3,
				failedCount: 0,
			});
		});
	});
});
