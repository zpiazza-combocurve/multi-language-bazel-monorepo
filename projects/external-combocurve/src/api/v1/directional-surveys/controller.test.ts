import { Request, Response } from 'express';
import { Types } from 'mongoose';

import { FieldNameFilterError, TypeError, ValidationError } from '@src/helpers/validation';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { ISort } from '@src/helpers/mongo-queries';
import { IWellDirectionalSurvey } from '@src/models/well-directional-surveys';
import { testSkipAndTakeErrors } from '@src/helpers/test/controller';

import { CreateDSRequest, UpdateDSRequest } from './models/requests';
import {
	deleteDirectionalSurvey,
	DS_READ_RECORD_LIMIT,
	getDirectionalSurveyByID,
	getDirectionalSurveyHead,
	getDirectionalSurveys,
	postDirectionalSurvey,
	putDirectionalSurvey,
} from './controller';
import { DSResponse } from './models/responses';

import { mockExpress } from '@test/express-mocks';

interface ApiRequest extends Request {
	originalUrl: string;
}

interface MockService {
	getDSCount: jest.Mock;
	getDirectionalSurveys: jest.Mock;
	getDSByID: jest.Mock;
	countWells: jest.Mock;
	createDirectionalSurveys: jest.Mock;
	updateDirectionalSurvey: jest.Mock;
	deleteDSByID: jest.Mock;
}

interface ApiResponse extends Response {
	locals: {
		service: MockService;
	};
	set: jest.Mock;
	status: jest.Mock;
	json: jest.Mock;
	end: jest.Mock;
}

interface itContext {
	req: ApiRequest;
	res: ApiResponse;
	service: MockService;
}

interface paginatedParams {
	sort: ISort;
	filters: ApiQueryFilters;
	cursor?: string | undefined | null;
	link?: string | undefined;
	result?: DSResponse[];
	hasNext?: boolean;
}

const configureContext = (): itContext => {
	const mockReqRes = mockExpress();
	const ctx: itContext = {
		req: mockReqRes.req as ApiRequest,
		res: mockReqRes.res as ApiResponse,
		service: {
			getDSCount: jest.fn(),
			getDirectionalSurveys: jest.fn(),
			getDSByID: jest.fn(),
			countWells: jest.fn(),
			createDirectionalSurveys: jest.fn(),
			updateDirectionalSurvey: jest.fn(),
			deleteDSByID: jest.fn(),
		},
	};

	ctx.req.originalUrl = `directional-surveys`;

	ctx.res.end = jest.fn();
	ctx.res.set = jest.fn(() => ctx.res);
	ctx.res.json = jest.fn();
	ctx.res.status = jest.fn(() => ctx.res);

	ctx.res.locals = {
		service: ctx.service,
	};

	return ctx;
};

function* generateDS(qtd: number): Generator<IWellDirectionalSurvey> {
	while (--qtd >= 0) {
		yield {
			_id: Types.ObjectId(`78702b4c9bd6de23709ef6e1`),
			well: Types.ObjectId(`78702b4c9bd6de23709ef6e1`),
			project: Types.ObjectId(`78702b4c9bd6de23709ef6e1`),
			measuredDepth: [qtd],
			trueVerticalDepth: [qtd],
			azimuth: [qtd],
			inclination: [qtd],
			deviationNS: [qtd],
			deviationEW: [qtd],
			latitude: [qtd],
			longitude: [qtd],
			createdAt: new Date(),
			updatedAt: new Date(),
		} as IWellDirectionalSurvey;
	}
}

describe('v1/directional-surveys', () => {
	describe('getDirectionalSurveyHead', () => {
		let ctx: itContext;

		beforeEach(() => {
			ctx = configureContext();
		});

		const baseTest = async (count: number, link: string, filters: ApiQueryFilters = {}): Promise<void> => {
			ctx.service.getDSCount.mockReturnValue(count);

			await getDirectionalSurveyHead(ctx.req, ctx.res);

			expect(ctx.service.getDSCount).toHaveBeenLastCalledWith(filters);
			expect(ctx.res.set).toHaveBeenLastCalledWith({
				Link: link,
				'X-Query-Count': `${count}`,
			});
		};

		it('should throw validation error when skip and take are invalid', async () => {
			ctx.service.getDSCount.mockReturnValue(0);

			await testSkipAndTakeErrors(ctx.req, ctx.res, getDirectionalSurveyHead, 20000);

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

		it('runs correctly with skip 30, take 10, well object_id, and count 35', async () => {
			ctx.req.query = { skip: '30', take: '10', well: 'D57BF0F636A8447AF77971284153DFE0' };
			const linkExpect =
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=0&take=10>;rel="first",` +
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=30&take=10>;rel="last"`;

			baseTest(35, linkExpect, { well: ['D57BF0F636A8447AF77971284153DFE0'] });
		});

		it('throws an error with skip 30, take 10, a b, and count 35', async () => {
			ctx.req.query = { skip: '30', take: '10', a: 'b' };
			ctx.service.getDSCount.mockReturnValue(35);

			const serviceCallTimes = ctx.service.getDSCount.mock.calls.length;

			await expect(getDirectionalSurveyHead(ctx.req, ctx.res)).rejects.toThrow(FieldNameFilterError);

			expect(ctx.service.getDSCount.mock.calls.length).toBe(serviceCallTimes);
		});
	});

	describe('getDirectionalSurveys', () => {
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
			testSkipAndTakeErrors(ctx.req, ctx.res, getDirectionalSurveys, DS_READ_RECORD_LIMIT);

			expect(ctx.res.set).not.toHaveBeenCalled();
		});

		it('throws validation error for skip and cursor', async () => {
			ctx.req.query = { skip: '10', cursor: '123456789012345678901234' };
			await expect(getDirectionalSurveys(ctx.req, ctx.res)).rejects.toThrow(ValidationError);
		});

		const baseTest = async (): Promise<void> => {
			ctx.service.getDirectionalSurveys.mockReturnValue({
				result: params.result,
				hasNext: params.hasNext,
				cursor: params.cursor,
			});

			await getDirectionalSurveys(ctx.req, ctx.res);

			expect(ctx.service.getDirectionalSurveys).toHaveBeenLastCalledWith(
				Number(ctx.req.query.skip || 0),
				Number(ctx.req.query.take || 25),
				params.sort,
				params.filters,
				true,
				params.cursor,
			);
			expect(ctx.res.set).toHaveBeenLastCalledWith({
				Link: params.link,
			});
			expect(ctx.res.json).toHaveBeenLastCalledWith(params.result);
		};

		it('returns empty array when no differentials are found', async () => {
			params.link = `<http://www.localhost.com/${ctx.req.originalUrl}?skip=0&take=25>;rel="first"`;
			baseTest();
		});

		it('returns array of 3 differentials when 3 are found', async () => {
			params.result = [...generateDS(3)].map((m) => new DSResponse(m));
			params.link = `<http://www.localhost.com/${ctx.req.originalUrl}?skip=0&take=25>;rel="first"`;

			baseTest();
		});

		it('returns correct pagination links when only skip is provided', async () => {
			ctx.req.query = { skip: '25' };

			params.hasNext = true;
			params.result = [...generateDS(25)].map((m) => new DSResponse(m));
			params.link =
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=50&take=25>;rel="next",` +
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=0&take=25>;rel="prev",` +
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=0&take=25>;rel="first"`;

			baseTest();
		});

		it('returns correct pagination links when skip and take are provided', async () => {
			ctx.req.query = { skip: '30', take: '10' };

			params.result = [...generateDS(5)].map((m) => new DSResponse(m));
			params.link =
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=0&take=10>;rel="first"`;

			baseTest();
		});

		it('filters by well when well is provided', async () => {
			ctx.req.query = { skip: '30', take: '10', well: '7401258ecf0b2e84482440b2' };

			params.result = [...generateDS(5)].map((m) => new DSResponse(m));
			params.filters = { well: ['7401258ecf0b2e84482440b2'] };
			params.link =
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=20&take=10>;rel="prev",` +
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=0&take=10>;rel="first"`;

			baseTest();
		});

		it('sorts by well ascending when sort is +well', async () => {
			ctx.req.query = { take: '10', well: '7401258ecf0b2e84482440b2', sort: '+well' };

			params.result = [...generateDS(15)].map((m) => new DSResponse(m));
			params.hasNext = true;
			params.filters = { well: ['7401258ecf0b2e84482440b2'] };
			params.sort = { well: 1 };
			params.link =
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=10&take=10>;rel="next",` +
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=0&take=10>;rel="first"`;

			baseTest();
		});

		it('sorts by well descending when sort is -well', async () => {
			ctx.req.query = { take: '10', well: '7401258ecf0b2e84482440b2', sort: '-well' };

			params.result = [...generateDS(15)].map((m) => new DSResponse(m));
			params.hasNext = true;
			params.filters = { well: ['7401258ecf0b2e84482440b2'] };
			params.sort = { well: -1 };
			params.link =
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=10&take=10>;rel="next",` +
				`<http://www.localhost.com/${ctx.req.originalUrl}?skip=0&take=10>;rel="first"`;

			baseTest();
		});

		it('can paginate by cursor when cursor is provided', async () => {
			ctx.req.query = { take: '10', cursor: Buffer.from('123456789012345678901234').toString('base64') };

			params.cursor = '123456789012345678901234';
			params.link = `<http://www.localhost.com/${ctx.req.originalUrl}?take=10>;rel="first"`;

			baseTest();
		});
	});

	describe('getDirectionalSurveyByID', () => {
		let ctx: itContext;

		beforeEach(() => {
			ctx = configureContext();
		});

		afterEach(() => {
			jest.clearAllMocks();
		});

		it('returns when found', async () => {
			const output = new DSResponse([...generateDS(1)][0]);

			ctx.req.params = { id: Types.ObjectId().toString() };
			ctx.res.locals.service.getDSByID.mockReturnValue(output);

			await getDirectionalSurveyByID(ctx.req, ctx.res);

			expect(ctx.res.json).toHaveBeenCalledWith(output);
		});

		it('throws an error when ID is invalid', async () => {
			ctx.req.params = { id: 'invalid_id' };

			await expect(getDirectionalSurveyByID(ctx.req, ctx.res)).rejects.toThrow(TypeError);
		});
	});

	describe('postDirectionalSurvey', () => {
		let ctx: itContext;
		let body: CreateDSRequest;

		beforeEach(() => {
			ctx = configureContext();
			body = {
				chosenID: '123456789',
				dataSource: 'IHS',
				projectID: null,
				spatialDataType: 'NAD27',
				measuredDepth: [1, 2, 3],
				trueVerticalDepth: [1, 2, 3],
				azimuth: [1, 2, 3],
				inclination: [1, 2, 3],
				deviationEW: [1, 2, 3],
				deviationNS: [1, 2, 3],
				latitude: [1, 2, 3],
				longitude: [1, 2, 3],
			} as CreateDSRequest;

			ctx.req.body = body;
		});

		afterEach(() => {
			jest.clearAllMocks();
		});

		it('returns an error for invalid payload', async () => {
			body.dataSource = 'invalid';

			await postDirectionalSurvey(ctx.req, ctx.res);

			expect(ctx.res.status).toHaveBeenCalledWith(400);
			expect(ctx.res.json).toHaveBeenCalledWith({
				code: 400,
				errors: [
					{
						location: 'dataSource',
						message:
							"The 'dataSource' must have a valid value. The valid values are: DI,Aries,IHS,Enverus,Internal,PDWin,Other",
						name: 'RequestStructureError',
					},
				],
				status: 'error',
			});
		});

		it('returns no errors when payload is valid', async () => {
			const expected = {
				status: 'created',
				code: 201,
				errors: [],
			};

			ctx.service.createDirectionalSurveys.mockReturnValue(expected);

			await postDirectionalSurvey(ctx.req, ctx.res);

			expect(ctx.res.status).toHaveBeenCalledWith(201);
			expect(ctx.res.json).toHaveBeenCalledWith(expected);
		});
	});

	describe('putDirectionalSurvey', () => {
		let ctx: itContext;
		let body: UpdateDSRequest;

		beforeEach(() => {
			ctx = configureContext();
			body = {
				spatialDataType: 'NAD27',
				remove: [1, 2],
				add: {
					measuredDepth: [5, 6],
					trueVerticalDepth: [5, 6],
					azimuth: [5, 6],
					inclination: [5, 6],
					deviationEW: [5, 6],
					deviationNS: [5, 6],
					latitude: [5, 6],
					longitude: [5, 6],
				},
				update: {
					measuredDepth: [5, 6],
					trueVerticalDepth: [5, 6],
					azimuth: [5, 6],
					inclination: [5, 6],
					deviationEW: [5, 6],
					deviationNS: [5, 6],
					latitude: [5, 6],
					longitude: [5, 6],
				},
			} as UpdateDSRequest;

			ctx.req.body = body;
		});

		afterEach(() => {
			jest.clearAllMocks();
		});

		it('returns an error for invalid payload', async () => {
			ctx.req.params = { id: Types.ObjectId().toString() };
			body.spatialDataType = 'invalid';

			await putDirectionalSurvey(ctx.req, ctx.res);

			expect(ctx.res.status).toHaveBeenCalledWith(400);
			expect(ctx.res.json).toHaveBeenCalledWith({
				code: 400,
				errors: [
					{
						location: 'spatialDataType',
						message:
							"The '.spatialDataType' must have a valid value. The valid values are: NAD27,NAD83,WGS84",
						name: 'RequestStructureError',
					},
				],
				status: 'error',
			});
		});

		it('returns no errors when payload is valid', async () => {
			ctx.req.params = { id: Types.ObjectId().toString() };

			const expected = {
				status: 'updated',
				code: 200,
				errors: [],
			};

			ctx.service.updateDirectionalSurvey.mockReturnValue(expected);

			await putDirectionalSurvey(ctx.req, ctx.res);

			expect(ctx.res.status).toHaveBeenCalledWith(200);
			expect(ctx.res.json).toHaveBeenCalledWith(expected);
		});
	});

	describe('deleteDirectionalSurvey', () => {
		let ctx: itContext;

		beforeEach(() => {
			ctx = configureContext();
		});

		it('returns an error when ID is invalid', async () => {
			ctx.req.params = { id: 'invalid' };

			await expect(deleteDirectionalSurvey(ctx.req, ctx.res)).rejects.toThrow(TypeError);
		});

		it('should call service when ID is valid', async () => {
			ctx.req.params = { id: Types.ObjectId().toString() };
			ctx.service.deleteDSByID.mockResolvedValue(1);

			await deleteDirectionalSurvey(ctx.req, ctx.res);

			expect(ctx.res.status).toHaveBeenCalledWith(204);
		});
	});
});
