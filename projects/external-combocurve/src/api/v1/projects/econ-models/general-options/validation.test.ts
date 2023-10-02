import { Types } from 'mongoose';

import { RequestStructureError, RequiredFieldError, ValidationError } from '@src/helpers/validation';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ApiGeneralOptionsType } from './fields/econ-function';
import { parseGeneralOptionsPayload } from './validation';

interface Context {
	errors: ValidationErrorAggregator;
	projectID: Types.ObjectId;
}

const noError = undefined;
const createValidRequest = (): Record<string, unknown> => {
	return {
		name: 'test',
		unique: false,
		mainOptions: {
			aggregationDate: '2021-07-01',
			reportingPeriod: 'fiscal',
			fiscal: '0-11',
			incomeTax: true,
			projectType: 'primary_recovery',
		},
		incomeTax: {
			federalIncomeTax: [
				{
					multiplier: 50,
					offsetToFpd: 890,
				},
				{
					multiplier: 50,
					offsetToFpd: 710,
				},
			],
			stateIncomeTax: [
				{
					multiplier: 50,
					offsetToAsOf: 1200,
				},
				{
					multiplier: 50,
					offsetToAsOf: 900,
				},
			],
		},
		discountTable: {
			discountMethod: 'yearly',
			cashAccrualTime: 'mid_month',
			firstDiscount: 10,
			secondDiscount: 15,
			discounts: [
				{ discountTable: 0 },
				{ discountTable: 2 },
				{ discountTable: 5 },
				{ discountTable: 8 },
				{ discountTable: 10 },
				{ discountTable: 12 },
				{ discountTable: 15 },
				{ discountTable: 20 },
				{ discountTable: 25 },
				{ discountTable: 30 },
				{ discountTable: 40 },
				{ discountTable: 50 },
				{ discountTable: 60 },
				{ discountTable: 70 },
				{ discountTable: 80 },
				{ discountTable: 100 },
			],
		},
		boeConversion: {
			oil: 1,
			dryGas: 6,
			wetGas: 6,
			ngl: 1,
			dripCondensate: 1,
		},
		reportingUnits: {
			oil: 'MBBL',
			gas: 'MMCF',
			ngl: 'MBBL',
			dripCondensate: 'MBBL',
			water: 'MBBL',
			pressure: 'PSI',
			cash: 'M$',
			gor: 'CF/BBL',
			condensateGasRatio: 'BBL/MMCF',
			dripCondensateYield: 'BBL/MMCF',
			nglYield: 'BBL/MMCF',
		},
	};
};

const createValidApiType = (): Record<string, unknown> => {
	return {
		name: 'test',
		unique: false,
		mainOptions: {
			aggregationDate: '2021-07-01',
			reportingPeriod: 'fiscal',
			currency: 'USD',
			fiscal: '0-11',
			incomeTax: true,
			projectType: 'primary_recovery',
		},
		incomeTax: {
			carryForward: false,
			federalIncomeTax: [
				{
					offsetToFpd: { end: 890, period: 890, start: 1 },
					multiplier: 50,
				},
				{
					offsetToFpd: { end: 1600, period: 710, start: 891 },
					multiplier: 50,
				},
			],
			fifteenDepletion: false,
			stateIncomeTax: [
				{
					offsetToAsOf: { end: 1200, period: 1200, start: 1 },
					multiplier: 50,
				},
				{
					offsetToAsOf: { end: 2100, period: 900, start: 1201 },
					multiplier: 50,
				},
			],
		},
		discountTable: {
			discountMethod: 'yearly',
			cashAccrualTime: 'mid_month',
			firstDiscount: 10,
			secondDiscount: 15,
			discounts: [
				{ discountTable: 0 },
				{ discountTable: 2 },
				{ discountTable: 5 },
				{ discountTable: 8 },
				{ discountTable: 10 },
				{ discountTable: 12 },
				{ discountTable: 15 },
				{ discountTable: 20 },
				{ discountTable: 25 },
				{ discountTable: 30 },
				{ discountTable: 40 },
				{ discountTable: 50 },
				{ discountTable: 60 },
				{ discountTable: 70 },
				{ discountTable: 80 },
				{ discountTable: 100 },
			],
		},
		boeConversion: { oil: 1, wetGas: 6, dryGas: 6, ngl: 1, dripCondensate: 1 },
		reportingUnits: {
			oil: 'MBBL',
			gas: 'MMCF',
			ngl: 'MBBL',
			dripCondensate: 'MBBL',
			water: 'MBBL',
			pressure: 'PSI',
			cash: 'M$',
			gor: 'CF/BBL',
			condensateGasRatio: 'BBL/MMCF',
			dripCondensateYield: 'BBL/MMCF',
			nglYield: 'BBL/MMCF',
		},
	};
};

describe('validation parseGeneralOptionsPayload', () => {
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
		expectedResponse?: ApiGeneralOptionsType,
	): void {
		const got = parseGeneralOptionsPayload(data, ctx.errors);

		if (expectedError) {
			expect(got).toStrictEqual([undefined]);
			expect(ctx.errors.errors).toHaveLength(expectedError.length);
			expect(ctx.errors.errors).toStrictEqual(expectedError);
		} else {
			expect(ctx.errors.errors).toHaveLength(0);
			expect(ctx.errors.errors).toStrictEqual([]);
			expect(got[0]).toStrictEqual(expectedResponse);
		}
	}

	it('when is not an object should return an error', () => {
		const data: unknown = true;
		baseTest(
			[data as Record<string, unknown>],
			[new RequestStructureError('Invalid General Options model data structure', '[0]')],
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

	it('when main options is not present should return an error', () => {
		const data = createValidRequest();
		delete data.mainOptions;

		baseTest(
			[data as Record<string, unknown>],
			[new RequiredFieldError('Missing required field: `mainOptions`', '[0]')],
		);
	});

	it('when mainOptions.incomeTax is true and incomeTax is not present should return an error', () => {
		const data = createValidRequest();

		(data.mainOptions as Record<string, unknown>).incomeTax = true;
		delete data.incomeTax;

		baseTest(
			[data as Record<string, unknown>],
			[new RequestStructureError('The Income Tax settings are required when the Income Tax is enabled', '[0]')],
		);
	});

	it('when mainOptions.incomeTax is false incomeTax is not required and should return no error', () => {
		const data = createValidRequest();
		const request = createValidApiType();

		(data.mainOptions as Record<string, unknown>).incomeTax = false;
		(request.mainOptions as Record<string, unknown>).incomeTax = false;

		delete data.incomeTax;
		delete request.incomeTax;

		baseTest([data], noError, request);
	});

	it('discountTable is not required and should complete it', () => {
		const data = createValidRequest();
		const request = createValidApiType();

		delete data.discountTable;

		baseTest([data], noError, request);
	});

	it('boeConversion is not required and should complete it', () => {
		const data = createValidRequest();
		const request = createValidApiType();

		delete data.boeConversion;

		baseTest([data], noError, request);
	});

	it('reportUnits is not required and should complete it', () => {
		const data = createValidRequest();
		const request = createValidApiType();

		delete data.reportUnits;

		baseTest([data], noError, request);
	});
});
