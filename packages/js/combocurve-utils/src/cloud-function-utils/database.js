// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const mongoose = require('mongoose');

let connection;

function openConnection(tenant) {
	if (!tenant) {
		throw new Error('Tenant missing, unable to find db info');
	}

	const { dbConnectionString } = tenant;
	connection = Promise.resolve(
		mongoose.createConnection(dbConnectionString, {
			autoIndex: false,
			useNewUrlParser: true,
			useCreateIndex: true,
			useFindAndModify: false,
		})
	);

	return connection;
}

async function closeConnection() {
	if (!connection) {
		return Promise.resolve();
	}
	return (await connection).close();
}

module.exports = { openConnection, closeConnection };
