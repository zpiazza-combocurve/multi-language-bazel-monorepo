import { IDAL } from '@combocurve/dal-client';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { BaseContext } from '../src/base-context';
import { connectToDb } from '../src/database';
import { getContextTenantInfoFromHeaders, getRequestTenantFromHeaders } from '../src/helpers/tenant';
import { mockExpress } from './express-mocks';
import { getTestHeaders } from './headers';

const MONGO_CONFIG_PATH = path.join(__dirname, 'mongoConfig.json');

const localhost = '127.0.0.1';

export default class TestDbManager {
	context!: BaseContext;
	db!: BaseContext['db'];
	connection!: mongoose.Connection;

	async start() {
		const { mongoUri } = JSON.parse(fs.readFileSync(MONGO_CONFIG_PATH, 'utf-8'));
		global.__MONGO_URI__ = mongoUri.replace('replace-me', uuidv4());
		const { req } = mockExpress();
		const headers = getTestHeaders();
		headers.dbConnectionString = global.__MONGO_URI__;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		req.headers = headers as any;
		this.connection = await connectToDb(global.__MONGO_URI__);
		const tenant = await getContextTenantInfoFromHeaders(getRequestTenantFromHeaders(req));
		this.context = new BaseContext({
			tenant,
			db: this.connection,
			dalClient: jest.fn() as unknown as IDAL,
		});
		this.db = this.context.db;
	}

	async stop() {
		if (this.db?.host === localhost) {
			await this.db?.dropDatabase();
			await this.db?.close();
			await mongoose.disconnect();
		}
	}

	async cleanup() {
		if (this.db?.host === localhost) {
			const collections = this?.db?.collections ?? {};

			for (const collection of Object.values(collections as mongoose.Collection[])) {
				await collection.deleteMany({});
			}
		}
	}
}
