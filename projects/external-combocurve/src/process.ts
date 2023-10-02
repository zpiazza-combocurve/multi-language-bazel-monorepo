import logger from './helpers/logger';

export const registerEvents = (): void => {
	process.on('uncaughtException', (error) =>
		logger.error(`uncaughtException: ${error?.stack ?? JSON.stringify(error)}`),
	);

	process.on('unhandledRejection', (error) => logger.error(`unhandledRejection: ${error && error.toString()}`));
};
