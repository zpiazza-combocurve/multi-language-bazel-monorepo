import { Connection } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import {
	createProductionCursor,
	getProductionCountPipeline,
	ISingleMonthlyProduction,
} from '@src/helpers/single-production';
import { callCloudFunction } from '@src/helpers/cloud-caller';
import config from '@src/config';
import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { indexToDate } from '@src/helpers/dates';
import { ValidationError } from '@src/helpers/validation';

import { ApiContextV1 } from '../context';
import { IRecordStatus } from '../multi-status';

import { CompanyMonthlyProductionService } from './service';

import { getTenantInfo } from '@test/tenant';
import { monthlyProduction } from '@test/fixtures/monthly-production';
import { TestContext } from '@test/context';
import wells from '@test/fixtures/wells.json';

const { CREATED, OK } = StatusCodes;

jest.mock('@src/helpers/cloud-caller');

let mongoUri: string;
let connection: Connection;
let service: CompanyMonthlyProductionService;
let context: ApiContextV1;

describe('v1/monthly-productions/service', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new TestContext(info, connection) as ApiContextV1;
		service = new CompanyMonthlyProductionService(context);

		await context.models.WellModel.bulkWrite(
			wells.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: { ...item },
					upsert: true,
				},
			})),
		);

		await context.models.MonthlyProductionModel.bulkWrite(
			monthlyProduction.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: { ...item },
					upsert: true,
				},
			})),
		);
	});

	afterAll(async () => {
		await connection.close();
	});

	test('getMonthlyProduction_WithSkipTakePagination_ShouldNotReturnCursor', async () => {
		await expect(service.getMonthlyProduction(0, 0, { well: 1 }, {})).resolves.toStrictEqual({
			result: [],
			hasNext: true,
			cursor: null,
		});
	});

	test('getMonthlyProduction_WithCreatedAtSort_ShouldReturnOldestRecord', async () => {
		await expect(service.getMonthlyProduction(0, 1, { createdAt: 1 }, {})).resolves.toStrictEqual({
			result: [
				{
					well: Types.ObjectId('5e272d38b78910dd2a1bd691'),
					date: new Date('2006-04-15'),
					oil: 0,
					gas: 13655,
					water: 142,
					choke: null,
					daysOn: null,
					operationalTag: null,
					gasInjection: null,
					waterInjection: 142,
					co2Injection: null,
					steamInjection: null,
					ngl: null,
					customNumber0: 0,
					customNumber1: null,
					customNumber2: null,
					customNumber3: null,
					customNumber4: null,
					createdAt: new Date('2020-02-13T22:18:08.418Z'),
					updatedAt: new Date('2020-07-26T14:49:24.004Z'),
				},
			],
			hasNext: true,
			cursor: null,
		});
	});

	test('getMonthlyProduction_WithDefaultSort_ShouldReturnFirstRecordByWellAndStartIndex', async () => {
		const results = await context.models.MonthlyProductionModel.find({}).sort({ well: 1, startIndex: 1 }).limit(1);
		await expect(service.getMonthlyProduction(0, 1, {}, {})).resolves.toStrictEqual({
			result: [
				{
					well: Types.ObjectId('5e272d38b78910dd2a1bd691'),
					date: new Date('2006-04-15'),
					oil: 0,
					gas: 13655,
					water: 142,
					choke: null,
					daysOn: null,
					operationalTag: null,
					gasInjection: null,
					waterInjection: 142,
					co2Injection: null,
					steamInjection: null,
					ngl: null,
					customNumber0: 0,
					customNumber1: null,
					customNumber2: null,
					customNumber3: null,
					customNumber4: null,
					createdAt: new Date('2020-02-13T22:18:08.418Z'),
					updatedAt: new Date('2020-07-26T14:49:24.004Z'),
				},
			],
			hasNext: true,
			cursor: createProductionCursor(results[0]?._id, 3),
		});
	});

	test('getMonthlyProduction_WithCursor_ShouldReturnFirstRecordAfterCursor', async () => {
		const results = await context.models.MonthlyProductionModel.findOne({ _id: '5e272d3ab78910dd2a1bdcf8' });
		await expect(service.getMonthlyProduction(0, 1, {}, {}, '5e272d3ab78910dd2a1bdcf8|0')).resolves.toStrictEqual({
			result: [
				{
					well: Types.ObjectId('5e272d38b78910dd2a1bd691'),
					date: new Date('2008-02-15'),
					oil: 0,
					gas: 1316,
					water: 14,
					choke: null,
					daysOn: null,
					operationalTag: null,
					gasInjection: null,
					waterInjection: 14,
					co2Injection: null,
					steamInjection: null,
					ngl: null,
					customNumber0: 0,
					customNumber1: null,
					customNumber2: null,
					customNumber3: null,
					customNumber4: null,
					createdAt: new Date('2020-02-13T22:18:08.420Z'),
					updatedAt: new Date('2020-07-26T14:49:24.001Z'),
				},
			],
			hasNext: true,
			cursor: createProductionCursor(results?._id, 1),
		});
	});

	test('getMonthlyProduction_WithInvalidCursor_ShouldThrowValidationError', async () => {
		await expect(service.getMonthlyProduction(0, 1, {}, {}, 'invalidcursor')).rejects.toThrow(ValidationError);
	});

	test('getMonthlyProduction_WithDateFilter_ShouldReturnRecordsLessThanInputDate', async () => {
		await expect(
			service.getMonthlyProduction(0, 10, { createdAt: 1 }, { date: [{ lt: '2006-05-15' }] }),
		).resolves.toStrictEqual({
			result: [
				{
					well: Types.ObjectId('5e272d38b78910dd2a1bd691'),
					date: new Date('2006-04-15'),
					oil: 0,
					gas: 13655,
					water: 142,
					choke: null,
					daysOn: null,
					operationalTag: null,
					gasInjection: null,
					waterInjection: 142,
					co2Injection: null,
					steamInjection: null,
					ngl: null,
					customNumber0: 0,
					customNumber1: null,
					customNumber2: null,
					customNumber3: null,
					customNumber4: null,
					createdAt: new Date('2020-02-13T22:18:08.418Z'),
					updatedAt: new Date('2020-07-26T14:49:24.004Z'),
				},
			],
			hasNext: false,
			cursor: null,
		});
	});

	test('getMonthlyProduction_WithDateFilter_ShouldReturnRecordsGreaterThanInputDate', async () => {
		await expect(
			service.getMonthlyProduction(0, 10, { createdAt: 1 }, { date: [{ gt: '2008-11-15' }] }),
		).resolves.toStrictEqual({
			result: [
				{
					well: Types.ObjectId('5e272d38b78910dd2a1bd691'),
					date: new Date('2008-12-15'),
					oil: 0,
					gas: 1158,
					water: 12,
					choke: null,
					daysOn: null,
					operationalTag: null,
					gasInjection: null,
					waterInjection: 12,
					co2Injection: null,
					steamInjection: null,
					ngl: null,
					customNumber0: 0,
					customNumber1: null,
					customNumber2: null,
					customNumber3: null,
					customNumber4: null,
					createdAt: new Date('2020-02-13T22:18:08.420Z'),
					updatedAt: new Date('2020-07-26T14:49:24.001Z'),
				},
			],
			hasNext: false,
			cursor: null,
		});
	});

	test('create', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(callCloudFunction as any).mockClear();

		let result = await service.create([]);
		expect(callCloudFunction).not.toHaveBeenCalled();
		expect(result).toStrictEqual({ results: [] });

		let prods = [
			{
				well: Types.ObjectId('5e272d38b78910dd2a1bd691'),
				index: 38850,
				oil: 100,
				gas: 100,
				water: 100,
				choke: 100,
				days_on: 30,
				operational_tag: 'test',
				gasInjection: 12,
				waterInjection: 13,
				co2Injection: 14,
				steamInjection: 15,
				ngl: 16,
				customNumber0: 17,
				customNumber1: 18,
				customNumber2: 19,
				customNumber3: 20,
				customNumber4: 21,
				arrayIndex: null,
			},
		];
		let creates: Array<ISingleMonthlyProduction | undefined> = [...prods];
		result = await service.create(creates);

		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: config.externalApiImportUrl,
			body: {
				data: { byWell: { '5e272d38b78910dd2a1bd691': prods }, project: null },
				resourceType: 'monthly',
				importOperation: 'insert',
			},
			headers: context.headers,
		});

		expect(result).toStrictEqual({
			results: prods.map(({ well, index }) => ({
				status: 'Created',
				code: CREATED,
				well: well.toString(),
				date: indexToDate(index),
			})),
		});

		prods = [
			{
				well: Types.ObjectId('5e272d38b78910dd2a1bd691'),
				index: 38850,
				oil: 100,
				gas: 100,
				water: 100,
				choke: 100,
				days_on: 30,
				operational_tag: 'test',
				gasInjection: 12,
				waterInjection: 13,
				co2Injection: 14,
				steamInjection: 15,
				ngl: 16,
				customNumber0: 17,
				customNumber1: 18,
				customNumber2: 19,
				customNumber3: 20,
				customNumber4: 21,
				arrayIndex: null,
			},
			{
				well: Types.ObjectId('5e272d38b78910dd2a1bd691'),
				index: 38890,
				oil: 100,
				gas: 100,
				water: 100,
				choke: 100,
				days_on: 30,
				operational_tag: 'test',
				gasInjection: 12,
				waterInjection: 13,
				co2Injection: 14,
				steamInjection: 15,
				ngl: 16,
				customNumber0: 17,
				customNumber1: 18,
				customNumber2: 19,
				customNumber3: 20,
				customNumber4: 21,
				arrayIndex: null,
			},
		];
		creates = [...prods];
		creates.splice(-1, 0, undefined);
		result = await service.create(creates);

		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: config.externalApiImportUrl,
			body: {
				data: { byWell: { '5e272d38b78910dd2a1bd691': prods }, project: null },
				resourceType: 'monthly',
				importOperation: 'insert',
			},
			headers: context.headers,
		});

		const expectResults: Array<IRecordStatus | undefined> = prods.map(({ well, index }) => ({
			status: 'Created',
			code: CREATED,
			well: well.toString(),
			date: indexToDate(index),
		}));
		expectResults.splice(-1, 0, undefined);
		expect(result).toStrictEqual({
			results: expectResults,
		});
	});

	test('upsert', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(callCloudFunction as any).mockClear();

		let result = await service.upsert([]);
		expect(callCloudFunction).not.toHaveBeenCalled();
		expect(result).toStrictEqual({ results: [] });

		let prods = [
			{
				well: Types.ObjectId('5e272d38b78910dd2a1bd691'),
				index: 38850,
				oil: 100,
				gas: 100,
				water: 100,
				choke: 100,
				days_on: 30,
				operational_tag: 'test',
				gasInjection: 12,
				waterInjection: 13,
				co2Injection: 14,
				steamInjection: 15,
				ngl: 16,
				customNumber0: 17,
				customNumber1: 18,
				customNumber2: 19,
				customNumber3: 20,
				customNumber4: 21,
				arrayIndex: null,
			},
		];
		let replaces: Array<ISingleMonthlyProduction | undefined> = [...prods];
		result = await service.upsert(replaces);

		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: config.externalApiImportUrl,
			body: {
				data: { byWell: { '5e272d38b78910dd2a1bd691': prods }, project: null },
				resourceType: 'monthly',
				importOperation: 'upsert',
			},
			headers: context.headers,
		});

		expect(result).toStrictEqual({
			results: prods.map(({ well, index }) => ({
				status: 'OK',
				code: OK,
				well: well.toString(),
				date: indexToDate(index),
			})),
		});

		prods = [
			{
				well: Types.ObjectId('5e272d38b78910dd2a1bd691'),
				index: 38850,
				oil: 100,
				gas: 100,
				water: 100,
				choke: 100,
				days_on: 30,
				operational_tag: 'test',
				gasInjection: 12,
				waterInjection: 13,
				co2Injection: 14,
				steamInjection: 15,
				ngl: 16,
				customNumber0: 17,
				customNumber1: 18,
				customNumber2: 19,
				customNumber3: 20,
				customNumber4: 21,
				arrayIndex: null,
			},
			{
				well: Types.ObjectId('5e272d38b78910dd2a1bd691'),
				index: 38890,
				oil: 100,
				gas: 100,
				water: 100,
				choke: 100,
				days_on: 30,
				operational_tag: 'test',
				gasInjection: 12,
				waterInjection: 13,
				co2Injection: 14,
				steamInjection: 15,
				ngl: 16,
				customNumber0: 17,
				customNumber1: 18,
				customNumber2: 19,
				customNumber3: 20,
				customNumber4: 21,
				arrayIndex: null,
			},
		];
		replaces = [...prods];
		replaces.splice(-1, 0, undefined);
		result = await service.upsert(replaces);

		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: config.externalApiImportUrl,
			body: {
				data: { byWell: { '5e272d38b78910dd2a1bd691': prods }, project: null },
				resourceType: 'monthly',
				importOperation: 'upsert',
			},
			headers: context.headers,
		});

		const expectResults: Array<IRecordStatus | undefined> = prods.map(({ well, index }) => ({
			status: 'OK',
			code: OK,
			well: well.toString(),
			date: indexToDate(index),
		}));
		expectResults.splice(-1, 0, undefined);
		expect(result).toStrictEqual({
			results: expectResults,
		});
	});

	test('getWellsIds', async () => {
		await expect(service.getWellsIds([])).resolves.toStrictEqual([]);

		const prod01 = { well: Types.ObjectId('5e272d38b78910dd2a1bd6ae'), date: new Date() };
		await expect(service.getWellsIds([prod01])).resolves.toStrictEqual([prod01]);

		const prod11 = { well: Types.ObjectId('5e272d38b78910dd2a1bd6ae'), date: new Date() };
		const prod12 = { well: Types.ObjectId('123456789012345678901234'), date: new Date() };
		await expect(service.getWellsIds([prod11, prod12])).resolves.toStrictEqual([
			prod11,
			{ ...prod12, well: undefined },
		]);

		const prod21 = { dataSource: 'di' as const, chosenID: '42479393790000', date: new Date() };
		const prod22 = { dataSource: 'di' as const, chosenID: '42479392700000', date: new Date() };
		await expect(service.getWellsIds([prod21, prod22])).resolves.toStrictEqual([
			{ ...prod21, well: Types.ObjectId('5e272d38b78910dd2a1bd691') },
			{ ...prod22, well: Types.ObjectId('5e272d38b78910dd2a1bd692') },
		]);

		const prod31 = { dataSource: 'di' as const, chosenID: '42479393790000', date: new Date() };
		const prod32 = { dataSource: 'di' as const, chosenID: '42479392700000', date: new Date() };
		const prod33 = { dataSource: 'di' as const, chosenID: '42479392700123', date: new Date() };
		await expect(service.getWellsIds([prod31, prod32, prod33])).resolves.toStrictEqual([
			{ ...prod31, well: Types.ObjectId('5e272d38b78910dd2a1bd691') },
			{ ...prod32, well: Types.ObjectId('5e272d38b78910dd2a1bd692') },
			{ ...prod33, well: undefined },
		]);

		const prod41 = { well: Types.ObjectId('5e272d38b78910dd2a1bd6ae'), date: new Date() };
		const prod42 = { dataSource: 'di' as const, chosenID: '42479393790000', date: new Date() };
		const prod43 = { dataSource: 'di' as const, chosenID: '42479392700000', date: new Date() };
		const prod44 = { dataSource: 'di' as const, chosenID: '42479392700123', date: new Date() };
		const prod45 = { well: Types.ObjectId('123456789012345678901234'), date: new Date() };
		await expect(service.getWellsIds([prod41, undefined, prod42, prod43, prod44, prod45])).resolves.toStrictEqual([
			prod41,
			undefined,
			{ ...prod42, well: Types.ObjectId('5e272d38b78910dd2a1bd691') },
			{ ...prod43, well: Types.ObjectId('5e272d38b78910dd2a1bd692') },
			{ ...prod44, well: undefined },
			{ ...prod45, well: undefined },
		]);
	});

	test('deleteMonthlyProduction', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(callCloudFunction as any).mockClear();

		const callResponse = { successCount: 10 };
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(callCloudFunction as any).mockImplementation(() => callResponse);

		const deleteBaseUrl = `${config.wellServiceUrl}/api/monthly-productions/delete`;

		let ids = (await context.models.MonthlyProductionModel.find({ project: null }, { _id: 1 })).map(({ _id }) =>
			_id.toString(),
		);

		const [{ count = 0 }] = await context.models.MonthlyProductionModel.aggregate<{ count?: number }>(
			getProductionCountPipeline({
				productionKind: 'monthly',
				beforeUnwindFilters: { project: null },
			}),
		);

		let result = await service.deleteMonthlyProduction({});
		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: deleteBaseUrl,
			headers: context.headers,
			body: { ids },
		});
		expect(result).toStrictEqual(count);

		ids = (
			await context.models.MonthlyProductionModel.find(
				{ project: null, well: '123456789012345678901234' },
				{ _id: 1 },
			)
		).map(({ _id }) => _id.toString());

		expect(ids).toStrictEqual([]);

		result = await service.deleteMonthlyProduction({ well: ['123456789012345678901234'] });
		expect(callCloudFunction).toHaveBeenCalledTimes(1);
	});
});
