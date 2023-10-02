import { Types } from 'mongoose';

import { FieldNameError, RequestStructureError, RequiredFieldError, ValidationError } from '@src/helpers/validation';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ApiActualForecast } from './fields/actual-forecast';
import { parseActualOrForecastPayload } from './validation';

interface Context {
	errors: ValidationErrorAggregator;
	projectID: Types.ObjectId;
}

const createValidRequest = (): Record<string, unknown> => {
	return {
		name: 'test',
		unique: false,
		actualOrForecast: {
			ignoreHistoryProd: false,
			replaceActualWithForecast: {
				oil: { never: true },
				gas: { never: true },
				water: { never: true },
			},
		},
	};
};

describe('validation parseActualOrForecastPayload', () => {
	let ctx: Context;

	beforeAll(() => {
		ctx = {
			errors: new ValidationErrorAggregator(),
			projectID: new Types.ObjectId(),
		};
	});

	beforeEach(() => {
		ctx.errors.clear();
	});

	function baseTest(
		data: Array<Record<string, unknown>>,
		expectedError?: ValidationError[],
		expectedResponse?: ApiActualForecast,
	): void {
		const got = parseActualOrForecastPayload(data, ctx.projectID, ctx.errors);

		if (expectedError) {
			expect(got).toStrictEqual([undefined]);
			expect(ctx.errors.errors).toHaveLength(expectedError.length);
			expect(ctx.errors.errors).toStrictEqual(expectedError);
		} else {
			expect(got[0]).toEqual(expectedResponse);
		}
	}

	it('when is not an object should return an error', () => {
		const data: unknown = true;
		baseTest(
			[data as Record<string, unknown>],
			[new RequestStructureError('Invalid Actual or Forecast model data structure', '[0]')],
		);
	});

	it('when name is not present should return an error', () => {
		const data = createValidRequest();
		delete data.name;

		baseTest([data as Record<string, unknown>], [new RequiredFieldError('Missing required field: `name`', '[0]')]);
	});

	it('when unique is not present should return an error', () => {
		const data = createValidRequest();
		delete data.unique;

		baseTest(
			[data as Record<string, unknown>],
			[new RequiredFieldError('Missing required field: `unique`', '[0]')],
		);
	});

	it('when actualOrForecast is not present should return an error', () => {
		const data = createValidRequest();
		delete data.actualOrForecast;

		baseTest(
			[data as Record<string, unknown>],
			[new RequiredFieldError('Missing required field: `actualOrForecast`', '[0]')],
		);
	});

	it('when ignoreHistoryProd is yes the replaceActualWithForecast should be undefined', () => {
		const data = createValidRequest();
		(data.actualOrForecast as Record<string, unknown>).ignoreHistoryProd = true;

		baseTest(
			[data as Record<string, unknown>],
			[new FieldNameError('`replaceActualWithForecast` is not a valid field name', '[0]')],
		);
	});

	it('when ignoreHistoryProd is no the replaceActualWithForecast should be defined', () => {
		const data = createValidRequest();
		delete (data.actualOrForecast as Record<string, unknown>).replaceActualWithForecast;

		baseTest(
			[data as Record<string, unknown>],
			[new RequiredFieldError('Missing required field: `actualOrForecast.replaceActualWithForecast`', '[0]')],
		);
	});
});
