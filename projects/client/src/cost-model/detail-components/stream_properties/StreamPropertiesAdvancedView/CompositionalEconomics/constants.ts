import { ColDef } from 'ag-grid-community';

import { DEFAULT_COLUMN_TYPES, SCHEMA_DESCRIBE_KEY } from '@/components/AdvancedTable/constants';
import { roundedValueGetter } from '@/cost-model/detail-components/AdvancedModelView/shared';

import { CompositionalEconomicsRow } from './types';

export const COMPOSITIONAL_ECONOMICS_SOURCES = { MANUAL: 'Manual', CALCULATED: 'Calculated' };

export const COMPOSITIONAL_ECONOMICS_COMPONENTS = [
	'Remaining',
	'N2',
	'CO2',
	'C1',
	'C2',
	'C3',
	'iC4',
	'nC4',
	'iC5',
	'nC5',
	'iC6',
	'nC6',
	'C7',
	'C8',
	'C9',
	'C10+',
	'H2S',
	'H2',
	'H2O',
	'He',
	'O2',
];

export const COMPOSITIONAL_ECONOMICS_CATEGORIES: Record<string, string> = COMPOSITIONAL_ECONOMICS_COMPONENTS.reduce(
	(obj, component) => {
		return {
			...obj,
			[component.toUpperCase()]: component,
		};
	},
	{}
);

export const TOOLTIP_MSG_FOR_CALCULATED_FIELDS = 'Non-editable based off of Source selection';

const getTooltipValue = ({
	data,
	colDef,
	fieldName,
}: {
	data: CompositionalEconomicsRow;
	colDef: ColDef;
	fieldName: string;
}) => {
	if (!data) return '';

	const _fieldName = colDef.field ?? fieldName;
	if (!_fieldName) return '';

	const isFieldOmitted = data[SCHEMA_DESCRIBE_KEY]?.[_fieldName]?.tests?.find(({ name }) => name === 'omitted');
	if (isFieldOmitted) return '';

	switch (colDef.field) {
		case 'value':
			return data.source === COMPOSITIONAL_ECONOMICS_SOURCES.CALCULATED ? TOOLTIP_MSG_FOR_CALCULATED_FIELDS : '';
		case 'molPercentage':
			return data.category === COMPOSITIONAL_ECONOMICS_CATEGORIES.REMAINING
				? TOOLTIP_MSG_FOR_CALCULATED_FIELDS
				: '';
		case 'plantEfficiency':
			return data.source === COMPOSITIONAL_ECONOMICS_SOURCES.MANUAL ? TOOLTIP_MSG_FOR_CALCULATED_FIELDS : '';
		case 'shrink':
			return data.category !== COMPOSITIONAL_ECONOMICS_CATEGORIES.REMAINING
				? TOOLTIP_MSG_FOR_CALCULATED_FIELDS
				: '';
		case 'postExtraction':
			return TOOLTIP_MSG_FOR_CALCULATED_FIELDS;
		default:
			return '';
	}
};

export const COMPOSITIONAL_ECONOMICS_COLUMNS = {
	key: { field: 'key', label: 'Key' },
	category: { field: 'category', label: 'Category' },
	source: { field: 'source', label: 'Source' },
	value: {
		field: 'value',
		label: 'Yield (BBL/MMCF)',
		editable: ({ data }) => data?.source === COMPOSITIONAL_ECONOMICS_SOURCES.MANUAL,
		tooltipValueGetter: getTooltipValue,
		minWidth: 200,
		valueGetter: ({ data }) => roundedValueGetter(data, 'value'),
		type: DEFAULT_COLUMN_TYPES.numericColumn,
	},
	molPercentage: {
		field: 'molPercentage',
		label: 'Mol %',
		editable: ({ data }) => data?.category !== COMPOSITIONAL_ECONOMICS_CATEGORIES.REMAINING,
		tooltipValueGetter: getTooltipValue,
		valueGetter: ({ data }) => roundedValueGetter(data, 'molPercentage'),
		type: DEFAULT_COLUMN_TYPES.numericColumn,
	},
	molFactor: {
		field: 'molFactor',
		label: 'Gal/lb-mol Factor',
		minWidth: 200,
		type: DEFAULT_COLUMN_TYPES.numericColumn,
	},
	plantEfficiency: {
		field: 'plantEfficiency',
		label: 'Plant Eff (%)',
		editable: ({ data }) => data?.source === COMPOSITIONAL_ECONOMICS_SOURCES.CALCULATED,
		tooltipValueGetter: getTooltipValue,
		valueGetter: ({ data }) => roundedValueGetter(data, 'plantEfficiency'),
		type: DEFAULT_COLUMN_TYPES.numericColumn,
	},
	shrink: {
		field: 'shrink',
		label: 'Shrink (% Remaining)',
		minWidth: 200,
		editable: ({ data }) => data?.category === COMPOSITIONAL_ECONOMICS_CATEGORIES.REMAINING,
		tooltipValueGetter: getTooltipValue,
		valueGetter: ({ data }) => roundedValueGetter(data, 'shrink'),
		type: DEFAULT_COLUMN_TYPES.numericColumn,
	},
	btu: {
		field: 'btu',
		label: 'BTU (MBTU/MCF)',
		minWidth: 200,
		valueGetter: ({ data }) => roundedValueGetter(data, 'btu', 1),
		type: DEFAULT_COLUMN_TYPES.numericColumn,
	},
	postExtraction: {
		field: 'postExtraction',
		label: 'Post Extraction %',
		minWidth: 200,
		editable: false,
		tooltipValueGetter: (params) => getTooltipValue(params),
		valueGetter: ({ data }) => roundedValueGetter(data, 'postExtraction'),
		type: DEFAULT_COLUMN_TYPES.numericColumn,
	},
};

export const COMPOSITIONAL_ECONOMICS_KEY = 'Compositional';

export const GAL_PER_LB_MOL_FACTORS = {
	N2: 4.1643,
	CO2: 6.4598,
	C1: 6.417,
	C2: 10.123,
	C3: 10.428,
	iC4: 12.386,
	nC4: 11.933,
	iC5: 13.843,
	nC5: 13.721,
	iC6: 15.712,
	nC6: 15.565,
	C7: 17.463,
	C8: 19.391,
	C9: 21.3,
	'C10+': 23.232,
	H2S: 5.1171,
	H2: 3.4095,
	H2O: 2.1608,
	He: 3.8471,
	O2: 3.3599,
};

export const BTU_VALUES = {
	N2: 0,
	CO2: 0,
	C1: 1010,
	C2: 1769.7,
	C3: 2515.1,
	iC4: 3251.9,
	nC4: 3262.3,
	iC5: 4000.9,
	nC5: 4008.7,
	iC6: 4747.9,
	nC6: 4755.9,
	C7: 5502.6,
	C8: 6249,
	C9: 6996.3,
	'C10+': 7742.9,
	H2S: 637.1,
	H2: 324.2,
	H2O: 50.31,
	He: 0,
	O2: 0,
	Remaining: 1000,
};

export const COMPOSITIONAL_ECONOMICS_DEFAULT_ROWS = COMPOSITIONAL_ECONOMICS_COMPONENTS.map((component) => ({
	key: COMPOSITIONAL_ECONOMICS_KEY,
	category: component,
	source: COMPOSITIONAL_ECONOMICS_SOURCES.MANUAL,
	molPercentage: 0,
	molFactor: GAL_PER_LB_MOL_FACTORS[component],
	plantEfficiency: component === COMPOSITIONAL_ECONOMICS_CATEGORIES.REMAINING ? undefined : 100,
	btu: BTU_VALUES[component],
}));
