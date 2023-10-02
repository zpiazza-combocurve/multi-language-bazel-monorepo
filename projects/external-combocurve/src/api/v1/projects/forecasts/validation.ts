import { Types } from 'mongoose';

import { parseObjectId, ValidationError } from '@src/helpers/validation';
import { IForecast } from '@src/models/forecasts';
import { notNil } from '@src/helpers/typing';

import { BaseProjectResolved } from '../fields';
import { ValidationErrorAggregator } from '../../multi-error';

import { WellBaseInformation } from './service';

export class ForecastNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message, location, ForecastNotFoundError.name, statusCode);
	}
}

export class WellAlreadyExistOnForecast extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 400) {
		super(message, location, WellAlreadyExistOnForecast.name, statusCode);
	}
}

export class WellNotExistOnProject extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 400) {
		super(message, location, WellNotExistOnProject.name, statusCode);
	}
}
export const parseWellIdPayload = (
	data: unknown[],
	errorAggregator: ValidationErrorAggregator,
): (Types.ObjectId | undefined)[] => {
	const objectIds = data.map((element, index) =>
		errorAggregator.catch(() => parseObjectId(element, `[${index.toString()}]`)),
	);
	return objectIds;
};

export const parseWellsToAdd = (
	forecast: IForecast,
	project: BaseProjectResolved,
	projectWellIds: Types.ObjectId[],
	data: (Types.ObjectId | undefined)[],
	wellInformation: WellBaseInformation[],
	errorAggregator: ValidationErrorAggregator,
): (Types.ObjectId | undefined)[] => {
	const validObjectIds = data.filter(notNil);

	const projectWells = validObjectIds.map((dataWellId, index) =>
		errorAggregator.catch(() => {
			const isWellInProject = projectWellIds.some((wellId) => wellId.toString() === dataWellId.toString());

			if (!isWellInProject) {
				const wellName = wellInformation?.find((wellInformation) => wellInformation?._id == dataWellId)
					?.well_name;
				let message = `wellId \`${dataWellId}\` was not found in project \`${project._id}:${project.name}\` `;

				if (wellName) {
					message = `well \`${dataWellId}:${wellName}\` was not found in project \`${project._id}:${project.name}\` `;
				}
				throw new WellNotExistOnProject(message, `[${index}]`);
			}
			return dataWellId;
		}),
	);

	const wellIdsToAdd = projectWells.map((dataWellId, index) =>
		errorAggregator.catch(() => {
			const isWellInForecast = forecast.wells.some((wellId) => wellId.toString() == dataWellId?.toString());

			if (isWellInForecast) {
				const wellName = wellInformation?.find((wellInformation) => wellInformation?._id == dataWellId)
					?.well_name;
				let message = `wellId \`${dataWellId}\` was found in Forecast \`${forecast._id}:${forecast.name}\` `;

				if (wellName) {
					message = `well \`${dataWellId}:${wellName}\` was found in Forecast \`${forecast._id}:${forecast.name}\` `;
				}
				throw new WellAlreadyExistOnForecast(message, `[${index}]`);
			}
			return dataWellId;
		}),
	);

	return wellIdsToAdd;
};
