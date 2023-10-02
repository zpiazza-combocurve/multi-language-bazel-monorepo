import { get, set } from 'lodash';

import {
	barrelRatioUnits,
	barrelUnits,
	cashUnits,
	gallonRationUnits,
	gallonUnits,
	gasVolumeUnits,
	GENERAL_OPTIONS_NAME,
	gorUnits,
	IReportingUnits,
	pressureUnits,
} from '@src/models/econ/general-options';
import { getStringEnumField, IFieldDefinition } from '@src/helpers/fields';
import { IField, readWriteDbField } from '@src/api/v1/fields';
import { parseRequestFromPayload, readRequestFromDocument, writeDocumentWithRequest } from '@src/helpers/fields/parses';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

import { IGeneralOptionsField } from './econ-function';

const reportUnitRWDBField = <K extends keyof IReportingUnits, TParsed = IReportingUnits[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
) => readWriteDbField<IReportingUnits, K, TParsed>(key, definition, { hasDefault: true });

export const REPORT_UNIT_FIELDS = {
	oil: reportUnitRWDBField('oil', getStringEnumField(barrelUnits, 'MBBL')),
	gas: reportUnitRWDBField('gas', getStringEnumField(gasVolumeUnits, 'MMCF')),
	ngl: reportUnitRWDBField('ngl', getStringEnumField([...barrelUnits, ...gallonUnits], 'MBBL')),
	dripCondensate: reportUnitRWDBField('drip_condensate', getStringEnumField(barrelUnits, 'MBBL')),
	water: reportUnitRWDBField('water', getStringEnumField(barrelUnits, 'MBBL')),
	pressure: reportUnitRWDBField('pressure', getStringEnumField(pressureUnits, 'PSI')),
	cash: reportUnitRWDBField('cash', getStringEnumField(cashUnits, 'M$')),
	gor: reportUnitRWDBField('gor', getStringEnumField(gorUnits, 'CF/BBL')),
	condensateGasRatio: reportUnitRWDBField('condensate_gas_ratio', getStringEnumField(barrelRatioUnits, 'BBL/MMCF')),
	dripCondensateYield: reportUnitRWDBField('drip_condensate_yield', getStringEnumField(barrelRatioUnits, 'BBL/MMCF')),
	nglYield: reportUnitRWDBField(
		'ngl_yield',
		getStringEnumField([...barrelRatioUnits, ...gallonRationUnits], 'BBL/MMCF'),
	),
};

// DB Mapping
export type IReportUnitField<T> = IField<IReportingUnits, T>;
type TypeOfReportUnitField<FT> = FT extends IReportUnitField<infer T> ? T : never;

// Api Mapping
export type ApiReportUnitFieldsKeys = keyof typeof REPORT_UNIT_FIELDS;
export type ApiReportUnitType = {
	[key in ApiReportUnitFieldsKeys]?: TypeOfReportUnitField<(typeof REPORT_UNIT_FIELDS)[key]>;
};

// Field
export const reportingUnitsField: IGeneralOptionsField<ApiReportUnitType> = {
	type: OpenApiDataType.object,
	properties: REPORT_UNIT_FIELDS,
	parse: (data: unknown, location?: string) =>
		parseRequestFromPayload<ApiReportUnitType, ApiReportUnitFieldsKeys>(
			GENERAL_OPTIONS_NAME,
			REPORT_UNIT_FIELDS,
			data,
			location,
		),
	read: (expenses) =>
		readRequestFromDocument<IReportingUnits, ApiReportUnitType, ApiReportUnitFieldsKeys>(
			get(expenses, ['econ_function', 'reporting_units']),
			REPORT_UNIT_FIELDS,
		),
	write: (expenses, value) =>
		set(
			expenses,
			['econ_function', 'reporting_units'],
			writeDocumentWithRequest<IReportingUnits, ApiReportUnitType, ApiReportUnitFieldsKeys>(
				value,
				REPORT_UNIT_FIELDS,
			),
		),
};
