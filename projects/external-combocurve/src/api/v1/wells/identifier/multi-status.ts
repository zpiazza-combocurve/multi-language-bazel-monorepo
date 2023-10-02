import { StatusCodes } from 'http-status-codes';

import { IErrorRecordStatus, IRecordStatus } from '../../multi-status';
import { IValidationErrorEntry } from '../../multi-error';

import { ValidationResult } from './service';

const { BAD_REQUEST, OK } = StatusCodes;
export interface IChangeIdentifierRecordStatus extends IRecordStatus {
	wellId: string | undefined;
}
export interface IChangeIdentifierErrorRecordStatus extends IErrorRecordStatus {
	wellId: string | undefined;
}

export const toUpdatedStatus = (wellId: string | undefined): IChangeIdentifierRecordStatus => ({
	status: 'UPDATED',
	code: OK,
	wellId: wellId,
});

export const toFailedStatus = (
	wellId: string,
	results: ValidationResult | undefined,
	location: number,
): IChangeIdentifierErrorRecordStatus => ({
	status: 'Failed',
	code: BAD_REQUEST,
	errors: [toErrorEntry(results, location, wellId)],
	wellId: wellId,
});

const toErrorEntry = (
	results: ValidationResult | undefined,
	location: number,
	wellId: string,
): IValidationErrorEntry => ({
	name: 'BadRequest',
	message: ValidationResultErrorMessage(results, wellId),
	location: `[${location}]`,
});

const ValidationResultErrorMessage = (results: ValidationResult | undefined, wellId: string): string => {
	if (results?.missingIdentifier?.length) {
		return `Missing Identifier ${results.missingIdentifier.join(', ')}`;
	}
	const collisions = results?.collisions[wellId]?.join(', ');
	return `Collisions with ${collisions}`;
};
