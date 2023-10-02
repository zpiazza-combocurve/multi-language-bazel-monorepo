import { Connection, Types } from 'mongoose';

import { callCloudFunction } from '@src/helpers/cloud-caller';
import config from '@src/config';
import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { IForecast } from '@src/models/forecasts';
import { IProject } from '@src/models/projects';

import { ApiContextV1 } from '../../context';
import { BaseProjectResolved } from '../fields';
import { TagsService } from '../../tags/service';

import { toCreatedStatus, toFailedStatus } from './multi-status';
import { ForecastNotFoundError } from './validation';
import { ForecastService } from './service';
import { toApiForecast } from './fields';

import forecasts from '@test/fixtures/forecasts.json';
import { getTenantInfo } from '@test/tenant';
import projects from '@test/fixtures/projects.json';
import tags from '@test/fixtures/tags.json';
import { TestContext } from '@test/context';

let mongoUri: string;
let connection: Connection;
let service: ForecastService;
let context: ApiContextV1;
let project: BaseProjectResolved;
let projectScopeFilter;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getMongoForecasts = async (filter: any, sort: any = { _id: 1 }, skip = 0, limit = forecasts.length) => {
	return await context.models.ForecastModel.find(filter).sort(sort).skip(skip).limit(limit).populate('tags');
};

const lastID = (forecasts: IForecast[]) => forecasts[forecasts.length - 1]._id;

jest.mock('@src/helpers/cloud-caller');

describe('v1/projects/:projectId/forecasts/service', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new TestContext(info, connection) as ApiContextV1;

		// Forecast uses tagService to fill the tagIDs
		context = {
			...context,
			tagsService: new TagsService(context),
		} as ApiContextV1;

		service = new ForecastService(context);

		await context.models.ForecastModel.bulkWrite(
			forecasts.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: item,
					upsert: true,
				},
			})),
		);

		await context.models.TagModel.bulkWrite(
			tags.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: item,
					upsert: true,
				},
			})),
		);
	});
	beforeEach(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(callCloudFunction as any).mockClear();
	});
	afterAll(async () => {
		await connection.close();
	});
	test('getForecasts', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		projectScopeFilter = { project: project._id };

		const count = await context.models.ForecastModel.countDocuments({ ...projectScopeFilter });

		// When coun is zero
		await expect(service.getForecasts(0, 0, { id: 1 }, {}, project)).resolves.toStrictEqual({
			result: [],
			hasNext: true,
			cursor: null,
		});

		// Get all
		let expected = await getMongoForecasts(projectScopeFilter);
		await expect(service.getForecasts(0, count + 1, {}, {}, project)).resolves.toStrictEqual({
			result: expected.map(toApiForecast),
			hasNext: false,
			cursor: null,
		});

		// Get Last one by ID
		expected = await getMongoForecasts(projectScopeFilter, { _id: 1 }, count - 1, 1);
		await expect(service.getForecasts(count - 1, 1, { id: 1 }, {}, project)).resolves.toStrictEqual({
			result: expected.map(toApiForecast),
			hasNext: false,
			cursor: lastID(expected),
		});

		// Get Last by runDate
		expected = await getMongoForecasts(projectScopeFilter, { runDate: -1 }, count - 1, 1);
		await expect(service.getForecasts(count - 1, 1, { runDate: -1 }, {}, project)).resolves.toStrictEqual({
			result: expected.map(toApiForecast),
			hasNext: false,
			cursor: null,
		});

		// Filter by name
		expected = await getMongoForecasts({ name: 'default1', ...projectScopeFilter });
		await expect(service.getForecasts(0, count + 1, {}, { name: ['default1'] }, project)).resolves.toStrictEqual({
			result: expected.map(toApiForecast),
			hasNext: false,
			cursor: null,
		});

		// Filter by Type
		expected = await getMongoForecasts({ type: 'probabilistic', ...projectScopeFilter });
		await expect(
			service.getForecasts(0, count + 1, {}, { type: ['probabilistic'] }, project),
		).resolves.toStrictEqual({
			result: expected.map(toApiForecast),
			hasNext: false,
			cursor: null,
		});

		// Get one and filter by notForecastField
		expected = await getMongoForecasts(projectScopeFilter, { _id: 1 }, 0, 1);
		await expect(
			service.getForecasts(0, 1, { id: 1 }, { notForecastField: ['test'] }, project),
		).resolves.toStrictEqual({
			result: expected.map(toApiForecast),
			hasNext: true,
			cursor: lastID(expected),
		});

		// Get one and filter by project
		expected = await getMongoForecasts(projectScopeFilter, { _id: 1 }, 0, 1);
		await expect(service.getForecasts(0, 1, { id: 1 }, {}, project)).resolves.toStrictEqual({
			result: expected.map(toApiForecast),
			hasNext: true,
			cursor: lastID(expected),
		});

		const runDate = new Date('2020-05-15T17:10:21.981Z');

		// Filter equal runDate
		expected = await getMongoForecasts({ runDate, ...projectScopeFilter });
		await expect(
			service.getForecasts(0, count + 1, { id: 1 }, { runDate: ['2020-05-15T17:10:21.981Z'] }, project),
		).resolves.toStrictEqual({
			result: expected.map(toApiForecast),
			hasNext: false,
			cursor: lastID(expected),
		});

		// Filter greater runDate
		expected = await getMongoForecasts({ runDate: { $gt: runDate }, ...projectScopeFilter });
		await expect(
			service.getForecasts(0, count + 1, { id: -1 }, { runDate: [{ gt: '2020-05-15T17:10:21.981Z' }] }, project),
		).resolves.toStrictEqual({
			result: expected.map(toApiForecast),
			hasNext: false,
			cursor: lastID(expected),
		});

		// Filter greater than or equals runDate
		expected = await getMongoForecasts({ runDate: { $gte: runDate }, ...projectScopeFilter });
		await expect(
			service.getForecasts(0, count + 1, { id: 1 }, { runDate: [{ ge: '2020-05-15T17:10:21.981Z' }] }, project),
		).resolves.toStrictEqual({
			result: expected.map(toApiForecast),
			hasNext: false,
			cursor: lastID(expected),
		});

		// Filter lower runDate
		expected = await getMongoForecasts({ runDate: { $lt: runDate }, ...projectScopeFilter });
		await expect(
			service.getForecasts(0, count + 1, { id: -1 }, { runDate: [{ lt: '2020-05-15T17:10:21.981Z' }] }, project),
		).resolves.toStrictEqual({
			result: expected.map(toApiForecast),
			hasNext: false,
			cursor: lastID(expected),
		});

		// Filter lower or equal runDate
		expected = await getMongoForecasts({ runDate: { $lte: runDate }, ...projectScopeFilter });
		await expect(
			service.getForecasts(0, count + 1, { id: 1 }, { runDate: [{ le: '2020-05-15T17:10:21.981Z' }] }, project),
		).resolves.toStrictEqual({
			result: expected.map(toApiForecast),
			hasNext: false,
			cursor: lastID(expected),
		});
	});
	test('getForecasts_tags', async () => {
		const tagName = 'Big 1';
		const expected = await getMongoForecasts({ _id: '5e272dec4b97ed00132f2273' });
		const project = { name: 'Test Tags', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };

		const actual = await service.getForecasts(0, 1, { id: -1 }, { tags: [tagName] }, project);

		expect(actual).toStrictEqual({
			result: expected.map((f) => toApiForecast(f)),
			hasNext: false,
			cursor: lastID(expected),
		});
	});
	test('getForecastsCount', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		projectScopeFilter = { project: project._id };
		let count = await context.models.ForecastModel.countDocuments({ ...projectScopeFilter });
		await expect(service.getForecastsCount({}, project)).resolves.toBe(count);

		count = await context.models.ForecastModel.countDocuments({ name: 'default1', ...projectScopeFilter });
		await expect(service.getForecastsCount({ name: ['default1'] }, project)).resolves.toBe(count);

		count = await context.models.ForecastModel.countDocuments({ type: 'probabilistic', ...projectScopeFilter });
		await expect(service.getForecastsCount({ type: ['probabilistic'] }, project)).resolves.toBe(count);

		count = await context.models.ForecastModel.countDocuments({ ...projectScopeFilter });
		await expect(service.getForecastsCount({ notForecastField: ['test'] }, project)).resolves.toBe(count);
	});
	test('getById', async () => {
		// 5e272dec4b97ed00132f2273
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		projectScopeFilter = { project: project._id };
		await expect(
			service.getById(Types.ObjectId(), { name: 'Test Project', _id: Types.ObjectId() }),
		).resolves.toBeNull();

		const forecast = (await context.models.ForecastModel.findOne({
			_id: '5e272dec4b97ed00132f2273',
			...projectScopeFilter,
		}).populate('tags')) as IForecast;

		await expect(service.getById(Types.ObjectId('5e272dec4b97ed00132f2273'), project)).resolves.toStrictEqual(
			toApiForecast(forecast),
		);

		await expect(service.getById(Types.ObjectId('5e272d38b78910dd2a1bd693'), project)).resolves.toBeNull();
	});

	test('getProjectWellIds', async () => {
		await context.models.ProjectModel.bulkWrite(
			projects.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: item,
					upsert: true,
				},
			})),
		);

		const project = projects[0] as unknown as IProject;
		let projectWells = (await service.getProjectWellIds(project._id)).map((w) => w.toString());
		expect(project.wells).toStrictEqual(projectWells);

		const unExistentProject = Types.ObjectId('5b272d38b78910dd2a1bd696');
		projectWells = (await service.getProjectWellIds(unExistentProject)).map((w) => w.toString());
		expect(projectWells).toStrictEqual([]);
	});
	test('getForecastBaseInfo', async () => {
		const forecast = forecasts[0] as unknown as IForecast;
		const forecastWells = (await service.getForecastBaseInfo(forecast._id, project)).wells.map((w) => w.toString());
		expect(forecast.wells).toEqual(forecastWells);

		const unExistentForecast = Types.ObjectId('5b272d38b78910dd2a1bd696');
		const unExistingProject = { ...project, _id: Types.ObjectId() };
		await expect(service.getForecastBaseInfo(unExistentForecast, unExistingProject)).rejects.toThrow(
			ForecastNotFoundError,
		);
	});
	test('addWellsToForecast', async () => {
		await expect(service.addWellsToForecast(Types.ObjectId(), [])).resolves.toStrictEqual({
			results: [],
		});
		expect(callCloudFunction).not.toHaveBeenCalled();

		await expect(service.addWellsToForecast(Types.ObjectId(), [undefined])).resolves.toStrictEqual({
			results: [undefined],
		});
		expect(callCloudFunction).not.toHaveBeenCalled();

		const wellId = Types.ObjectId().toString();
		const forecastId = Types.ObjectId();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(callCloudFunction as any).mockImplementation(() => ({
			wellsIds: [wellId],
			message: `Successfully Added 1 well(s) To Forecast`,
		}));
		await expect(service.addWellsToForecast(forecastId, [Types.ObjectId(wellId)])).resolves.toStrictEqual({
			results: [toCreatedStatus(wellId)],
		});
		expect(callCloudFunction).toHaveBeenCalled();
		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: `${config.forecastServiceUrl}/api/forecasts/${forecastId.toString()}/wells`,
			body: { inputForecastWells: [wellId] },
			headers: context.headers,
		});
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(callCloudFunction as any).mockImplementation(() => ({
			wellsIds: [],
			message: `Successfully Added 0 well(s) To Forecast`,
		}));
		await expect(service.addWellsToForecast(forecastId, [Types.ObjectId(wellId)])).resolves.toStrictEqual({
			results: [toFailedStatus(`Failed to add well with identifier ${wellId}`, 0, wellId)],
		});
		expect(callCloudFunction).toHaveBeenCalled();
		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: `${config.forecastServiceUrl}/api/forecasts/${forecastId.toString()}/wells`,
			body: { inputForecastWells: [wellId] },
			headers: context.headers,
		});

		const wellId2 = Types.ObjectId().toString();

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(callCloudFunction as any).mockImplementation(() => ({
			wellsIds: [wellId],
			message: `Successfully Added 0 well(s) To Forecast`,
		}));
		await expect(
			service.addWellsToForecast(forecastId, [Types.ObjectId(wellId), Types.ObjectId(wellId2)]),
		).resolves.toStrictEqual({
			results: [
				toCreatedStatus(wellId),
				toFailedStatus(`Failed to add well with identifier ${wellId2}`, 1, wellId2),
			],
		});
		expect(callCloudFunction).toHaveBeenCalled();
		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: `${config.forecastServiceUrl}/api/forecasts/${forecastId.toString()}/wells`,
			body: { inputForecastWells: [wellId, wellId2] },
			headers: context.headers,
		});
	});
});
