/* eslint-disable @typescript-eslint/no-explicit-any */
import { Connection } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { ApiContextV1 } from '@src/api/v1/context';
import { callCloudFunction } from '@src/helpers/cloud-caller';
import config from '@src/config';
import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { indexToDate } from '@src/helpers/dates';
import { ISingleDailyProduction } from '@src/helpers/single-production';

import { IRecordStatus } from '../../multi-status';

import { ProjectDailyProductionService } from './service';

import { dailyProduction } from '@test/fixtures/daily-production';
import { getTenantInfo } from '@test/tenant';
import { TestContext } from '@test/context';
import wells from '@test/fixtures/wells.json';

const { CREATED, OK } = StatusCodes;

jest.mock('@src/helpers/cloud-caller');

let mongoUri: string;
let connection: Connection;
let service: ProjectDailyProductionService;
let context: ApiContextV1;

describe('v1/daily-productions/service', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new TestContext(info, connection) as ApiContextV1;
		service = new ProjectDailyProductionService(context);

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
	test('create', async () => {
		(callCloudFunction as any).mockClear();
		const projectId = '5e272bed4b97ed00132f2271';

		let result = await service.create([], projectId);
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
		result = await service.create(creates, projectId);

		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: config.externalApiImportUrl,
			body: {
				data: { byWell: { '5e272d38b78910dd2a1bd691': prods }, project: projectId },
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
		result = await service.create(creates, projectId);

		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: config.externalApiImportUrl,
			body: {
				data: { byWell: { '5e272d38b78910dd2a1bd691': prods }, project: projectId },
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
		const projectId = '5e272bed4b97ed00132f2271';

		let result = await service.upsert([], projectId);
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
		result = await service.upsert(replaces, projectId);

		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: config.externalApiImportUrl,
			body: {
				data: { byWell: { '5e272d38b78910dd2a1bd691': prods }, project: projectId },
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
		result = await service.upsert(replaces, projectId);

		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: config.externalApiImportUrl,
			body: {
				data: { byWell: { '5e272d38b78910dd2a1bd691': prods }, project: projectId },
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

		const prodNotInProject = { well: Types.ObjectId('5e272d38b78910dd2a1bd6ae'), date: new Date() };
		await expect(service.getWellsIds([prodNotInProject], '5e272bed4b97ed00132f2271')).resolves.toStrictEqual([
			{
				date: prodNotInProject.date,
				well: undefined,
			},
		]);

		const prodInProject = { well: Types.ObjectId('5e272d38b78910dd2a1bd693'), date: new Date() };
		await expect(service.getWellsIds([prodInProject], '5e272bed4b97ed00132f2271')).resolves.toStrictEqual([
			prodInProject,
		]);

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
});
