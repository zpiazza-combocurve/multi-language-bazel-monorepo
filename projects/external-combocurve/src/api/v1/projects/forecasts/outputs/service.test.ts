import { Connection, Types } from 'mongoose';

import { ApiContextV1 } from '@src/api/v1/context';
import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { IForecastData } from '@src/models/forecast-data';

import { BaseForecastResolved } from '../fields';
import { BaseProjectResolved } from '../../fields';

import { ForecastDataService } from './service';
import { toApiForecastData } from './fields/forecast-outputs';

import deterministicForecastData from '@test/fixtures/deterministic-forecast-data.json';
import forecastData from '@test/fixtures/forecast-data.json';
import { getTenantInfo } from '@test/tenant';
import { TestContext } from '@test/context';

jest.mock('@src/helpers/request');

let mongoUri: string;
let connection: Connection;
let service: ForecastDataService;
let context: ApiContextV1;
let project: BaseProjectResolved;
let forecast: BaseForecastResolved;
let scopeFilter: { project: Types.ObjectId; forecast: Types.ObjectId };

describe('v1/projects/:projectId/forecasts/:forecastId/outputs/service', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new TestContext(info, connection) as ApiContextV1;
		service = new ForecastDataService(context);

		await context.models.ProbabilisticForecastDataModel.bulkWrite(
			forecastData.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: item,
					upsert: true,
				},
			})),
		);

		await context.models.DeterministicForecastDataModel.bulkWrite(
			deterministicForecastData.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: item,
					upsert: true,
				},
			})),
		);
	});

	afterAll(async () => {
		await connection.close();
	});

	test('getForecastData probabilistic', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		forecast = {
			name: 'Test Forecast',
			id: Types.ObjectId('5e272dec4b97ed00132f2273'),
			type: 'probabilistic' as const,
		};
		scopeFilter = { project: project._id, forecast: forecast.id };

		const count = await context.models.ProbabilisticForecastDataModel.countDocuments({ ...scopeFilter });

		await expect(service.getForecastData(0, 0, { id: 1 }, {}, project, forecast)).resolves.toStrictEqual({
			result: [],
			hasNext: true,
			cursor: null,
		});

		let results = await context.models.ProbabilisticForecastDataModel.find({ ...scopeFilter }).sort({ _id: 1 });
		await expect(service.getForecastData(0, count + 1, { id: 1 }, {}, project, forecast)).resolves.toStrictEqual({
			result: results.map((fd) => toApiForecastData(fd, forecast)),
			hasNext: false,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.ProbabilisticForecastDataModel.find({ ...scopeFilter })
			.sort({ _id: 1 })
			.skip(count - 1)
			.limit(1);
		await expect(service.getForecastData(count - 1, 1, { id: 1 }, {}, project, forecast)).resolves.toStrictEqual({
			result: results.map((fd) => toApiForecastData(fd, forecast)),
			hasNext: false,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.ProbabilisticForecastDataModel.find({ ...scopeFilter })
			.sort({ runDate: -1 })
			.skip(count - 1)
			.limit(1);
		await expect(
			service.getForecastData(count - 1, 1, { runDate: -1 }, {}, project, forecast),
		).resolves.toStrictEqual({
			result: results.map((fd) => toApiForecastData(fd, forecast)),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.ProbabilisticForecastDataModel.find({
			well: '5e272d7ab78910dd2a1dfdc3',
			...scopeFilter,
		}).sort({ _id: 1 });
		await expect(
			service.getForecastData(0, count + 1, { id: 1 }, { well: ['5e272d7ab78910dd2a1dfdc3'] }, project, forecast),
		).resolves.toStrictEqual({
			result: results.map((fd) => toApiForecastData(fd, forecast)),
			hasNext: false,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.ProbabilisticForecastDataModel.find({ ...scopeFilter })
			.sort({ _id: 1 })
			.limit(1);
		await expect(
			service.getForecastData(0, 1, { id: 1 }, { notForecastDataField: ['test'] }, project, forecast),
		).resolves.toStrictEqual({
			result: results.map((fd) => toApiForecastData(fd, forecast)),
			hasNext: true,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.ProbabilisticForecastDataModel.find({ ...scopeFilter })
			.sort({ _id: 1 })
			.limit(1);
		await expect(service.getForecastData(0, 1, { id: 1 }, {}, project, forecast)).resolves.toStrictEqual({
			result: results.map((fd) => toApiForecastData(fd, forecast)),
			hasNext: true,
			cursor: results[results.length - 1]._id,
		});
	});

	test('getForecastData deterministic', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		forecast = {
			name: 'Test Forecast',
			id: Types.ObjectId('5f24af657bc6030012064ed7'),
			type: 'deterministic' as const,
		};
		scopeFilter = { project: project._id, forecast: forecast.id };

		const count = await context.models.DeterministicForecastDataModel.countDocuments({ ...scopeFilter });

		await expect(service.getForecastData(0, 0, { id: 1 }, {}, project, forecast)).resolves.toStrictEqual({
			result: [],
			hasNext: true,
			cursor: null,
		});

		let results = await context.models.DeterministicForecastDataModel.find({ ...scopeFilter }).sort({ _id: 1 });
		await expect(service.getForecastData(0, count + 1, { id: 1 }, {}, project, forecast)).resolves.toStrictEqual({
			result: results.map((fd) => toApiForecastData(fd, forecast)),
			hasNext: false,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.DeterministicForecastDataModel.find({ ...scopeFilter })
			.sort({ _id: 1 })
			.skip(count - 1)
			.limit(1);
		await expect(service.getForecastData(count - 1, 1, { id: 1 }, {}, project, forecast)).resolves.toStrictEqual({
			result: results.map((fd) => toApiForecastData(fd, forecast)),
			hasNext: false,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.DeterministicForecastDataModel.find({ ...scopeFilter })
			.sort({ runDate: -1 })
			.skip(count - 1)
			.limit(1);
		await expect(
			service.getForecastData(count - 1, 1, { runDate: -1 }, {}, project, forecast),
		).resolves.toStrictEqual({
			result: results.map((fd) => toApiForecastData(fd, forecast)),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.DeterministicForecastDataModel.find({
			well: '5e272d7ab78910dd2a1dfdc3',
			...scopeFilter,
		}).sort({ _id: 1 });
		await expect(
			service.getForecastData(0, count + 1, { id: 1 }, { well: ['5e272d7ab78910dd2a1dfdc3'] }, project, forecast),
		).resolves.toStrictEqual({
			result: [],
			hasNext: false,
			cursor: null,
		});

		results = await context.models.DeterministicForecastDataModel.find({ ...scopeFilter })
			.sort({ _id: 1 })
			.limit(1);
		await expect(
			service.getForecastData(0, 1, { id: 1 }, { notForecastDataField: ['test'] }, project, forecast),
		).resolves.toStrictEqual({
			result: results.map((fd) => toApiForecastData(fd, forecast)),
			hasNext: true,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.DeterministicForecastDataModel.find({ ...scopeFilter })
			.sort({ _id: 1 })
			.limit(1);
		await expect(service.getForecastData(0, 1, { id: 1 }, {}, project, forecast)).resolves.toStrictEqual({
			result: results.map((fd) => toApiForecastData(fd, forecast)),
			hasNext: true,
			cursor: results[results.length - 1]._id,
		});
	});

	test('getForecastsCount probabilistic', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		forecast = {
			name: 'Test Forecast',
			id: Types.ObjectId('5e272dec4b97ed00132f2273'),
			type: 'probabilistic' as const,
		};
		scopeFilter = { project: project._id, forecast: forecast.id };
		let count = await context.models.ProbabilisticForecastDataModel.countDocuments({ ...scopeFilter });
		await expect(service.getForecastDataCount({}, project, forecast)).resolves.toBe(count);

		count = await context.models.ProbabilisticForecastDataModel.countDocuments({
			well: '5e272d7ab78910dd2a1dfdc3',
			...scopeFilter,
		});
		await expect(
			service.getForecastDataCount({ well: ['5e272d7ab78910dd2a1dfdc3'] }, project, forecast),
		).resolves.toBe(count);

		count = await context.models.ProbabilisticForecastDataModel.countDocuments({ ...scopeFilter });
		await expect(service.getForecastDataCount({ notForecastDataField: ['test'] }, project, forecast)).resolves.toBe(
			count,
		);
	});

	test('getForecastsCount deterministic', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		forecast = {
			name: 'Test Forecast',
			id: Types.ObjectId('5e272dec4b97ed00132f2273'),
			type: 'deterministic' as const,
		};
		scopeFilter = { project: project._id, forecast: forecast.id };
		let count = await context.models.DeterministicForecastDataModel.countDocuments({ ...scopeFilter });
		await expect(service.getForecastDataCount({}, project, forecast)).resolves.toBe(count);

		count = await context.models.DeterministicForecastDataModel.countDocuments({
			well: '5e272d7ab78910dd2a1dfdc3',
			...scopeFilter,
		});
		await expect(
			service.getForecastDataCount({ well: ['5e272d7ab78910dd2a1dfdc3'] }, project, forecast),
		).resolves.toBe(count);

		count = await context.models.DeterministicForecastDataModel.countDocuments({ ...scopeFilter });
		await expect(service.getForecastDataCount({ notForecastDataField: ['test'] }, project, forecast)).resolves.toBe(
			count,
		);
	});

	test('getById probabilistic', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		forecast = {
			name: 'Test Forecast',
			id: Types.ObjectId('5e272dec4b97ed00132f2273'),
			type: 'probabilistic' as const,
		};
		scopeFilter = { project: project._id, forecast: forecast.id };

		await expect(
			service.getById(
				Types.ObjectId(),
				{ name: 'Test Project', _id: Types.ObjectId() },
				{ name: 'Test Forecast', id: Types.ObjectId(), type: 'probabilistic' },
			),
		).resolves.toBeNull();

		const forecastData = (await context.models.ProbabilisticForecastDataModel.findOne({
			_id: '5e272dec4b97ed00132f2278',
			...scopeFilter,
		})) as IForecastData;
		await expect(
			service.getById(Types.ObjectId('5e272dec4b97ed00132f2278'), project, forecast),
		).resolves.toStrictEqual(toApiForecastData(forecastData, forecast));

		await expect(
			service.getById(Types.ObjectId('5e272d38b78910dd2a1bd693'), project, forecast),
		).resolves.toBeNull();
	});

	test('getById deterministic', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		forecast = {
			name: 'Test Forecast',
			id: Types.ObjectId('5f24af657bc6030012064ed7'),
			type: 'deterministic' as const,
		};
		scopeFilter = { project: project._id, forecast: forecast.id };

		await expect(
			service.getById(
				Types.ObjectId(),
				{ name: 'Test Project', _id: Types.ObjectId() },
				{ name: 'Test Forecast', id: Types.ObjectId(), type: 'deterministic' },
			),
		).resolves.toBeNull();

		const forecastData = (await context.models.DeterministicForecastDataModel.findOne({
			_id: '5f24af6537794900129b17af',
			...scopeFilter,
		})) as IForecastData;
		await expect(
			service.getById(Types.ObjectId('5f24af6537794900129b17af'), project, forecast),
		).resolves.toStrictEqual(toApiForecastData(forecastData, forecast));

		await expect(
			service.getById(Types.ObjectId('5e272d38b78910dd2a1bd693'), project, forecast),
		).resolves.toBeNull();
	});
});
