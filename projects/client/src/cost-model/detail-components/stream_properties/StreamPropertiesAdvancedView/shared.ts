import { ColDef, ColGroupDef } from 'ag-grid-community';
import { capitalize, isString, partition, snakeCase } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import { eltColumnDefinition } from '@/components/AdvancedTable/ag-grid-shared';
import { IS_NESTED_ROW_KEY, ROW_ID_KEY } from '@/components/AdvancedTable/constants';
import { formatDateRangeValue, parseDateValue } from '@/components/AdvancedTable/shared';
import { GenerateNewModelHeaders, createEconFunction } from '@/cost-model/detail-components/gen-data';
import {
	STREAM_PROPERTIES_CATEGORY_MAPPINGS,
	STREAM_PROPERTIES_COLUMNS,
	STREAM_PROPERTIES_COMPONENTS,
	STREAM_PROPERTIES_CRITERIA,
	STREAM_PROPERTIES_CRITERIA_INVERSE,
	STREAM_PROPERTIES_KEY_CATEGORIES,
	STREAM_PROPERTIES_RATE_LABELS,
	STREAM_PROPERTIES_SOURCE,
} from '@/cost-model/detail-components/stream_properties/StreamPropertiesAdvancedView/constants';
import { snakelizeObjectKeys } from '@/helpers/text';

import { parseAssumptionOptionsRowsCriteria } from '../../AdvancedModelView/shared';
import { CompositionalEconomicsRow } from './CompositionalEconomics/types';
import { STREAM_PROPERTIES_CATEGORIES, STREAM_PROPERTIES_KEYS } from './constants';
import {
	CriteriaRowViewHeader,
	CriteriaRowViewRow,
	StreamPropertiesAssumption,
	StreamPropertiesOptionsGenericRowView,
	StreamPropertiesRow,
	StreamPropertiesTemplate,
} from './types';
import { CompositionalEconomicsOptionsRows } from './types/assumptionTypes';

export const getStreamPropertiesColumnsDef = (enableELTColumn: boolean): ColGroupDef[] => {
	const streamPropertiesChildren: ColDef[] = [];
	const streamPropertiesOtherChildren: ColDef[] = [];

	if (enableELTColumn) {
		streamPropertiesChildren.push(eltColumnDefinition);
	}

	const mapHeaderName = (field) => ({ ...field, headerName: field.label });
	const columnsMappedWithHeaderName = Object.values(STREAM_PROPERTIES_COLUMNS).map(mapHeaderName);
	const [streamPropertiesColumns, otherColumns] = partition(
		columnsMappedWithHeaderName,
		({ otherColumns }) => !otherColumns
	);

	streamPropertiesChildren.push(...streamPropertiesColumns);
	streamPropertiesOtherChildren.push(...otherColumns);

	return [
		{
			headerName: 'Stream Properties',
			children: streamPropertiesChildren,
		},
		{
			headerName: 'Others',
			groupId: 'others',
			children: streamPropertiesOtherChildren,
		},
	];
};

const getAssumptionFieldData = ({
	category,
	fieldName,
	assumption,
}: {
	category: string;
	fieldName?: string;
	assumption: StreamPropertiesAssumption;
}) => {
	const componentKey = STREAM_PROPERTIES_CATEGORY_MAPPINGS[category];
	const componentType = componentKey && STREAM_PROPERTIES_COMPONENTS[componentKey];
	const fieldData = assumption?.options?.[componentType];
	return fieldName ? fieldData?.[fieldName] : fieldData;
};

/**
 * Returns period value based on criteria header value:
 *
 * - If criteria is string, return it (Flat criteria)
 * - If criteria is of rate type, will return start value for criteria row
 * - If criteria is of date type, will parse and format start_date value for criteria row
 * - Otherwise, will try return either period value for criteria row for the period types
 */
const getPeriodValue = ({
	criteriaHeader,
	criteria,
}: {
	criteriaHeader: CriteriaRowViewHeader;
	criteria: CriteriaRowViewRow;
}) => {
	if (isString(criteria)) return criteriaHeader.label;
	if (criteriaHeader.value.split('_')[1] === 'rate') return criteria?.start;
	if (criteriaHeader.value === 'dates' && criteria?.start_date) {
		const isoDateString = new Date(criteria.start_date).toISOString();
		return formatDateRangeValue(parseDateValue(isoDateString));
	}
	return criteria?.period;
};

const shouldRenderRow = ({
	assumption,
	category,
	fieldName,
}: {
	assumption: StreamPropertiesAssumption;
	category: string;
	fieldName: string;
}) => {
	const {
		options: { metadata },
	} = assumption;
	if (!metadata) return true;
	if (metadata.saved_from !== 'advanced_view') return true;
	const componentKey = STREAM_PROPERTIES_CATEGORY_MAPPINGS[category];
	const fieldSavedByUser = metadata.saved_fields?.[componentKey].includes(fieldName);
	if (fieldSavedByUser) return true;
	return false;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const mapBTURows = (assumption: StreamPropertiesAssumption): StreamPropertiesRow[] | any[] => {
	const btuRows = STREAM_PROPERTIES_KEY_CATEGORIES.filter(({ key }) => key === STREAM_PROPERTIES_KEYS.BTU).map(
		({ key, category, fieldName, unit }) => {
			if (!shouldRenderRow({ assumption, category, fieldName })) return undefined;

			const fieldData = getAssumptionFieldData({ category, assumption, fieldName });
			if (!fieldData) return undefined;

			const categoryGroup = STREAM_PROPERTIES_KEY_CATEGORIES.find(
				(streamProp) => streamProp.key === key && streamProp.category === category
			)?.category_group;

			return {
				[ROW_ID_KEY]: uuidv4(),
				key,
				category,
				value: fieldData,
				category_group: categoryGroup,
				unit,
			};
		}
	);

	return btuRows;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const mapPeriodRows = (assumption: StreamPropertiesAssumption): StreamPropertiesRow[] | any[] => {
	const periodRows = STREAM_PROPERTIES_KEY_CATEGORIES.filter(({ period }) => !!period).map(
		({ key, category, fieldName, unit }) => {
			if (!shouldRenderRow({ assumption, category, fieldName })) return undefined;

			const fieldData = getAssumptionFieldData({ category, assumption });
			if (!fieldData) return undefined;

			const {
				rate_type,
				rows_calculation_method,
				[fieldName]: {
					subItems: {
						row_view: { headers, rows },
					},
				},
			} = fieldData;

			const fieldCategory = STREAM_PROPERTIES_CATEGORY_MAPPINGS[category];
			const fieldMetadata = assumption.options?.metadata?.saved_fields_data?.[fieldCategory]?.[fieldName];

			const isRateCriteria = STREAM_PROPERTIES_RATE_LABELS.includes(headers.criteria.label);

			const isYieldCategory = category === STREAM_PROPERTIES_CATEGORIES.YIELD;

			const categoryGroup = STREAM_PROPERTIES_KEY_CATEGORIES.find(
				(streamProp) => streamProp.key === key && streamProp.category === category
			)?.category_group;

			return rows.map((row: StreamPropertiesOptionsGenericRowView, i: number) =>
				i === 0
					? {
							[ROW_ID_KEY]: uuidv4(),
							key,
							category,
							category_group: categoryGroup,
							criteria: headers.criteria.label,
							period: getPeriodValue({ criteriaHeader: headers.criteria, criteria: row.criteria }),
							source: isYieldCategory ? headers.gas_type.label : fieldMetadata?.['source'],
							value: isYieldCategory ? row.yield : row.pct_remaining,
							unit: isYieldCategory ? unit : headers.pct_remaining,
							rate_type: isRateCriteria ? rate_type.label : undefined,
							rows_calculation_method: isRateCriteria ? rows_calculation_method.label : undefined,
					  }
					: {
							[ROW_ID_KEY]: uuidv4(),
							[IS_NESTED_ROW_KEY]: true,
							period: getPeriodValue({ criteriaHeader: headers.criteria, criteria: row.criteria }),
							value: isYieldCategory ? row.yield : row.pct_remaining,
					  }
			);
		}
	);

	return periodRows.flat(1);
};

/** Will convert from data saved in the db to rows used by ag grid */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const assumptionToRows = (assumption: StreamPropertiesAssumption): StreamPropertiesRow[] | any[] => {
	const btuRows = mapBTURows(assumption);
	const periodRows = mapPeriodRows(assumption);

	return [...btuRows, ...periodRows].filter((row) => !!row);
};

type ParsedStreamPropertiesOption = {
	btu_category?: string;
	btu_value?: number;
	categoryKey?: string;
	assumptionFieldName?: string;
	optionRows?: object[];
	headers?: object;
	rate_type?: { label: string; value: string };
	rows_calculation_method?: { label: string; value: string };
	metadata?: Record<string, unknown>;
};

/**
 * Transforms a row buffer into an option object
 *
 * @remarks
 *   This is a helper function for the {@link rowsToAssumption} function.
 * @param {StreamPropertiesRow[]} rowBuffer - The row buffer
 * @returns {ParsedStreamPropertiesOption} - The option object with the following properties:
 *
 *   - Btu_category: the BTU category - Only if the row buffer is for BTU
 *   - Btu_value: the BTU value - Only if the row buffer is for BTU
 *   - CategoryKey: the category key - For all other cases
 *   - AssumptionFieldName: the assumption field name - For all other cases
 *   - OptionRows: the option rows - For all other cases
 *   - Headers: the headers - For all other cases
 */

export function rowBufferToOption(rowBuffer: StreamPropertiesRow[]): ParsedStreamPropertiesOption {
	// Special treatment for BTU
	if (rowBuffer[0]?.key === STREAM_PROPERTIES_KEYS.BTU) {
		const btu_category = `${
			rowBuffer[0].category?.toLowerCase() ?? STREAM_PROPERTIES_CATEGORIES.SHRUNK.toLowerCase()
		}_gas`;
		return { btu_category, btu_value: Number(rowBuffer[0].value) };
	}
	// Get the key, category, criteria, source, rate_type and rows_calculation_method from the first row
	const {
		key,
		category,
		criteria,
		source,
		rate_type: rateType,
		rows_calculation_method: rowsCalculationMethod,
	} = rowBuffer[0];
	// Get the field name
	const assumptionFieldName = STREAM_PROPERTIES_CATEGORY_MAPPINGS[capitalize(rowBuffer[0].category ?? 'shrink')];
	// Get the category key
	let categoryKey = key?.toLowerCase();
	// For loss_flare we need to compose the category key (oil_loss, gas_flare...)
	if (category === STREAM_PROPERTIES_CATEGORIES.LOSS || category === STREAM_PROPERTIES_CATEGORIES.FLARE) {
		categoryKey = `${key?.toLowerCase()}_${category?.toLowerCase()}`;
	} else if (categoryKey === 'drip cond') {
		// We have a mismatch between the key in case of drip cond and the categoryKey so we need to manually set it
		categoryKey = 'drip_condensate';
	}
	// Setup headers
	const headers = {
		criteria: { value: STREAM_PROPERTIES_CRITERIA_INVERSE[criteria ?? 'Flat'], label: criteria ?? 'Flat' },
	};

	// Setup the extras for the row
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const extraRowFields: any = {};
	const rowValueField = assumptionFieldName === 'yields' ? 'yield' : 'pct_remaining';

	// Setup the headers and extra row fields based on the assumption field name
	if (assumptionFieldName === 'yields') {
		const yield_type = key === STREAM_PROPERTIES_KEYS.NGL ? 'NGL' : 'Drip Cond';
		const gas_type = source ?? STREAM_PROPERTIES_SOURCE.unshrunk_gas;
		headers['yield'] = yield_type + ' Yield';
		headers['gas_type'] = { label: gas_type, value: gas_type.toLowerCase().replace(' ', '_') };
		extraRowFields['gas_type'] = gas_type;
	} else {
		headers['pct_remaining'] = '% Remaining';
	}
	// Now we set the rows based on the criteria
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	let rows: any[] = [];
	rows = rowBuffer.map((row) => {
		const parsedCriteria = parseAssumptionOptionsRowsCriteria({
			row,
			isDateCriteria: criteria === STREAM_PROPERTIES_CRITERIA.dates,
			isRateCriteria: !!rateType,
		});

		return {
			...extraRowFields,
			[rowValueField]: Number(row.value),
			criteria: parsedCriteria,
		};
	});

	const optionsObj: ParsedStreamPropertiesOption = { assumptionFieldName, categoryKey, headers, optionRows: rows };

	// Persist source for Gas Shrinkage
	if (key === STREAM_PROPERTIES_KEYS.GAS && category === STREAM_PROPERTIES_CATEGORIES.SHRINK && !!source) {
		optionsObj.metadata = { source };
	}

	if (rateType) {
		optionsObj.rate_type = { label: rateType, value: 'gross_well_head' };
		optionsObj.rows_calculation_method = {
			label: rowsCalculationMethod ?? 'Non Monotonic',
			value: snakeCase(rowsCalculationMethod) ?? 'non_monotonic',
		};
	}

	return optionsObj;
}

export function rowsToAssumption(
	rows: StreamPropertiesRow[],
	template: StreamPropertiesTemplate,
	compEconRows?: CompositionalEconomicsRow[]
): StreamPropertiesAssumption {
	/* Converts the rows into an assumption object
	The objective is to be able to store the state of the table in the database.

	 * @param {StreamPropertiesRow[]} rows - the rows
	 * @param {StreamPropertiesTemplate} template - the template
	 * @returns {StreamPropertiesAssumption} - the assumption object
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	let timeSeriesRowBuffer: any[] = [];
	// eslint-disable-next-line new-cap -- TODO eslint fix later
	const options = GenerateNewModelHeaders(template) as StreamPropertiesAssumption['options'];

	// Include metadata field, needed for identifying which rows were saved from Advanced View
	options.metadata = {
		saved_from: 'advanced_view',
		saved_fields: {
			btu_content: [],
			loss_flare: [],
			shrinkage: [],
			yields: [],
		},
		saved_fields_data: {
			btu_content: {},
			loss_flare: {},
			shrinkage: {},
			yields: {},
		},
	};

	// Include compositional economics if it exists.
	// JSON stringify and parse are being used to remove the ag-grid symbol keys
	if (compEconRows) {
		options.compositional_economics = {
			rows: compEconRows.map(
				(row) => snakelizeObjectKeys(JSON.parse(JSON.stringify(row))) as CompositionalEconomicsOptionsRows
			),
			omitSection: true,
		};
	}
	// Helper function to modify the options object
	const modifyOptions = (parsedOption: ParsedStreamPropertiesOption): void => {
		if (parsedOption['btu_category']) {
			options.btu_content[parsedOption['btu_category']] = parsedOption['btu_value'];
			options.metadata?.saved_fields.btu_content.push(parsedOption['btu_category']);
		} else {
			const {
				assumptionFieldName,
				categoryKey,
				headers,
				optionRows,
				rate_type,
				rows_calculation_method,
				metadata: parsedMetadata,
			} = parsedOption;

			if (!assumptionFieldName || !categoryKey || !headers || !optionRows) {
				throw new Error('Invalid assumption field name, category key, headers, or rows');
			}
			options[assumptionFieldName][categoryKey]['subItems']['row_view'] = { headers, rows: optionRows };
			if (options.metadata) {
				options.metadata.saved_fields[assumptionFieldName].push(categoryKey);
				if (parsedMetadata) {
					options.metadata.saved_fields_data[assumptionFieldName][categoryKey] = { ...parsedMetadata };
				}
			}

			if (rate_type) {
				options[assumptionFieldName] = {
					...options[assumptionFieldName],
					rate_type,
					rows_calculation_method,
				};
			}
		}
	};

	for (const row of rows) {
		// Checks whether is a time series row or not, if it is, we use the parent row to get the key and category
		const isParentRow = !!row?.key;
		if (isParentRow) {
			// If it is a parent row and the buffer is full, we need to flush the buffer and start a new one.
			if (timeSeriesRowBuffer?.length > 0) {
				// We also need to modify the options object.
				const parsedOption = rowBufferToOption(timeSeriesRowBuffer);
				modifyOptions(parsedOption);
				timeSeriesRowBuffer = [];
			}
			timeSeriesRowBuffer.push(row);
		} else {
			timeSeriesRowBuffer.push(row);
		}
	}
	// Deal with the last row buffer
	if (timeSeriesRowBuffer?.length > 0) {
		const parsedOption = rowBufferToOption(timeSeriesRowBuffer);
		modifyOptions(parsedOption);
	}
	return {
		options,
		econ_function: createEconFunction(options, Object.keys(template)),
	} as StreamPropertiesAssumption;
}
