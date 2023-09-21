import { ColDef, ColGroupDef } from 'ag-grid-community';
import partition from 'lodash/partition';
import { v4 as uuidv4 } from 'uuid';

import { eltColumnDefinition } from '@/components/AdvancedTable/ag-grid-shared';
import { IS_NESTED_ROW_KEY, ROW_ID_KEY } from '@/components/AdvancedTable/constants';
import { getPeriodValue } from '@/components/AdvancedTable/shared';
import {
	BASE_ASSUMPTION_CRITERIA_MAPPINGS,
	getConstantKeyFromValue,
} from '@/cost-model/detail-components/AdvancedModelView/constants';
import { getModelTimeSeriesRows, groupTimeSeriesRows } from '@/cost-model/detail-components/AdvancedModelView/shared';
import { DifferentialsRow } from '@/cost-model/detail-components/differentials/DifferentialsAdvancedView/types';
import {
	BaseDifferentialsPeriodRows,
	DifferentialModel,
	DifferentialModelComponentFields,
	DifferentialsAssumption,
	DifferentialsComponent,
	DifferentialsFieldsTemplate,
	RawDifferentialsFieldsTemplate,
} from '@/cost-model/detail-components/differentials/types';
import { GenerateNewModelHeaders, createEconFunction } from '@/cost-model/detail-components/gen-data';

import { DIFFERENTIALS_CATEGORIES_MAP } from '../constants';
import {
	DIFFERENTIALS_CATEGORIES,
	DIFFERENTIALS_COLUMNS,
	DIFFERENTIALS_CRITERIA,
	DIFFERENTIALS_KEYS,
	DIFFERENTIALS_KEYS_COLUMNS,
	DIFFERENTIALS_KEYS_CONFIG,
	DIFFERENTIALS_UNITS,
	DIFFERENTIALS_UNITS_MAPPINGS,
	DIFFERENTIAL_ASSUMPTION_UNIT_AND_KEY_TO_FIELD_NAME_MAPPING,
	PERCENTAGE_OF_BASE_PRICE_REPHRASED,
} from './constants';

export const getDifferentialsgColumnsDef = (enableELTColumn: boolean): ColGroupDef[] => {
	const differentialsChildren: ColDef[] = [];
	const differentialsOtherChildren: ColDef[] = [];

	if (enableELTColumn) {
		differentialsChildren.push(eltColumnDefinition);
	}
	const mapHeaderName = (field) => ({ ...field, headerName: field.label });
	const columnsMappedWithHeaderName = Object.values(DIFFERENTIALS_COLUMNS).map(mapHeaderName);

	const [differentialsColumns, otherColumns] = partition(
		columnsMappedWithHeaderName,
		({ otherColumns }) => !otherColumns
	);

	differentialsChildren.push(...differentialsColumns);
	differentialsOtherChildren.push(...otherColumns);

	return [
		{
			headerName: 'Differentials',
			children: differentialsChildren,
		},
		{
			headerName: 'Others',
			children: differentialsOtherChildren,
		},
	];
};

const mapDifferentialModelRows = (
	differentialModelState: DifferentialModel,
	differentialModelTemplate: DifferentialsFieldsTemplate,
	categoryKey: string,
	categoryValue: string
): DifferentialsRow[] => {
	const categoryDifferentialModelState = differentialModelState[categoryKey]?.subItems;
	const categoryDifferentialModelTemplate = differentialModelTemplate[categoryKey]?.subItems;
	const differentialsModelRows = DIFFERENTIALS_KEYS_COLUMNS.filter(({ category }) => category === categoryValue).map(
		({ key, optionsKey }) => {
			const fieldData = categoryDifferentialModelState?.[optionsKey];
			if (!fieldData) return undefined;

			const {
				subItems: {
					escalation_model,
					row_view: { headers, rows },
				},
			} = fieldData;

			const escalationsModelFieldTemplate =
				categoryDifferentialModelTemplate?.[optionsKey].subItems.escalation_model;
			const escalation =
				escalationsModelFieldTemplate.menuItems.find(({ value }) => value === escalation_model?.value) ??
				escalationsModelFieldTemplate.Default;

			const rawUnitValue = headers.differential.label ?? headers.differential;
			const unit =
				rawUnitValue === PERCENTAGE_OF_BASE_PRICE_REPHRASED
					? DIFFERENTIALS_UNITS.PERCENTAGE_OF_BASE_PRICE
					: rawUnitValue;

			return rows.map((row: BaseDifferentialsPeriodRows, i: number) =>
				i === 0
					? {
							[ROW_ID_KEY]: uuidv4(),
							key,
							category: categoryValue,
							criteria: headers.criteria.label,
							period: getPeriodValue({ criteriaHeader: headers.criteria, criteria: row.criteria }),
							value: row.differential,
							unit,
							escalation: escalation.label,
					  }
					: {
							[ROW_ID_KEY]: uuidv4(),
							[IS_NESTED_ROW_KEY]: true,
							period: getPeriodValue({ criteriaHeader: headers.criteria, criteria: row.criteria }),
							value: row.differential,
					  }
			);
		}
	);

	return differentialsModelRows.flat(1);
};

export const assumptionToRows = (
	{ options }: DifferentialsAssumption,
	template: DifferentialsFieldsTemplate
): DifferentialsRow[] => {
	const { saved_from, saved_fields } = options.metadata ?? {};
	const assumptionSavedFromAdvancedView = saved_from === 'advanced_view';

	const differentialsModelOptions = options.differentials;
	const savedFieldsWithValues = Object.values(saved_fields || []).some((savedField) => savedField.length);
	//Remove keys from differentials model that are not saved in the advanced view
	if (assumptionSavedFromAdvancedView && savedFieldsWithValues) {
		DIFFERENTIALS_KEYS_COLUMNS.forEach(({ category, optionsKey }) => {
			const categoryKey = getConstantKeyFromValue(DIFFERENTIALS_CATEGORIES_MAP, category);
			if (categoryKey) {
				if (saved_fields?.[categoryKey].includes(optionsKey)) return;
				delete differentialsModelOptions[categoryKey]?.subItems?.[optionsKey];
			}
		});
	}

	const mappedDifferentialModelRowsPerCategory = Object.entries(DIFFERENTIALS_CATEGORIES_MAP)
		.map(([categoryKey, categoryValue]) =>
			mapDifferentialModelRows(differentialsModelOptions, template, categoryKey, categoryValue)
		)
		.flat(1);

	return [...mappedDifferentialModelRowsPerCategory].filter((row) => !!row);
};

const formatDifferentialModelComponent = (
	rows: DifferentialsRow[] | undefined,
	key: string,
	differentialPhase: string,
	differentialPhasesModelFields: DifferentialsFieldsTemplate
): DifferentialsComponent => {
	// Get the first row unit or the default unit
	const rawUnitValue = rows?.[0]?.unit ?? DIFFERENTIALS_UNITS_MAPPINGS[key][0];
	const unit =
		rawUnitValue === DIFFERENTIALS_UNITS.PERCENTAGE_OF_BASE_PRICE
			? PERCENTAGE_OF_BASE_PRICE_REPHRASED
			: rawUnitValue;
	// Get the assumption value field associated with the key/unit pair.
	const valueField = DIFFERENTIAL_ASSUMPTION_UNIT_AND_KEY_TO_FIELD_NAME_MAPPING[key][rawUnitValue];
	// The optionKey for the current key to navigate through the
	// differential model fields properly.
	const optionKey = Object.values(DIFFERENTIALS_KEYS_CONFIG).find(({ label }) => label === key)?.optionsKey;

	const differentialPhaseKey = getConstantKeyFromValue(DIFFERENTIALS_CATEGORIES_MAP, differentialPhase) as string;
	const keyDifferentialModelSubItems =
		optionKey && differentialPhasesModelFields[differentialPhaseKey]?.subItems?.[optionKey]?.subItems;

	const rawEscalationValue = rows?.[0]?.escalation;
	const escalationValue = typeof rawEscalationValue === 'string' ? rawEscalationValue : rawEscalationValue?.label;
	const escalationsModelFieldTemplate = keyDifferentialModelSubItems?.escalation_model;
	const escalation_model =
		(escalationValue && escalationsModelFieldTemplate?.menuItems.find(({ label }) => label === escalationValue)) ||
		escalationsModelFieldTemplate?.Default;

	// Get the criteria, as this determines how we format the rows and set headers
	const criteria =
		getConstantKeyFromValue(DIFFERENTIALS_CRITERIA, rows?.[0]?.criteria) ?? DIFFERENTIALS_CRITERIA.FLAT;
	const criteriaHeaders = BASE_ASSUMPTION_CRITERIA_MAPPINGS[criteria] ?? BASE_ASSUMPTION_CRITERIA_MAPPINGS.FLAT;
	const differentialHeaders = { label: unit, value: valueField };
	const headers = { criteria: criteriaHeaders, differential: differentialHeaders };
	// For empty rows, we just return the default values
	if (!rows || rows.length === 0)
		return {
			escalation_model,
			row_view: {
				headers,
				rows: [
					{
						differential: rawUnitValue === DIFFERENTIALS_UNITS.PERCENTAGE_OF_BASE_PRICE ? 100 : 0,
						criteria: DIFFERENTIALS_CRITERIA[criteria] ?? DIFFERENTIALS_CRITERIA.FLAT,
					},
				],
			},
		};
	// For Flat criteria, we just return the value of the first row
	if (criteria === DIFFERENTIALS_CRITERIA.FLAT) {
		const value = Number(rows[0]?.value ?? 0);
		return {
			escalation_model,
			row_view: {
				headers,
				rows: [
					{ differential: value, criteria: DIFFERENTIALS_CRITERIA[criteria] ?? DIFFERENTIALS_CRITERIA.FLAT },
				],
			},
		};
	}
	// For Time Series criteria, we'll use the helper function to format the rows
	return {
		escalation_model,
		row_view: {
			headers,
			rows: getModelTimeSeriesRows({
				rows,
				criteria,
				assumptionKey: 'differential',
			}) as BaseDifferentialsPeriodRows[],
		},
	};
};

const formatDifferentialModel = (
	groupedRows: DifferentialsRow[][],
	differentialPhase: string,
	differentialPhasesModelFields: DifferentialsFieldsTemplate
): DifferentialModelComponentFields => {
	const gasRows = groupedRows?.find((rows) => rows[0]?.key === DIFFERENTIALS_KEYS_CONFIG.GAS.label);
	const oilRows = groupedRows?.find((rows) => rows[0]?.key === DIFFERENTIALS_KEYS_CONFIG.OIL.label);
	const nglRows = groupedRows?.find((rows) => rows[0]?.key === DIFFERENTIALS_KEYS_CONFIG.NGL.label);
	const dripCondensateRows = groupedRows?.find((rows) => rows[0]?.key === DIFFERENTIALS_KEYS_CONFIG.DRIP_COND.label);
	return {
		oil: {
			subItems: formatDifferentialModelComponent(
				oilRows,
				DIFFERENTIALS_KEYS.OIL,
				differentialPhase,
				differentialPhasesModelFields
			),
		},
		gas: {
			subItems: formatDifferentialModelComponent(
				gasRows,
				DIFFERENTIALS_KEYS.GAS,
				differentialPhase,
				differentialPhasesModelFields
			),
		},
		ngl: {
			subItems: formatDifferentialModelComponent(
				nglRows,
				DIFFERENTIALS_KEYS.NGL,
				differentialPhase,
				differentialPhasesModelFields
			),
		},
		drip_condensate: {
			subItems: formatDifferentialModelComponent(
				dripCondensateRows,
				DIFFERENTIALS_KEYS.DRIP_COND,
				differentialPhase,
				differentialPhasesModelFields
			),
		},
	} as DifferentialModelComponentFields;
};

const formatDifferentialPhases = (
	rows: DifferentialsRow[][],
	differentialPhasesModelFields: DifferentialsFieldsTemplate
): DifferentialModel => {
	const { firstDiff, secondDiff, thirdDiff } = rows.reduce(
		(differentialCategories, currentRow) => {
			const currentRowData = currentRow[0];
			const categoryKey = getConstantKeyFromValue(DIFFERENTIALS_CATEGORIES, currentRowData?.category);
			if (categoryKey) {
				return {
					...differentialCategories,
					[categoryKey]: [...differentialCategories[categoryKey], currentRow],
				};
			}
			return differentialCategories;
		},
		{ firstDiff: [], secondDiff: [], thirdDiff: [] }
	);
	return {
		differentials_1: {
			subItems: formatDifferentialModel(
				firstDiff,
				DIFFERENTIALS_CATEGORIES.firstDiff,
				differentialPhasesModelFields
			),
		},
		differentials_2: {
			subItems: formatDifferentialModel(
				secondDiff,
				DIFFERENTIALS_CATEGORIES.secondDiff,
				differentialPhasesModelFields
			),
		},
		differentials_3: {
			subItems: formatDifferentialModel(
				thirdDiff,
				DIFFERENTIALS_CATEGORIES.thirdDiff,
				differentialPhasesModelFields
			),
		},
	} as DifferentialModel;
};

export function rowsToAssumption(
	rows: DifferentialsRow[],
	template: RawDifferentialsFieldsTemplate
): DifferentialsAssumption {
	// eslint-disable-next-line new-cap -- TODO eslint fix later
	const options = GenerateNewModelHeaders(template) as DifferentialsAssumption['options'];

	const differentialPhasesModelFields = template.differentials;

	const groupedRows = groupTimeSeriesRows(rows);
	options.differentials = formatDifferentialPhases(groupedRows, differentialPhasesModelFields);

	// Include metadata field, needed for identifying which rows were saved from Advanced View
	options.metadata = {
		saved_from: 'advanced_view',
		saved_fields: {
			differentials_1: [],
			differentials_2: [],
			differentials_3: [],
		},
	};

	groupedRows?.forEach((rows: DifferentialsRow[]) => {
		const keyConfig = Object.values(DIFFERENTIALS_KEYS_CONFIG).find(({ label }) => label === rows[0].key);
		const rowCategoryKey = getConstantKeyFromValue(DIFFERENTIALS_CATEGORIES_MAP, rows[0].category);

		if (keyConfig && rowCategoryKey) options.metadata?.saved_fields[rowCategoryKey]?.push(keyConfig.optionsKey);
	});

	return {
		options,
		econ_function: createEconFunction(options, Object.keys(template)),
	} as DifferentialsAssumption;
}
