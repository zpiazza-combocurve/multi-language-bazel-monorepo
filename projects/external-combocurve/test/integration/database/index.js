const mongoose = require('mongoose');

const connectToDb = (dbConnectionString) =>
	Promise.resolve(
		mongoose.createConnection(dbConnectionString, {
			useNewUrlParser: true,
			useCreateIndex: true,
			useFindAndModify: false,
			useUnifiedTopology: true,
		}),
	);

module.exports = {
	connectToDb,
};
