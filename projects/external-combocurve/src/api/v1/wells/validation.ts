import { groupBy, isNil } from 'lodash';
import { Types } from 'mongoose';

import {
	DifferentDataSourceError,
	FieldNameError,
	isObject,
	isString,
	parseObjectId,
	RequestStructureError,
	RequiredFieldError,
	RequiredFilterError,
	ValidationError,
	ValueError,
} from '@src/helpers/validation';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { IUpdate } from '@src/api/v1/fields';
import { IWell } from '@src/models/wells';
import { notNil } from '@src/helpers/typing';
import { WellService } from '@src/services/well-service';

import { ProjectResolved } from '../projects/wells/fields';
import { ValidationErrorAggregator } from '../multi-error';

import {
	ApiWell,
	ApiWellKey,
	getChosenId,
	getConditionallyRequiredFields,
	getRequiredFields,
	getWellField,
	IReplace,
	PotentialChosenId,
	potentialChosenIds,
	toIReplace,
	toPartialWell,
	WellField,
} from './fields';
import { isCreate, isReplace, UpsertEntry } from './upsert-types';

export const ERROR_ON_EXTRANEOUS_FIELDS = true;

export class WellExistsError extends ValidationError {
	constructor(message?: string, location?: string, chosenId?: string) {
		super(message, location);
		this.details.chosenID = chosenId;
		this.name = WellExistsError.name;
	}
}

export class WellNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, chosenId?: string, statusCode = 404) {
		super(message, location, WellNotFoundError.name, statusCode, chosenId);
	}
}

export class DuplicateIdentifierError extends ValidationError {
	constructor(message?: string, location?: string, chosenId?: string) {
		super(message, location);
		this.details.chosenID = chosenId;
		this.name = DuplicateIdentifierError.name;
	}
}

export class KeyFieldModificationError extends ValidationError {
	constructor(message?: string, location?: string, chosenId?: string) {
		super(message, location);
		this.details.chosenID = chosenId;
		this.name = KeyFieldModificationError.name;
	}
}

export class ReadOnlyFieldError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = ReadOnlyFieldError.name;
	}
}

export class NonNullableFieldError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = NonNullableFieldError.name;
	}
}

const errorLocation = (field: string, index?: number) => (index !== undefined ? `[${index}].${field}` : field);

const parseValue = ({
	value,
	field,
	fieldName,
	index,
	allowNull = false,
}: {
	value: unknown;
	field: WellField;
	fieldName: string;
	index?: number;
	allowNull: boolean;
}) => {
	const coercedValue = value as ApiWell[ApiWellKey];

	if (allowNull && isNil(coercedValue)) {
		return coercedValue;
	}

	const { parse } = field;

	try {
		return parse ? parse(value) : coercedValue;
	} catch (e) {
		if (e instanceof ValidationError) {
			e.details.location = errorLocation(fieldName, index);
		}
		throw e;
	}
};

export const parseApiWell = (value: Record<string, unknown>, index?: number, allowNull = false): ApiWell => {
	const well: Record<string, ApiWell[ApiWellKey]> = {};
	const dataSource = isString(value['dataSource']) ? value['dataSource'] : undefined;
	const chosenIds = Object.fromEntries(
		potentialChosenIds.map((potentialId) => [
			potentialId,
			isString(value[potentialId]) ? value[potentialId] : undefined,
		]),
	) as Record<PotentialChosenId, string | undefined>;
	const requiredFieldsSet = new Set(getRequiredFields({ dataSource, ...chosenIds }));

	const errorAggregator = new ValidationErrorAggregator();
	const chosenId = isString(value['chosenID']) ? value['chosenID'] : undefined;
	errorAggregator.setChosenId(chosenId);

	const entries = allowNull ? Object.entries(value) : Object.entries(value).filter(([, value]) => notNil(value));

	entries.forEach(([fieldName, value]) =>
		errorAggregator.catch(() => {
			const wellField = getWellField(fieldName, { dataSource, ...chosenIds } as ApiWell);

			if (!wellField) {
				if (ERROR_ON_EXTRANEOUS_FIELDS) {
					throw new FieldNameError(`\`${fieldName}\` is not a valid field name`, `[${index}]`);
				}
				return;
			}

			const validFieldName = fieldName as ApiWellKey;

			const { write, options: { isNullable, isRequired } = {} } = wellField;

			if (requiredFieldsSet.has(validFieldName)) {
				requiredFieldsSet.delete(validFieldName);
			}

			if (allowNull && !isNullable && isRequired && isNil(value)) {
				throw new NonNullableFieldError(`Required field \`${fieldName}\` is not nullable`, `[${index}]`);
			}

			if (!write && validFieldName !== 'id') {
				// `id` is read-only but we want to allow it in PUT
				throw new ReadOnlyFieldError(
					`Cannot write to read-only field \`${fieldName}\`. Please remove it from the input data`,
					`[${index}]`,
				);
			}

			well[validFieldName] = parseValue({ value, field: wellField, fieldName, index, allowNull });
		}),
	);

	const conditionallyRequiredFields = getConditionallyRequiredFields(well);
	conditionallyRequiredFields.forEach((fieldName) => {
		if (well[fieldName] === undefined) {
			requiredFieldsSet.add(fieldName);
		}
	});

	[...requiredFieldsSet].forEach((field) =>
		errorAggregator.catch(() => {
			throw new RequiredFieldError(`Missing required field: \`${field}\``, `[${index}]`);
		}),
	);

	errorAggregator.throwAll();

	return well;
};

export const parsePostWells = async (
	data: unknown[],
	service: WellService,
	errorAggregator: ValidationErrorAggregator,
	project: Types.ObjectId | null = null,
): Promise<Array<IWell | undefined>> => {
	let wells = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid well data structure', `[${index}]`);
			}
			const apiWell = parseApiWell(element, index);
			const well = service.toDbWell(apiWell);
			well.project = project;

			return well;
		}),
	);

	// check for duplicate chosen id
	const filteredIndexes = [...wells.keys()].filter((index) => wells[index]?.chosenID);
	const idIndexMap: Record<string, number[] | undefined> = groupBy(
		filteredIndexes,
		(index: number) => wells[index]?.chosenID,
	);
	Object.entries(idIndexMap).forEach(([chosenID, indexes]) =>
		errorAggregator.catch(() => {
			if (indexes && indexes.length > 1) {
				indexes.forEach((i) => (wells[i] = undefined));
				throw new DuplicateIdentifierError(
					`Duplicate identifier value: \`${chosenID}\``,
					indexes.map((i) => `[${i}]`).join(', '),
					chosenID,
				);
			}
		}),
	);

	const firstValid = wells.find((w) => w);
	wells = wells.map((w, index) =>
		errorAggregator.catch(() => {
			if (w && w.dataSource !== firstValid?.dataSource) {
				throw new DifferentDataSourceError(
					`Different data source found: \`${w.dataSource}\`. All wells in a request must be from the same data source.`,
					`[${index}]`,
					w.chosenID,
				);
			}
			return w;
		}),
	);

	// check if at least one of the wells coming in the request already exists
	const existingIds = await service.getExistingChosenIds(wells.filter(notNil), project);
	existingIds.forEach((chosenId) =>
		errorAggregator.catch(() => {
			const indexes = idIndexMap[chosenId];
			indexes?.forEach((i) => (wells[i] = undefined));
			throw new WellExistsError(
				`Well with identifier \`${chosenId}\` already exists`,
				indexes?.map((i) => `[${i}]`).join(', '),
				chosenId,
			);
		}),
	);

	return wells;
};

export const parsePutWell = async (
	data: unknown,
	id: string,
	service: WellService,
	project: ProjectResolved | null = null,
): Promise<IReplace | null> => {
	if (!isObject(data)) {
		throw new RequestStructureError('Invalid well data structure', 'body');
	}

	const wellId = parseObjectId(id);

	const [matchingWell] = await service.getMatchingWellsById([wellId], {
		projection: ['chosenID', 'dataSource'],
		project: project?._id?.toString(),
		limit: 1,
	});
	if (!matchingWell) {
		return null;
	}

	const apiWell = { ...parseApiWell(data), id: wellId };
	const replace = toIReplace(apiWell);
	replace.update.project = project?._id;
	const { chosenID, dataSource } = replace.update;

	if (matchingWell.chosenID !== chosenID) {
		throw new KeyFieldModificationError(
			`Invalid identifier value: \`${chosenID}\`. Cannot change the identifier of an existing well`,
			undefined,
			chosenID,
		);
	}

	if (matchingWell.dataSource !== dataSource) {
		throw new KeyFieldModificationError(
			`Invalid dataSource value: \`${dataSource}\`. Cannot change the dataSource value of an existing well`,
			'dataSource',
			chosenID,
		);
	}

	return replace;
};

export const parsePutWells = async (
	data: unknown[],
	service: WellService,
	errorAggregator: ValidationErrorAggregator,
	project: ProjectResolved | null = null,
): Promise<{ replaces: Array<IReplace | undefined>; wellsToCreate: Array<IWell | undefined> }> => {
	let wells = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid well data structure', `[${index}]`);
			}

			return parseApiWell(element, index);
		}),
	);

	const firstValid = wells.find(notNil);
	wells = wells.map((w, index) =>
		errorAggregator.catch(() => {
			if (w && w.dataSource !== firstValid?.dataSource) {
				throw new DifferentDataSourceError(
					`Different data source found: \`${w.dataSource}\`. ` +
						'All wells in a request must be from the same data source.',
					`[${index}]`,
					w.chosenID,
				);
			}
			return w;
		}),
	);

	const matchingWells = await service.getMatchingWellsMixed(wells.filter(notNil), {
		projection: ['chosenID', 'dataSource'],
		project: project?._id?.toString(),
	});

	const entries = wells.map<UpsertEntry | undefined>((w, index) =>
		errorAggregator.catch(() => {
			if (w === undefined) {
				return undefined;
			}
			const { id, dataSource } = w;
			const chosenID = getChosenId(w);

			const matching = matchingWells.find(({ _id, chosenID: matchChosenId }) =>
				id ? _id.toString() === id.toString() : chosenID === matchChosenId,
			);

			if (!matching) {
				const well = service.toDbWell(w);
				well.project = project?._id ?? null;
				return { type: 'create', well };
			}

			if (matching.chosenID !== chosenID) {
				throw new KeyFieldModificationError(
					`Invalid identifier value: \`${chosenID}\`. Cannot change the identifier of an existing well`,
					`[${index}]`,
					chosenID,
				);
			}

			if (matching.dataSource !== dataSource) {
				throw new KeyFieldModificationError(
					`Invalid dataSource value: \`${dataSource}\`. Cannot change the dataSource value of an existing well`,
					`[${index}].dataSource`,
					chosenID,
				);
			}

			const replace = toIReplace({ ...w, id: matching._id });
			replace.update.project = project?._id ?? null;

			return { type: 'replace', replace };
		}),
	);

	const wellsToCreate = entries.map((entry) => (isCreate(entry) ? entry.well : undefined));
	const replaces = entries.map((entry) => (isReplace(entry) ? entry.replace : undefined));

	return {
		replaces,
		wellsToCreate,
	};
};

export const parsePatchWell = async (
	data: unknown,
	id: string,
	service: WellService,
	project: ProjectResolved | null = null,
): Promise<IUpdate<IWell> | null> => {
	if (!isObject(data)) {
		throw new RequestStructureError('Invalid well data structure', 'body');
	}

	const wellId = parseObjectId(id);

	const [matchingWell] = await service.getMatchingWellsById([wellId], {
		projection: ['chosenID', 'dataSource'],
		limit: 1,
		project: project?._id.toString(),
	});
	if (!matchingWell) {
		return null;
	}

	const index = undefined;
	const allowNull = true;

	const apiWell = { ...parseApiWell(data, index, allowNull), id: wellId };
	const update = toPartialWell(apiWell, wellId);
	update.update.project = project?._id ?? null;
	const { chosenID, dataSource } = update.update;

	if (chosenID && matchingWell.chosenID !== chosenID) {
		throw new KeyFieldModificationError(
			`Invalid identifier value: \`${chosenID}\`. Cannot change the identifier of an existing well`,
			undefined,
			chosenID,
		);
	}

	if (dataSource && matchingWell.dataSource !== dataSource) {
		throw new KeyFieldModificationError(
			`Invalid dataSource value: \`${dataSource}\`. Cannot change the dataSource value of an existing well`,
			'dataSource',
			chosenID,
		);
	}

	return update;
};

export const parsePatchWells = async (
	data: unknown[],
	service: WellService,
	errorAggregator: ValidationErrorAggregator,
	project: ProjectResolved | null = null,
): Promise<Array<IUpdate<IWell> | undefined>> => {
	const allowNull = true;
	let wells = data.map((element, index) =>
		errorAggregator.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid well data structure', `[${index}]`);
			}

			return parseApiWell(element, index, allowNull);
		}),
	);

	const firstValid = wells.find(notNil);
	wells = wells.map((w, index) =>
		errorAggregator.catch(() => {
			if (w && w.dataSource !== firstValid?.dataSource) {
				throw new DifferentDataSourceError(
					`Different data source found: \`${w.dataSource}\`. ` +
						'All wells in a request must be from the same data source.',
					`[${index}]`,
					w.chosenID,
				);
			}
			return w;
		}),
	);

	const matchingWells = await service.getMatchingWellsMixed(wells.filter(notNil), {
		projection: ['chosenID', 'dataSource'],
		project: project?._id.toString(),
	});

	const updates = wells.map((w, index) =>
		errorAggregator.catch(() => {
			if (w === undefined) {
				return undefined;
			}
			const { id, dataSource } = w;
			const chosenID = getChosenId(w);

			const matching = matchingWells.find(({ _id, chosenID: matchChosenId }) =>
				id ? _id.toString() === id.toString() : chosenID === matchChosenId,
			);

			if (!matching) {
				let message = id
					? `No well was found with id \`${id}\``
					: `No well was found with data source \`${dataSource}\` and chosen id \`${chosenID}\``;
				message = message + (project ? ` in project \`${project._id}:${project.name}\`` : ` in company scope`);
				throw new WellNotFoundError(message, `[${index}]`, chosenID);
			}

			if (chosenID && matching.chosenID !== chosenID) {
				throw new KeyFieldModificationError(
					`Invalid identifier value: \`${chosenID}\`. Cannot change the identifier of an existing well`,
					`[${index}]`,
					chosenID,
				);
			}

			if (dataSource && matching.dataSource !== dataSource) {
				throw new KeyFieldModificationError(
					`Invalid dataSource value: \`${dataSource}\`. Cannot change the dataSource value of an existing well`,
					`[${index}].dataSource`,
					chosenID,
				);
			}

			const update = toPartialWell(w, matching._id);
			update.update.project = project?._id ?? null;

			return update;
		}),
	);

	return updates;
};

export const validateDeleteFilters = (filters: ApiQueryFilters): void => {
	if (!filters['id'] && (!filters['chosenID'] || !filters['dataSource'])) {
		throw new RequiredFilterError(`Missing required filters: \`id\` or \`dataSource\` + \`chosenID\``);
	}
};

export const validateWellApiFormat = (value: string, fieldName: string, apiLength: number, location?: string): void => {
	const regex = new RegExp(`^\\d{${apiLength}}$`, 'g');
	if (!regex.test(value)) {
		throw new ValueError(
			`Invalid ${fieldName}: '${value}'. Must contain only digits and have a length of ${apiLength}.`,
			location,
		);
	}
};

export const validateChosenIDFormat = (value: string, fieldName: string, location?: string): void => {
	if (!/^[A-Za-z0-9]+$/g.test(value)) {
		throw new ValueError(`Invalid ${fieldName} format: only letters and numbers are allowed`, location);
	}
};
