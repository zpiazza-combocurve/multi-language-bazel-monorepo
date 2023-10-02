import { groupBy } from 'lodash';

import { FieldNameError, RequiredFieldError, ValidationError } from '@src/helpers/validation';
import { isNil, notNil } from '@src/helpers/typing';
import { IOwnershipQualifier } from '@src/models/econ/ownership-qualifiers';

import {
	ApiOwnershipQualifier,
	ApiOwnershipQualifierKey,
	getApiOwnershipQualifierField,
	getRequiredFields,
} from '../fields/ownership-qualifier';
import { ValidationErrorAggregator } from '../../multi-error';

export const ERROR_ON_EXTRANEOUS_FIELDS = true;
export const MAX_QUALIFIER_COUNT = 10;

export class OwnershipQualifierNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message, location, OwnershipQualifierNotFoundError.name, statusCode);
	}
}

export class DuplicateOwnershipQualifierError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = DuplicateOwnershipQualifierError.name;
	}
}

export class OwnershipQualifierCollisionError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = OwnershipQualifierCollisionError.name;
	}
}
export class OwnershipQualifierPerWellLimitError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = OwnershipQualifierPerWellLimitError.name;
	}
}

export class OwnershipQualifierLimitError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = OwnershipQualifierLimitError.name;
	}
}

export const errorLocation = (field: string, index?: number): string =>
	index !== undefined ? `[${index}].${field}` : field;

export const parseApiOwnershipQualifiers = (data: Record<string, unknown>, index?: number): ApiOwnershipQualifier => {
	const ownershipQualifier: Record<string, ApiOwnershipQualifier[ApiOwnershipQualifierKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const ownershipQualifierField = getApiOwnershipQualifierField(field);

				if (!ownershipQualifierField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, `[${index}]`);
					}
					return;
				}

				const { write, parse } = ownershipQualifierField;

				const parsedValue = parse
					? parse(value, errorLocation(field, index))
					: (value as ApiOwnershipQualifier[ApiOwnershipQualifierKey]);

				if (write) {
					ownershipQualifier[field] = parsedValue;
				}
			}),
		);

	const requiredFields = getRequiredFields(ownershipQualifier);

	requiredFields
		.filter((field) => isNil(data[field]))
		.forEach((field) =>
			errorAggregator.catch(() => {
				throw new RequiredFieldError(`Missing required field: \`${field}\``, `[${index}]`);
			}),
		);

	errorAggregator.throwAll();

	return ownershipQualifier;
};

interface IIdIndexMapEntry {
	wellId: string;
	qualifierKey: string;
	indexInList: number;
}

export const checkDuplicates = (
	ownershipQualifiers: Array<IOwnershipQualifier | undefined>,
	errorAggregator?: ValidationErrorAggregator,
): Array<IOwnershipQualifier | undefined> => {
	const filtered = ownershipQualifiers
		.map((ownershipQualifier, indexInList) => ({
			wellId: ownershipQualifier?.well?.toString(),
			qualifierKey: ownershipQualifier?.qualifierKey,
			indexInList,
		}))
		.filter(({ wellId, qualifierKey }) => wellId && qualifierKey);

	const idIndexMap: Record<string, IIdIndexMapEntry[] | undefined> = groupBy(
		filtered,
		({ wellId, qualifierKey }: IIdIndexMapEntry) => `${wellId}|${qualifierKey}`,
	) as Record<string, IIdIndexMapEntry[] | undefined>;

	const actualErrorAggregator = errorAggregator ?? new ValidationErrorAggregator();

	const validProduction = [...ownershipQualifiers];

	Object.values(idIndexMap).forEach((occurrences) =>
		actualErrorAggregator.catch(() => {
			if (occurrences && occurrences.length > 1) {
				const { wellId, qualifierKey } = occurrences[0];

				occurrences.forEach(({ indexInList }) => (validProduction[indexInList] = undefined));

				throw new DuplicateOwnershipQualifierError(
					`More than one ownership qualifier data supplied for well \`${wellId}\` ` +
						`and qualifier key \`${qualifierKey}\``,
					occurrences.map(({ indexInList }) => `[${indexInList}]`).join(', '),
				);
			}
		}),
	);

	if (!errorAggregator) {
		actualErrorAggregator.throwAll();
	}

	return validProduction;
};

export const checkMaxQualifiersCount = (
	ownershipQualifiers: Array<IOwnershipQualifier | undefined>,
	wellsCountMapping: Record<string, number>,
	errorAggregator?: ValidationErrorAggregator,
): Array<IOwnershipQualifier | undefined> => {
	const filtered = ownershipQualifiers
		.map((ownershipQualifier, indexInList) => ({
			wellId: ownershipQualifier?.well?.toString(),
			indexInList,
		}))
		.filter(({ wellId }) => wellId);
	const wellIndexMap: Record<string, Pick<IIdIndexMapEntry, 'wellId' | 'indexInList'>[] | undefined> = groupBy(
		filtered,
		({ wellId }: Pick<IIdIndexMapEntry, 'wellId' | 'indexInList'>) => wellId,
	) as Record<string, Pick<IIdIndexMapEntry, 'wellId' | 'indexInList'>[] | undefined>;

	const actualErrorAggregator = errorAggregator ?? new ValidationErrorAggregator();

	const validProduction = [...ownershipQualifiers];

	Object.values(wellIndexMap).forEach((occurrences) =>
		actualErrorAggregator.catch(() => {
			if (occurrences && occurrences.length > 1) {
				const { wellId } = occurrences[0];
				const dbCount = wellsCountMapping[wellId];
				const allowedQuantity = MAX_QUALIFIER_COUNT - dbCount;

				if (occurrences.length > allowedQuantity) {
					occurrences
						.splice(allowedQuantity)
						.forEach(({ indexInList }) => (validProduction[indexInList] = undefined));

					throw new OwnershipQualifierPerWellLimitError(
						`Ownership qualifier limit exceeded for well \`${wellId}\`. Up to ${MAX_QUALIFIER_COUNT} qualifiers are allowed per well`,
						occurrences
							.splice(allowedQuantity)
							.map(({ indexInList }) => `[${indexInList}]`)
							.join(', '),
					);
				}
			}
		}),
	);

	if (!errorAggregator) {
		actualErrorAggregator.throwAll();
	}

	return validProduction;
};
