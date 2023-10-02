/* eslint-disable @typescript-eslint/no-explicit-any */
import { MultipleValidationError } from '@src/api/v1/multi-error';
import { ValidationError } from '@src/helpers/validation';

import {
	FlatRowCriteria,
	StartEndDatesCriteria,
	StartEndPeriodCriteria,
	StartEndRateCriteria,
} from './criteria-validation';
import { RowsArrayContext } from './helpers';

describe('v1/projects/econ-models/row-validations/time-period-property-validation', () => {
	// FLAT ROW PROPERTY
	describe('FlatRowProperty', () => {
		describe('validate()', () => {
			it("should throw a ValidationError if entireWellLife is not 'Flat'", () => {
				const row = { entireWellLife: 'NotFlat' };
				const flatRowProperty = new FlatRowCriteria();

				expect(() => flatRowProperty.validate(row)).toThrow(
					new ValidationError(
						`Invalid value for \`entireWellLife\`: \`NotFlat\` was entered but must be \`Flat\``,
					),
				);
			});

			it("should not throw a ValidationError if entireWellLife is 'Flat'", () => {
				const row = { entireWellLife: 'Flat' };
				const flatRowProperty = new FlatRowCriteria();

				expect(() => flatRowProperty.validate(row)).not.toThrow();
			});
		});

		describe('validateRows()', () => {
			it('should throw a ValidationError if there are more than one rows in the context', () => {
				const rows = [{ entireWellLife: 'Flat' }, { entireWellLife: 'Flat' }];
				const context: RowsArrayContext = { rows: rows, location: 'location' };
				const flatRowProperty = new FlatRowCriteria();

				expect(() => flatRowProperty.validateRows(context)).toThrow(
					new ValidationError(
						`There can only be one row in a Model with the \`entireWellLife\` property.`,
						'location',
					),
				);
			});

			it('should call validate() with the first row in the context', () => {
				const rows = [{ entireWellLife: 'Flat' }];
				const context: RowsArrayContext = { rows: rows, location: 'location' };
				const flatRowProperty = new FlatRowCriteria();
				const validateSpy = jest.spyOn(flatRowProperty, 'validate');

				flatRowProperty.validateRows(context);

				expect(validateSpy).toHaveBeenCalledWith(rows[0], 'location[0]');
			});
		});
	});

	// OFFSET ROW PROPERTY
	describe('OffsetToProperty', () => {
		describe('validate', () => {
			it('should throw MultipleValidationError when monthPeriod is not an object', () => {
				const rowObject = { monthPeriod: 123 };
				const validator = new StartEndPeriodCriteria();

				expect(() => validator.validate(rowObject)).toThrow(MultipleValidationError);
			});

			it('should throw a MultipleValidationError when monthPeriod.start is not a natural number', () => {
				const rowObject = { monthPeriod: 0 };
				const validator = new StartEndPeriodCriteria();

				expect(() => validator.validate(rowObject)).toThrow(MultipleValidationError);
			});

			it('should throw a ValidationError when monthPeriod.period is greater than 1200', () => {
				const rowObject = { monthPeriod: { start: 1, end: 1, period: 1201 } };
				const validator = new StartEndPeriodCriteria();

				expect(() => validator.validate(rowObject)).toThrow(ValidationError);
				expect(() => validator.validate(rowObject)).toThrow(
					'Invalid value for `monthPeriod`: `1201`. `monthPeriod` is greater than the maximum of 1200.',
				);
			});

			it('should not throw an error when monthPeriod is valid', () => {
				const rowObject = { monthPeriod: { start: 1, end: 123, period: 123 } };
				const validator = new StartEndPeriodCriteria();

				expect(() => validator.validate(rowObject)).not.toThrow();
			});
		});

		describe('validateRows', () => {
			it('should throw a ValidationError when a row does not contain the key monthPeriod', () => {
				const rows = [{}, {}];
				const validator = new StartEndPeriodCriteria();
				expect(() => validator.validateRows({ rows, location: 'test' })).toThrow(ValidationError);
			});

			it('should not throw an error with multiple valid rows', () => {
				const rows = [{ monthPeriod: 1 }, { monthPeriod: 1200 }, { monthPeriod: 123 }];
				const validator = new StartEndPeriodCriteria();

				expect(() => validator.validateRows({ rows: rows, location: 'test' })).not.toThrow();
			});
		});

		describe('validateNumberValue', () => {
			it('should throw a MultipleValidationError when value is not a number', () => {
				const validator = new StartEndPeriodCriteria();
				const row = { monthPeriod: 'abc' };

				expect(() => validator.validate(row, 'test')).toThrow(MultipleValidationError);
			});

			it('should throw a MultipleValidationError when value is less than zero', () => {
				const validator = new StartEndPeriodCriteria();
				const row = { monthPeriod: -1 };
				expect(() => validator.validate(row, 'location')).toThrow(MultipleValidationError);
			});

			it('should throw a ValidationError when monthPeriod.period value is not a natural number', () => {
				const validator = new StartEndPeriodCriteria();
				const row = { monthPeriod: { start: 1, end: 1, period: 1.5 } };
				expect(() => validator.validate(row, 'test')).toThrow(ValidationError);
				expect(() => validator.validate(row, 'test')).toThrow(
					'Invalid value for `monthPeriod`: `1.5`. `monthPeriod` must be a natural number.',
				);
			});

			it('should throw a MultipleValidationError when value is not present', () => {
				const validator = new StartEndPeriodCriteria();
				const row = { monthPeriod: { start: undefined, end: undefined, period: undefined } };
				expect(() => validator.validate(row, undefined as any)).toThrow(MultipleValidationError);
			});

			it('should not throw an error when value is a valid number', () => {
				const validator = new StartEndPeriodCriteria();
				const row = { monthPeriod: { start: 1, end: 1, period: 1 } };

				expect(() => validator.validate(row, 'test')).not.toThrow();
			});
		});
	});

	// DATE ROW PROPERTY
	describe('DatesRowProperty', () => {
		describe('validate()', () => {
			it('should not throw an error if dates value is correct', () => {
				const property = new StartEndDatesCriteria();
				const rowObject = { dates: '2022-03-01' };
				expect(() => property.validate(rowObject, 'fieldPath')).not.toThrow();
			});

			it('should throw ValidationError if `dates` is not a correctly formatted string', () => {
				const datesRowProperty = new StartEndDatesCriteria();
				const rowObject = { dates: 'not an object' };
				expect(() => datesRowProperty.validate(rowObject, 'location')).toThrow(
					new ValidationError(
						'Invalid value for `dates`: `not an object`. `dates` must be a string of the format YYYY-MM-DD.',
						'location.dates',
					),
				);
			});

			it('should throw ValidationError if `dates` day is greater than 1', () => {
				const datesRowProperty = new StartEndDatesCriteria();
				const rowObject = {
					dates: '2022-01-12',
				};
				expect(() => datesRowProperty.validate(rowObject, 'location')).toThrow(
					new ValidationError(
						'Invalid value for `dates`: `12`. `dates` can not have a value greater than 01 for the days position.',
						'location.dates.endDate',
					),
				);
			});

			it('should call validateDateValue with correct dates value', () => {
				const datesRowProperty = new StartEndDatesCriteria();
				const rowObject = {
					dates: '2022-01-01',
				};
				const validateDateValueSpy = jest.spyOn(datesRowProperty as any, 'validateDateValue');
				datesRowProperty.validate(rowObject, 'location');
				expect(validateDateValueSpy).toHaveBeenCalledWith('2022-01-01', 'location');
			});
		});

		describe('validateRows()', () => {
			it('should throw ValidationError if the first row does not have `dates` property', () => {
				const datesRowProperty = new StartEndDatesCriteria();
				const rows = [{ foo: 'bar' }];
				const context = { rows, location: 'location' };
				expect(() => datesRowProperty.validateRows(context)).toThrow(
					new ValidationError('Expected model to have `dates` property in the first row.', 'location[0]'),
				);
			});

			it('should throw ValidationError if `dates.endDate` is not `Econ Limit` for the only row', () => {
				const datesRowProperty = new StartEndDatesCriteria();
				const rows = [
					{
						dates: {
							startDate: '2022-01-01',
							endDate: '2023-01-01',
						},
					},
				];
				const context = { rows, location: 'location' };
				expect(() => datesRowProperty.validateRows(context)).toThrow(ValidationError);
			});

			it('should throw ValidationError if `dates` property is missing in a row other than the first one', () => {
				const datesRowProperty = new StartEndDatesCriteria();
				const rows = [{ dates: { startDate: '2022-01-01', endDate: '2023-01-01' } }, {}];
				const context = {
					rows,
					location: 'location',
				};
				expect(() => datesRowProperty.validateRows(context)).toThrow(
					new ValidationError('Each row must contain the key `dates` which is missing.', 'location[1]'),
				);
			});
		});
	});

	//
	describe('StartEndRateCriteria', () => {
		describe('validate()', () => {
			const acceptedProperties = ['waterRate', 'oilRate', 'gasRate'];
			it('should throw an error if the rowObject does not have any accepted properties property', () => {
				const property = new StartEndRateCriteria();
				const rowObject = {};
				expect(() => property.validate(rowObject, 'fieldPath')).toThrow(
					`Rows key not supported. Supported values : ${acceptedProperties.join(', ')}`,
				);
			});

			it('should throw an error if the key property is not an object', () => {
				const property = new StartEndRateCriteria();
				const rowObject = { waterRate: 'invalid' };
				expect(() => property.validate(rowObject, 'fieldPath')).toThrow(
					new ValidationError(
						'Invalid value for `waterRate`: `undefined`. `waterRate` is required and must be a number larger than 0.',
						'fieldPath',
					),
				);
			});

			it('should throw an error if waterRate is not a valid number', () => {
				const property = new StartEndRateCriteria();
				const rowObject = { waterRate: 'invalid' };
				expect(() => property.validate(rowObject, 'test')).toThrow(ValidationError);
			});

			it('should not throw an error with valid value', () => {
				const property = new StartEndRateCriteria();
				const rowObject = { waterRate: { start: 1, end: 'invalid' } };
				expect(() => property.validate(rowObject, 'fieldPath')).not.toThrow();
			});

			it('should throw ValidationError if `waterRate` is null', () => {
				const startEndRangeProperty = new StartEndRateCriteria();
				const rowObject = { waterRate: null };
				expect(() => startEndRangeProperty.validate(rowObject, 'location')).toThrow(
					new ValidationError(
						'Invalid value for `waterRate`: `null`. `waterRate` is required and must be a number larger than 0.',
						'location.waterRate',
					),
				);
			});
		});

		describe('validateRows()', () => {
			it('should throw an error if value is not a number', () => {
				const property = new StartEndRateCriteria();
				const rows = [
					{
						waterRate: 'not a number',
					},
				];
				const location = 'fieldPath';
				expect(() => property.validateRows({ rows, location })).toThrow(
					'Invalid value for `waterRate`: `not a number`. `waterRate` must be a number.',
				);
			});

			it('should not throw an error for multiple valid values', () => {
				const property = new StartEndRateCriteria();
				const rows = [{ waterRate: 2 }, { waterRate: 3 }, { waterRate: 4 }, { waterRate: 5 }, { waterRate: 6 }];
				const location = 'fieldPath';
				expect(() => property.validateRows({ rows, location })).not.toThrow();
			});

			it('should throw an error if value is less than 0', () => {
				const property = new StartEndRateCriteria();
				const rows = [
					{
						waterRate: -1,
					},
					{ waterRate: 5 },
				];
				const location = 'fieldPath';
				expect(() => property.validateRows({ rows, location })).toThrow(
					'Invalid value for `waterRate`: `-1`. `waterRate` is less than the minimum of 0.',
				);
			});
		});
	});
});
