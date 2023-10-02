import { Connection, Types } from 'mongoose';

import { IReplace, toApiWell } from '@src/api/v1/wells/fields';
import { ApiContextV1 } from '@src/api/v1/context';
import { callCloudFunction } from '@src/helpers/cloud-caller';
import config from '@src/config';
import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { IRecordStatus } from '@src/api/v1/multi-status';
import { IUpdate } from '@src/api/v1/fields';
import { IWell } from '@src/models/wells';

import { ProjectResolved } from './fields';
import { ProjectWellService } from './service';

import { getTenantInfo } from '@test/tenant';
import projects from '@test/fixtures/projects.json';
import { TestContext } from '@test/context';
import wells from '@test/fixtures/wells.json';

jest.mock('@src/helpers/cloud-caller');
jest.mock('@src/helpers/request');

let mongoUri: string;
let connection: Connection;
let service: ProjectWellService;
let context: ApiContextV1;
let project: ProjectResolved;
let projectScopeFilter;

describe('v1/projects/:projectId/wells', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new TestContext(info, connection) as ApiContextV1;
		service = new ProjectWellService(context);

		await context.models.WellModel.bulkWrite(
			wells.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: item,
					upsert: true,
				},
			})),
		);

		await context.models.ProjectModel.bulkWrite(
			projects.map((item) => ({
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

	test('getProjectWells', async () => {
		project = {
			name: 'Test Project',
			_id: Types.ObjectId('5e272bed4b97ed00132f2271'),
			wells: [
				Types.ObjectId('5e272d38b78910dd2a1bd691'),
				Types.ObjectId('5e272d38b78910dd2a1bd692'),
				Types.ObjectId('5e272d38b78910dd2a1bd6ae'),
				Types.ObjectId('5e6f9e10ce8c14e6f180f705'),
				Types.ObjectId('5e6f9e10ce8c14e6f180f702'),
				Types.ObjectId('5e272d38b78910dd2a1bd693'),
				Types.ObjectId('5e272d38b78910dd3a1bd691'),
				Types.ObjectId('5e272d38b78910dd3a1bd692'),
			],
		};
		projectScopeFilter = { _id: { $in: project.wells }, project: project._id };

		const count = await context.models.WellModel.countDocuments(projectScopeFilter);

		await expect(
			service.getWells({ skip: 0, take: 0, sort: { id: 1 } }, { project, company: false }),
		).resolves.toStrictEqual({
			result: [],
			hasNext: true,
			cursor: null,
		});

		let results = await context.models.WellModel.find(projectScopeFilter).sort({ _id: 1 });
		await expect(
			service.getWells({ skip: 0, take: count + 1, sort: { id: 1 } }, { project, company: false }),
		).resolves.toStrictEqual({
			result: results.map(toApiWell),
			hasNext: false,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.WellModel.find(projectScopeFilter)
			.sort({ _id: 1 })
			.skip(count - 1)
			.limit(1);
		await expect(
			service.getWells({ skip: count - 1, take: 1, sort: { id: 1 } }, { project, company: false }),
		).resolves.toStrictEqual({
			result: results.map(toApiWell),
			hasNext: false,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.WellModel.find(projectScopeFilter)
			.sort({ createdAt: -1 })
			.skip(count - 1)
			.limit(1);
		await expect(
			service.getWells({ skip: count - 1, take: 1, sort: { createdAt: -1 } }, { project, company: false }),
		).resolves.toStrictEqual({
			result: results.map(toApiWell),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.WellModel.find({ ...projectScopeFilter, well_name: 'BRISCOE' }).sort({ _id: 1 });
		await expect(
			service.getWells(
				{ skip: 0, take: count + 1, sort: { id: 1 }, filters: { wellName: ['BRISCOE'] } },
				{ project, company: false },
			),
		).resolves.toStrictEqual({
			result: results.map(toApiWell),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.WellModel.find({ ...projectScopeFilter, api14: '42479392700000' }).sort({
			_id: 1,
		});
		await expect(
			service.getWells(
				{ skip: 0, take: count + 1, sort: { id: 1 }, filters: { api14: ['42479392700000'] } },
				{ project, company: false },
			),
		).resolves.toStrictEqual({
			result: results.map(toApiWell),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.WellModel.find(projectScopeFilter).sort({ _id: 1 }).limit(1);
		await expect(
			service.getWells(
				{ skip: 0, take: 1, sort: { id: 1 }, filters: { notWellField: ['test'] } },
				{ project, company: false },
			),
		).resolves.toStrictEqual({
			result: results.map(toApiWell),
			hasNext: true,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.WellModel.find(projectScopeFilter).sort({ _id: 1 }).limit(1);
		await expect(
			service.getWells({ skip: 0, take: 1, sort: { id: 1 } }, { project, company: false }),
		).resolves.toStrictEqual({
			result: results.map(toApiWell),
			hasNext: true,
			cursor: results[results.length - 1]._id,
		});
	});

	test('getProjectWellsCount', async () => {
		project = {
			name: 'Test Project',
			_id: Types.ObjectId('5e272bed4b97ed00132f2271'),
			wells: [
				Types.ObjectId('5e272d38b78910dd2a1bd691'),
				Types.ObjectId('5e272d38b78910dd2a1bd692'),
				Types.ObjectId('5e272d38b78910dd2a1bd6ae'),
				Types.ObjectId('5e6f9e10ce8c14e6f180f705'),
				Types.ObjectId('5e6f9e10ce8c14e6f180f702'),
				Types.ObjectId('5e272d38b78910dd2a1bd693'),
				Types.ObjectId('5e272d38b78910dd3a1bd691'),
				Types.ObjectId('5e272d38b78910dd3a1bd692'),
			],
		};
		projectScopeFilter = { _id: { $in: project.wells }, project: project._id };

		let count = await context.models.WellModel.countDocuments(projectScopeFilter);

		await expect(service.getWellsCount({}, { project, company: false })).resolves.toBe(count);

		count = await context.models.WellModel.countDocuments({ ...projectScopeFilter, well_name: 'BRISCOE' });
		await expect(service.getWellsCount({ wellName: ['BRISCOE'] }, { project, company: false })).resolves.toBe(
			count,
		);

		count = await context.models.WellModel.countDocuments({ ...projectScopeFilter, api14: '42479392700000' });
		await expect(service.getWellsCount({ api14: ['42479392700000'] }, { project, company: false })).resolves.toBe(
			count,
		);

		count = await context.models.WellModel.countDocuments(projectScopeFilter);
		await expect(service.getWellsCount({ notWellField: ['test'] }, { project, company: false })).resolves.toBe(
			count,
		);
	});

	test('getById', async () => {
		project = {
			name: 'Test Project',
			_id: Types.ObjectId('5e272bed4b97ed00132f2271'),
			wells: [
				Types.ObjectId('5e272d38b78910dd2a1bd691'),
				Types.ObjectId('5e272d38b78910dd2a1bd692'),
				Types.ObjectId('5e272d38b78910dd2a1bd6ae'),
				Types.ObjectId('5e6f9e10ce8c14e6f180f705'),
				Types.ObjectId('5e6f9e10ce8c14e6f180f702'),
				Types.ObjectId('5e272d38b78910dd2a1bd693'),
				Types.ObjectId('5e272d38b78910dd3a1bd691'),
				Types.ObjectId('5e272d38b78910dd3a1bd692'),
			],
		};
		projectScopeFilter = { _id: { $in: project.wells }, project: project._id };
		await expect(
			service.getById(Types.ObjectId(), {
				project: { name: 'Test Project', _id: Types.ObjectId(), wells: [] },
				company: false,
			}),
		).resolves.toBeNull();

		const projectWell = (await context.models.WellModel.findOne({
			...projectScopeFilter,
			_id: Types.ObjectId('5e272d38b78910dd3a1bd691'),
		})) as IWell;
		await expect(
			service.getById(Types.ObjectId('5e272d38b78910dd3a1bd691'), { project, company: false }),
		).resolves.toStrictEqual(toApiWell(projectWell));

		await expect(
			service.getById(Types.ObjectId('5e272d38b78910dd2a1bd691'), { project, company: false }),
		).resolves.toBeNull();
	});

	test('deleteProjectWells', async () => {
		project = {
			name: 'Test Project',
			_id: Types.ObjectId('5e272bed4b97ed00132f2271'),
			wells: [
				Types.ObjectId('5e272d38b78910dd2a1bd691'),
				Types.ObjectId('5e272d38b78910dd2a1bd692'),
				Types.ObjectId('5e272d38b78910dd2a1bd6ae'),
				Types.ObjectId('5e6f9e10ce8c14e6f180f705'),
				Types.ObjectId('5e6f9e10ce8c14e6f180f702'),
				Types.ObjectId('5e272d38b78910dd2a1bd693'),
				Types.ObjectId('5e272d38b78910dd3a1bd691'),
				Types.ObjectId('5e272d38b78910dd3a1bd692'),
			],
		};
		const projectId = project._id.toString();

		let callResponse: { wells: string[] } = { wells: [] };
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(callCloudFunction as any).mockImplementation(() => callResponse);

		const deleteBaseUrl = `${config.wellServiceUrl}/api/project-wells/delete`;

		let ids = (
			await context.models.WellModel.find(
				{
					_id: {
						$in: [
							Types.ObjectId('5e272d38b78910dd2a1bd693'),
							Types.ObjectId('5e272d38b78910dd3a1bd691'),
							Types.ObjectId('5e272d38b78910dd3a1bd692'),
						],
					},
				},
				{ _id: 1 },
			)
		).map(({ _id }) => _id.toString());

		callResponse = {
			wells: [
				'5e272d38b78910dd2a1bd691',
				'5e272d38b78910dd2a1bd692',
				'5e272d38b78910dd2a1bd6ae',
				'5e6f9e10ce8c14e6f180f705',
				'5e6f9e10ce8c14e6f180f702',
			],
		};
		let result = await service.deleteProjectWells({}, project);
		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: deleteBaseUrl,
			body: { ids, project: projectId },
			headers: context.headers,
		});
		expect(result).toStrictEqual(ids.length);

		ids = (
			await context.models.WellModel.find(
				{ dataSource: 'internal', chosenID: '22222222222222', project: project._id },
				{ _id: 1 },
			)
		).map(({ _id }) => _id.toString());

		expect(ids).toStrictEqual([]);
		result = await service.deleteProjectWells(
			{
				dataSource: ['internal'],
				chosenID: ['22222222222222'],
			},
			project,
		);
		expect(callCloudFunction).toHaveBeenCalledTimes(1);
	});

	test('deleteProjectWellById', async () => {
		project = {
			name: 'Test Project',
			_id: Types.ObjectId('5e272bed4b97ed00132f2271'),
			wells: [
				Types.ObjectId('5e272d38b78910dd2a1bd691'),
				Types.ObjectId('5e272d38b78910dd2a1bd692'),
				Types.ObjectId('5e272d38b78910dd2a1bd6ae'),
				Types.ObjectId('5e6f9e10ce8c14e6f180f705'),
				Types.ObjectId('5e6f9e10ce8c14e6f180f702'),
				Types.ObjectId('5e272d38b78910dd2a1bd693'),
				Types.ObjectId('5e272d38b78910dd3a1bd691'),
				Types.ObjectId('5e272d38b78910dd3a1bd692'),
			],
		};

		let callResponse: { wells: string[] } = { wells: [] };
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(callCloudFunction as any).mockImplementation(() => callResponse);

		const deleteBaseUrl = `${config.wellServiceUrl}/api/project-wells/delete`;

		const wellId = Types.ObjectId('5e272d38b78910dd2a1bd693');

		callResponse = {
			wells: [
				'5e272d38b78910dd2a1bd691',
				'5e272d38b78910dd2a1bd692',
				'5e272d38b78910dd2a1bd6ae',
				'5e6f9e10ce8c14e6f180f705',
				'5e6f9e10ce8c14e6f180f702',
				'5e272d38b78910dd2a1bd691',
				'5e272d38b78910dd3a1bd692',
			],
		};
		const result = await service.deleteProjectWellById(wellId, project);
		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: deleteBaseUrl,
			body: { ids: [wellId.toString()], project: project._id.toString() },
			headers: context.headers,
		});
		expect(result).toStrictEqual(1);
	});

	test('create', async () => {
		const projectId = '5e272bed4b97ed00132f2271';
		const projectObjectId = Types.ObjectId(projectId);
		let result = await service.create([], projectId);
		expect(callCloudFunction).not.toHaveBeenCalled();
		expect(result).toStrictEqual({ results: [] });

		let wells = await context.models.WellModel.find({
			project: projectObjectId,
			dataSource: 'di',
		});
		let creates: Array<IWell | undefined> = wells;
		result = await service.create(creates, projectId);

		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: config.externalApiImportUrl,
			body: {
				data: { dataSource: 'di', project: projectId, wells },
				resourceType: 'headers',
				importOperation: 'insert',
			},
			headers: context.headers,
		});

		expect(result).toStrictEqual({
			results: wells.map(({ _id, chosenID, dataSource, createdAt, updatedAt }) => ({
				status: 'Created',
				code: 201,
				id: _id.toString(),
				chosenID,
				dataSource,
				createdAt,
				updatedAt,
			})),
		});

		const newWell = { ...wells[0], well_name: 'test3011202111', chosenID: 'test3011202111' } as IWell;
		const wellsToCreate = [newWell];
		result = await service.create(wellsToCreate, projectId);

		expect(result).toStrictEqual({
			results: wellsToCreate.map(({ chosenID }) => ({
				status: 'Failed',
				code: 500,
				errors: [
					{
						name: 'InternalServerError',
						message: `Failed to create well with identifier \`${chosenID}\``,
						location: `[0]`,
					},
				],
				chosenID: 'test3011202111',
			})),
		});

		wells = await context.models.WellModel.find({ project: projectObjectId, dataSource: 'di' });
		creates = [...wells];
		creates.splice(-1, 0, undefined);
		result = await service.create(creates, projectId);

		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: config.externalApiImportUrl,
			body: {
				data: { dataSource: 'di', project: projectId, wells },
				resourceType: 'headers',
				importOperation: 'insert',
			},
			headers: context.headers,
		});

		const expectResults: Array<IRecordStatus | undefined> = wells.map(
			({ _id, chosenID, dataSource, createdAt, updatedAt }) => ({
				status: 'Created',
				code: 201,
				id: _id.toString(),
				chosenID,
				dataSource,
				createdAt,
				updatedAt,
			}),
		);
		expectResults.splice(-1, 0, undefined);
		expect(result).toStrictEqual({
			results: expectResults,
		});
	});

	test('replaceWells', async () => {
		const projectId = '5e272bed4b97ed00132f2271';
		const projectObjectId = Types.ObjectId(projectId);
		let result = await service.replaceWells([], projectId);
		expect(callCloudFunction).not.toHaveBeenCalled();
		expect(result).toStrictEqual({ results: [] });

		let wells = await context.models.WellModel.find({ project: projectObjectId, dataSource: 'di' });
		let replaces: Array<IReplace | undefined> = wells.map((w) => ({ id: w.id, update: w, remove: [] }));
		let updatedTimestamp = new Date((wells[0]?.updatedAt?.getTime() ?? 0) - 1000);
		result = await service.replaceWells(replaces, projectId, updatedTimestamp);

		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: config.externalApiImportUrl,
			body: {
				data: { dataSource: 'di', project: projectId, replaces: replaces },
				resourceType: 'headers',
				importOperation: 'replace',
			},
			headers: context.headers,
		});

		expect(result).toStrictEqual({
			results: wells.map(({ _id, chosenID, dataSource, createdAt, updatedAt }) => ({
				status: 'OK',
				code: 200,
				id: _id.toString(),
				chosenID,
				dataSource,
				createdAt,
				updatedAt,
			})),
		});

		wells = await context.models.WellModel.find({ project: projectObjectId, dataSource: 'di' });
		replaces = wells.map((w) => ({ id: w.id, update: w, remove: [] }));
		result = await service.replaceWells(replaces, projectId);

		expect(result).toStrictEqual({
			results: wells.map(({ _id, chosenID }, i) => ({
				status: 'Failed',
				code: 500,
				errors: [
					{
						name: 'InternalServerError',
						message: `Failed to update well with identifier \`${_id}\``,
						location: `[${i}]`,
					},
				],
				chosenID,
			})),
		});

		wells = await context.models.WellModel.find({ project: projectObjectId, dataSource: 'di' });
		replaces = wells.map((w) => ({ id: w.id, update: w, remove: [] }));
		replaces.splice(-1, 0, undefined);
		updatedTimestamp = new Date((wells[0]?.updatedAt?.getTime() ?? 0) - 1000);
		result = await service.replaceWells(replaces, projectId, updatedTimestamp);

		const expectResults: Array<IRecordStatus | undefined> = wells.map(
			({ _id, chosenID, dataSource, createdAt, updatedAt }) => ({
				status: 'OK',
				code: 200,
				id: _id.toString(),
				chosenID,
				dataSource,
				createdAt,
				updatedAt,
			}),
		);
		expectResults.splice(-1, 0, undefined);
		expect(result).toStrictEqual({
			results: expectResults,
		});
	});

	test('replaceWell', async () => {
		const projectId = '5e272bed4b97ed00132f2271';
		const replace = {
			id: Types.ObjectId('5e272d38b78910dd2a1bd691'),
			update: { api14: '42479393790000' },
			remove: [],
		};

		service.replaceWells = jest.fn(() => Promise.resolve({ results: [] }));

		await service.replaceWell(replace, projectId);
		expect(service.replaceWells).toHaveBeenCalledWith([replace], projectId);
	});

	test('updateWells', async () => {
		const projectId = '5e272bed4b97ed00132f2271';
		const projectObjectId = Types.ObjectId(projectId);
		let result = await service.updateWells([], projectId);
		expect(callCloudFunction).not.toHaveBeenCalled();
		expect(result).toStrictEqual({ results: [] });

		let wells = await context.models.WellModel.find({ project: projectObjectId, dataSource: 'di' });
		let updates: Array<IUpdate<IWell> | undefined> = wells.map((w) => ({ id: w.id, update: w, remove: [] }));
		let updatedTimestamp = new Date((wells[0]?.updatedAt?.getTime() ?? 0) - 1000);
		result = await service.updateWells(updates, projectId, updatedTimestamp);

		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: config.externalApiImportUrl,
			body: {
				data: { dataSource: 'di', project: projectId, replaces: updates, setDefaultValues: false },
				resourceType: 'headers',
				importOperation: 'replace',
			},
			headers: context.headers,
		});

		expect(result).toStrictEqual({
			results: wells.map(({ _id, chosenID, dataSource, createdAt, updatedAt }) => ({
				status: 'OK',
				code: 200,
				id: _id.toString(),
				chosenID,
				dataSource,
				createdAt,
				updatedAt,
			})),
		});

		wells = await context.models.WellModel.find({ project: projectObjectId, dataSource: 'di' });
		updates = wells.map((w) => ({ id: w.id, update: w, remove: [] }));
		result = await service.updateWells(updates, projectId);

		expect(result).toStrictEqual({
			results: wells.map(({ _id, chosenID }, i) => ({
				status: 'Failed',
				code: 500,
				errors: [
					{
						name: 'InternalServerError',
						message: `Failed to update well with identifier \`${_id}\``,
						location: `[${i}]`,
					},
				],
				chosenID,
			})),
		});

		wells = await context.models.WellModel.find({ project: projectObjectId, dataSource: 'di' });
		updates = wells.map((w) => ({ id: w.id, update: w, remove: [] }));
		updates.splice(-1, 0, undefined);
		updatedTimestamp = new Date((wells[0]?.updatedAt?.getTime() ?? 0) - 1000);
		result = await service.updateWells(updates, projectId, updatedTimestamp);

		const exceptResults: Array<IRecordStatus | undefined> = wells.map(
			({ _id, chosenID, dataSource, createdAt, updatedAt }) => ({
				status: 'OK',
				code: 200,
				id: _id.toString(),
				chosenID,
				dataSource,
				createdAt,
				updatedAt,
			}),
		);
		exceptResults.splice(-1, 0, undefined);
		expect(result).toStrictEqual({
			results: exceptResults,
		});
	});

	test('updateWell', async () => {
		const projectId = '5e272bed4b97ed00132f2271';
		const update = {
			id: Types.ObjectId('5e272d38b78910dd2a1bd691'),
			update: { api14: '42479393790000', dataSource: 'di' },
			remove: [],
		};

		service.updateWells = jest.fn(() => Promise.resolve({ results: [] }));

		await service.updateWell(update as IUpdate<IWell>, projectId);
		expect(service.updateWells).toHaveBeenCalledWith([update], projectId);
	});
});
