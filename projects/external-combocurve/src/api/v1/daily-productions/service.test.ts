/* eslint-disable @typescript-eslint/no-explicit-any */
import { Connection } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import {
	createProductionCursor,
	getProductionCountPipeline,
	ISingleDailyProduction,
} from '@src/helpers/single-production';
import { callCloudFunction } from '@src/helpers/cloud-caller';
import config from '@src/config';
import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { indexToDate } from '@src/helpers/dates';
import { ValidationError } from '@src/helpers/validation';

import { ApiContextV1 } from '../context';
import { IRecordStatus } from '../multi-status';

import { CompanyDailyProductionService } from './service';

import { dailyProduction } from '@test/fixtures/daily-production';
import { getTenantInfo } from '@test/tenant';
import { TestContext } from '@test/context';
import wells from '@test/fixtures/wells.json';

const { CREATED, OK } = StatusCodes;

jest.mock('@src/helpers/cloud-caller');

let mongoUri: string;
let connection: Connection;
let service: CompanyDailyProductionService;
let context: ApiContextV1;

describe('v1/daily-productions/service', () => {
	beforeAll(async () => {
		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(await getMemoryMongoUri());
		context = new TestContext(info, connection) as ApiContextV1;
		service = new CompanyDailyProductionService(context);

		await context.models.WellModel.bulkWrite(
			wells.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: { ...item },
					upsert: true,
				},
			})),
		);

		await context.models.DailyProductionModel.bulkWrite(
			dailyProduction.map((item) => ({
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

	test('getDailyProduction_WithSkipTakePagination_ShouldNotReturnCursor', async () => {
		await expect(service.getDailyProduction(0, 0, { well: 1 }, {})).resolves.toStrictEqual({
			result: [],
			hasNext: true,
			cursor: null,
		});
	});

	test('getDailyProduction_WithCreatedAtSort_ShouldReturnOldestRecord', async () => {
		await expect(service.getDailyProduction(0, 1, { createdAt: -1 }, {})).resolves.toStrictEqual({
			result: [
				{
					well: Types.ObjectId('5e272d38b78910dd2a1bd691'),
					date: new Date('2010-01-18'),
					oil: 0,
					gas: 0,
					water: 0,
					choke: null,
					hoursOn: null,
					bottomHolePressure: null,
					casingHeadPressure: null,
					flowlinePressure: null,
					gasLiftInjectionPressure: null,
					tubingHeadPressure: null,
					vesselSeparatorPressure: null,
					operationalTag: null,
					gasInjection: null,
					waterInjection: 0,
					co2Injection: null,
					steamInjection: null,
					ngl: null,
					customNumber0: 0,
					customNumber1: null,
					customNumber2: null,
					customNumber3: null,
					customNumber4: null,
					createdAt: new Date('2020-01-22T09:47:00.152Z'),
					updatedAt: new Date('2020-01-22T09:47:00.152Z'),
				},
			],
			hasNext: true,
			cursor: null,
		});
	});

	test('getDailyProduction_WithDefaultSort_ShouldReturnFirstRecordByWellAndStartIndex', async () => {
		const results = await context.models.DailyProductionModel.find({}).sort({ well: 1, startIndex: 1 }).limit(1);
		await expect(service.getDailyProduction(0, 1, {}, {})).resolves.toStrictEqual({
			result: [
				{
					well: Types.ObjectId('5e272d38b78910dd2a1bd691'),
					date: new Date('2010-01-18'),
					oil: 0,
					gas: 0,
					water: 0,
					choke: null,
					hoursOn: null,
					bottomHolePressure: null,
					casingHeadPressure: null,
					flowlinePressure: null,
					gasLiftInjectionPressure: null,
					tubingHeadPressure: null,
					vesselSeparatorPressure: null,
					operationalTag: null,
					gasInjection: null,
					waterInjection: 0,
					co2Injection: null,
					steamInjection: null,
					ngl: null,
					customNumber0: 0,
					customNumber1: null,
					customNumber2: null,
					customNumber3: null,
					customNumber4: null,
					createdAt: new Date('2020-01-22T09:47:00.152Z'),
					updatedAt: new Date('2020-01-22T09:47:00.152Z'),
				},
			],
			hasNext: true,
			cursor: createProductionCursor(results[0]?._id, 17),
		});
	});

	test('getDailyProduction_WithCursor_ShouldReturnFirstRecordAfterCursor', async () => {
		const results = await context.models.DailyProductionModel.findOne({ _id: '5e286ed88f3df51d7ae7738a' });
		await expect(service.getDailyProduction(0, 1, {}, {}, '5e286ed88f3df51d7ae7738a|0')).resolves.toStrictEqual({
			result: [
				{
					well: Types.ObjectId('5e272d38b78910dd2a1bd691'),
					date: new Date('2010-03-02'),
					oil: 0,
					gas: 537,
					water: 3,
					choke: null,
					hoursOn: null,
					bottomHolePressure: null,
					casingHeadPressure: null,
					flowlinePressure: null,
					gasLiftInjectionPressure: null,
					tubingHeadPressure: null,
					vesselSeparatorPressure: null,
					operationalTag: null,
					gasInjection: null,
					waterInjection: 3,
					co2Injection: null,
					steamInjection: null,
					ngl: null,
					customNumber0: 0,
					customNumber1: null,
					customNumber2: null,
					customNumber3: null,
					customNumber4: null,
					createdAt: new Date('2020-01-22T09:47:00.152Z'),
					updatedAt: new Date('2020-01-22T09:47:00.152Z'),
				},
			],
			hasNext: true,
			cursor: createProductionCursor(results?._id, 1),
		});
	});

	test('getDailyProduction_WithInvalidCursor_ShouldThrowValidationError', async () => {
		await expect(service.getDailyProduction(0, 1, {}, {}, 'invalidcursor')).rejects.toThrow(ValidationError);
	});

	test('getDailyProduction_WithDateFilter_ShouldReturnRecordsLessThanInputDate', async () => {
		await expect(
			service.getDailyProduction(0, 10, { createdAt: -1 }, { date: [{ lt: '2010-01-20' }] }),
		).resolves.toStrictEqual({
			result: [
				{
					well: Types.ObjectId('5e272d38b78910dd2a1bd691'),
					date: new Date('2010-01-18'),
					oil: 0,
					gas: 0,
					water: 0,
					choke: null,
					hoursOn: null,
					bottomHolePressure: null,
					casingHeadPressure: null,
					flowlinePressure: null,
					gasLiftInjectionPressure: null,
					tubingHeadPressure: null,
					vesselSeparatorPressure: null,
					operationalTag: null,
					gasInjection: null,
					waterInjection: 0,
					co2Injection: null,
					steamInjection: null,
					ngl: null,
					customNumber0: 0,
					customNumber1: null,
					customNumber2: null,
					customNumber3: null,
					customNumber4: null,
					createdAt: new Date('2020-01-22T09:47:00.152Z'),
					updatedAt: new Date('2020-01-22T09:47:00.152Z'),
				},
			],
			hasNext: false,
			cursor: null,
		});
	});

	test('getDailyProduction_WithDateFilter_ShouldReturnRecordsGreaterThanInputDate', async () => {
		await expect(
			service.getDailyProduction(0, 10, { createdAt: -1 }, { date: [{ gt: '2010-03-30' }] }),
		).resolves.toStrictEqual({
			result: [
				{
					well: Types.ObjectId('5e272d38b78910dd2a1bd691'),
					date: new Date('2010-03-31'),
					oil: 1.1572400331,
					gas: 446,
					water: 3,
					choke: null,
					hoursOn: null,
					bottomHolePressure: null,
					casingHeadPressure: null,
					flowlinePressure: null,
					gasLiftInjectionPressure: null,
					tubingHeadPressure: null,
					vesselSeparatorPressure: null,
					operationalTag: null,
					gasInjection: null,
					waterInjection: 3,
					co2Injection: null,
					steamInjection: null,
					ngl: null,
					customNumber0: 1.1572400331,
					customNumber1: null,
					customNumber2: null,
					customNumber3: null,
					customNumber4: null,
					createdAt: new Date('2020-01-22T09:47:00.152Z'),
					updatedAt: new Date('2020-01-22T09:47:00.152Z'),
				},
			],
			hasNext: false,
			cursor: null,
		});
	});

	test('create', async () => {
		(callCloudFunction as any).mockClear();

		let result = await service.create([]);
		expect(callCloudFunction).not.toHaveBeenCalled();
		expect(result).toStrictEqual({ results: [] });

		let prods = [
			{
				well: Types.ObjectId('5e272d38b78910dd2a1bd691'),
				index: 40200,
				oil: 100,
				gas: 100,
				water: 100,
				choke: 100,
				hours_on: 24,
				bottom_hole_pressure: 10,
				casing_head_pressure: 10,
				flowline_pressure: 10,
				gas_lift_injection_pressure: 10,
				tubing_head_pressure: 10,
				vessel_separator_pressure: 10,
				operational_tag: 'test',
				gasInjection: 100,
				waterInjection: 100,
				co2Injection: 100,
				steamInjection: 100,
				ngl: 100,
				customNumber0: 10,
				customNumber1: 10,
				customNumber2: 10,
				customNumber3: 10,
				customNumber4: 10,
				arrayIndex: null,
			},
		];
		let creates: Array<ISingleDailyProduction | undefined> = [...prods];
		result = await service.create(creates);

		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: config.externalApiImportUrl,
			body: {
				data: { byWell: { '5e272d38b78910dd2a1bd691': prods }, project: null },
				resourceType: 'daily',
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
				index: 40200,
				oil: 100,
				gas: 100,
				water: 100,
				choke: 100,
				hours_on: 24,
				bottom_hole_pressure: 10,
				casing_head_pressure: 10,
				flowline_pressure: 10,
				gas_lift_injection_pressure: 10,
				tubing_head_pressure: 10,
				vessel_separator_pressure: 10,
				operational_tag: 'test',
				gasInjection: 100,
				waterInjection: 100,
				co2Injection: 100,
				steamInjection: 100,
				ngl: 100,
				customNumber0: 10,
				customNumber1: 10,
				customNumber2: 10,
				customNumber3: 10,
				customNumber4: 10,
				arrayIndex: null,
			},
			{
				well: Types.ObjectId('5e272d38b78910dd2a1bd691'),
				index: 40201,
				oil: 100,
				gas: 100,
				water: 100,
				choke: 100,
				hours_on: 24,
				bottom_hole_pressure: 10,
				casing_head_pressure: 10,
				flowline_pressure: 10,
				gas_lift_injection_pressure: 10,
				tubing_head_pressure: 10,
				vessel_separator_pressure: 10,
				operational_tag: 'test',
				gasInjection: 100,
				waterInjection: 100,
				co2Injection: 100,
				steamInjection: 100,
				ngl: 100,
				customNumber0: 10,
				customNumber1: 10,
				customNumber2: 10,
				customNumber3: 10,
				customNumber4: 10,
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
				resourceType: 'daily',
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
		(callCloudFunction as any).mockClear();

		let result = await service.upsert([]);
		expect(callCloudFunction).not.toHaveBeenCalled();
		expect(result).toStrictEqual({ results: [] });

		let prods = [
			{
				well: Types.ObjectId('5e272d38b78910dd2a1bd691'),
				index: 40200,
				oil: 100,
				gas: 100,
				water: 100,
				choke: 100,
				hours_on: 24,
				bottom_hole_pressure: 10,
				casing_head_pressure: 10,
				flowline_pressure: 10,
				gas_lift_injection_pressure: 10,
				tubing_head_pressure: 10,
				vessel_separator_pressure: 10,
				operational_tag: 'test',
				gasInjection: 100,
				waterInjection: 100,
				co2Injection: 100,
				steamInjection: 100,
				ngl: 100,
				customNumber0: 10,
				customNumber1: 10,
				customNumber2: 10,
				customNumber3: 10,
				customNumber4: 10,
				arrayIndex: null,
			},
		];
		let replaces: Array<ISingleDailyProduction | undefined> = [...prods];
		result = await service.upsert(replaces);

		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: config.externalApiImportUrl,
			body: {
				data: { byWell: { '5e272d38b78910dd2a1bd691': prods }, project: null },
				resourceType: 'daily',
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
				index: 40200,
				oil: 100,
				gas: 100,
				water: 100,
				choke: 100,
				hours_on: 24,
				bottom_hole_pressure: 10,
				casing_head_pressure: 10,
				flowline_pressure: 10,
				gas_lift_injection_pressure: 10,
				tubing_head_pressure: 10,
				vessel_separator_pressure: 10,
				operational_tag: 'test',
				gasInjection: 100,
				waterInjection: 100,
				co2Injection: 100,
				steamInjection: 100,
				ngl: 100,
				customNumber0: 10,
				customNumber1: 10,
				customNumber2: 10,
				customNumber3: 10,
				customNumber4: 10,
				arrayIndex: null,
			},
			{
				well: Types.ObjectId('5e272d38b78910dd2a1bd691'),
				index: 40201,
				oil: 100,
				gas: 100,
				water: 100,
				choke: 100,
				hours_on: 24,
				bottom_hole_pressure: 10,
				casing_head_pressure: 10,
				flowline_pressure: 10,
				gas_lift_injection_pressure: 10,
				tubing_head_pressure: 10,
				vessel_separator_pressure: 10,
				operational_tag: 'test',
				gasInjection: 100,
				waterInjection: 100,
				co2Injection: 100,
				steamInjection: 100,
				ngl: 100,
				customNumber0: 10,
				customNumber1: 10,
				customNumber2: 10,
				customNumber3: 10,
				customNumber4: 10,
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
				resourceType: 'daily',
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

	test('deleteDailyProduction', async () => {
		(callCloudFunction as any).mockClear();

		const callResponse = { successCount: 10 };
		(callCloudFunction as any).mockImplementation(() => callResponse);

		const deleteBaseUrl = `${config.wellServiceUrl}/api/daily-productions/delete`;

		let ids = (await context.models.DailyProductionModel.find({ project: null }, { _id: 1 })).map(({ _id }) =>
			_id.toString(),
		);

		const [{ count = 0 }] = await context.models.DailyProductionModel.aggregate<{ count?: number }>(
			getProductionCountPipeline({
				productionKind: 'daily',
				beforeUnwindFilters: { project: null },
			}),
		);

		let result = await service.deleteDailyProduction({});
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

		result = await service.deleteDailyProduction({ well: ['123456789012345678901234'] });
		expect(callCloudFunction).toHaveBeenCalledTimes(1);
	});
});
