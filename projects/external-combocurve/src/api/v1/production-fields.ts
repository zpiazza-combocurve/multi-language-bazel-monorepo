import { ApiQueryFilters, ParseQueryOperator } from '@src/helpers/fields/field-definition';
import { DATE_FIELD, IFieldDefinition } from '@src/helpers/fields';
import { dateToIndex, getStartIndexDailyDate, getStartIndexMonthlyDate, indexToDate } from '@src/helpers/dates';
import { getDbFilter, IFilter, ISort } from '@src/helpers/mongo-queries';
import { ISingleProduction } from '@src/helpers/single-production';
import { IWell } from '@src/models/wells';

import { IApiSort, IReadFieldOptions, IReadWriteFieldOptions as IReadWriteGeneralFieldOptions } from './fields';

export type MatchMoment = 'beforeUnwind' | 'afterUnwind';

export interface IProductionField<TP extends ISingleProduction, TValue> extends IFieldDefinition<TValue> {
	read?: (monthlyProduction: TP) => TValue;
	write?: (monthlyProduction: TP, value: TValue) => void;
	getDbSort?: (sort: ISort, cursor?: string) => IApiSort;
	getDbReadFilter?: (filter: ApiQueryFilters, matchMoment?: MatchMoment) => IFilter;
	getDbDeleteFilter?: (filter: ApiQueryFilters) => IFilter;
	options?: IReadWriteFieldOptions;
}

const getFilterFunction =
	<T extends ISingleProduction>() =>
	<K extends keyof T>(
		key: K,
		definition: IFieldDefinition<T[K]>,
	): ((filter: ApiQueryFilters) => IFilter) | undefined =>
	(filter) => {
		const { parseQuery } = definition;
		const rawValue = Object.values(filter)[0];
		const parsedQueryValue = parseQuery?.(rawValue);
		return {
			[key]: parsedQueryValue ? getDbFilter(parsedQueryValue) : rawValue,
		};
	};

interface IReadWriteFieldOptions extends IReadWriteGeneralFieldOptions {
	isProductionData?: boolean;
}

export const readField =
	<T extends ISingleProduction>() =>
	<K extends keyof T>(
		key: K,
		definition: IFieldDefinition<T[K]>,
		options: IReadFieldOptions = {},
	): IProductionField<T, T[K]> => {
		const {
			sortable = false,
			allowCursor = false,
			filterOption = { read: { filterValues: false }, delete: { filterValues: false } },
		} = options;
		const { parseQuery } = definition;

		const getDbFieldFilter = (filter: ApiQueryFilters) => {
			const parsedValue = parseQuery?.(Object.values(filter)[0]);
			if (!parsedValue) {
				return { [key]: Object.values(filter)[0] };
			}
			return {
				[key]: getDbFilter(parsedValue),
			};
		};

		return {
			...definition,
			read: (production) => production[key],
			getDbSort: sortable
				? (sort, cursor) => {
						const sortVal = Object.values(sort)[0];

						return {
							sortQuery: { [key]: sortVal },
							cursorFilter:
								allowCursor && cursor
									? getDbFieldFilter?.({ [key]: sortVal === 1 ? [{ gt: cursor }] : [{ lt: cursor }] })
									: undefined,
							allowCursor,
						};
				  }
				: undefined,
			getDbReadFilter: filterOption.read?.filterValues ? getFilterFunction<T>()(key, definition) : undefined,
			getDbDeleteFilter: filterOption.delete?.filterValues ? getFilterFunction<T>()(key, definition) : undefined,
			options,
		};
	};
export const readWriteField =
	<T extends ISingleProduction>() =>
	<K extends keyof T>(
		key: K,
		definition: IFieldDefinition<T[K]>,
		{ isRequired = false, isProductionData = false, ...readOptions }: IReadWriteFieldOptions = {},
	): IProductionField<T, T[K]> => {
		const field = readField<T>()(key, definition, readOptions);

		return {
			...field,
			write: (production, value) => (production[key] = value),
			options: { ...field.options, isRequired, isProductionData },
		};
	};

export const productionDateField = <T extends ISingleProduction>(
	correctDate: (date: Date) => Date,
	resolution: 'monthly' | 'daily',
): IProductionField<T, Date> => ({
	...DATE_FIELD,
	read: (production) => indexToDate(production.index ?? 0),
	getDbSort: (sort) => ({ sortQuery: { startIndex: Object.values(sort)[0] }, allowCursor: false }),
	getDbReadFilter: (filter, matchMoment) => {
		const { parseQuery } = DATE_FIELD;
		const rawValue = Object.values(filter)[0];
		const parsedQueryValue = parseQuery?.(rawValue);
		if (matchMoment == 'afterUnwind') {
			return {
				index: parsedQueryValue
					? getDbFilter(parsedQueryValue, (value) => dateToIndex(correctDate(value)))
					: rawValue,
			};
		} else {
			const operatorMapping: Record<ParseQueryOperator, ParseQueryOperator> = {
				ge: 'ge',
				gt: 'ge',
				lt: 'le',
				le: 'le',
			};

			return {
				startIndex: parsedQueryValue
					? getDbFilter(
							parsedQueryValue,
							(value) =>
								resolution == 'monthly'
									? getStartIndexMonthlyDate(value)
									: getStartIndexDailyDate(value),
							(operator) => operatorMapping[operator],
					  )
					: rawValue,
			};
		}
	},
	options: {
		isRequired: true,
		isProductionData: false,
		filterOption: { read: { filterValues: 1, beforeUnwind: true, afterUnwind: true } },
	},
	write: (production, date) => {
		const correctedDate = correctDate(date);
		production.index = dateToIndex(correctedDate);
	},
});

export const wellField =
	<T extends ISingleProduction>() =>
	<K extends keyof IWell>(
		key: K,
		definition: IFieldDefinition<IWell[K]>,
	): IProductionField<T, IWell[K] | undefined> => ({
		...definition,
		read: undefined,
		getDbSort: undefined,
		getDbReadFilter: undefined,
		write: () => {
			// do nothing
		},
		options: { isRequired: false },
	});
