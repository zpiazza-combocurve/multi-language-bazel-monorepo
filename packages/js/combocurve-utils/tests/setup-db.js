// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { MongoClient } = require('mongodb');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { MongoMemoryServer } = require('mongodb-memory-server-global-4.2');

module.exports = async () => {
	const mongod = await MongoMemoryServer.create();
	const uri = await mongod.getUri();

	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	await client.connect();

	const db = client.db('test');

	return { db, client, mongod };
};
