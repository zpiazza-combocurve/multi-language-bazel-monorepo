import { Connection, Types } from 'mongoose';
import { omit } from 'lodash';
import { StatusCodes } from 'http-status-codes';

import { ApiContextV1 } from '@src/api/v1/context';
import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';
import { IOwnershipQualifier } from '@src/models/econ/ownership-qualifiers';
// import config from '@src/config';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { postApi } from '@src/helpers/request';

import { IRecordStatus } from '../multi-status';

import { OwnershipQualifierService } from './service';

import { getTenantInfo } from '@test/tenant';
import ownershipQualifiers from '@test/fixtures/ownership-qualifiers.json';
import { TestContext } from '@test/context';

const { CREATED, OK } = StatusCodes;

jest.mock('@src/helpers/request');

let mongoUri: string;
let connection: Connection;
let service: OwnershipQualifierService;
let context: ApiContextV1;

describe('v1/ownership-qualifiers/service', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new TestContext(info, connection) as ApiContextV1;
		service = new OwnershipQualifierService(context);

		await context.models.OwnershipQualifierModel.bulkWrite(
			ownershipQualifiers.map((item) => ({
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

	test('getOwnershipQualifiers', async () => {
		await expect(service.getOwnershipQualifiers(0, 0, { well: 1 }, {})).resolves.toStrictEqual({
			result: [],
			hasNext: true,
			cursor: null,
		});

		await expect(service.getOwnershipQualifiers(0, 1, { well: -1 }, {})).resolves.toStrictEqual({
			result: [
				{
					id: Types.ObjectId('60ad509f494b590ec8c40d2c'),
					well: Types.ObjectId('5e272d38b78910dd2a1bd691'),
					chosenID: '42479393790000',
					dataSource: 'di',
					qualifierKey: 'q1',
					ownership: {
						name: 't1',
						initialOwnership: {
							workingInterest: 100,
							netProfitInterestType: 'expense',
							netProfitInterest: 0,
							netRevenueInterest: 75,
							leaseNetRevenueInterest: 75,
							oilNetRevenueInterest: null,
							gasNetRevenueInterest: null,
							nglNetRevenueInterest: null,
							dripCondensateNetRevenueInterest: null,
						},
						firstReversion: null,
						secondReversion: null,
						thirdReversion: null,
						fourthReversion: null,
						fifthReversion: null,
						sixthReversion: null,
						seventhReversion: null,
						eighthReversion: null,
						ninthReversion: null,
						tenthReversion: null,
					},
					createdAt: new Date('2021-10-19T20:16:09.053Z'),
					updatedAt: new Date('2021-10-19T20:16:09.053Z'),
				},
			],
			hasNext: true,
			cursor: null,
		});

		await expect(service.getOwnershipQualifiers(1, 1, { id: -1 }, {})).resolves.toStrictEqual({
			result: [
				{
					id: Types.ObjectId('60ad4f6d79160c2f7808f2e0'),
					well: Types.ObjectId('5e272d38b78910dd2a1bd691'),
					chosenID: '42479393790000',
					dataSource: 'di',
					qualifierKey: 'q2',
					ownership: {
						name: 't2',
						initialOwnership: {
							workingInterest: 100,
							netProfitInterestType: 'expense',
							netProfitInterest: 0,
							netRevenueInterest: 100,
							leaseNetRevenueInterest: 75,
							oilNetRevenueInterest: 4,
							gasNetRevenueInterest: null,
							nglNetRevenueInterest: null,
							dripCondensateNetRevenueInterest: null,
						},
						firstReversion: {
							reversionType: 'Irr',
							reversionValue: 2,
							balance: 'gross',
							includeNetProfitInterest: 'yes',
							workingInterest: 100,
							netRevenueInterest: 100,
							leaseNetRevenueInterest: 75,
							netProfitInterest: 0,
							oilNetRevenueInterest: null,
							gasNetRevenueInterest: null,
							nglNetRevenueInterest: null,
							dripCondensateNetRevenueInterest: null,
						},
						secondReversion: {
							reversionType: 'PayoutWithoutInvestment',
							reversionValue: 4,
							balance: 'gross',
							includeNetProfitInterest: 'yes',
							workingInterest: 100,
							netRevenueInterest: 100,
							leaseNetRevenueInterest: 75,
							netProfitInterest: 0,
							oilNetRevenueInterest: null,
							gasNetRevenueInterest: null,
							nglNetRevenueInterest: null,
							dripCondensateNetRevenueInterest: null,
						},
						thirdReversion: {
							reversionType: 'UndiscRoi',
							reversionValue: 3,
							balance: 'gross',
							includeNetProfitInterest: 'yes',
							workingInterest: 100,
							netRevenueInterest: 100,
							leaseNetRevenueInterest: 75,
							netProfitInterest: 0,
							oilNetRevenueInterest: null,
							gasNetRevenueInterest: null,
							nglNetRevenueInterest: null,
							dripCondensateNetRevenueInterest: null,
						},
						fourthReversion: null,
						fifthReversion: null,
						sixthReversion: null,
						seventhReversion: null,
						eighthReversion: null,
						ninthReversion: null,
						tenthReversion: null,
					},
					createdAt: new Date('2021-10-19T20:16:09.053Z'),
					updatedAt: new Date('2021-10-19T20:16:09.053Z'),
				},
			],
			hasNext: false,
			cursor: Types.ObjectId('60ad4f6d79160c2f7808f2e0'),
		});
	});

	test('create', async () => {
		let result = await service.create([]);
		expect(postApi).not.toHaveBeenCalled();
		expect(result).toStrictEqual({ results: [] });

		let ownershipQualifiers = await context.models.OwnershipQualifierModel.find({}).lean();
		let creates: Array<IOwnershipQualifier | undefined> = ownershipQualifiers.map(
			(o) =>
				({
					...o,
					_id: Types.ObjectId(),
				}) as IOwnershipQualifier,
		);

		result = await service.create(creates);
		expect(postApi).toHaveBeenLastCalledWith(
			`/cc-to-cc/econ-function-to-option`,
			{
				assumption_key: 'ownership_reversion',
				econ_functions: ownershipQualifiers.map(({ ownership }) => ownership.econ_function),
			},
			3,
		);

		expect(result).toStrictEqual({
			results: ownershipQualifiers.map(({ well, qualifierKey }) => ({
				status: 'Created',
				code: CREATED,
				well: well.toString(),
				qualifierKey,
			})),
		});

		ownershipQualifiers = await context.models.OwnershipQualifierModel.find({}).lean();
		creates = ownershipQualifiers.map(
			(o) =>
				({
					...o,
					_id: Types.ObjectId(),
				}) as IOwnershipQualifier,
		);
		creates.splice(-1, 0, undefined);

		result = await service.create(creates);
		expect(postApi).toHaveBeenLastCalledWith(
			`/cc-to-cc/econ-function-to-option`,
			{
				assumption_key: 'ownership_reversion',
				econ_functions: ownershipQualifiers.map(({ ownership }) => ownership.econ_function),
			},
			3,
		);

		const expectResults: Array<IRecordStatus | undefined> = ownershipQualifiers.map(({ well, qualifierKey }) => ({
			status: 'Created',
			code: CREATED,
			well: well.toString(),
			qualifierKey,
		}));
		expectResults.splice(-1, 0, undefined);
		expect(result).toStrictEqual({
			results: expectResults,
		});
	});

	test('upsert', async () => {
		let result = await service.upsert([]);
		expect(postApi).not.toHaveBeenCalled();
		expect(result).toStrictEqual({ results: [] });

		let ownershipQualifiers = await context.models.OwnershipQualifierModel.find({}).lean();
		let ownershipQualifiersWithoutId: Array<IOwnershipQualifier | undefined> = ownershipQualifiers.map(
			(o) => omit(o, '_id') as IOwnershipQualifier,
		);

		result = await service.upsert(ownershipQualifiersWithoutId);
		expect(postApi).toHaveBeenLastCalledWith(
			`/cc-to-cc/econ-function-to-option`,
			{
				assumption_key: 'ownership_reversion',
				econ_functions: ownershipQualifiers.map(({ ownership }) => ownership.econ_function),
			},
			3,
		);

		expect(result).toStrictEqual({
			results: ownershipQualifiers.map(({ well, qualifierKey }) => ({
				status: 'OK',
				code: OK,
				well: well.toString(),
				qualifierKey,
			})),
		});

		ownershipQualifiers = await context.models.OwnershipQualifierModel.find({}).lean();
		ownershipQualifiersWithoutId = ownershipQualifiers.map((o) => omit(o, '_id') as IOwnershipQualifier);
		ownershipQualifiersWithoutId.splice(-1, 0, undefined);

		result = await service.upsert(ownershipQualifiersWithoutId);
		expect(postApi).toHaveBeenLastCalledWith(
			`/cc-to-cc/econ-function-to-option`,
			{
				assumption_key: 'ownership_reversion',
				econ_functions: ownershipQualifiers.map(({ ownership }) => ownership.econ_function),
			},
			3,
		);

		const expectResults: Array<IRecordStatus | undefined> = ownershipQualifiers.map(({ well, qualifierKey }) => ({
			status: 'OK',
			code: OK,
			well: well.toString(),
			qualifierKey,
		}));
		expectResults.splice(-1, 0, undefined);
		expect(result).toStrictEqual({
			results: expectResults,
		});
	});
});
