import { groupBy } from 'lodash';
import { Types } from 'mongoose';

import {
	FieldNameError,
	isBoolean,
	isObject,
	isString,
	parseObjectId,
	RequestStructureError,
	ValueError,
} from '@src/helpers/validation';
import { isNil, isOneOf } from '@src/helpers/typing';
import { DATA_SOURCES } from '@src/models/wells';

import { DuplicateIdentifierError, WellNotFoundError } from '../validation';
import { ValidationErrorAggregator } from '../../multi-error';

import { ID_FIELDS, WellIdentifierRequest } from './service';

const VALID_PROPERTIES_NAME = ['dataSource', 'chosenKeyID', 'companyScope'] as const;

export const parsePatchWellIdentifier = (
	data: unknown[],
	errorAggregator: ValidationErrorAggregator,
): (WellIdentifierRequest | undefined)[] => {
	//check for proper structure
	const wellIdentifier = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid data structure', `[${index}]`);
			}
			return parseWellIdentifier(element, index);
		}),
	);

	// check for duplicate well id
	const filteredIndexes = [...wellIdentifier.keys()].filter((index) => wellIdentifier[index]?.wellId);
	const idIndexMap: Record<string, number[] | undefined> = groupBy(
		filteredIndexes,
		(index: number) => wellIdentifier[index]?.wellId,
	);
	Object.entries(idIndexMap).forEach(([wellId, indexes]) =>
		errorAggregator.catch(() => {
			if (indexes && indexes.length > 1) {
				indexes.forEach((i) => (wellIdentifier[i] = undefined));
				throw new DuplicateIdentifierError(
					`Duplicate identifier value: \`${wellId}\``,
					indexes.map((i) => `[${i}]`).join(', '),
				);
			}
		}),
	);

	return wellIdentifier;
};

const parseWellIdentifier = (value: Record<string, unknown>, index: number): WellIdentifierRequest | undefined => {
	if (!isObject(value.newInfo) || isNil(value.wellId)) {
		throw new RequestStructureError('Invalid data structure', `[${index}]`);
	}

	const errorAggregator = new ValidationErrorAggregator();

	const wellId = errorAggregator.catch(() => parseObjectId(value.wellId, `[${index}]`)) as Types.ObjectId;
	const newInfo = value.newInfo as Record<string, unknown>;
	Object.entries(newInfo).forEach(([prop]) =>
		errorAggregator.catch(() => {
			if (!isString(prop) || !isOneOf(prop, VALID_PROPERTIES_NAME)) {
				throw new FieldNameError(`\`${prop}\` is not a valid field name`, `[${index}]`);
			}
		}),
	);

	checkForValidPropertyAndValue(newInfo.dataSource, DATA_SOURCES, index, errorAggregator);
	checkForValidPropertyAndValue(newInfo.chosenKeyID, ID_FIELDS, index, errorAggregator);

	if (!isNil(newInfo.companyScope)) {
		if (!isBoolean(newInfo.companyScope)) {
			errorAggregator.catch(() => {
				throw new ValueError(
					`\`${newInfo.companyScope}\` is not a valid value for this field. Valid choices: \` true \`.`,
					`[${index}]`,
				);
			});
		}
	}

	errorAggregator.throwAll();

	return { ...(value as WellIdentifierRequest), wellId: wellId.toString() };
};

const checkForValidPropertyAndValue = <T extends string>(
	value: string | undefined | unknown,
	choices: readonly T[],
	index: number,
	errorAggregator: ValidationErrorAggregator,
): void => {
	if (value) {
		if (!isOneOf(value as T, choices)) {
			errorAggregator.catch(() => {
				throw new ValueError(
					`\`${value}\` is not a valid value for this field. Valid choices: \`${choices.join('`, `')}\`.`,
					`[${index}]`,
				);
			});
		}
	}
};

export const removeNotFoundWells = (
	wellIdentifierIds: string[],
	existingWells: string[],
	wellIdentifierRequest: (WellIdentifierRequest | undefined)[],
	errorAggregator: ValidationErrorAggregator,
): (WellIdentifierRequest | undefined)[] => {
	const wellIdentifier = [...wellIdentifierRequest];
	const wellsNotFound = wellIdentifierIds.filter((ew) => !existingWells.includes(ew));
	const invalidIndexes = wellsNotFound.map((wellId) =>
		wellIdentifier.findIndex((requestWell) => requestWell && requestWell.wellId.toString() === wellId),
	);

	invalidIndexes.forEach((index) =>
		errorAggregator.catch(() => {
			const wellId = wellIdentifier[index]?.wellId.toString();
			wellIdentifier[index] = undefined;
			throw new WellNotFoundError(`No well was found with id: \`${wellId}\``, `[${index}]`);
		}),
	);
	return wellIdentifier;
};
