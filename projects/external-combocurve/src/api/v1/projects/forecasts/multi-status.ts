import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { IErrorRecordStatus, IMultiStatusResponse, IRecordStatus, mergeRecordResults } from '../../multi-status';
import { IValidationErrorEntry } from '../../multi-error';

import { AddWellToForecastResponse } from './service';

const { CREATED, INTERNAL_SERVER_ERROR } = StatusCodes;
export interface IAddWellForecastRecordStatus extends IRecordStatus {
	wellId: string | undefined;
}
export interface IAddWellForecastErrorRecordStatus extends IErrorRecordStatus {
	wellId: string | undefined;
}

export const getUpdateMultiResponse = (
	originalArray: (Types.ObjectId | undefined)[],
	response: AddWellToForecastResponse,
): IMultiStatusResponse => {
	const multiResponse = {} as IMultiStatusResponse;

	const originalArrayWellIds = originalArray.map((w) => w?.toString());
	const updated = originalArrayWellIds.map((wellId) => {
		if (wellId && response.wellsIds.includes(wellId)) {
			return wellId;
		}
		return undefined;
	});
	const failedResponse = originalArrayWellIds.map((w, index) => {
		if (w && !updated.includes(w)) {
			return toFailedStatus(`Failed to add well with identifier ${w?.toString()}`, index, w);
		}
		return undefined;
	}) as IRecordStatus[];
	const createdResponse = updated.map((w) => w && toCreatedStatus(w)) as IRecordStatus[];

	multiResponse.results = mergeRecordResults(createdResponse, failedResponse, originalArrayWellIds.length);

	return multiResponse;
};

export const toCreatedStatus = (wellId: string | undefined): IAddWellForecastRecordStatus => ({
	status: 'Created',
	code: CREATED,
	wellId: wellId,
});

export const toFailedStatus = (
	message: string,
	location: number,
	wellId: string | undefined,
): IAddWellForecastErrorRecordStatus => ({
	status: 'Failed',
	code: INTERNAL_SERVER_ERROR,
	errors: [toErrorEntry(message, location)],
	wellId: wellId,
});

const toErrorEntry = (message: string, location: number): IValidationErrorEntry => ({
	name: 'InternalServerError',
	message,
	location: `[${location}]`,
});
