/* eslint-disable complexity */
import { get } from 'lodash';

import { getDateWithOffset, getMonthsApart, getPreviousDayWithOffset } from '@src/helpers/dates';
import { isNumber, isString, isValidDate, ValidationError } from '@src/helpers/validation';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { IRowValidator, isNaturalNumber, RowsArrayContext } from './helpers';
const MAX_DATE = '2262-04-01' as const;

// ECON FUNCTION FLAT ROW
export class FlatRowCriteria implements IRowValidator {
	acceptedProperties = ['entireWellLife'];
	constructor(readonly entireWellLife?: string) {}

	public validate(rowObject: Record<string, unknown>, location?: string): void {
		const errorAggregator = new ValidationErrorAggregator();
		errorAggregator.catch(() => {
			if (!isString(rowObject.entireWellLife) || rowObject.entireWellLife !== 'Flat') {
				throw new ValidationError(
					`Invalid value for \`entireWellLife\`: \`${rowObject.entireWellLife}\` was entered but must be \`Flat\``,
					location,
				);
			}
		});
		errorAggregator.throwAll();
	}

	validateRows(context: RowsArrayContext): void {
		const { rows: rows, location } = context;

		const errorAggregator = new ValidationErrorAggregator();
		// If there are more than 1 rows, it's not a valid row for the Flat type
		// move this rows validation to its own method

		if (rows.length > 1) {
			errorAggregator.catch(() => {
				throw new ValidationError(
					`There can only be one row in a Model with the \`entireWellLife\` property.`,
					location,
				);
			});
		}
		const flatRow = rows[0];
		errorAggregator.catch(() => {
			this.validate(flatRow, location + '[0]');
		});
		errorAggregator.throwAll();
	}
}

// ECON FUNCTION OFFSET TO AS Of ROW
export interface IStartEndPeriodRowData {
	readonly start: number;
	readonly end: number;
	readonly period: number;
}

export class StartEndPeriodCriteria implements IRowValidator {
	acceptedProperties = [
		'monthPeriod',
		'offsetToAsOf',
		'offsetToFpd',
		'offsetToDiscountDate',
		'offsetToFirstSegment',
		'offsetToEndHistory',
	];
	key = '';

	private setKey(record: Record<string, unknown>, fieldPath?: string): void {
		const rowKey = Object.keys(record).find((prop) => this.acceptedProperties.includes(prop));
		if (!rowKey) {
			throw new ValidationError(
				`Rows key not supported. Supported values : ${this.acceptedProperties.join(', ')}`,
				fieldPath,
			);
		}
		this.key = rowKey;
	}

	private createStartEndPeriodData = (start: number, period: number) => {
		const end = start + period - 1;
		return { start, end, period };
	};

	validate(row: Record<string, unknown>, fieldPath?: string): void {
		const errorAggregator = new ValidationErrorAggregator();

		if (!this.key) {
			this.setKey(row, fieldPath);
		}

		if (row[this.key] === undefined || row[this.key] === null) {
			errorAggregator.catch(() => {
				throw new ValidationError(
					`Invalid value for \`${this.key}\`: \`${row[this.key]}\`. \`${
						this.key
					}\` is required and must be a number larger than 0.`,
					fieldPath,
				);
			});
		} else {
			const { period } = get(row, this.key) as IStartEndPeriodRowData;

			errorAggregator.catch(() => {
				this.validateNumberValue(this.key, period, fieldPath);
			});
		}

		errorAggregator.throwAll();
	}

	validateRows(context: RowsArrayContext): void {
		const { rows: rows, location } = context;
		const errorAggregator = new ValidationErrorAggregator();
		const firstRowLocation = `${location}[${0}].${this.key}`;
		this.setKey(rows[0], location);

		if (rows.length === 1) {
			errorAggregator.catch(() => {
				const period = get(rows[0], this.key) as number;
				const startEndPeriod = this.createStartEndPeriodData(1, period);
				rows[0][this.key] = startEndPeriod;
				this.validate(rows[0], firstRowLocation);
			});
		}

		// Each startEndPeriod row in the `rows` array must be continuous with the first row being the first startEndPeriod
		for (let index = 0; index < rows.length - 1; index++) {
			const currentRow = rows[index];
			const nextRow = rows[index + 1];
			const nextRowPath = `${location}[${index + 1}].${this.key}`;

			const currentPeriod = get(currentRow, this.key) as number;

			if (index == 0) {
				const period = currentPeriod;
				const startEndPeriodData = this.createStartEndPeriodData(1, period);
				currentRow[this.key] = startEndPeriodData;
				this.validate(currentRow, firstRowLocation);
			}

			const nextPeriod = get(nextRow, this.key) as number;

			// If nextRow does not contain the key then it is invalid
			if (!nextPeriod) {
				errorAggregator.catch(() => {
					throw new ValidationError(
						`Each row must contain the key \`${this.key}\` which is missing.`,
						nextRowPath,
					);
				});
			}

			if (currentRow && nextRow && currentPeriod && nextPeriod) {
				errorAggregator.catch(() => {
					const prevStartEndPeriodRowData = currentRow[this.key] as IStartEndPeriodRowData;
					const start = prevStartEndPeriodRowData.end + 1;
					const period = nextPeriod;
					const startEndPeriodData = this.createStartEndPeriodData(start, period);
					nextRow[this.key] = startEndPeriodData;
					this.validate(nextRow, location);
				});
			}
		}

		errorAggregator.throwAll();
	}

	private validateNumberValue(valueKey: string, value: number, fieldPath?: string): void {
		const errorAggregator = new ValidationErrorAggregator();
		errorAggregator.catch(() => {
			if (!value) {
				throw new ValidationError(
					`Invalid value for \`${valueKey}\`: \`${value}\`. \`${valueKey}\` is required and must be a natural number (larger than 0).`,
					fieldPath,
				);
			}
			if (!isNumber(value)) {
				throw new ValidationError(
					`Invalid value for \`${valueKey}\`: \`${value}\`. \`${valueKey}\` must be a natural number.`,
					fieldPath,
				);
			}
		});
		if (value < 0) {
			errorAggregator.catch(() => {
				throw new ValidationError(
					`Invalid value for \`${valueKey}\`: \`${value}\`. \`${valueKey}\` is less than the minimum of 1.`,
					fieldPath,
				);
			});
		}
		if (value > 1200) {
			errorAggregator.catch(() => {
				throw new ValidationError(
					`Invalid value for \`${valueKey}\`: \`${value}\`. \`${valueKey}\` is greater than the maximum of 1200.`,
					fieldPath,
				);
			});
		}
		// If value is not a natural number then it is invalid
		if (!isNaturalNumber(value)) {
			errorAggregator.catch(() => {
				throw new ValidationError(
					`Invalid value for \`${valueKey}\`: \`${value}\`. \`${valueKey}\` must be a natural number.`,
					fieldPath,
				);
			});
		}

		errorAggregator.throwAll();
	}
}

// ECON FUNCTION DATES ROW
export interface IDatesRowData {
	readonly startDate: string;
	readonly endDate: string;
}

export class StartEndDatesCriteria implements IRowValidator {
	acceptedProperties = ['dates'];

	public validate(row: Record<string, unknown>, fieldPath: string | undefined): void {
		const errorAggregator = new ValidationErrorAggregator();
		const startDate = row.dates as unknown as string;
		errorAggregator.catch(() => {
			this.validateDateValue(startDate, fieldPath);
		});
		errorAggregator.throwAll();
	}

	public validateRows(context: RowsArrayContext): void {
		const { rows, location } = context;
		const errorAggregator = new ValidationErrorAggregator();

		if (rows.length === 1) {
			this.validateSingleRow(rows, location, errorAggregator);
		} else {
			this.validateMultipleRows(rows, location, errorAggregator);
		}

		errorAggregator.throwAll();
	}

	private validateSingleRow(
		rows: Record<string, unknown>[],
		location: string,
		errorAggregator: ValidationErrorAggregator,
	) {
		const firstRowPath = `${location}[${0}]`;

		if (rows[0].dates) {
			errorAggregator.catch(() => {
				this.validate(rows[0], location);
			});
			const dates = this.createStartEndDates(rows[0].dates as string, 'Econ Limit');
			rows[0].dates = dates;
		} else {
			errorAggregator.catch(() => {
				throw new ValidationError(`Expected model to have \`dates\` property in the first row.`, firstRowPath);
			});
		}
	}

	private validateMultipleRows(
		rows: Record<string, unknown>[],
		location: string,
		errorAggregator: ValidationErrorAggregator,
	) {
		for (let index = 0; index < rows.length - 1; index++) {
			const currentRow = rows[index];
			const nextRow = rows[index + 1];

			const currentRowPath = `${location}[${index}]`;
			const nextRowPath = `${location}[${index + 1}]`;

			if (currentRow.dates && nextRow.dates) {
				this.validateRowWithDates(rows, index, currentRowPath, nextRowPath, errorAggregator);
			} else if (!currentRow.dates) {
				errorAggregator.catch(() => {
					throw new ValidationError(`Expected model to have \`dates\` property in row.`, currentRowPath);
				});
			} else {
				errorAggregator.catch(() => {
					throw new ValidationError(`Each row must contain the key \`dates\` which is missing.`, nextRowPath);
				});
			}
		}
	}

	private validateRowWithDates(
		rows: Record<string, unknown>[],
		index: number,
		currentRowPath: string,
		nextRowPath: string,
		errorAggregator: ValidationErrorAggregator,
	) {
		const currentRow = rows[index];
		const nextRow = rows[index + 1];

		// validate dates user input
		this.validate(currentRow, currentRowPath);
		this.validate(nextRow, nextRowPath);

		// transform dates into object that contains startDate and endDate
		const startDate = currentRow.dates as string;
		const nextStartDate = nextRow.dates as string;
		const endDate = getPreviousDayWithOffset(nextStartDate);
		const dates = this.createStartEndDates(startDate, endDate);

		rows[index].dates = dates;

		// The last row in the rows array must have an endDate of "Econ_Limit".
		if (index === rows.length - 2) {
			const dates = this.createStartEndDates(nextStartDate, 'Econ Limit');
			rows[index + 1].dates = dates;
		}

		// Ensure the startDate of nextDates must be at minimum one month after the startDate of currentDates in one month increments.
		const currentStartDateOffset = getDateWithOffset(startDate);
		const nextStartDateOffset = getDateWithOffset(nextStartDate);
		const monthsApart = getMonthsApart(currentStartDateOffset, nextStartDateOffset);
		if (monthsApart < 1) {
			errorAggregator.catch(() => {
				throw new ValidationError(
					`The \`dates\` of this row must be at minimum one month after the \`dates\` of the previous row in one month increments.`,
					nextRowPath,
				);
			});
		}
	}

	private validateDateValue(value: string, fieldPath: string | undefined): void {
		const errorAggregator = new ValidationErrorAggregator();
		if (!value) {
			errorAggregator.catch(() => {
				throw new ValidationError(
					`Invalid value for \`dates\`: \`${value}\`. \`dates\` is required and must be a string with the format of YYYY-MM-DD.`,
					fieldPath,
				);
			});
		}
		if (!isValidDate(value)) {
			errorAggregator.catch(() => {
				throw new ValidationError(
					`Invalid value for \`dates\`: \`${value}\`. \`dates\` must be a string of the format YYYY-MM-DD.`,
					fieldPath,
				);
			});
		} else {
			// Ensure date is not beyond the maximum date
			const date = getDateWithOffset(value);
			if (date > getDateWithOffset(MAX_DATE)) {
				errorAggregator.catch(() => {
					throw new ValidationError(
						`Invalid value for \`dates\`: \`${value}\`. \`dates\` can not be a date beyond 2262-04-01.`,
						fieldPath,
					);
				});
			}
			// Ensure the date does not have a value greater than 1 in the days position
			const day = date.getDate();
			if (day > 1) {
				errorAggregator.catch(() => {
					throw new ValidationError(
						`Invalid value for \`dates\`: \`${day}\`. \`dates\` can not have a value greater than 01 for the days position.`,
						fieldPath,
					);
				});
			}
		}
		errorAggregator.throwAll();
	}

	private createStartEndDates = (startDate: string, endDate: string) => {
		return { startDate, endDate };
	};
}

export interface IStartEndRangeRowData {
	readonly start: number;
	readonly end: number | 'inf';
}

export class StartEndRateCriteria implements IRowValidator {
	key = '';
	acceptedProperties = ['waterRate', 'oilRate', 'gasRate', 'totalFluidRate'];

	validate(row: Record<string, unknown>, fieldPath?: string): void {
		const errorAggregator = new ValidationErrorAggregator();

		if (!this.key) {
			this.setKey(row, fieldPath);
		}

		if (row[this.key] === undefined || row[this.key] === null) {
			errorAggregator.catch(() => {
				throw new ValidationError(
					`Invalid value for \`${this.key}\`: \`${row[this.key]}\`. \`${
						this.key
					}\` is required and must be a number larger than 0.`,
					fieldPath,
				);
			});
		} else {
			const { start } = get(row, this.key) as IStartEndPeriodRowData;

			errorAggregator.catch(() => {
				this.validateNumberValue(this.key, start, fieldPath);
			});
		}

		errorAggregator.throwAll();
	}

	validateRows(context: RowsArrayContext): void {
		const { rows, location } = context;
		const errorAggregator = new ValidationErrorAggregator();
		this.setKey(rows[0], location);
		const firstRowLocation = `${location}[${0}].${this.key}`;

		if (rows.length === 1) {
			errorAggregator.catch(() => {
				const start = get(rows[0], this.key) as number;
				const startEndPeriod = this.createStartEndRange(start);
				rows[0][this.key] = startEndPeriod;
				this.validate(rows[0], firstRowLocation);
			});

			errorAggregator.throwAll();
			return;
		}

		// Each StartEndRateCriteria row in the `rows` array must be continuous with the first row being the first key
		for (let index = 0; index < rows.length; index++) {
			const currentRow = rows[index];
			const nextRow = rows[index + 1];
			const nextRowPath = `${location}[${index + 1}]`;

			const currentStart = get(currentRow, this.key) as number;
			const nextStart = get(nextRow, this.key) as number;

			// If nextRow does not contain the key then it is invalid
			if (!currentRow) {
				errorAggregator.catch(() => {
					throw new ValidationError(
						`Each row must contain the key \`${this.key}\` which is missing.`,
						nextRowPath,
					);
				});
			}

			if (currentRow && (currentStart || currentStart === 0)) {
				// Ensure that nextStart is greater than currentStart by at least 1
				if (nextStart && nextStart < currentStart + 1) {
					errorAggregator.catch(() => {
						throw new ValidationError(
							`The value of \`${this.key}\` in this row must be greater than the value of \`${this.key}\` in the previous row.`,
							nextRowPath,
						);
					});
				} else {
					errorAggregator.catch(() => {
						const start = get(rows[index], this.key) as number;
						const startEndRate = this.createStartEndRange(start, nextStart);
						rows[index][this.key] = startEndRate;
						this.validate(rows[index], firstRowLocation);
					});
				}
			}
		}

		errorAggregator.throwAll();
	}

	private validateNumberValue(valueKey: string, value: number, fieldPath?: string): void {
		const errorAggregator = new ValidationErrorAggregator();
		errorAggregator.catch(() => {
			if (!value && value !== 0) {
				throw new ValidationError(
					`Invalid value for \`${valueKey}\`: \`${value}\`. \`${valueKey}\` is required and must be a number larger than 0.`,
					fieldPath,
				);
			}
			if (!isNumber(value)) {
				throw new ValidationError(
					`Invalid value for \`${valueKey}\`: \`${value}\`. \`${valueKey}\` must be a number.`,
					fieldPath,
				);
			}
		});
		if (value < 0) {
			errorAggregator.catch(() => {
				throw new ValidationError(
					`Invalid value for \`${valueKey}\`: \`${value}\`. \`${valueKey}\` is less than the minimum of 0.`,
					fieldPath,
				);
			});
		}
		if (value > 10000000000) {
			errorAggregator.catch(() => {
				throw new ValidationError(
					`Invalid value for \`${valueKey}\`: \`${value}\`. \`${valueKey}\` is greater than the maximum of 10000000000.`,
					fieldPath,
				);
			});
		}

		errorAggregator.throwAll();
	}

	private setKey(record: Record<string, unknown>, fieldPath?: string): void {
		const rowKey = Object.keys(record).find((prop) => this.acceptedProperties.includes(prop));
		if (!rowKey) {
			throw new ValidationError(
				`Rows key not supported. Supported values : ${this.acceptedProperties.join(', ')}`,
				fieldPath,
			);
		}
		this.key = rowKey;
	}

	private createStartEndRange = (start: number, nextStart?: number) => {
		const end = nextStart ? nextStart : 'inf';
		return { start, end };
	};
}
