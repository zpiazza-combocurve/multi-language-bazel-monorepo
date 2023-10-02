import mongoose, { Connection } from 'mongoose';

import config from './config';
import logger from './helpers/logger';

export const connectToDb = (dbConnectionString: string, tenantName = 'Unknown'): Promise<Connection> => {
	const logMetadata = {
		tenant: tenantName,
	};

	let connection: Connection;

	try {
		connection = mongoose.createConnection(dbConnectionString, {
			autoIndex: config.devEnv,
			useNewUrlParser: true,
			useCreateIndex: true,
			useFindAndModify: false,
			useUnifiedTopology: true,
			serverSelectionTimeoutMS: config.databaseTimeoutSeconds * 1000,
			connectTimeoutMS: config.databaseTimeoutSeconds * 1000,
			socketTimeoutMS: config.databaseTimeoutSeconds * 1000,
		});
	} catch (error) {
		logger.error('Unable to establish initial connection to mongo database', { ...logMetadata, error });
		throw error;
	}

	if (config.environment == 'production') {
		connection.on('connected', () => {
			logger.info('Connected to mongo', logMetadata);
		});

		connection.on('disconnected', () => {
			logger.info('Disconnected from mongo', logMetadata);
		});

		connection.on('close', () => {
			logger.info('Connection to mongo closed', logMetadata);
			connection.removeAllListeners();
		});

		connection.on('error', (error) => {
			logger.error('Mongo connection error', { ...logMetadata, error });
		});
	}

	const closeConnection = function () {
		connection.close();
	};

	process.on('exit', closeConnection).on('SIGINT', closeConnection).on('SIGTERM', closeConnection);

	return Promise.resolve(connection);
};
