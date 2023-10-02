import { groupBy, isString, keyBy } from 'lodash';
import moment from 'moment';
import { Types } from 'mongoose';

import {
	DifferentDataSourceError,
	FieldNameError,
	isObject,
	RequestStructureError,
	RequiredFieldError,
	ValidationError,
} from '@src/helpers/validation';
import { isNil, notNil } from '@src/helpers/typing';
import { indexToDate } from '@src/helpers/dates';
import { ISingleMonthlyProduction } from '@src/helpers/single-production';
import { MonthlyProductionService } from '@src/services/monthly-productions-service';

import { BaseProjectResolved } from '../projects/fields';
import { ValidationErrorAggregator } from '../multi-error';
import { WellNotFoundError } from '../wells/validation';

import {
	ApiMonthlyProduction,
	ApiMonthlyProductionKey,
	getApiMonthlyProductionField,
	getRequiredFields,
	toISingleMonthlyProduction,
} from './fields';

export const ERROR_ON_EXTRANEOUS_FIELDS = true;

export class ProductionCollisionError extends ValidationError {
	constructor(message?: string, location?: string, chosenId?: string) {
		super(message, location, ProductionCollisionError.name);
		this.details.chosenID = chosenId;
	}
}

export class DuplicateProductionError extends ValidationError {
	constructor(message?: string, location?: string, chosenId?: string) {
		super(message, location, DuplicateProductionError.name);
		this.details.chosenID = chosenId;
	}
}

const errorLocation = (field: string, index?: number) => (index !== undefined ? `[${index}].${field}` : field);

export const parseApiMonthlyProduction = (value: Record<string, unknown>, index?: number): ApiMonthlyProduction => {
	const production: Record<string, ApiMonthlyProduction[ApiMonthlyProductionKey]> = {};
	const chosenId = isString(value['chosenID']) ? value['chosenID'] : undefined;

	const errorAggregator = new ValidationErrorAggregator();
	errorAggregator.setChosenId(chosenId);

	Object.entries(value)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const wellField = getApiMonthlyProductionField(field);

				if (!wellField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, `[${index}]`);
					}
					return;
				}

				const { write, parse } = wellField;

				let parsedValue;
				try {
					parsedValue = parse ? parse(value) : (value as ApiMonthlyProduction[ApiMonthlyProductionKey]);
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
				} catch (e: any) {
					e.details.location = errorLocation(field, index);
					throw e;
				}

				if (write) {
					production[field] = parsedValue;
				}
			}),
		);

	const requiredFields = getRequiredFields(production);
	requiredFields
		.filter((field) => isNil(value[field]))
		.forEach((field) =>
			errorAggregator.catch(() => {
				throw new RequiredFieldError(`Missing required field: \`${field}\``, `[${index}]`);
			}),
		);

	errorAggregator.throwAll();

	return production;
};

interface IIdIndexMapEntry {
	wellId: string;
	index: number;
	indexInList: number;
}

export const checkDuplicateProduction = (
	production: Array<ISingleMonthlyProduction | undefined>,
	wellIdToChosenIdMap: Map<string, string>,
	errorAggregator?: ValidationErrorAggregator,
): Array<ISingleMonthlyProduction | undefined> => {
	const filtered = production
		.map((prod, indexInList) => ({ wellId: prod?.well?.toString(), index: prod?.index, indexInList }))
		.filter(({ wellId, index }) => wellId && index);
	const idIndexMap: Record<string, IIdIndexMapEntry[] | undefined> = groupBy(
		filtered,
		({ wellId, index }: IIdIndexMapEntry) => `${wellId}|${index}`,
	) as Record<string, IIdIndexMapEntry[] | undefined>;

	const actualErrorAggregator = errorAggregator ?? new ValidationErrorAggregator();

	const validProduction = [...production];

	Object.values(idIndexMap).forEach((occurrences) =>
		actualErrorAggregator.catch(() => {
			if (occurrences && occurrences.length > 1) {
				const { wellId, index } = occurrences[0];
				const date = indexToDate(index);
				const chosenID = wellIdToChosenIdMap.get(wellId);

				occurrences.forEach(({ indexInList }) => (validProduction[indexInList] = undefined));

				throw new DuplicateProductionError(
					`More than one production data supplied for well \`${wellId}\` ` +
						`in \`${moment(date).utc().format('YYYY-MM')}\``,
					occurrences.map(({ indexInList }) => `[${indexInList}]`).join(', '),
					chosenID,
				);
			}
		}),
	);

	if (!errorAggregator) {
		actualErrorAggregator.throwAll();
	}

	return validProduction;
};

export const parsePostMonthlyProductions = async (
	data: unknown[],
	service: MonthlyProductionService,
	errorAggregator: ValidationErrorAggregator,
	project: BaseProjectResolved | null = null,
): Promise<Array<ISingleMonthlyProduction | undefined>> => {
	let apiProduction = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid production data structure', `[${index}]`);
			}
			return parseApiMonthlyProduction(element, index);
		}),
	);

	const dataSource = apiProduction.find((prod) => prod && notNil(prod.dataSource))?.dataSource;
	apiProduction = apiProduction.map((prod, index) =>
		errorAggregator.catch(() => {
			if (prod?.dataSource && prod.dataSource !== dataSource) {
				throw new DifferentDataSourceError(
					`Different data source found: \`${prod.dataSource}\`. All records in a request must be from the same data source.`,
					`[${index}]`,
					prod.chosenID,
				);
			}
			return prod;
		}),
	);

	const prodWithFoundIds = await service.getWellsIds(apiProduction, project?._id.toString());
	apiProduction = prodWithFoundIds.map((prod, index) =>
		errorAggregator.catch(() => {
			if (prod && !prod.well) {
				const { well, dataSource, chosenID } = apiProduction[index] ?? {};
				let message = well
					? `No well was found with id \`${well}\``
					: `No well was found with data source \`${dataSource}\` and chosen id \`${chosenID}\``;
				message = message + (project ? ` in project \`${project._id}:${project.name}\`` : ` in company scope`);
				throw new WellNotFoundError(message, `[${index}]`, chosenID);
			}
			return prod;
		}),
	);

	const wellIdToChosenIdMap = mapWellIdToChosenId(apiProduction);
	let production = apiProduction.map((prod) => prod && toISingleMonthlyProduction(prod));
	production = checkDuplicateProduction(production, wellIdToChosenIdMap, errorAggregator);

	const matchesProductions = await service.findMatches(production.filter(notNil));
	const existingProductions = keyBy(matchesProductions, ({ well, index }) => `${well}|${index}`);
	production = production.map((prod, indexInList) =>
		errorAggregator.catch(() => {
			if (prod === undefined) {
				return undefined;
			}
			const { well, index } = prod;

			if (well === undefined || index === undefined) {
				return undefined;
			}

			const wellIdStr = well.toString();
			const match = existingProductions[`${wellIdStr}|${index}`];

			if (!match) {
				return prod;
			}

			const date = moment(indexToDate(index)).utc().format('YYYY-MM');
			const chosenID = wellIdToChosenIdMap.get(wellIdStr);
			throw new ProductionCollisionError(
				`Production data for well \`${well}\` in \`${date}\` already exist`,
				`[${indexInList}]`,
				chosenID,
			);
		}),
	);

	return production;
};

export const parsePutMonthlyProductions = async (
	data: unknown[],
	service: MonthlyProductionService,
	errorAggregator: ValidationErrorAggregator,
	project: BaseProjectResolved | null = null,
): Promise<Array<ISingleMonthlyProduction | undefined>> => {
	let apiProduction = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid production data structure', `[${index}]`);
			}
			return parseApiMonthlyProduction(element, index);
		}),
	);

	const dataSource = apiProduction.find((prod) => prod && notNil(prod.dataSource))?.dataSource;
	apiProduction = apiProduction.map((prod, index) =>
		errorAggregator.catch(() => {
			if (prod?.dataSource && prod.dataSource !== dataSource) {
				throw new DifferentDataSourceError(
					`Different data source found: \`${prod.dataSource}\`. All records in a request must be from the same data source.`,
					`[${index}]`,
					prod.chosenID,
				);
			}
			return prod;
		}),
	);

	const prodWithFoundIds = await service.getWellsIds(apiProduction, project?._id?.toString());
	apiProduction = prodWithFoundIds.map((prod, index) =>
		errorAggregator.catch(() => {
			if (prod && !prod.well) {
				const { well, dataSource, chosenID } = apiProduction[index] ?? {};
				let message = well
					? `No well was found with id \`${well}\``
					: `No well was found with data source \`${dataSource}\` and chosen id \`${chosenID}\``;
				message = message + (project ? ` in project \`${project._id}:${project.name}\`` : ` in company scope`);
				throw new WellNotFoundError(message, `[${index}]`, chosenID);
			}
			return prod;
		}),
	);

	const wellIdToChosenIdMap = mapWellIdToChosenId(apiProduction);
	let production = apiProduction.map((prod) => prod && toISingleMonthlyProduction(prod));
	production = checkDuplicateProduction(production, wellIdToChosenIdMap, errorAggregator);

	return production;
};

const mapWellIdToChosenId = (apiProduction: (ApiMonthlyProduction | undefined)[]) =>
	new Map<string, string>(
		apiProduction
			.filter((x): x is typeof x & { well: Types.ObjectId; chosenID: string } => !!x?.well && !!x?.chosenID)
			.map((x) => [x.well.toString(), x.chosenID]),
	);
