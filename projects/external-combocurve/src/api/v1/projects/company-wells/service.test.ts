/* eslint-disable @typescript-eslint/no-explicit-any */
import { Connection, Types } from 'mongoose';

import { ApiContextV1 } from '@src/api/v1/context';
import { callCloudFunction } from '@src/helpers/cloud-caller';
import config from '@src/config';
import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { IWell } from '@src/models/wells';
import { toApiWell } from '@src/api/v1/wells/fields';

import { ProjectCompanyWellService } from './service';
import { ProjectResolved } from './fields';

import { getTenantInfo } from '@test/tenant';
import projects from '@test/fixtures/projects.json';
import { TestContext } from '@test/context';
import wells from '@test/fixtures/wells.json';

jest.mock('@src/helpers/request');
jest.mock('@src/helpers/cloud-caller');

let mongoUri: string;
let connection: Connection;
let service: ProjectCompanyWellService;
let context: ApiContextV1;
let project: ProjectResolved;
let projectScopeFilter;

describe('v1/projects/:projectId/company-wells', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new TestContext(info, connection) as ApiContextV1;
		service = new ProjectCompanyWellService(context);

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

	afterAll(async () => {
		await connection.close();
	});

	test('getProjectCompanyWells', async () => {
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
		projectScopeFilter = { _id: { $in: project.wells }, project: null };

		const count = await context.models.WellModel.countDocuments(projectScopeFilter);

		await expect(
			service.getWells({ skip: 0, take: 0, sort: { id: 1 } }, { project, company: true }),
		).resolves.toStrictEqual({
			result: [],
			hasNext: true,
			cursor: null,
		});

		let results = await context.models.WellModel.find(projectScopeFilter).sort({ _id: 1 });
		await expect(
			service.getWells({ skip: 0, take: count + 1, sort: { id: 1 } }, { project, company: true }),
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
			service.getWells({ skip: count - 1, take: 1, sort: { id: 1 } }, { project, company: true }),
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
			service.getWells({ skip: count - 1, take: 1, sort: { createdAt: -1 } }, { project, company: true }),
		).resolves.toStrictEqual({
			result: results.map(toApiWell),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.WellModel.find({ ...projectScopeFilter, well_name: 'BRISCOE' }).sort({ _id: 1 });
		await expect(
			service.getWells(
				{ skip: 0, take: count + 1, sort: { id: 1 }, filters: { wellName: ['BRISCOE'] } },
				{ project, company: true },
			),
		).resolves.toStrictEqual({
			result: results.map(toApiWell),
			hasNext: false,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.WellModel.find({ ...projectScopeFilter, api14: '42479392700000' }).sort({
			_id: 1,
		});
		await expect(
			service.getWells(
				{ skip: 0, take: count + 1, sort: { id: 1 }, filters: { api14: ['42479392700000'] } },
				{ project, company: true },
			),
		).resolves.toStrictEqual({
			result: results.map(toApiWell),
			hasNext: false,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.WellModel.find(projectScopeFilter).limit(1).sort({ _id: 1 });
		await expect(
			service.getWells(
				{ skip: 0, take: 1, sort: { id: 1 }, filters: { notWellField: ['test'] } },
				{ project, company: true },
			),
		).resolves.toStrictEqual({
			result: results.map(toApiWell),
			hasNext: true,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.WellModel.find(projectScopeFilter).limit(1).sort({ _id: 1 });
		await expect(
			service.getWells({ skip: 0, take: 1, sort: { id: 1 } }, { project, company: true }),
		).resolves.toStrictEqual({
			result: results.map(toApiWell),
			hasNext: true,
			cursor: results[results.length - 1]._id,
		});
	});

	test('getProjectCompanyWellsCount', async () => {
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
		projectScopeFilter = { _id: { $in: project.wells }, project: null };

		let count = await context.models.WellModel.countDocuments(projectScopeFilter);

		await expect(service.getWellsCount({}, { project, company: true })).resolves.toBe(count);

		count = await context.models.WellModel.countDocuments({ ...projectScopeFilter, well_name: 'BRISCOE' });
		await expect(service.getWellsCount({ wellName: ['BRISCOE'] }, { project, company: true })).resolves.toBe(count);

		count = await context.models.WellModel.countDocuments({ ...projectScopeFilter, api14: '42479392700000' });
		await expect(service.getWellsCount({ api14: ['42479392700000'] }, { project, company: true })).resolves.toBe(
			count,
		);

		count = await context.models.WellModel.countDocuments(projectScopeFilter);
		await expect(service.getWellsCount({ notWellField: ['test'] }, { project, company: true })).resolves.toBe(
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
		projectScopeFilter = { _id: { $in: project.wells }, project: null };
		await expect(
			service.getById(Types.ObjectId(), {
				project: { name: 'Test Project', _id: Types.ObjectId(), wells: [] },
				company: true,
			}),
		).resolves.toBeNull();

		const projectWell = (await context.models.WellModel.findOne({
			...projectScopeFilter,
			_id: Types.ObjectId('5e272d38b78910dd2a1bd691'),
		})) as IWell;
		await expect(
			service.getById(Types.ObjectId('5e272d38b78910dd2a1bd691'), { project, company: true }),
		).resolves.toStrictEqual(toApiWell(projectWell));

		await expect(
			service.getById(Types.ObjectId('5e272d38b78910dd2a1bd697'), { project, company: true }),
		).resolves.toBeNull();
	});

	test('addCompanyWellsToProject', async () => {
		(callCloudFunction as any).mockClear();
		let callResponse: { wells: string[] } = { wells: [] };
		(callCloudFunction as any).mockImplementation(() => callResponse);
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

		let result = await service.addCompanyWellsToProject([], projectId);
		expect(callCloudFunction).not.toHaveBeenCalled();
		expect(result).toStrictEqual({ results: [] });

		const wells = await context.models.WellModel.find({ project: null, dataSource: 'other' });
		callResponse = {
			wells: wells.map((w) => w._id.toString()),
		};
		result = await service.addCompanyWellsToProject(wells, projectId);

		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: `${config.wellServiceUrl}/api/project-company-wells/add`,
			body: {
				ids: wells.map(({ _id }) => _id.toString()),
				project: projectId,
			},
			headers: context.headers,
		});

		expect(result).toStrictEqual({
			results: wells.map(({ _id, chosenID, dataSource }) => ({
				status: 'Created',
				code: 201,
				id: _id.toString(),
				chosenID,
				dataSource,
			})),
		});
	});

	test('deleteCompanyWellsFromProject', async () => {
		(callCloudFunction as any).mockImplementation(
			async ({ body: { ids, project } }: { body: { ids: string[]; project: string } }) => {
				const wellIdsOId = ids.map((id) => Types.ObjectId(id));
				return await context.models.ProjectModel.findOneAndUpdate(
					{ _id: Types.ObjectId(project) },
					{
						$pullAll: {
							wells: wellIdsOId,
						},
					},
					{
						new: true,
					},
				);
			},
		);

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

		let result = await service.deleteCompanyWellsFromProject(
			{ dataSource: ['internal'], chosenID: ['invalid-chosenID'] },
			project,
		);
		expect(callCloudFunction).not.toHaveBeenCalled();
		expect(result).toStrictEqual(0);

		let wells = await context.models.WellModel.find({ project: null, dataSource: 'other' });
		wells = wells.filter((w) => project.wells.some((wId) => wId.toString() === w._id.toString()));

		const wellIds = wells.map(({ _id }) => _id.toString());

		result = await service.deleteCompanyWellsFromProject({ id: wellIds }, project);

		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: `${config.wellServiceUrl}/api/project-company-wells/delete`,
			body: {
				ids: wellIds,
				project: project._id.toString(),
			},
			headers: context.headers,
		});

		expect(result).toStrictEqual(wells.length);
	});
});
