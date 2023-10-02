// Here we can a build a clone of the context to interact with the services from the REPL during development

import { ApiContextV1 } from './src/api/v1/context';
import { connectToDb } from './src/database';
import { getTenantInfo } from './src/tenant';

export const createContext = async (): Promise<ApiContextV1> => {
	const info = await getTenantInfo('test');
	const connection = await connectToDb(info.dbConnectionString);
	return new ApiContextV1(info, connection);
};
