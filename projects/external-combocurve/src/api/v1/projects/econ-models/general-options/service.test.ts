import { Connection, Types } from 'mongoose';

import { GENERAL_OPTIONS_KEY, IGeneralOptions } from '@src/models/econ/general-options';
import { ApiContextV1 } from '@src/api/v1/context';
import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { postApi } from '@src/helpers/request';

import { BaseProjectResolved } from '../../fields';

import { GeneralOptionsService } from './service';
import { getRequestFromDocument } from './fields/econ-function';

import assumptions from '@test/fixtures/assumptions.json';
import { getTenantInfo } from '@test/tenant';
import { TestContext } from '@test/context';

jest.mock('@src/helpers/request');

const assumptionKey = GENERAL_OPTIONS_KEY;

let connection: Connection;
let service: GeneralOptionsService;
let context: ApiContextV1;
let project: BaseProjectResolved;
let projectScopeFilter;

describe('v1/projects/:projectId/econ-models/general-options/service', () => {
	beforeAll(async () => {
		const uri = await getMemoryMongoUri();
		const info = await getTenantInfo(uri);

		connection = await connectToDb(uri);
		context = new TestContext(info, connection) as ApiContextV1;
		service = new GeneralOptionsService(context);

		await context.models.AssumptionModel.bulkWrite(
			assumptions.map((item) => ({
				replaceOne: {
					filter: { _id: item._id },
					replacement: item,
					upsert: true,
				},
			})),
		);
	});
	beforeEach(() => {
		postApi.mockClear();
	});
	afterAll(async () => {
		await connection.close();
	});

	test('getPaginated', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('64500b6ff2ddce00213ee0b7') };
		projectScopeFilter = { project: project._id };

		const count = await context.models.AssumptionModel.countDocuments({ assumptionKey, ...projectScopeFilter });

		await expect(service.getPaginated(0, 0, { id: 1 }, {}, project)).resolves.toStrictEqual({
			result: [],
			hasNext: true,
			cursor: null,
		});

		let results = await context.models.AssumptionModel.find({ assumptionKey, ...projectScopeFilter });
		await expect(service.getPaginated(0, count + 1, {}, {}, project)).resolves.toStrictEqual({
			result: results.map((r) => getRequestFromDocument(r as IGeneralOptions)),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.AssumptionModel.find({ assumptionKey, ...projectScopeFilter })
			.sort({ _id: 1 })
			.skip(count - 1)
			.limit(1);
		await expect(service.getPaginated(count - 1, 1, { id: 1 }, {}, project)).resolves.toStrictEqual({
			result: results.map((r) => getRequestFromDocument(r as IGeneralOptions)),
			hasNext: false,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.AssumptionModel.find({ assumptionKey, ...projectScopeFilter })
			.sort({ name: -1 })
			.skip(count - 1)
			.limit(1);
		await expect(service.getPaginated(count - 1, 1, { name: -1 }, {}, project)).resolves.toStrictEqual({
			result: results.map((r) => getRequestFromDocument(r as IGeneralOptions)),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.AssumptionModel.find({ name: 'test1', assumptionKey, ...projectScopeFilter });
		await expect(service.getPaginated(0, count + 1, {}, { name: ['test1'] }, project)).resolves.toStrictEqual({
			result: results.map((r) => getRequestFromDocument(r as IGeneralOptions)),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.AssumptionModel.find({ unique: true, assumptionKey, ...projectScopeFilter });
		await expect(service.getPaginated(0, count + 1, {}, { unique: ['true'] }, project)).resolves.toStrictEqual({
			result: results.map((r) => getRequestFromDocument(r as IGeneralOptions)),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.AssumptionModel.find({ assumptionKey, ...projectScopeFilter })
			.sort({ _id: 1 })
			.limit(1);
		await expect(
			service.getPaginated(0, 1, { id: 1 }, { notEscalationField: ['test'] }, project),
		).resolves.toStrictEqual({
			result: results.map((r) => getRequestFromDocument(r as IGeneralOptions)),
			hasNext: true,
			cursor: results[results.length - 1]._id,
		});
	});

	test('getCount', async () => {
		project = { name: 'Test Project', _id: Types.ObjectId('64500b6ff2ddce00213ee0b7') };
		projectScopeFilter = { project: project._id };

		let count = await context.models.AssumptionModel.countDocuments({ assumptionKey, ...projectScopeFilter });
		await expect(service.getCount({}, project)).resolves.toBe(count);

		count = await context.models.AssumptionModel.countDocuments({
			name: 'test1',
			assumptionKey,
			...projectScopeFilter,
		});
		await expect(service.getCount({ name: ['test1'] }, project)).resolves.toBe(count);

		count = await context.models.AssumptionModel.countDocuments({
			unique: true,
			assumptionKey,
			...projectScopeFilter,
		});
		await expect(service.getCount({ unique: ['true'] }, project)).resolves.toBe(count);
	});
});
