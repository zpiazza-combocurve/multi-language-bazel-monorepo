import { Types } from 'mongoose';

import { IValidationErrorEntry } from '../../../multi-error';

export interface IMultiErrorResponse extends IForecastSegmentResponse {
	status: 'BadRequest';
	errors: IValidationErrorEntry[];
	errorCount: number;
}

export interface ISuccessResponse extends IForecastSegmentResponse {
	status: 'Created';
	segmentsCount: number;
	id: string;
}

export interface IForecastSegmentResponse {
	status: 'Created' | 'Error' | 'BadRequest' | 'Failed';
}

export const getForecastSegmentResponseFromErrors = (errors: IValidationErrorEntry[]): IMultiErrorResponse => {
	const response: IMultiErrorResponse = { status: 'BadRequest', errors: [], errorCount: 0 };

	errors.forEach((e) => {
		response.errorCount++;
		response.errors.push(e);
	});

	return response;
};

export const getCreatedResponse = (count: number, forecastDataId: Types.ObjectId): ISuccessResponse => {
	const id = forecastDataId as unknown as Record<string, string>;
	return { status: 'Created', segmentsCount: count, id: id._id };
};
