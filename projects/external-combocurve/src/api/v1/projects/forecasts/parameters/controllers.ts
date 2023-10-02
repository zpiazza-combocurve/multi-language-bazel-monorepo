import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { checkRecordCount, RequestStructureError } from '@src/helpers/validation';
import { getDeleteHeaders } from '@src/api/v1/delete';

import { BaseForecastResolved } from '../fields';
import { BaseProjectResolved } from '../../fields';
import { ValidationErrorAggregator } from '../../../multi-error';

import {
	checkValidPhase,
	checkValidSeries,
	checkWellId,
	parseForecastParameters,
	UnknownSegmentTypeError,
} from './validation';
import { getCreatedResponse, getForecastSegmentResponseFromErrors, IForecastSegmentResponse } from './multi-status';
import { FORECAST_PARAMETERS_WRITE_RECORD_LIMIT } from './fields';
import { ForecastParameterService } from './service';

const { BAD_REQUEST, CREATED, NO_CONTENT } = StatusCodes;

export const IS_TRANSACTIONAL = false;

type Locals = { service: ForecastParameterService; project: BaseProjectResolved; forecast: BaseForecastResolved };

export const postForecastParameters = async (req: Request, res: Response<IForecastSegmentResponse>): Promise<void> => {
	const { service, forecast } = res.locals as Locals;

	const { wellId, phase, series } = req.params;

	const errorAggregator = new ValidationErrorAggregator();

	if (!wellId || !phase || !series) {
		errorAggregator.catch(() => {
			throw new RequestStructureError('Missing required parameter(s)');
		});
	}

	checkWellId(wellId, errorAggregator);
	checkValidPhase(phase, errorAggregator);
	checkValidSeries(series, errorAggregator);

	const data = Array.isArray(req.body) ? (req.body as unknown[]) : ([req.body] as unknown[]);

	checkRecordCount(data, FORECAST_PARAMETERS_WRITE_RECORD_LIMIT);

	const segments = parseForecastParameters(data, service, errorAggregator);

	const validationErrors = getForecastSegmentResponseFromErrors(errorAggregator.getErrorEntries());

	if (validationErrors.errors.some((e) => e.name === UnknownSegmentTypeError.name)) {
		res.status(BAD_REQUEST).json(validationErrors);
		return;
	}

	const serviceResponse = await service.createSegments(segments, forecast.id.toString(), wellId, phase, series);
	const allErrors = [...validationErrors.errors, ...serviceResponse.errors];

	if (allErrors.length) {
		const errorsResponse = getForecastSegmentResponseFromErrors(allErrors);
		res.status(BAD_REQUEST).json(errorsResponse);
	} else {
		const successResponse = getCreatedResponse(serviceResponse.segmentsCount, serviceResponse.id);
		res.status(CREATED).json(successResponse);
	}
};

export const deleteForecastParameters = async (req: Request, res: Response): Promise<void> => {
	const { service, forecast } = res.locals as Locals;

	const { wellId, phase, series } = req.params;

	const errorAggregator = new ValidationErrorAggregator();

	if (!wellId || !phase || !series) {
		errorAggregator.catch(() => {
			throw new RequestStructureError('Missing required parameter(s)');
		});
	}

	checkWellId(wellId, errorAggregator);
	checkValidPhase(phase, errorAggregator);
	checkValidSeries(series, errorAggregator);

	const serviceResponse = await service.deleteSegments(forecast.id.toString(), wellId, phase, series);
	if (serviceResponse.errors.length) {
		const errorsResponse = getForecastSegmentResponseFromErrors(serviceResponse.errors);
		res.status(BAD_REQUEST).json(errorsResponse);
	} else {
		res.status(NO_CONTENT).set(getDeleteHeaders(serviceResponse.deleteCount)).end();
	}
};

export const putForecastParameters = async (req: Request, res: Response<IForecastSegmentResponse>): Promise<void> => {
	const { service, forecast } = res.locals as Locals;

	const { wellId, phase, series } = req.params;

	const errorAggregator = new ValidationErrorAggregator();

	if (!wellId || !phase || !series) {
		errorAggregator.catch(() => {
			throw new RequestStructureError('Missing required parameter(s)');
		});
	}

	checkWellId(wellId, errorAggregator);
	checkValidPhase(phase, errorAggregator);
	checkValidSeries(series, errorAggregator);

	const data = Array.isArray(req.body) ? (req.body as unknown[]) : ([req.body] as unknown[]);

	checkRecordCount(data, FORECAST_PARAMETERS_WRITE_RECORD_LIMIT);

	const segments = parseForecastParameters(data, service, errorAggregator);

	const validationErrors = getForecastSegmentResponseFromErrors(errorAggregator.getErrorEntries());

	if (validationErrors.errors.some((e) => e.name === UnknownSegmentTypeError.name)) {
		res.status(BAD_REQUEST).json(validationErrors);
		return;
	}

	const serviceResponse = await service.replaceSegments(segments, forecast.id.toString(), wellId, phase, series);
	const allErrors = [...serviceResponse.errors, ...validationErrors.errors];

	if (allErrors.length) {
		const errorsResponse = getForecastSegmentResponseFromErrors(serviceResponse.errors);
		res.status(BAD_REQUEST).json(errorsResponse);
	} else {
		const successResponse = getCreatedResponse(serviceResponse.segmentsCount, serviceResponse.id);
		res.status(CREATED).json(successResponse);
	}
};
