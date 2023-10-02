import config from './config';
import { createApp } from './app';
import logger from './helpers/logger';
import { registerEvents } from './process';

registerEvents();

const startServer = (): void => {
	const app = createApp();
	app.listen(config.port, () => {
		logger.info(`ComboCurve External API running on http://localhost:${config.port}`);
	});
};

startServer();
