import { range } from 'lodash';

import { count } from '@src/helpers/collections';
import { notNil } from '@src/helpers/typing';

import { IValidationErrorEntry, ValidationErrorAggregator } from './multi-error';

export interface IRecordStatus {
	status: string;
	code: number;
	chosenID?: string;
}

export interface IErrorRecordStatus extends IRecordStatus {
	errors: IValidationErrorEntry[];
}

export interface IMultiStatusResponse {
	generalErrors?: IValidationErrorEntry[];
	results: IRecordStatus[];
	failedCount?: number;
	successCount?: number;
}

export const multiStatusResponseSample: IMultiStatusResponse = {
	results: [
		{
			status: 'created',
			code: 201,
			chosenID: 'chosen_id',
		},
	],
	generalErrors: [
		{
			name: 'ValidationError',
			message: `The field name is required`,
			location: '.person.name',
			chosenID: 'chosen_id',
		},
	],
	failedCount: 1,
	successCount: 1,
};

const locationRe = /^\[(\d+)\](.*)$/;
const parseLocation = (location: string) => {
	const singleLocations = location.split(/,\s*/);
	return singleLocations
		.map((loc) => {
			const match = locationRe.exec(loc);
			if (!match) {
				return undefined;
			}
			return { index: parseInt(match[1]), path: match[2] };
		})
		.filter(notNil);
};

const isErrorStatus = (status: IRecordStatus | undefined): status is IErrorRecordStatus =>
	status !== undefined && status.code >= 400 && (status as IErrorRecordStatus).errors !== undefined;

export const getResponseFromErrors = (errors: IValidationErrorEntry[]): IMultiStatusResponse => {
	const res: IMultiStatusResponse = { results: [] };

	const generalErrors: IValidationErrorEntry[] = [];
	errors.forEach((e) => {
		const { location } = e;
		if (!location) {
			generalErrors.push(e);
			return;
		}
		const locs = parseLocation(location);
		if (!locs.length) {
			generalErrors.push(e);
			return;
		}
		locs.forEach(({ index }) => {
			const recordResult = res.results[index];
			if (isErrorStatus(recordResult)) {
				recordResult.errors.push(e);
				return;
			}
			const newResult: IErrorRecordStatus = {
				status: 'Error',
				code: 400,
				chosenID: e.chosenID,
				errors: [e],
			};
			res.results[index] = newResult;
		});
	});

	if (generalErrors.length) {
		res.generalErrors = generalErrors;
	}

	return res;
};

export const mergeRecordResults = (
	first: IRecordStatus[],
	second: IRecordStatus[],
	returnLength: number,
): IRecordStatus[] => range(returnLength).map((i) => first[i] ?? second[i]);

export const mergeResponses = (first: IMultiStatusResponse, second: IMultiStatusResponse): IMultiStatusResponse => {
	const indexes = [...Array(Math.max(first.results.length, second.results.length)).keys()];
	const res: IMultiStatusResponse = {
		results: indexes.map((index) => first.results[index] ?? second.results[index]),
	};

	const generalErrors = [...(first.generalErrors ?? []), ...(second.generalErrors ?? [])];
	if (generalErrors.length) {
		res.generalErrors = generalErrors;
	}

	return res;
};

export const emptyResponse: IMultiStatusResponse = {
	results: [],
	generalErrors: [],
};

export const mergeResponsesFixed = (
	first: IMultiStatusResponse | undefined,
	second: IMultiStatusResponse | undefined,
): IMultiStatusResponse => {
	const auxFirst = first ?? emptyResponse;
	const auxSecond = second ?? emptyResponse;

	return {
		generalErrors:
			!first?.generalErrors && !second?.generalErrors
				? undefined
				: [...(auxFirst.generalErrors ?? []), ...(auxSecond.generalErrors ?? [])],
		results: [...auxFirst.results, ...auxSecond.results],
	};
};

export const withCounts = ({ generalErrors, results }: IMultiStatusResponse): IMultiStatusResponse => ({
	generalErrors,
	results,
	successCount: count(results, (r) => !isErrorStatus(r)),
	failedCount: count(results, isErrorStatus),
});

export function createFinalMultiResponse(
	success: IMultiStatusResponse,
	errors: ValidationErrorAggregator,
): IMultiStatusResponse {
	const errorsResponse = getResponseFromErrors(errors.getErrorEntries());
	const finalResponse = withCounts(mergeResponsesFixed(errorsResponse, success));

	return finalResponse;
}
