import { get, set } from 'lodash';

import {
	BOOLEAN_FIELD,
	DATE_FIELD,
	IFieldDefinition,
	NUMBER_FIELD,
	OBJECT_ID_FIELD,
	STRING_FIELD,
} from '@src/helpers/fields';
import { isBoolean, isNumber, parseBoolean, parseNumberStrict, TypeError } from '@src/helpers/validation';
import { isNil, notNil } from '@src/helpers/typing';
import { IBaseEconModel } from '@src/models/econ/econ-models';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { ParsedQueryValue } from '@src/helpers/fields/field-definition';

import { IField, IReadFieldOptions, IReadWriteFieldOptions, readDbField, readWriteDbField } from '../../fields';

import { IEconFunctionRow } from './row-fields/econ-function-row-fields';

export type IEconModelField<T> = IField<IBaseEconModel, T>;

const readField = <K extends keyof IBaseEconModel, TParsed = IBaseEconModel[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadFieldOptions = {},
) => readDbField<IBaseEconModel, K, TParsed>(key, definition, options);

const readEmptyWriteField = <K extends keyof IBaseEconModel>(
	key: K,
	definition: IFieldDefinition<IBaseEconModel[K]>,
	options: IReadFieldOptions = {},
): IEconModelField<IBaseEconModel[K]> => {
	return {
		...readField(key, definition, options),
		write: () => {
			// do nothing
		},
	};
};

export const readWriteYesNoDbField = <T>(key: keyof T): IField<T, boolean | string | undefined> => ({
	...BOOLEAN_FIELD,
	read: (value) => {
		const databaseValue = get(value, key) as string;

		if (!databaseValue) {
			return undefined;
		}

		return databaseValue && databaseValue.toLowerCase() == 'yes';
	},
	write: (row: IEconFunctionRow, value: boolean | number | string | undefined) => {
		if (notNil(value)) {
			const valueToSave: string | number = value ? 'yes' : 'no';
			set(row, key, valueToSave);
		}
	},
});

export const readWriteNullableNumberDbField = <T>(key: keyof T): IField<T, number | null | undefined | string> => ({
	...NUMBER_FIELD,
	read: (value) => {
		const databaseValue = get(value, key);

		if (!databaseValue && databaseValue !== 0) {
			return null;
		}

		return parseNumberStrict(databaseValue);
	},
	write: (row: Partial<T>, value: number | null | undefined | string) => {
		if (isNil(value)) {
			set(row, key, '');
			return;
		}
		set(row, key, value);
	},
});

export const readWriteYesNoOrNumberDbField = <T>(key: keyof T): IField<T, boolean | number | string | undefined> => ({
	type: OpenApiDataType.string, // TODO: What should be the type here?
	parse: (value, location) => {
		if (isBoolean(value)) {
			return parseBoolean(value, location);
		}
		if (isNumber(value)) {
			return parseNumberStrict(value, location);
		}
		throw new TypeError(`\`${value}\` is either not a valid number or boolean`, location);
	},
	parseQuery: (values: unknown[], location?: string) => {
		return values.map((row) => {
			const value = get(row, key);
			if (isBoolean(value)) {
				return { value: parseBoolean(value, location) } as ParsedQueryValue<boolean>;
			}
			if (isNumber(value)) {
				return { value: parseNumberStrict(value, location) } as ParsedQueryValue<number>;
			}
			throw new TypeError(`\`${value}\` is either not a valid number or boolean`, location);
		});
	},
	read: (value) => {
		const databaseValue = get(value, key) as string;

		if (databaseValue === undefined) {
			return undefined;
		}

		if (isNumber(databaseValue)) {
			return databaseValue;
		}
		return databaseValue && databaseValue.toLowerCase() == 'yes';
	},
	write: (row: IEconFunctionRow, value) => {
		if (notNil(value)) {
			let valueToSave: string | number = value ? 'yes' : 'no';
			if (isNumber(value)) {
				valueToSave = value;
			}
			set(row, key, valueToSave);
		}
	},
});

const econModelReadWriteDbField = <K extends keyof IBaseEconModel, TParsed = IBaseEconModel[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IBaseEconModel, K, TParsed>(key, definition, options);

export const API_ECON_MODEL_FIELDS = {
	id: readEmptyWriteField('_id', OBJECT_ID_FIELD, { sortable: true, allowCursor: true }),
	copiedFrom: readField('copiedFrom', OBJECT_ID_FIELD),
	name: econModelReadWriteDbField('name', STRING_FIELD, {
		filterOption: { read: { filterValues: 1 } },
		sortable: true,
		isRequired: true,
	}),
	scenario: econModelReadWriteDbField('scenario', OBJECT_ID_FIELD),
	tags: readField(
		'tags',
		{ type: OpenApiDataType.array, items: OBJECT_ID_FIELD },
		{
			sortable: true,
			filterOption: { read: { filterValues: 1 } },
		},
	),
	unique: econModelReadWriteDbField('unique', BOOLEAN_FIELD, {
		isRequired: true,
		filterOption: { read: { filterValues: 1 } },
		sortable: true,
	}),
	well: econModelReadWriteDbField('well', OBJECT_ID_FIELD, {
		filterOption: { read: { filterValues: 1 } },
		sortable: true,
	}),
	createdBy: readField('createdBy', OBJECT_ID_FIELD),
	lastUpdatedBy: readField('lastUpdatedBy', OBJECT_ID_FIELD),
	createdAt: readField('createdAt', DATE_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 1 } },
	}),
	updatedAt: readField('updatedAt', DATE_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 1 } },
	}),
};

export type ApiEconModelKey = keyof typeof API_ECON_MODEL_FIELDS;

type TypeOfField<FT> = FT extends IEconModelField<infer T> ? T : never;

export type ApiEconModel = {
	[key in ApiEconModelKey]?: TypeOfField<(typeof API_ECON_MODEL_FIELDS)[key]>;
};
