import { RequestHandler } from 'express';

import { ApiContextV1 } from '@src/api/v1/context';
import { BaseProjectResolved } from '@src/api/v1/projects/fields';
import { ForecastNotFoundError } from '@src/api/v1/projects/forecasts/validation';
import { ForecastService } from '@src/api/v1/projects/forecasts/service';
import { IForecast } from '@src/models/forecasts';
import { IProjection } from '@src/helpers/mongo-queries';
import { parseObjectId } from '@src/helpers/validation';

import { serviceResolver } from './service-resolver';

type Locals = { forecastService: ForecastService; project: BaseProjectResolved };

const forecastValidationResolver = (projection: IProjection<IForecast>): RequestHandler =>
	async function forecastValidationResolver(req, res, next) {
		const { forecastService, project } = res.locals as Locals;
		const { forecastId } = req.params;
		const forecastIdParsed = parseObjectId(forecastId);

		const forecast = await forecastService.getByIdProjected(forecastIdParsed, project, projection);
		if (!forecast) {
			throw new ForecastNotFoundError(
				`No forecast was found with id \`${forecastIdParsed}\` in project \`${project._id}:${project.name}\` `,
			);
		}

		res.locals.forecast = { id: forecast.id, type: forecast.type, name: forecast.name };

		next();
	};

export const forecastResolver = (
	projection: IProjection<IForecast> = { _id: 1, name: 1, type: 1 },
): RequestHandler[] => {
	const forecastServiceResolver = serviceResolver<ApiContextV1, keyof ApiContextV1>(
		'forecastService',
		'forecastService',
	);

	const forecastValidation = forecastValidationResolver(projection);

	return [forecastServiceResolver, forecastValidation];
};
