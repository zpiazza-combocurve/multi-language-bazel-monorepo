import { IErrorRecordStatus } from '@src/api/v1/multi-status';
import { IValidationErrorEntry } from '@src/api/v1/multi-error';

export const getErrorStatus = (
	name: string,
	message: string,
	location: string,
	chosenId?: string,
): IErrorRecordStatus => ({
	status: 'Error',
	code: 400,
	chosenID: chosenId,
	errors: [
		{
			name,
			message,
			location,
			chosenID: chosenId,
		},
	],
});

export const getMultiErrorStatus = (errors: IValidationErrorEntry[], chosenId?: string): IErrorRecordStatus => ({
	status: 'Error',
	code: 400,
	errors,
	chosenID: chosenId,
});
