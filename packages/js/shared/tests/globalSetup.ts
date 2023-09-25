import fs from 'fs';
import { MongoMemoryServer } from 'mongodb-memory-server-global-4.2';
import path from 'path';

const MONGO_CONFIG_PATH = path.join(__dirname, 'mongoConfig.json');

const mongod = new MongoMemoryServer();

export = async function globalSetup() {
	if (mongod.state !== 'running') {
		await mongod.start();
	}

	const mongoConfig = {
		mongoUri: mongod.getUri('replace-me'),
	};

	fs.writeFileSync(MONGO_CONFIG_PATH, JSON.stringify(mongoConfig));

	// Set reference to mongod in order to close the server during teardown.
	global.__MONGOD__ = mongod;
};
