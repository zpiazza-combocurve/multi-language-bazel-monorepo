import { Connection } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-global';

import { connectToDb } from './database';

let mongoServer: MongoMemoryServer;
let mongoUri: string;

describe('database', () => {
	beforeAll(async () => {
		mongoServer = await MongoMemoryServer.create();
		mongoUri = mongoServer.getUri();
	});

	afterAll(async () => {
		await mongoServer.stop();
	});

	test('connectToDb', async () => {
		const connection = await connectToDb(mongoUri);
		expect(connection).toBeInstanceOf(Connection);
		await connection.close();
	});
});
