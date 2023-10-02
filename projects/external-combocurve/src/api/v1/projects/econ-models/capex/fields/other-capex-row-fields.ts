import { get, isArray, isNil, set } from 'lodash';

import { FieldNameError, RequestStructureError, ValidationError } from '@src/helpers/validation';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IFieldDefinition, NUMBER_FIELD, STRING_FIELD } from '@src/helpers/fields';
import { IOtherCapexRowField } from '@src/models/econ/capex';
import { notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';
import { readWriteYesNoDbField } from '../../fields';

import { OtherCapexEconFunctionField } from './other-capex';
import { otherCapexEscalationStartReadWriteDbField } from './escalation-start-fields';

export type OtherCapeRowField<T> = IField<IOtherCapexRowField, T>;

export const otherCapexRowField = (): OtherCapexEconFunctionField<ApiOtherCapexRowFields[] | null> => {
	return {
		type: OpenApiDataType.object,
		properties: API_OTHER_CAPEX_ROW_FIELDS,
		parse: (data: unknown, location?: string) => parseApiOtherCapexRowFields(data, location),
		read: (fields) => toApiOtherCapexRowFields(get(fields, ['rows'])),
		write: (fields, value) => {
			if (notNil(value)) {
				set(fields, ['rows'], toOtherCapexRowFields(value));
			}
		},
		options: { isRequired: false },
	};
};

const otherCapexRowReadWriteDbField = <K extends keyof IOtherCapexRowField, TParsed = IOtherCapexRowField[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IOtherCapexRowField, K, TParsed>(key, definition, options);

export const API_OTHER_CAPEX_ROW_FIELDS = {
	category: otherCapexRowReadWriteDbField('category', STRING_FIELD),
	description: otherCapexRowReadWriteDbField('description', STRING_FIELD),
	tangible: otherCapexRowReadWriteDbField('tangible', NUMBER_FIELD),
	intangible: otherCapexRowReadWriteDbField('intangible', NUMBER_FIELD),
	capexExpense: otherCapexRowReadWriteDbField('capex_expense', STRING_FIELD),
	afterEconLimit: readWriteYesNoDbField('after_econ_limit'),
	calculation: otherCapexRowReadWriteDbField('calculation', STRING_FIELD),
	escalationModel: otherCapexRowReadWriteDbField('escalation_model', STRING_FIELD),
	escalationStart: otherCapexEscalationStartReadWriteDbField(),
	depreciationModel: otherCapexRowReadWriteDbField('depreciation_model', STRING_FIELD),
	dealTerms: otherCapexRowReadWriteDbField('deal_terms', NUMBER_FIELD),
	// Probabilistic Capex
	distributionType: otherCapexRowReadWriteDbField('distribution_type', STRING_FIELD),
	mean: otherCapexRowReadWriteDbField('mean', NUMBER_FIELD),
	standardDeviation: otherCapexRowReadWriteDbField('standard_deviation', NUMBER_FIELD),
	lowerBound: otherCapexRowReadWriteDbField('lower_bound', NUMBER_FIELD),
	upperBound: otherCapexRowReadWriteDbField('upper_bound', NUMBER_FIELD),
	mode: otherCapexRowReadWriteDbField('mode', NUMBER_FIELD),
	seed: otherCapexRowReadWriteDbField('seed', NUMBER_FIELD),
	// Criteria
	offsetToFpd: otherCapexRowReadWriteDbField('offset_to_fpd', NUMBER_FIELD),
	offsetToAsOf: otherCapexRowReadWriteDbField('offset_to_as_of_date', NUMBER_FIELD),
	offsetToDiscountDate: otherCapexRowReadWriteDbField('offset_to_discount_date', NUMBER_FIELD),
	offsetToMajorSegment: otherCapexRowReadWriteDbField('offset_to_first_segment', NUMBER_FIELD),
	offsetToEconLimit: otherCapexRowReadWriteDbField('offset_to_econ_limit', NUMBER_FIELD),
	date: otherCapexRowReadWriteDbField('date', STRING_FIELD),
	oilRate: otherCapexRowReadWriteDbField('oil_rate', NUMBER_FIELD),
	gasRate: otherCapexRowReadWriteDbField('gas_rate', NUMBER_FIELD),
	waterRate: otherCapexRowReadWriteDbField('water_rate', NUMBER_FIELD),
	totalFluidRate: otherCapexRowReadWriteDbField('total_fluid_rate', NUMBER_FIELD),
	// FROM SCHEDULE PROPERTIES
	fromSchedule: otherCapexRowReadWriteDbField('fromSchedule', STRING_FIELD),
	padPreparationMobStart: otherCapexRowReadWriteDbField('offset_to_pad_preparation_mob_start', NUMBER_FIELD),
	padPreparationMobEnd: otherCapexRowReadWriteDbField('offset_to_pad_preparation_mob_end', NUMBER_FIELD),
	padPreparationStart: otherCapexRowReadWriteDbField('offset_to_pad_preparation_start', NUMBER_FIELD),
	padPreparationEnd: otherCapexRowReadWriteDbField('offset_to_pad_preparation_end', NUMBER_FIELD),
	padPreparationDemobStart: otherCapexRowReadWriteDbField('offset_to_pad_preparation_demob_start', NUMBER_FIELD),
	padPreparationDemobEnd: otherCapexRowReadWriteDbField('offset_to_pad_preparation_demob_end', NUMBER_FIELD),
	spudMobStart: otherCapexRowReadWriteDbField('offset_to_spud_mob_start', NUMBER_FIELD),
	spudMobEnd: otherCapexRowReadWriteDbField('offset_to_spud_mob_end', NUMBER_FIELD),
	spudStart: otherCapexRowReadWriteDbField('offset_to_spud_start', NUMBER_FIELD),
	spudEnd: otherCapexRowReadWriteDbField('offset_to_spud_end', NUMBER_FIELD),
	spudDemobStart: otherCapexRowReadWriteDbField('offset_to_spud_demob_start', NUMBER_FIELD),
	spudDemobEnd: otherCapexRowReadWriteDbField('offset_to_spud_demob_end', NUMBER_FIELD),
	drillMobStart: otherCapexRowReadWriteDbField('offset_to_drill_mob_start', NUMBER_FIELD),
	drillMobEnd: otherCapexRowReadWriteDbField('offset_to_drill_mob_end', NUMBER_FIELD),
	drillStart: otherCapexRowReadWriteDbField('offset_to_drill_start', NUMBER_FIELD),
	drillEnd: otherCapexRowReadWriteDbField('offset_to_drill_end', NUMBER_FIELD),
	drillDemobStart: otherCapexRowReadWriteDbField('offset_to_drill_demob_start', NUMBER_FIELD),
	drillDemobEnd: otherCapexRowReadWriteDbField('offset_to_drill_demob_end', NUMBER_FIELD),
	completionMobStart: otherCapexRowReadWriteDbField('offset_to_completion_mob_start', NUMBER_FIELD),
	completionMobEnd: otherCapexRowReadWriteDbField('offset_to_completion_mob_end', NUMBER_FIELD),
	completionStart: otherCapexRowReadWriteDbField('offset_to_completion_start', NUMBER_FIELD),
	completionEnd: otherCapexRowReadWriteDbField('offset_to_completion_end', NUMBER_FIELD),
	completionDemobStart: otherCapexRowReadWriteDbField('offset_to_completion_demob_start', NUMBER_FIELD),
	completionDemobEnd: otherCapexRowReadWriteDbField('offset_to_completion_demob_end', NUMBER_FIELD),
	// FROM HEADERS PROPERTIES
	fromHeaders: otherCapexRowReadWriteDbField('fromHeaders', STRING_FIELD),
	refracDate: otherCapexRowReadWriteDbField('offset_to_refrac_date', NUMBER_FIELD),
	completionEndDate: otherCapexRowReadWriteDbField('offset_to_completion_end_date', NUMBER_FIELD),
	completionStartDate: otherCapexRowReadWriteDbField('offset_to_completion_start_date', NUMBER_FIELD),
	dateRigRelease: otherCapexRowReadWriteDbField('offset_to_date_rig_release', NUMBER_FIELD),
	drillEndDate: otherCapexRowReadWriteDbField('offset_to_drill_end_date', NUMBER_FIELD),
	drillStartDate: otherCapexRowReadWriteDbField('offset_to_drill_start_date', NUMBER_FIELD),
	firstProdDate: otherCapexRowReadWriteDbField('offset_to_first_prod_date', NUMBER_FIELD),
	permitDate: otherCapexRowReadWriteDbField('offset_to_permit_date', NUMBER_FIELD),
	spudDate: otherCapexRowReadWriteDbField('offset_to_spud_date', NUMBER_FIELD),
	til: otherCapexRowReadWriteDbField('offset_to_til', NUMBER_FIELD),
	customDateHeader0: otherCapexRowReadWriteDbField('offset_to_custom_date_0', NUMBER_FIELD),
	customDateHeader1: otherCapexRowReadWriteDbField('offset_to_custom_date_1', NUMBER_FIELD),
	customDateHeader2: otherCapexRowReadWriteDbField('offset_to_custom_date_2', NUMBER_FIELD),
	customDateHeader3: otherCapexRowReadWriteDbField('offset_to_custom_date_3', NUMBER_FIELD),
	customDateHeader4: otherCapexRowReadWriteDbField('offset_to_custom_date_4', NUMBER_FIELD),
	customDateHeader5: otherCapexRowReadWriteDbField('offset_to_custom_date_5', NUMBER_FIELD),
	customDateHeader6: otherCapexRowReadWriteDbField('offset_to_custom_date_6', NUMBER_FIELD),
	customDateHeader7: otherCapexRowReadWriteDbField('offset_to_custom_date_7', NUMBER_FIELD),
	customDateHeader8: otherCapexRowReadWriteDbField('offset_to_custom_date_8', NUMBER_FIELD),
	customDateHeader9: otherCapexRowReadWriteDbField('offset_to_custom_date_9', NUMBER_FIELD),
	firstProdDateDaily: otherCapexRowReadWriteDbField('offset_to_first_prod_date_daily_calc', NUMBER_FIELD),
	firstProdDateMonthly: otherCapexRowReadWriteDbField('offset_to_first_prod_date_monthly_calc', NUMBER_FIELD),
	lastProdDateDaily: otherCapexRowReadWriteDbField('offset_to_last_prod_date_daily', NUMBER_FIELD),
	lastProdDateMonthly: otherCapexRowReadWriteDbField('offset_to_last_prod_date_monthly', NUMBER_FIELD),
};

export type ApiOtherCapexRowFieldsKey = keyof typeof API_OTHER_CAPEX_ROW_FIELDS;

type TypeOfOtherCapexRowField<FT> = FT extends OtherCapeRowField<infer T> ? T : never;

export type ApiOtherCapexRowFields = {
	[key in ApiOtherCapexRowFieldsKey]?: TypeOfOtherCapexRowField<(typeof API_OTHER_CAPEX_ROW_FIELDS)[key]>;
};

export const getApiOtherCapexRowFields = (
	field: string,
): (typeof API_OTHER_CAPEX_ROW_FIELDS)[ApiOtherCapexRowFieldsKey] | null =>
	getApiField(field, API_OTHER_CAPEX_ROW_FIELDS);

export const getRequiredOtherCapexRowFields: ApiOtherCapexRowFieldsKey[] = Object.entries(API_OTHER_CAPEX_ROW_FIELDS)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiOtherCapexRowFieldsKey);

export const toOtherCapexRowFields = (
	apiOtherCapexRowFieldArray: ApiOtherCapexRowFields[],
): IOtherCapexRowField[] | Record<string, unknown> => {
	const rowsResult: IOtherCapexRowField[] = [];
	for (const apiOtherCapexRowField of apiOtherCapexRowFieldArray) {
		const otherCapexRowFieldResult = {};

		if (isNil(apiOtherCapexRowField)) {
			return otherCapexRowFieldResult;
		}

		Object.entries(API_OTHER_CAPEX_ROW_FIELDS).forEach(([field, { write }]) => {
			if (write) {
				const coercedWrite = write as (otherCapexRowField: IOtherCapexRowField, value: unknown) => void;
				coercedWrite(
					otherCapexRowFieldResult as IOtherCapexRowField,
					apiOtherCapexRowField[field as ApiOtherCapexRowFieldsKey],
				);
			}
		});
		rowsResult.push(otherCapexRowFieldResult as IOtherCapexRowField);
	}
	return rowsResult;
};

export const parseApiOtherCapexRowFields = (dataRow: unknown, location?: string): ApiOtherCapexRowFields[] => {
	if (!isArray(dataRow)) {
		throw new RequestStructureError(`Invalid Capex model rows data structure`, location);
	}

	const errorAggregator = new ValidationErrorAggregator();
	const rowsParsed: ApiOtherCapexRowFields[] = [];
	let index = 0;
	for (const data of dataRow as Record<string, unknown>[]) {
		const locationWithIndex = location + `.[${index}]`;
		const otherCapexEconFunction: Record<string, ApiOtherCapexRowFields[ApiOtherCapexRowFieldsKey]> = {};
		if (!data.capexExpense) {
			data.capexExpense = 'capex';
		}
		if (!data.description) {
			data.description = '';
		}
		if (data.fromHeaders) {
			validateCorrectFromHeaderIsSent(data, locationWithIndex);
		}
		if (data.fromSchedule) {
			validateCorrectFromScheduleIsSent(data, locationWithIndex);
		}
		Object.entries(withProbabilisticDefaultPropertiesValues(data))
			.filter(([, value]) => notNil(value))
			.forEach(([field, value]) =>
				errorAggregator.catch(() => {
					const fieldPath = `${location}.${field}`;
					const otherCapexEconFunctionField = getApiOtherCapexRowFields(field);

					if (!otherCapexEconFunctionField) {
						if (ERROR_ON_EXTRANEOUS_FIELDS) {
							throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
						}
						return;
					}

					const { write, parse } = otherCapexEconFunctionField;

					const parsedValue = parse
						? parse(value, fieldPath)
						: (value as ApiOtherCapexRowFields[ApiOtherCapexRowFieldsKey]);

					if (write) {
						otherCapexEconFunction[field] = parsedValue;
					}
				}),
			);
		rowsParsed.push(otherCapexEconFunction);
		index++;
	}

	errorAggregator.throwAll();

	return rowsParsed;
};

const withProbabilisticDefaultPropertiesValues = (data: Record<string, unknown>): Record<string, unknown> => {
	//We don't support probCapex... for now, so saving these as 0 ALWAYS
	// if (!data.distributionType) {
	// 	return data;
	// }
	return {
		mean: data.mean ?? 0,
		standardDeviation: data.standardDeviation ?? 0,
		lowerBound: data.lowerBound ?? 0,
		upperBound: data.upperBound ?? 0,
		mode: data.mode ?? 0,
		seed: data.seed ?? 0,
		...data,
	};
};
export const toApiOtherCapexRowFields = (otherCapexRowFields: IOtherCapexRowField[]): ApiOtherCapexRowFields[] => {
	const rows: ApiOtherCapexRowFields[] = [];
	for (const otherCapexRowField of otherCapexRowFields) {
		const apiOtherCapexRowField: Record<string, ApiOtherCapexRowFields[ApiOtherCapexRowFieldsKey]> = {};
		Object.entries(API_OTHER_CAPEX_ROW_FIELDS).forEach(([field, { read }]) => {
			if (read) {
				apiOtherCapexRowField[field] = read(otherCapexRowField);
			}
		});
		rows.push(apiOtherCapexRowField);
	}

	return rows;
};
const validateCorrectFromHeaderIsSent = (data: Record<string, unknown>, location?: string) => {
	const fromHeadersMapping = {
		refracDate: 'offset_to_refrac_date',
		completionEndDate: 'offset_to_completion_end_date',
		completionStartDate: 'offset_to_completion_start_date',
		dateRigRelease: 'offset_to_date_rig_release',
		drillEndDate: 'offset_to_drill_end_date',
		drillStartDate: 'offset_to_drill_start_date',
		firstProdDate: 'offset_to_first_prod_date',
		permitDate: 'offset_to_permit_date',
		spudDate: 'offset_to_spud_date',
		til: 'offset_to_til',
		customDateHeader0: 'offset_to_custom_date_0',
		customDateHeader1: 'offset_to_custom_date_1',
		customDateHeader2: 'offset_to_custom_date_2',
		customDateHeader3: 'offset_to_custom_date_3',
		customDateHeader4: 'offset_to_custom_date_4',
		customDateHeader5: 'offset_to_custom_date_5',
		customDateHeader6: 'offset_to_custom_date_6',
		customDateHeader7: 'offset_to_custom_date_7',
		customDateHeader8: 'offset_to_custom_date_8',
		customDateHeader9: 'offset_to_custom_date_9',
		firstProdDateDaily: 'offset_to_first_prod_date_daily_calc',
		firstProdDateMonthly: 'offset_to_first_prod_date_monthly_calc',
		lastProdDateDaily: 'offset_to_last_prod_date_daily',
		lastProdDateMonthly: 'offset_to_last_prod_date_monthly',
	};
	checkIfCorrectPropertyIsSet(data, 'fromHeaders', fromHeadersMapping, location);
};

const validateCorrectFromScheduleIsSent = (data: Record<string, unknown>, location?: string) => {
	const fromScheduleMapping = {
		padPreparationMobStart: 'offset_to_pad_preparation_mob_start',
		padPreparationMobEnd: 'offset_to_pad_preparation_mob_end',
		padPreparationStart: 'offset_to_pad_preparation_start',
		padPreparationEnd: 'offset_to_pad_preparation_end',
		padPreparationDemobStart: 'offset_to_pad_preparation_demob_start',
		padPreparationDemobEnd: 'offset_to_pad_preparation_demob_end',
		spudMobStart: 'offset_to_spud_mob_start',
		spudMobEnd: 'offset_to_spud_mob_end',
		spudStart: 'offset_to_spud_start',
		spudEnd: 'offset_to_spud_end',
		spudDemobStart: 'offset_to_spud_demob_start',
		spudDemobEnd: 'offset_to_spud_demob_end',
		drillMobStart: 'offset_to_drill_mob_start',
		drillMobEnd: 'offset_to_drill_mob_end',
		drillStart: 'offset_to_drill_start',
		drillEnd: 'offset_to_drill_end',
		drillDemobStart: 'offset_to_drill_demob_start',
		drillDemobEnd: 'offset_to_drill_demob_end',
		completionMobStart: 'offset_to_completion_mob_start',
		completionMobEnd: 'offset_to_completion_mob_end',
		completionStart: 'offset_to_completion_start',
		completionEnd: 'offset_to_completion_end',
		completionDemobStart: 'offset_to_completion_demob_start',
		completionDemobEnd: 'offset_to_completion_demob_end',
	};

	checkIfCorrectPropertyIsSet(data, 'fromSchedule', fromScheduleMapping, location);
};

const checkIfCorrectPropertyIsSet = (
	data: Record<string, unknown>,
	propertyToCheck: 'fromSchedule' | 'fromHeaders',
	propertiesMappingHashTable: Record<string, string>,
	location?: string,
) => {
	const propertyValueToBeSet = data[propertyToCheck] as string;
	const [propertyToBeSet] = Object.entries(propertiesMappingHashTable).find(
		([, value]) => value == propertyValueToBeSet,
	) ?? [''];

	if (data[propertyToBeSet] === undefined) {
		throw new ValidationError(
			`if \`${propertyToCheck}\` is set to ${propertyValueToBeSet} the \`${propertyToBeSet}\` property must be set`,
			location,
		);
	}
};
