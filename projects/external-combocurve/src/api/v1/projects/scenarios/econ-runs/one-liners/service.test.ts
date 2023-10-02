import { Connection, Types } from 'mongoose';

import { ApiContextV1 } from '@src/api/v1/context';
import { BaseProjectResolved } from '@src/api/v1/projects/fields';
import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { IEconRun } from '@src/models/econ/econ-runs';
import { IEconRunData } from '@src/models/econ/econ-run-data';

import { EconRunDataService } from './service';
import { toApiEconRunData } from './fields';

import econGroupData from '@test/fixtures/econ-groups.json';
import econRunData from '@test/fixtures/one-liners.json';
import { getTenantInfo } from '@test/tenant';
import { TestContext } from '@test/context';

jest.mock('@src/helpers/request');

let mongoUri: string;
let connection: Connection;
let service: EconRunDataService;
let context: ApiContextV1;
let project: BaseProjectResolved;
let scenarioId: Types.ObjectId;
let econRun: Pick<IEconRun, 'id' | 'runDate'>;
let scopeFilter: { project: Types.ObjectId; scenario: Types.ObjectId; run: Types.ObjectId };

async function populateGroupName(econRunData: IEconRunData[]): Promise<IEconRunData[]> {
	const econGroups = await context.models.EconGroupModel.find({});

	return econRunData.map((econRunDataItem) => {
		const groupId = econRunDataItem.get('group');

		if (groupId) {
			econRunDataItem.groupName = econGroups.find((econGroup) => econGroup.id.toString() == groupId.toString())
				?.name;
		}

		return econRunDataItem;
	});
}

describe('v1/projects/:projectId/scenarios/:scenarioId/econ-runs/:econRunId/one-liners/service', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new TestContext(info, connection) as ApiContextV1;
		service = new EconRunDataService(context);

		await context.models.EconGroupModel.bulkWrite(
			econGroupData.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: item,
					upsert: true,
				},
			})),
		);

		await context.models.EconRunDataModel.bulkWrite(
			econRunData.map((item) => ({
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

	test('getEconRuns skip 0 take 0 returns empty array', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		scenarioId = Types.ObjectId('5e27305e4f59a9ec64eb576a');
		econRun = { id: Types.ObjectId('5f80f287d7e63537b90aa121'), runDate: new Date(2020, 10, 9) };

		await expect(service.getEconRunData(0, 0, { id: 1 }, {}, project, scenarioId, econRun)).resolves.toStrictEqual({
			result: [],
			hasNext: true,
			cursor: null,
		});
	});

	test('getEconRuns skip 0 take more than exist should return expected results', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		scenarioId = Types.ObjectId('5e27305e4f59a9ec64eb576a');
		econRun = { id: Types.ObjectId('5f80f287d7e63537b90aa121'), runDate: new Date(2020, 10, 9) };
		scopeFilter = { project: project._id, scenario: scenarioId, run: econRun.id };

		const count = await context.models.EconRunDataModel.countDocuments({ ...scopeFilter });

		const expectedResults = await populateGroupName(
			await context.models.EconRunDataModel.find({ ...scopeFilter }).sort({ _id: 1 }),
		);

		await expect(
			service.getEconRunData(0, count + 1, { id: 1 }, {}, project, scenarioId, econRun),
		).resolves.toStrictEqual({
			result: expectedResults.map(toApiEconRunData),
			hasNext: false,
			cursor: expectedResults[expectedResults.length - 1]._id,
		});
	});

	test('getEconRuns skip take should limit results', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		scenarioId = Types.ObjectId('5e27305e4f59a9ec64eb576a');
		econRun = { id: Types.ObjectId('5f80f287d7e63537b90aa121'), runDate: new Date(2020, 10, 9) };
		scopeFilter = { project: project._id, scenario: scenarioId, run: econRun.id };

		const count = await context.models.EconRunDataModel.countDocuments({ ...scopeFilter });

		const expectedResults = await populateGroupName(
			await context.models.EconRunDataModel.find({ ...scopeFilter })
				.sort({ _id: 1 })
				.skip(count - 1)
				.limit(1),
		);

		await expect(
			service.getEconRunData(count - 1, 1, { id: 1 }, {}, project, scenarioId, econRun),
		).resolves.toStrictEqual({
			result: expectedResults.map(toApiEconRunData),
			hasNext: false,
			cursor: expectedResults[expectedResults.length - 1]._id,
		});
	});

	test('getEconRuns should sort by comboName', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		scenarioId = Types.ObjectId('5e27305e4f59a9ec64eb576a');
		econRun = { id: Types.ObjectId('5f80f287d7e63537b90aa121'), runDate: new Date(2020, 10, 9) };
		scopeFilter = { project: project._id, scenario: scenarioId, run: econRun.id };

		const count = await context.models.EconRunDataModel.countDocuments({ ...scopeFilter });

		const expectedResults = await populateGroupName(
			await context.models.EconRunDataModel.find({ ...scopeFilter })
				.sort({ comboName: -1 })
				.skip(count - 1)
				.limit(1),
		);

		await expect(
			service.getEconRunData(count - 1, 1, { comboName: -1 }, {}, project, scenarioId, econRun),
		).resolves.toStrictEqual({
			result: expectedResults.map(toApiEconRunData),
			hasNext: false,
			cursor: null,
		});
	});

	test('getEconRuns should filter by comboName', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		scenarioId = Types.ObjectId('5e27305e4f59a9ec64eb576a');
		econRun = { id: Types.ObjectId('5f80f287d7e63537b90aa121'), runDate: new Date(2020, 10, 9) };
		scopeFilter = { project: project._id, scenario: scenarioId, run: econRun.id };

		const count = await context.models.EconRunDataModel.countDocuments({ ...scopeFilter });

		const expectedResults = await populateGroupName(
			await context.models.EconRunDataModel.find({ comboName: 'default1', ...scopeFilter }).sort({
				_id: 1,
			}),
		);

		await expect(
			service.getEconRunData(0, count + 1, { id: 1 }, { comboName: ['default1'] }, project, scenarioId, econRun),
		).resolves.toStrictEqual({
			result: expectedResults.map(toApiEconRunData),
			hasNext: false,
			cursor: null,
		});
	});

	test('getEconRuns should ignore filters with invalid fields', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		scenarioId = Types.ObjectId('5e27305e4f59a9ec64eb576a');
		econRun = { id: Types.ObjectId('5f80f287d7e63537b90aa121'), runDate: new Date(2020, 10, 9) };
		scopeFilter = { project: project._id, scenario: scenarioId, run: econRun.id };

		const expectedResults = await populateGroupName(
			await context.models.EconRunDataModel.find({ ...scopeFilter })
				.sort({ _id: 1 })
				.limit(1),
		);

		await expect(
			service.getEconRunData(0, 1, { id: 1 }, { notEconRunDataField: ['test'] }, project, scenarioId, econRun),
		).resolves.toStrictEqual({
			result: expectedResults.map(toApiEconRunData),
			hasNext: true,
			cursor: expectedResults[expectedResults.length - 1]._id,
		});
	});

	test('getEconRuns should return cursor when skip value 0', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		scenarioId = Types.ObjectId('5e27305e4f59a9ec64eb576a');
		econRun = { id: Types.ObjectId('5f80f287d7e63537b90aa121'), runDate: new Date(2020, 10, 9) };
		scopeFilter = { project: project._id, scenario: scenarioId, run: econRun.id };

		const expectedResults = await populateGroupName(
			await context.models.EconRunDataModel.find({ ...scopeFilter })
				.sort({ _id: 1 })
				.limit(1),
		);

		await expect(service.getEconRunData(0, 1, { id: 1 }, {}, project, scenarioId, econRun)).resolves.toStrictEqual({
			result: expectedResults.map(toApiEconRunData),
			hasNext: true,
			cursor: expectedResults[expectedResults.length - 1]._id,
		});
	});

	test('getEconRunDataCount', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		scenarioId = Types.ObjectId('5e27305e4f59a9ec64eb576a');
		econRun = { id: Types.ObjectId('5f80f287d7e63537b90aa121'), runDate: new Date(2020, 10, 9) };
		scopeFilter = { project: project._id, scenario: scenarioId, run: econRun.id };
		let count = await context.models.EconRunDataModel.countDocuments({ ...scopeFilter });
		await expect(service.getEconRunDataCount({}, project, scenarioId, econRun)).resolves.toBe(count);

		count = await context.models.EconRunDataModel.countDocuments({ ...scopeFilter });
		await expect(
			service.getEconRunDataCount({ notEconRunDataField: ['test'] }, project, scenarioId, econRun),
		).resolves.toBe(count);
	});

	test('getById when id empty should return null', async () => {
		await expect(
			service.getById(Types.ObjectId(), { name: 'Test Project', _id: Types.ObjectId() }, Types.ObjectId(), {
				id: Types.ObjectId(),
				runDate: new Date(),
			}),
		).resolves.toBeNull();
	});

	test('getById when record not found should return null', async () => {
		await expect(
			service.getById(Types.ObjectId('5f80f287d7e63537b90aa324'), project, scenarioId, econRun),
		).resolves.toBeNull();
	});

	test('getById with econ group should return record with group name', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		scenarioId = Types.ObjectId('5e27305e4f59a9ec64eb576a');
		econRun = { id: Types.ObjectId('5f80f287d7e63537b90aa121'), runDate: new Date(2020, 10, 9) };
		scopeFilter = { project: project._id, scenario: scenarioId, run: econRun.id };

		const econRunFound = (await context.models.EconRunDataModel.findOne({
			_id: '5f80f29af286b2b3a6c0b473',
			...scopeFilter,
		})) as IEconRunData;

		const econGroupFound = await context.models.EconGroupModel.findOne({ _id: econRunFound.get('group') });

		econRunFound.groupName = econGroupFound?.name;

		await expect(
			service.getById(Types.ObjectId('5f80f29af286b2b3a6c0b473'), project, scenarioId, econRun),
		).resolves.toStrictEqual(toApiEconRunData(econRunFound));
	});

	test('getById with no econ group should return record without group name', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
		scenarioId = Types.ObjectId('5e27305e4f59a9ec64eb576a');
		econRun = { id: Types.ObjectId('5f80f287d7e63537b90aa121'), runDate: new Date(2020, 10, 9) };
		scopeFilter = { project: project._id, scenario: scenarioId, run: econRun.id };

		const econRunFound = (await context.models.EconRunDataModel.findOne({
			_id: '5f80f29af286b2b3a6c0b474',
			...scopeFilter,
		})) as IEconRunData;

		await expect(
			service.getById(Types.ObjectId('5f80f29af286b2b3a6c0b474'), project, scenarioId, econRun),
		).resolves.toStrictEqual(toApiEconRunData(econRunFound));
	});

	describe('getEconRunComboNames', () => {
		afterEach(() => {
			jest.clearAllMocks();
		});

		test('getEconRunComboNames when project not found should return null', async () => {
			project = { name: 'FAKE PROJECT', _id: Types.ObjectId('5f80f287d7e63537b90aa324') };
			scenarioId = Types.ObjectId('5e27305e4f59a9ec64eb576a');
			econRun = { id: Types.ObjectId('5f80f287d7e63537b90aa121'), runDate: new Date(2020, 10, 9) };
			await expect(service.getEconRunComboNames(project, scenarioId, econRun)).resolves.toBeNull();
		});

		test('getEconRunComboNames when scenarioId not found should return null', async () => {
			project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
			scenarioId = Types.ObjectId('5f80f287d7e63537b90aa324');
			econRun = { id: Types.ObjectId('5f80f287d7e63537b90aa121'), runDate: new Date(2020, 10, 9) };
			await expect(service.getEconRunComboNames(project, scenarioId, econRun)).resolves.toBeNull();
		});

		test('getEconRunComboNames when econRun not found should return null', async () => {
			project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
			scenarioId = Types.ObjectId('5e27305e4f59a9ec64eb576a');
			econRun = { id: Types.ObjectId('5f80f287d7e63537b90aa324'), runDate: new Date(1986, 10, 28) };
			await expect(service.getEconRunComboNames(project, scenarioId, econRun)).resolves.toBeNull();
		});

		it('should return distinct combo names', async () => {
			project = { name: 'Test Project', _id: Types.ObjectId('5e272bed4b97ed00132f2271') };
			scenarioId = Types.ObjectId('5e27305e4f59a9ec64eb576a');
			econRun = { id: Types.ObjectId('5f80f287d7e63537b90aa121'), runDate: new Date(2020, 10, 9) };

			const comboNames = (await context.models.EconRunDataModel.distinct('comboName', {
				project: project._id,
				scenario: scenarioId,
				run: econRun.id,
			})) as string[];

			const result = await service.getEconRunComboNames(project, scenarioId, econRun);

			expect(result).toEqual(comboNames);
		});
	});
});
