import mongoose, { Connection } from 'mongoose';

import config from './config';

export const connectToDb = (dbConnectionString: string): Promise<Connection> =>
	Promise.resolve(
		// NOTE: take a look at `useDb()` which helps with connection pool sharing
		// across multiple databases on the same cluster
		mongoose.createConnection(dbConnectionString, {
			// TODO: autoIndex should be disabled in production once we have the seed scripts for indexes
			autoIndex: config.devEnv || true,
			useNewUrlParser: true,
			useCreateIndex: true,
			useFindAndModify: false,
			useUnifiedTopology: true,
		})
	);
