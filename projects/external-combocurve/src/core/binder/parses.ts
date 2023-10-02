import {
	getSort,
	parseBoolean,
	parseNumber,
	parseObjectId,
	parseString,
	ValidationError,
} from '@src/helpers/validation';

import { InvalidValue, ParseFN, ParseInput, ParseOutput } from '../common';
import { PaginatedRequest } from '../requests/mongo';

const convertErrorToObj = (error: unknown) => {
	const { message, name } = error as ValidationError;
	return {
		errorMsg: message,
		errorReason: name,
	};
};

const toNumber = (value: unknown): ParseOutput => {
	if (value !== undefined) {
		let aux = -1;

		if (typeof value === 'number') {
			aux = value;
		}

		if (typeof value === 'string') {
			aux = +value;
		}

		if (aux > 0) {
			return { parsedValue: aux };
		}
	}

	return {
		errorMsg: 'skip value must be a positive integer',
		errorReason: 'invalid skip value',
	};
};

export const appParses: Record<string, ParseFN> = {
	string: function (input: ParseInput): ParseOutput {
		try {
			const choices = input.requirements?.validValues as string[] | undefined;
			const maxLength = input.requirements?.maxLength || 16384;

			const parsedValue = parseString(input.value, input.location, choices, maxLength);

			return checkInvalidValue(input, parsedValue);
		} catch (error) {
			return convertErrorToObj(error);
		}
	},
	number: function (input: ParseInput): ParseOutput {
		try {
			const [max, min] = input.requirements?.range || [-Infinity, Infinity];
			const parsedValue = parseNumber(input.value, input.location, max, min);
			return { parsedValue };
		} catch (error) {
			return convertErrorToObj(error);
		}
	},
	boolean: function (input: ParseInput): ParseOutput {
		try {
			const parsedValue = parseBoolean(input.value, input.location);
			return { parsedValue };
		} catch (error) {
			return convertErrorToObj(error);
		}
	},
	sort: function (input: ParseInput): ParseOutput {
		try {
			const fields = input.requirements?.validValues as string[] | ['_id'];
			const parsedValue = getSort(input.value, input.location, fields);
			return { parsedValue };
		} catch (error) {
			return convertErrorToObj(error);
		}
	},
	page: function (input: ParseInput): ParseOutput {
		return this['number'](input);
	},
	skip: function (input: ParseInput): ParseOutput {
		return toNumber(input.value);
	},
	take: function (input: ParseInput): ParseOutput {
		const result = toNumber(input.value);
		if (result.parsedValue !== undefined && input.model instanceof PaginatedRequest) {
			const request = input.model as PaginatedRequest<unknown, unknown>;
			const aux = result.parsedValue as number;

			if (aux > request.maxPageSize) {
				return {
					errorMsg: `take value must be less than ${request.maxPageSize}`,
					errorReason: 'invalid take value',
				};
			}
		}

		return result;
	},
	objectID: function (input: ParseInput): ParseOutput {
		try {
			const parsedValue = parseObjectId(input.value, input.location);
			return { parsedValue };
		} catch (error) {
			return convertErrorToObj(error);
		}
	},
};

function checkInvalidValue(input: ParseInput, parsedValue: unknown): ParseOutput {
	const invalidValues = input.requirements?.invalidValues as InvalidValue[] | undefined;
	if (invalidValues) {
		const invalid = invalidValues.find((invalidValue) => {
			return invalidValue.value === parsedValue;
		});

		if (invalid) {
			return {
				errorMsg: `invalid value for ${input.name}. ${invalid.reason}`,
				errorReason: invalid.reason,
			};
		}
	}

	return { parsedValue };
}
