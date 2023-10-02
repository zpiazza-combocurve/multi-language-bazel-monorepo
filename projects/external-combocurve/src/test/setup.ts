import fs from 'fs';
import { log } from 'console';
import { MongoMemoryServer } from 'mongodb-memory-server-global';

const setup = async (): Promise<void> => {
	log('JEST Setup');

	const mongoServer = await MongoMemoryServer.create();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const aux = global as any;

	aux.__MONGOD__ = mongoServer;
	await fs.writeFileSync('./memoryMongoConfig.txt', mongoServer.getUri(), 'utf8');
};

let mongoUri: string | undefined = undefined;

export async function getMemoryMongoUri(): Promise<string> {
	if (mongoUri === undefined) {
		mongoUri = await fs.readFileSync('./memoryMongoConfig.txt', 'utf8');
	}

	return mongoUri;
}

export default setup;
