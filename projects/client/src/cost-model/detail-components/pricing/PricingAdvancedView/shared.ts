import { ColDef, ColGroupDef } from 'ag-grid-community';
import { capitalize, partition } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import { eltColumnDefinition } from '@/components/AdvancedTable/ag-grid-shared';
import { IS_NESTED_ROW_KEY, ROW_ID_KEY } from '@/components/AdvancedTable/constants';
import { getPeriodValue } from '@/components/AdvancedTable/shared';
import {
	BASE_ASSUMPTION_CRITERIA_MAPPINGS,
	getConstantKeyFromValue,
} from '@/cost-model/detail-components/AdvancedModelView/constants';
import { getModelTimeSeriesRows, groupTimeSeriesRows } from '@/cost-model/detail-components/AdvancedModelView/shared';
import { GenerateNewModelHeaders, createEconFunction } from '@/cost-model/detail-components/gen-data';
import {
	COMPOSITIONAL_PRICING_CATEGORIES_CONF,
	PRICING_ASSUMPTION_UNIT_AND_KEY_TO_FIELD_NAME_MAPPING,
	PRICING_CATEGORIES_CONF,
	PRICING_COLUMNS,
	PRICING_COMPOSITIONAL_KEYS_COLUMNS,
	PRICING_CRITERIA,
	PRICING_KEYS_CATEGORIES,
	PRICING_KEYS_COLUMNS,
	PRICING_KEYS_CONFIG,
	PRICING_UNITS_MAPPINGS,
	pricing_category_column,
} from '@/cost-model/detail-components/pricing/PricingAdvancedView/constants';
import {
	BasePricingPeriodRows,
	Breakeven,
	CompositionalEconomicsComponent,
	CompositionalEconomicsModel,
	PriceModel,
	PriceModelComponent,
	PriceModelFields,
	PricingAssumption,
	PricingTemplate,
	RowViewHeader,
	RowViewHeaders,
} from '@/cost-model/detail-components/pricing/types';

import { PRICING_KEYS, PRICING_UNITS } from './constants';
import { PricingRow } from './types';

export const getPricingColumnsDef = (enableELTColumn: boolean, useCompositionalEconomics = false): ColGroupDef[] => {
	const pricingChildren: ColDef[] = [];
	const pricingOtherChildren: ColDef[] = [];

	if (enableELTColumn) {
		pricingChildren.push(eltColumnDefinition);
	}
	const mapHeaderName = (field) => ({ ...field, headerName: field.label });

	const columnsMappedWithHeaderName = Object.values(PRICING_COLUMNS).map(mapHeaderName);
	if (useCompositionalEconomics) {
		columnsMappedWithHeaderName.splice(
			pricing_category_column.columnIndex,
			0,
			mapHeaderName(pricing_category_column)
		);
	}

	const [pricingColumns, otherColumns] = partition(columnsMappedWithHeaderName, ({ otherColumns }) => !otherColumns);

	pricingChildren.push(...pricingColumns);
	pricingOtherChildren.push(...otherColumns);

	return [
		{
			headerName: 'Pricing',
			children: pricingChildren,
		},
		{
			headerName: 'Others',
			children: pricingOtherChildren,
		},
	];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const mapBreakevenRows = (breakevenState: Breakeven): PricingRow[] | any[] => {
	return PRICING_KEYS_COLUMNS.filter(({ key }) => key === PRICING_KEYS.BREAK_EVEN).map(({ key, unit }) => {
		if (!breakevenState) return undefined;
		const basedOnPriceRatio = breakevenState.based_on_price_ratio.value === 'yes';
		return {
			[ROW_ID_KEY]: uuidv4(),
			key,
			criteria: basedOnPriceRatio ? 'Based on Price Ratio' : 'Direct',
			value: breakevenState.npv_discount,
			unit,
			price_ratio: basedOnPriceRatio ? breakevenState.price_ratio : undefined,
		};
	});
};

const getCategory = (categoryLabel: string | undefined | null, key: string, isCompEconEnabled: boolean) => {
	if (isCompEconEnabled) {
		if (categoryLabel === PRICING_CATEGORIES_CONF.NOT_APPLIES.label) {
			return null;
		}
		if (categoryLabel) {
			return categoryLabel;
		}
		const defaultCategory = PRICING_KEYS_CATEGORIES[key][0].label;
		if (defaultCategory === PRICING_CATEGORIES_CONF.NOT_APPLIES.label) {
			return null;
		}
		return defaultCategory;
	}
	return undefined;
};

const mapPriceModelRows = (
	priceModelState: PriceModel,
	priceModelTemplate: PriceModelFields,
	isCompEconEnabled: boolean
): PricingRow[] => {
	const priceModelRows = PRICING_KEYS_COLUMNS.filter(({ period }) => !!period).map(({ key, optionsKey }) => {
		const fieldData = priceModelState[optionsKey];
		if (!fieldData) return undefined;

		const {
			subItems: {
				cap,
				escalation_model,
				row_view: { headers, rows },
			},
		} = fieldData;

		const escalationsModelFieldTemplate = priceModelTemplate[optionsKey].subItems.escalation_model;
		const escalation =
			escalationsModelFieldTemplate.menuItems.find(({ value }) => value === escalation_model.value) ??
			escalationsModelFieldTemplate.Default;

		return getRowViewRowsData(rows, key, headers, isCompEconEnabled, escalation.label, cap);
	}) as PricingRow[][];

	return priceModelRows.flat(1);
};

const mapCompositionalEconomicRows = (
	compositionalEconomicsState: CompositionalEconomicsModel,
	priceModelTemplate: PriceModelFields
): PricingRow[] => {
	const compositionalEconomicRows = PRICING_COMPOSITIONAL_KEYS_COLUMNS.filter(({ period }) => !!period)
		.map(({ key, category: compositionalCategory, optionsKey }) => {
			const compositionalComponents = compositionalEconomicsState[
				optionsKey
			] as CompositionalEconomicsComponent[];
			if (!compositionalComponents) return undefined;

			return compositionalComponents.reduce((accumulatedCompositionalComponents, compositionalComponent) => {
				if (compositionalComponent.category !== compositionalCategory) {
					return accumulatedCompositionalComponents;
				}

				const { criteria, period, value, unit, escalation_model, cap } = compositionalComponent;

				const escalationsModelFieldTemplate = priceModelTemplate[optionsKey].subItems.escalation_model;
				const escalation =
					escalationsModelFieldTemplate.menuItems.find(({ value }) => value === escalation_model.value) ??
					escalationsModelFieldTemplate.Default;

				return accumulatedCompositionalComponents.concat(
					period?.map((period, i) => {
						if (i === 0) {
							return {
								[ROW_ID_KEY]: uuidv4(),
								key,
								criteria,
								period,
								value: isNaN(Number(value[i])) ? 0 : Number(value[i]),
								category: compositionalCategory,
								unit,
								escalation: escalation.label,
								cap: typeof cap === 'number' ? cap : undefined, // Ensure cap is of type number | undefined
							};
						}

						return {
							[ROW_ID_KEY]: uuidv4(),
							[IS_NESTED_ROW_KEY]: true,
							period,
							value: isNaN(Number(value[i])) ? 0 : Number(value[i]),
						};
					}) ?? []
				);
			}, [] as PricingRow[]);
		})
		.flat(1) as PricingRow[];

	return compositionalEconomicRows;
};

export const assumptionToRows = (
	{ options }: PricingAssumption,
	template: PricingTemplate,
	isCompEconEnabled: boolean
): {
	breakEvenAndPriceModelRows: PricingRow[];
	compositionalEconomicModelRows: PricingRow[];
} => {
	const { saved_from, saved_fields } = options.metadata ?? {};
	const assumptionSavedFromAdvancedView = saved_from === 'advanced_view';

	const shouldRenderBreakevenRow = !assumptionSavedFromAdvancedView || !!saved_fields?.breakeven.length;
	const breakEvenRows = shouldRenderBreakevenRow ? mapBreakevenRows(options.breakeven) : [];

	const priceModelOptions = options.price_model;
	//Remove keys from price model that are not saved in the advanced view
	if (assumptionSavedFromAdvancedView && !!saved_fields?.price_model.length) {
		PRICING_KEYS_COLUMNS.forEach(({ optionsKey }) => {
			if (saved_fields?.price_model.includes(optionsKey)) return;
			delete priceModelOptions[optionsKey];
		});
	}
	const priceModelRows = mapPriceModelRows(priceModelOptions, template.price_model, isCompEconEnabled);

	const compositionalEconomicModelOptions = options.compositional_economics;
	const compositionalEconomicModelRows =
		(compositionalEconomicModelOptions &&
			mapCompositionalEconomicRows(compositionalEconomicModelOptions, template.price_model)) ||
		[];

	return {
		breakEvenAndPriceModelRows: [...breakEvenRows, ...priceModelRows].filter((row) => !!row),
		compositionalEconomicModelRows: [...compositionalEconomicModelRows].filter((row) => !!row),
	};
};

const formatBreakEven = (row: PricingRow | undefined): Breakeven => {
	if (!row)
		return { npv_discount: 0, based_on_price_ratio: { label: 'No', value: 'no' }, price_ratio: '' } as Breakeven;
	const basedOnPriceRatioVal = row.criteria === PRICING_CRITERIA.BASED_ON_PRICE_RATIO ? 'yes' : 'no';
	const price_ratio = basedOnPriceRatioVal === 'yes' ? Number(row?.price_ratio) ?? 0 : '';
	const based_on_price_ratio = { label: capitalize(basedOnPriceRatioVal), value: basedOnPriceRatioVal };
	const npv_discount = Number(row?.value) ?? 0;
	return { npv_discount, based_on_price_ratio, price_ratio } as Breakeven;
};

const formatPriceModelComponent = (
	rows: PricingRow[] | undefined,
	key: string,
	priceModelFields: PriceModelFields
): PriceModelComponent => {
	// Get the first row unit or the default unit
	const unit = rows?.[0]?.unit ?? PRICING_UNITS_MAPPINGS[key][0];
	// Get the assumption value field associated with the key/unit pair.
	const valueField = PRICING_ASSUMPTION_UNIT_AND_KEY_TO_FIELD_NAME_MAPPING[key][unit];
	// The optionKey for the current key to navigate through the
	// price model fields properly.
	const optionKey = Object.values(PRICING_KEYS_CONFIG).find(({ label }) => label === key)?.optionsKey;

	// Get Cap and escalation model, as these are the same for all rows
	const cap = Number(rows?.[0]?.cap) > 0 ? Number(rows?.[0]?.cap) : '';

	const keyPriceModelSubItems = optionKey && priceModelFields[optionKey]?.subItems;

	const rawEscalationValue = rows?.[0]?.escalation;
	const escalationValue = typeof rawEscalationValue === 'string' ? rawEscalationValue : rawEscalationValue?.label;
	const escalationsModelFieldTemplate = keyPriceModelSubItems?.escalation_model;
	const escalation_model =
		(escalationValue && escalationsModelFieldTemplate?.menuItems.find(({ label }) => label === escalationValue)) ||
		escalationsModelFieldTemplate?.Default;

	// Get the criteria, as this determines how we format the rows and set headers
	const criteria = getConstantKeyFromValue(PRICING_CRITERIA, rows?.[0]?.criteria) ?? PRICING_CRITERIA.FLAT;
	const criteriaHeaders = BASE_ASSUMPTION_CRITERIA_MAPPINGS[criteria] ?? BASE_ASSUMPTION_CRITERIA_MAPPINGS.FLAT;
	const priceHeaders = key === PRICING_KEYS.OIL ? unit : { label: unit, value: valueField };

	const defaultCategory = PRICING_KEYS_CATEGORIES[key][0];
	const category =
		Object.values(PRICING_CATEGORIES_CONF).find(({ label }) => rows?.[0]?.category === label) ?? defaultCategory;

	const headers = {
		category: { label: category.label, value: category.optionsKey },
		criteria: criteriaHeaders,
		price: priceHeaders,
	};

	// For empty rows, we just return the default values
	if (!rows || rows.length === 0)
		return {
			cap,
			escalation_model,
			row_view: {
				headers,
				rows: [
					{
						price: unit === PRICING_UNITS.PERCENTAGE_OF_OIL_PRICE ? 100 : 0,
						criteria: PRICING_CRITERIA[criteria] ?? PRICING_CRITERIA.FLAT,
					},
				],
			},
		};
	// For Flat criteria, we just return the value of the first row
	if (criteria === getConstantKeyFromValue(PRICING_CRITERIA, PRICING_CRITERIA.FLAT)) {
		const value = Number(rows[0]?.value ?? 0);
		return {
			cap,
			escalation_model,
			row_view: {
				headers,
				rows: [{ price: value, criteria: PRICING_CRITERIA[criteria] ?? PRICING_CRITERIA.FLAT }],
			},
		};
	}
	// For Time Series criteria, we'll use the helper function to format the rows
	return {
		cap,
		escalation_model,
		row_view: {
			headers,
			rows: getModelTimeSeriesRows({ rows, criteria, assumptionKey: 'price' }) as BasePricingPeriodRows[],
		},
	};
};

const formatPriceModel = (rows: PricingRow[][], priceModelFields: PriceModelFields): PriceModel => {
	const gasRows = rows.filter((row) => row[0]?.key === PRICING_KEYS_CONFIG.GAS.label)[0];
	const oilRows = rows.filter((row) => row[0]?.key === PRICING_KEYS_CONFIG.OIL.label)[0];
	const nglRows = rows.filter((row) => row[0]?.key === PRICING_KEYS_CONFIG.NGL.label)[0];
	const dripCondensateRows = rows.filter((row) => row[0]?.key === PRICING_KEYS_CONFIG.DRIP_COND.label)[0];
	return {
		oil: { subItems: formatPriceModelComponent(oilRows, PRICING_KEYS.OIL, priceModelFields) },
		gas: { subItems: formatPriceModelComponent(gasRows, PRICING_KEYS.GAS, priceModelFields) },
		ngl: { subItems: formatPriceModelComponent(nglRows, PRICING_KEYS.NGL, priceModelFields) },
		drip_condensate: {
			subItems: formatPriceModelComponent(dripCondensateRows, PRICING_KEYS.DRIP_COND, priceModelFields),
		},
	} as PriceModel;
};

const formatCompositionalEconomicComponent = (
	rows: PricingRow[],
	key: string,
	priceModelFields: PriceModelFields
): CompositionalEconomicsComponent => {
	const optionKey = Object.values(PRICING_KEYS_CONFIG).find(({ label }) => label === key)?.optionsKey;

	const keyPriceModelSubItems = optionKey && priceModelFields[optionKey]?.subItems;

	const rawEscalationValue = rows[0].escalation;
	const escalationValue = typeof rawEscalationValue === 'string' ? rawEscalationValue : rawEscalationValue?.label;
	const escalationsModelFieldTemplate = keyPriceModelSubItems?.escalation_model;
	const escalation_model =
		(escalationValue && escalationsModelFieldTemplate?.menuItems.find(({ label }) => label === escalationValue)) ||
		escalationsModelFieldTemplate?.Default;

	const category = rows[0].category;
	const criteria = rows[0].criteria;
	const unit = rows[0].unit;
	const cap = rows[0].cap ?? '';

	const { period, value } = rows.reduce(
		(accumulatedPeriodAndValue: { period; value }, rowToAccumulate: PricingRow) => ({
			period: [...accumulatedPeriodAndValue.period, rowToAccumulate.period],
			value: [...accumulatedPeriodAndValue.value, rowToAccumulate.value],
		}),
		{ period: [], value: [] }
	);

	return {
		key,
		category,
		criteria,
		period,
		value,
		unit,
		escalation_model,
		cap,
	};
};

const formatCompositionalEconomicsModel = (
	rows: PricingRow[][],
	priceModelFields: PriceModelFields
): CompositionalEconomicsModel => {
	const gasRows = rows.filter((row) => row[0]?.key === PRICING_KEYS_CONFIG.GAS.label) ?? [];
	const nglRows = rows.filter((row) => row[0]?.key === PRICING_KEYS_CONFIG.NGL.label) ?? [];

	return {
		gas: gasRows.map((subItemRows) =>
			formatCompositionalEconomicComponent(subItemRows, PRICING_KEYS.GAS, priceModelFields)
		),
		ngl: nglRows.map((subItemRows) =>
			formatCompositionalEconomicComponent(subItemRows, PRICING_KEYS.NGL, priceModelFields)
		),
		omitSection: true,
	};
};

function getRowViewRowsData(
	rows: BasePricingPeriodRows[],
	key: string,
	headers: RowViewHeaders,
	isCompEconEnabled: boolean,
	escalationLabel: string,
	cap: number
): PricingRow[] {
	return rows.map((row: BasePricingPeriodRows, i: number) =>
		i === 0
			? {
					[ROW_ID_KEY]: uuidv4(),
					key,
					criteria: headers.criteria.label,
					period: getPeriodValue({ criteriaHeader: headers.criteria, criteria: row.criteria }),
					value: row.price,
					category: getCategory(headers?.category?.label, key, isCompEconEnabled),
					unit: (headers.price as RowViewHeader).label ?? headers.price,
					escalation: escalationLabel,
					cap,
			  }
			: {
					[ROW_ID_KEY]: uuidv4(),
					[IS_NESTED_ROW_KEY]: true,
					period: getPeriodValue({ criteriaHeader: headers.criteria, criteria: row.criteria }),
					value: row.price,
			  }
	);
}

export function rowsToAssumption(
	rows: PricingRow[],
	template: PricingTemplate,
	isCompEconEnabled: boolean
): PricingAssumption {
	// eslint-disable-next-line new-cap -- TODO eslint fix later
	const options = GenerateNewModelHeaders(template) as PricingAssumption['options'];

	const priceModelFields = template.price_model;

	const groupedRows = groupTimeSeriesRows(rows) as PricingRow[][];
	const breakEvenRow = groupedRows.filter((rows) => rows[0]?.key === PRICING_KEYS_CONFIG.BREAK_EVEN.label)[0];
	const priceAndCompositionalModelRows = groupedRows.filter(
		(rows) => rows[0]?.key !== PRICING_KEYS_CONFIG.BREAK_EVEN.label
	);
	options.breakeven = formatBreakEven(breakEvenRow ? breakEvenRow[0] : undefined);

	// const oilRows = rows.filter((row) => row[0]?.key === PRICING_KEYS_CONFIG.OIL.label)[0]
	const filteredPriceAndCompositionalModelRows = priceAndCompositionalModelRows ?? [];

	const compositionalEconomicsCategoryLabels = Object.values(COMPOSITIONAL_PRICING_CATEGORIES_CONF).map(
		({ label }) => label
	);

	const { priceModelRows, compositionalEconomicsRows } = filteredPriceAndCompositionalModelRows.reduce(
		(accumulatedFilteredRows, rowsToAccumulate) => {
			const category = rowsToAccumulate[0].category;
			const isCompositionalEconomicsRow = category && compositionalEconomicsCategoryLabels.includes(category);

			if (isCompositionalEconomicsRow) {
				return {
					priceModelRows: accumulatedFilteredRows.priceModelRows,
					compositionalEconomicsRows: [
						...accumulatedFilteredRows.compositionalEconomicsRows,
						rowsToAccumulate,
					],
				};
			}

			return {
				priceModelRows: [...accumulatedFilteredRows.priceModelRows, rowsToAccumulate],
				compositionalEconomicsRows: accumulatedFilteredRows.compositionalEconomicsRows,
			};
		},
		{ priceModelRows: [] as PricingRow[][], compositionalEconomicsRows: [] as PricingRow[][] }
	);

	options.price_model = formatPriceModel(priceModelRows, priceModelFields);

	if (isCompEconEnabled) {
		options.compositional_economics = formatCompositionalEconomicsModel(
			compositionalEconomicsRows ?? [],
			priceModelFields
		);
	}

	// Include metadata field, needed for identifying which rows were saved from Advanced View
	options.metadata = {
		saved_from: 'advanced_view',
		saved_fields: {
			price_model: [],
			breakeven: [],
			compositional_economics: [],
		},
	};

	if (breakEvenRow?.length) options.metadata.saved_fields.breakeven.push(PRICING_KEYS_CONFIG.BREAK_EVEN.optionsKey);
	priceModelRows?.forEach((rows) => {
		const keyConfig = Object.values(PRICING_KEYS_CONFIG).find(({ label }) => label === rows[0].key);
		if (keyConfig) options.metadata?.saved_fields.price_model.push(keyConfig.optionsKey);
	});

	const uniqueCompositionalEconomicLabels = new Set(compositionalEconomicsRows?.map((rows) => rows[0].key));
	uniqueCompositionalEconomicLabels?.forEach((rowLabel) => {
		const keyConfig = Object.values(PRICING_KEYS_CONFIG).find(({ label }) => label === rowLabel);
		if (keyConfig) options.metadata?.saved_fields.compositional_economics.push(keyConfig.optionsKey);
	});

	return {
		options,
		econ_function: createEconFunction(options, Object.keys(template)),
	} as PricingAssumption;
}
