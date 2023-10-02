// eslint-disable-next-line import/extensions
import '@src/helpers/tracer'; // do not change the order, this needs to load before express

import 'express-async-errors'; // NOTE: the problem this package solves is fixed in express 5 (in alpha as of today), this should be good enough as a temporary fix
import express, { Application } from 'express';
import { json, urlencoded } from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import { StatusCodes } from 'http-status-codes';

import api from './api';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './helpers/request-logger';

const { OK } = StatusCodes;

export const createApp = (): Application => {
	const app = express();

	app.use(helmet());
	app.use(cors());
	app.use(json({ limit: '24mb' }));
	app.use(
		urlencoded({
			limit: '24mb',
			parameterLimit: 50000,
			extended: true,
		}),
	);

	app.get('/', (req, res) => {
		res.status(OK).send('ComboCurve External API');
	});

	app.use(requestLogger);

	app.use('/', api);

	app.use(errorHandler()); // error handler middleware should be last

	return app;
};
