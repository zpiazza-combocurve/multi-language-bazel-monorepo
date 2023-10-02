import { ValidationError } from '@src/helpers/validation';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

export type NumberDecimalValidation = {
	valueRange: { min: number; max: number };
	decimalScale: number;
};

export type RowsArrayContext = {
	rows: Record<string, unknown>[];
	location: string;
	firstRowValidation?: (row: Record<string, unknown>, location: string) => void;
} & Partial<NumberDecimalValidation>;

export interface IRowValidator {
	acceptedProperties: string[];
	validate(rowObject: Record<string, unknown>, fieldPath: string | undefined): void;
	validateRows(context: RowsArrayContext): void;
}

export type RowContext = {
	rowObject: Record<string, unknown>;
	location: string | undefined;
};

export const validateMinMaxValues = (
	valuePropertyName: string,
	propertyValue: number,
	min: number,
	max: number,
	location?: string,
): void => {
	const errorAggregator = new ValidationErrorAggregator();
	errorAggregator.catch(() => {
		if (propertyValue < min) {
			throw new ValidationError(
				`Invalid value for \`${valuePropertyName}\`: ${propertyValue} is less than the minimum of ${min}.`,
				location,
			);
		}
		if (propertyValue > max) {
			throw new ValidationError(
				`Invalid value for \`${valuePropertyName}\`: ${propertyValue} is greater than the maximum of ${max}.`,
				location,
			);
		}
	});
	errorAggregator.throwAll();
};

export const validateDecimalScale = (
	maxScale: number,
	propertyName: string,
	propertyValue: number,
	location?: string,
): void => {
	const errorAggregator = new ValidationErrorAggregator();
	const valueScale = getDecimalScale(propertyValue);
	errorAggregator.catch(() => {
		if (valueScale > maxScale) {
			throw new ValidationError(
				`Invalid value for \`${propertyName}\`: ${propertyName} has a decimal scale of ${valueScale}. Decimal scale can not be greater than ${maxScale}.`,
				location,
			);
		}
	});
	errorAggregator.throwAll();
};

export const getDecimalScale = (num: number): number => {
	// Convert the number to a string
	const str = num.toString();

	// Find the index of the decimal point or "e" (if in scientific notation)
	const decimalIndex =
		str.indexOf('.') !== -1
			? str.indexOf('.')
			: str.indexOf('e') !== -1
			? str.indexOf('e')
			: str.indexOf('E') !== -1
			? str.indexOf('E')
			: str.length;

	// Calculate the decimal scale
	let decimalScale = 0;
	if (decimalIndex !== str.length) {
		decimalScale = str.length - decimalIndex - 1;
	}

	return decimalScale;
};

export const validateKeyLength = <T extends Record<string, unknown>>(
	row: T,
	location: string,
	keyLength: number,
): void => {
	const errorAggregator = new ValidationErrorAggregator();
	const objKeys = Object.keys(row);
	errorAggregator.catch(() => {
		if (objKeys.length !== keyLength) {
			throw new ValidationError(
				`There can only be ${keyLength} properties the Model row, but there are ${
					objKeys.length
				}. Properties submitted are: ${objKeys.join(', ')}.`,
				location,
			);
		}
	});
	errorAggregator.throwAll();
};

export const isNaturalNumber = (value: number): boolean => {
	return value > 0 && Number.isInteger(value);
};
