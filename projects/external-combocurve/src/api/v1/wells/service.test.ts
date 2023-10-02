import { Connection, Types } from 'mongoose';

import { callCloudFunction } from '@src/helpers/cloud-caller';
import config from '@src/config';
import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { IUpdate } from '@src/api/v1/fields';
import { IWell } from '@src/models/wells';

import { ApiContextV1 } from '../context';
import { IRecordStatus } from '../multi-status';

import { IReplace, readOnlyFields, toApiWell } from './fields';
import { CompanyWellService } from './service';

import { getTenantInfo } from '@test/tenant';
import { TestContext } from '@test/context';
import wells from '@test/fixtures/wells.json';

jest.mock('@src/helpers/cloud-caller');

let mongoUri: string;
let connection: Connection;
let service: CompanyWellService;
let context: ApiContextV1;

describe('v1/wells/service', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new TestContext(info, connection) as ApiContextV1;
		service = new CompanyWellService(context);

		await context.models.WellModel.bulkWrite(
			wells.map((item) => ({
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

	test('getWells', async () => {
		const count = await context.models.WellModel.countDocuments({});

		await expect(service.getWells({ skip: 0, take: 0, sort: { id: 1 } }, { company: true })).resolves.toStrictEqual(
			{
				result: [],
				hasNext: true,
				cursor: null,
			},
		);

		let results = await context.models.WellModel.find({ project: null }).sort({ _id: 1 });
		await expect(
			service.getWells({ skip: 0, take: count + 1, sort: { id: 1 } }, { company: true }),
		).resolves.toStrictEqual({
			result: results.map(toApiWell),
			hasNext: false,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.WellModel.find({ project: null })
			.sort({ _id: 1 })
			.skip(count - 1)
			.limit(1);
		await expect(
			service.getWells({ skip: count - 1, take: 1, sort: { id: 1 } }, { company: true }),
		).resolves.toStrictEqual({
			result: results.map(toApiWell),
			hasNext: false,
			cursor: null,
		});

		results = await context.models.WellModel.find({ api14: '42479393790000', project: null }).sort({ _id: 1 });
		await expect(
			service.getWells(
				{ skip: 0, take: count + 1, sort: { id: 1 }, filters: { api14: ['42479393790000'] } },
				{ company: true },
			),
		).resolves.toStrictEqual({
			result: results.map(toApiWell),
			hasNext: false,
			cursor: results[results.length - 1]._id,
		});

		results = await context.models.WellModel.find({ county: 'WEBB (TX)', project: null })
			.sort({ chosenID: -1 })
			.limit(1);
		await expect(
			service.getWells(
				{ skip: 0, take: 1, sort: { chosenID: -1 }, filters: { county: ['WEBB (TX)'] } },
				{ company: true },
			),
		).resolves.toStrictEqual({
			result: results.map(toApiWell),
			hasNext: true,
			cursor: null,
		});

		results = await context.models.WellModel.find({ project: null }).sort({ _id: 1 }).limit(1);
		await expect(
			service.getWells(
				{ skip: 0, take: 1, sort: { id: 1 }, filters: { notWellField: ['test'] } },
				{ company: true },
			),
		).resolves.toStrictEqual({
			result: results.map(toApiWell),
			hasNext: true,
			cursor: results[results.length - 1]._id,
		});
	});

	test('getWellsCount', async () => {
		let count = await context.models.WellModel.countDocuments({ project: null });
		await expect(service.getWellsCount({}, { company: true })).resolves.toBe(count);

		count = await context.models.WellModel.countDocuments({ county: 'WEBB (TX)', project: null });
		await expect(service.getWellsCount({ county: ['WEBB (TX)'] }, { company: true })).resolves.toBe(count);

		count = await context.models.WellModel.countDocuments({ project: null });
		await expect(service.getWellsCount({ notWellField: ['test'] }, { company: true })).resolves.toBe(count);
	});

	test('getById', async () => {
		await expect(service.getById(Types.ObjectId(), { company: true })).resolves.toBeNull();

		const well = (await context.models.WellModel.findOne({ _id: '5e272d38b78910dd2a1bd691' })) as IWell;
		await expect(
			service.getById(Types.ObjectId('5e272d38b78910dd2a1bd691'), { company: true }),
		).resolves.toStrictEqual(toApiWell(well));

		await expect(
			service.getById(Types.ObjectId('5e272d38b78910dd2a1bd693'), { company: true }),
		).resolves.toBeNull();
	});

	test('getExistingChosenIds', async () => {
		await expect(service.getExistingChosenIds([])).resolves.toStrictEqual([]);

		const wells = await context.models.WellModel.find({
			chosenID: { $in: ['37015204522387', '37015204513456'] },
			project: null,
			dataSource: 'other',
		});
		await expect(service.getExistingChosenIds(wells)).resolves.toStrictEqual(wells.map(({ chosenID }) => chosenID));

		const wells2 = await context.models.WellModel.find({
			chosenID: { $in: ['42479392700000', '42479393790000'] },
			project: null,
			dataSource: 'di',
		});
		await expect(service.getExistingChosenIds(wells2)).resolves.toStrictEqual(
			wells2.map(({ chosenID }) => chosenID).sort(),
		);
	});

	test('getMatchingWells', async () => {
		await expect(service.getMatchingWells([])).resolves.toStrictEqual([]);

		let wells = await context.models.WellModel.find({
			chosenID: { $in: ['37015204522387', '37015204513456'] },
			project: null,
			dataSource: 'other',
		});
		await expect(service.getMatchingWells(wells)).resolves.toStrictEqual(wells);

		wells = await context.models.WellModel.find({
			chosenID: { $in: ['42479393790000', '42479392700000'] },
			project: null,
			dataSource: 'di',
		});
		await expect(service.getMatchingWells(wells)).resolves.toStrictEqual(wells);

		wells = await context.models.WellModel.find(
			{
				chosenID: { $in: ['37015204522387', '42477309850000'] },
				project: null,
				dataSource: 'di',
			},
			'dataSource chosenID county',
		);
		await expect(
			service.getMatchingWells(wells, { projection: ['dataSource', 'chosenID', 'county'], limit: 1 }),
		).resolves.toStrictEqual([wells[0]]);
	});

	test('getMatchingWellsById', async () => {
		const companyWellIds = ['5e272d38b78910dd2a1bd691', '5e272d38b78910dd2a1bd692'].map(Types.ObjectId);
		const projectWellIds = ['5e272d38b78910dd2a1bd693'].map(Types.ObjectId);
		const allIds = [...companyWellIds, ...projectWellIds];

		let wells = await context.models.WellModel.find({
			_id: { $in: companyWellIds },
		});
		await expect(service.getMatchingWellsById(companyWellIds)).resolves.toStrictEqual(wells);

		wells = await context.models.WellModel.find({
			_id: { $in: companyWellIds },
		});
		await expect(service.getMatchingWellsById(allIds)).resolves.toStrictEqual(wells);

		wells = await context.models.WellModel.find(
			{
				_id: { $in: companyWellIds },
			},
			'chosenID county',
		).limit(1);
		await expect(
			service.getMatchingWellsById(companyWellIds, { projection: ['chosenID', 'county'], limit: 1 }),
		).resolves.toStrictEqual(wells);
	});

	test('getMatchingWellsMixed', async () => {
		const getChosenId = ({ dataSource, chosenID }: IWell) => ({ dataSource, chosenID });
		const getApi14 = ({ dataSource, api14 }: IWell) => ({ dataSource, api14 });
		const getIdAndApi14 = ({ _id, dataSource, api14 }: IWell) => ({ id: _id, dataSource, api14 });

		await expect(service.getMatchingWellsMixed([])).resolves.toStrictEqual([]);

		let wells = await context.models.WellModel.find({
			chosenID: { $in: ['37015204522387', '37015204513456'] },
			project: null,
			dataSource: 'other',
		});
		await expect(service.getMatchingWellsMixed(wells.map(getChosenId))).resolves.toStrictEqual(wells);

		wells = await context.models.WellModel.find({
			chosenID: { $in: ['42479393790000', '42479392700000'] },
			project: null,
			dataSource: 'di',
		});
		await expect(service.getMatchingWellsMixed(wells.map(getApi14))).resolves.toStrictEqual(wells);

		wells = await context.models.WellModel.find({
			chosenID: { $in: ['42479393790000', '42479392700000'] },
			project: null,
			dataSource: 'di',
		});
		await expect(service.getMatchingWellsMixed(wells.map(getChosenId))).resolves.toStrictEqual(wells);

		wells = await context.models.WellModel.find(
			{
				chosenID: { $in: ['37015204522387', '42477309850000'] },
				project: null,
				dataSource: 'di',
			},
			'dataSource api14 county',
		);
		await expect(
			service.getMatchingWellsMixed(wells.map(getApi14), {
				projection: ['dataSource', 'api14', 'county'],
				limit: 1,
			}),
		).resolves.toStrictEqual([wells[0]]);

		const companyWellIds = ['5e272d38b78910dd2a1bd691', '5e272d38b78910dd2a1bd692'].map(Types.ObjectId);
		const projectWellIds = ['5e272d38b78910dd2a1bd693'].map(Types.ObjectId);
		const allIds = [...companyWellIds, ...projectWellIds];

		const companyWells = await context.models.WellModel.find({ _id: { $in: companyWellIds } });
		const allWells = await context.models.WellModel.find({ _id: { $in: allIds } });

		await expect(service.getMatchingWellsMixed(companyWells.map(getIdAndApi14))).resolves.toStrictEqual(
			companyWells,
		);

		await expect(service.getMatchingWellsMixed(allWells.map(getIdAndApi14))).resolves.toStrictEqual(companyWells);

		wells = await context.models.WellModel.find(
			{
				_id: { $in: companyWellIds },
			},
			'chosenID county',
		);
		await expect(
			service.getMatchingWellsMixed(companyWells.map(getIdAndApi14), {
				projection: ['chosenID', 'county'],
				limit: 1,
			}),
		).resolves.toStrictEqual([wells[0]]);

		const [firstWell, secondWell] = companyWells;
		await expect(
			service.getMatchingWellsMixed([getIdAndApi14(firstWell), getApi14(secondWell)]),
		).resolves.toStrictEqual([firstWell, secondWell]);
	});

	test('toDbWell', () => {
		const removeId = (well: IWell) => {
			well.set('_id', null);
		};

		let well = new context.models.WellModel({});
		removeId(well);
		let result = service.toDbWell({});
		removeId(result);
		expect(result).toStrictEqual(well);

		well = new context.models.WellModel({
			dataSource: 'di',
			dataPool: 'external',
			api14: '11111111111111',
			chosenID: '11111111111111',
			chosenKeyID: 'api14',
		});
		removeId(well);
		result = service.toDbWell({
			dataSource: 'di',
			api14: '11111111111111',
		});
		removeId(result);
		expect(result).toStrictEqual(well);

		well = new context.models.WellModel({
			dataSource: 'internal',
			dataPool: 'internal',
			chosenID: '11111111111111',
			chosenKeyID: 'chosenID',
		});
		removeId(well);
		result = service.toDbWell({
			dataSource: 'internal',
			chosenID: '11111111111111',
		});
		removeId(result);
		expect(result).toStrictEqual(well);

		well = new context.models.WellModel({
			dataSource: 'di',
			dataPool: 'external',
			chosenID: '11111111111111',
			api14: '22222222222222',
			chosenKeyID: 'chosenID',
		});
		removeId(well);
		result = service.toDbWell({
			dataSource: 'di',
			chosenID: '11111111111111',
			api14: '22222222222222',
		});
		removeId(result);
		expect(result).toStrictEqual(well);

		well = new context.models.WellModel({
			dataSource: 'internal',
			dataPool: 'internal',
			chosenID: '11111111111111',
			chosenKeyID: 'SSN',
		});
		removeId(well);
		result = service.toDbWell({
			dataSource: 'internal',
			dataPool: 'internal',
			chosenID: '11111111111111',
			chosenKeyID: 'SSN',
		});
		removeId(result);
		expect(result).toStrictEqual(well);

		const [readOnlyField1, readOnlyField2] = readOnlyFields;
		well = new context.models.WellModel({
			dataSource: 'di',
			dataPool: 'external',
			api14: '11111111111111',
			chosenID: '11111111111111',
			chosenKeyID: 'api14',
		});
		removeId(well);
		result = service.toDbWell({
			dataSource: 'di',
			dataPool: 'external',
			api14: '11111111111111',
			[readOnlyField1]: 'test1',
			[readOnlyField2]: 'test2',
		});
		removeId(result);
		expect(result).toStrictEqual(well);
	});

	test('create', async () => {
		let result = await service.create([]);
		expect(callCloudFunction).not.toHaveBeenCalled();
		expect(result).toStrictEqual({ results: [] });

		let wells = await context.models.WellModel.find({
			project: null,
			dataSource: 'other',
		});
		let creates: Array<IWell | undefined> = wells;
		result = await service.create(creates);

		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: config.externalApiImportUrl,
			body: {
				data: { dataSource: 'other', project: null, wells },
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
		result = await service.create(wellsToCreate);

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

		wells = await context.models.WellModel.find({ project: null, dataSource: 'other' });
		creates = [...wells];
		creates.splice(-1, 0, undefined);
		result = await service.create(creates);

		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: config.externalApiImportUrl,
			body: {
				data: { dataSource: 'other', project: null, wells },
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
		let result = await service.replaceWells([]);
		expect(callCloudFunction).not.toHaveBeenCalled();
		expect(result).toStrictEqual({ results: [] });

		let wells = await context.models.WellModel.find({ project: null, dataSource: 'other' });
		let replaces: Array<IReplace | undefined> = wells.map((w) => ({ id: w.id, update: w, remove: [] }));
		let updatedTimestamp = new Date((wells[0]?.updatedAt?.getTime() ?? 0) - 1000);
		result = await service.replaceWells(replaces, null, updatedTimestamp);

		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: config.externalApiImportUrl,
			body: {
				data: { dataSource: 'other', project: null, replaces: replaces },
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

		wells = await context.models.WellModel.find({ project: null, dataSource: 'other' });
		replaces = wells.map((w) => ({ id: w.id, update: w, remove: [] }));
		result = await service.replaceWells(replaces);

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

		wells = await context.models.WellModel.find({ project: null, dataSource: 'other' });
		replaces = wells.map((w) => ({ id: w.id, update: w, remove: [] }));
		replaces.splice(-1, 0, undefined);
		updatedTimestamp = new Date((wells[0]?.updatedAt?.getTime() ?? 0) - 1000);
		result = await service.replaceWells(replaces, null, updatedTimestamp);

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
		const replace = {
			id: Types.ObjectId('5e272d38b78910dd2a1bd691'),
			update: { api14: '42479393790000' },
			remove: [],
		};

		service.replaceWells = jest.fn(() => Promise.resolve({ results: [] }));

		await service.replaceWell(replace);
		expect(service.replaceWells).toHaveBeenCalledWith([replace], null);
	});

	test('updateWells', async () => {
		let result = await service.updateWells([]);
		expect(callCloudFunction).not.toHaveBeenCalled();
		expect(result).toStrictEqual({ results: [] });

		let wells = await context.models.WellModel.find({ project: null, dataSource: 'other' });
		let updates: Array<IUpdate<IWell> | undefined> = wells.map((w) => ({ id: w.id, update: w, remove: [] }));
		let updatedTimestamp = new Date((wells[0]?.updatedAt?.getTime() ?? 0) - 1000);
		result = await service.updateWells(updates, null, updatedTimestamp);

		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: config.externalApiImportUrl,
			body: {
				data: { dataSource: 'other', project: null, replaces: updates, setDefaultValues: false },
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

		wells = await context.models.WellModel.find({ project: null, dataSource: 'other' });
		updates = wells.map((w) => ({ id: w.id, update: w, remove: [] }));
		result = await service.updateWells(updates);

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

		wells = await context.models.WellModel.find({ project: null, dataSource: 'other' });
		updates = wells.map((w) => ({ id: w.id, update: w, remove: [] }));
		updates.splice(-1, 0, undefined);
		updatedTimestamp = new Date((wells[0]?.updatedAt?.getTime() ?? 0) - 1000);
		result = await service.updateWells(updates, null, updatedTimestamp);

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
		const update = {
			id: Types.ObjectId('5e272d38b78910dd2a1bd691'),
			update: { api14: '42479393790000', dataSource: 'di' },
			remove: [],
		};

		service.updateWells = jest.fn(() => Promise.resolve({ results: [] }));

		await service.updateWell(update as IUpdate<IWell>);
		expect(service.updateWells).toHaveBeenCalledWith([update], null);
	});

	test('deleteWells', async () => {
		const callResponse = { successCount: 10 };
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(callCloudFunction as any).mockImplementation(() => callResponse);

		const deleteBaseUrl = `${config.wellServiceUrl}/api/wells/delete`;

		let ids = (await context.models.WellModel.find({ project: null }, { _id: 1 })).map(({ _id }) => _id.toString());

		let result = await service.deleteWells({});
		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: deleteBaseUrl,
			body: { ids },
			headers: context.headers,
		});
		expect(result).toStrictEqual(10);

		ids = (
			await context.models.WellModel.find(
				{ dataSource: 'internal', chosenID: '22222222222222', project: null },
				{ _id: 1 },
			)
		).map(({ _id }) => _id.toString());

		expect(ids).toStrictEqual([]);
		result = await service.deleteWells({
			dataSource: ['internal'],
			chosenID: ['22222222222222'],
		});
		expect(callCloudFunction).toHaveBeenCalledTimes(1);
	});

	test('deleteWellById', async () => {
		const callResponse = { successCount: 1 };
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(callCloudFunction as any).mockImplementation(() => callResponse);

		const deleteBaseUrl = `${config.wellServiceUrl}/api/wells/delete`;

		const wellId = Types.ObjectId('5e6f9e10ce8c14e6f180f705');

		const result = await service.deleteWellById(wellId);
		expect(callCloudFunction).toHaveBeenLastCalledWith({
			fullUrl: deleteBaseUrl,
			body: { ids: [wellId.toString()] },
			headers: context.headers,
		});
		expect(result).toStrictEqual(1);
	});
});
