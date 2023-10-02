/* eslint-disable @typescript-eslint/no-explicit-any */
import { Connection } from 'mongoose';

import { connectToDb } from '@src/database';
import { getMemoryMongoUri } from '@src/test/setup';

import { ApiContextV1 } from '../context';

import { CustomColumnService, CustomHeadersCollections } from './service';
import { toApiSingleProductionCustomColumn } from './fields/single-production-custom-columns-fields';
import { toApiWellCustomColumn } from './fields/wells-custom-columns-fields';

import customHeaderConfiguration from '@test/fixtures/custom-header-configuration.json';
import { getTenantInfo } from '@test/tenant';
import { TestContext } from '@test/context';

let mongoUri: string;
let connection: Connection;
let service: CustomColumnService;
let context: ApiContextV1;

describe('v1/custom-columns/service', () => {
	beforeAll(async () => {
		mongoUri = await getMemoryMongoUri();

		const info = await getTenantInfo(mongoUri);
		connection = await connectToDb(mongoUri);
		context = new TestContext(info, connection) as ApiContextV1;
		service = new CustomColumnService(context);

		await context.models.CustomHeaderConfigurationModel.bulkWrite(
			customHeaderConfiguration.map((item) => ({
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
	describe('getCustomColumns', () => {
		it.each([['wells'], ['daily-productions'], ['monthly-productions']])(
			'getCustomColumns returns correct custom-columns',
			async (collection) => {
				const collectionCustomColumns = await service.getCustomColumns(collection as CustomHeadersCollections);
				let expectedObject = null;
				const objectToCompare = (customHeaderConfiguration as Record<string, any>[])[0][collection];
				if (collection === 'wells') {
					expectedObject = toApiWellCustomColumn(objectToCompare);
				} else {
					expectedObject = toApiSingleProductionCustomColumn(objectToCompare);
				}
				expect(collectionCustomColumns).toStrictEqual(expectedObject);
			},
		);
	});
});
