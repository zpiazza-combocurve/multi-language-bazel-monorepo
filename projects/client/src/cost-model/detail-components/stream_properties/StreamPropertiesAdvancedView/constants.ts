import { CellRendererRowGroup } from '@/components/AdvancedTable/ag-grid-shared';
import { SCHEMA_DESCRIBE_KEY } from '@/components/AdvancedTable/constants';

import { TOOLTIP_MSG_FOR_CALCULATED_FIELDS } from './CompositionalEconomics/constants';
import { StreamPropertiesColumns } from './types';

export const GAS_SHRINK_SOURCES = { FROM_COMP: 'From Comp' };

export const STREAM_PROPERTIES_COLUMNS: StreamPropertiesColumns = {
	key: { field: 'key', label: 'Key', cellRenderer: CellRendererRowGroup },
	category: { field: 'category', label: 'Category' },
	category_group: { label: 'Category Group', field: 'category_group', hide: true },
	criteria: { field: 'criteria', label: 'Criteria', minWidth: 130 },
	period: { field: 'period', label: 'Period', minWidth: 240, enabledForTimeSeries: true },
	source: { field: 'source', label: 'Source' },
	value: {
		field: 'value',
		label: 'Value',
		enabledForTimeSeries: true,
		editable: ({ data }) => {
			if (data.key === 'Gas' && data.category === 'Shrink') {
				if (data[SCHEMA_DESCRIBE_KEY]?.source.optional) return true;
				return false;
			}
			return true;
		},
		tooltipValueGetter: ({ data }) => {
			if (data.key === 'Gas' && data.category === 'Shrink') {
				if (data[SCHEMA_DESCRIBE_KEY]?.source.optional) return '';
				return TOOLTIP_MSG_FOR_CALCULATED_FIELDS;
			}
			return '';
		},
	},
	unit: { field: 'unit', label: 'Unit' },
	rate_type: {
		field: 'rate_type',
		label: 'Rate Type',
		otherColumns: true,
		linkedBy: 'category_group',
	},
	rows_calculation_method: {
		field: 'rows_calculation_method',
		label: 'Rate Rows Calculation Method',
		otherColumns: true,
		linkedBy: 'category_group',
	},
};

export const STREAM_PROPERTIES_KEYS = {
	OIL: 'Oil',
	GAS: 'Gas',
	NGL: 'NGL',
	DRIP_COND: 'Drip Cond',
	BTU: 'BTU',
};

export const STREAM_PROPERTIES_CATEGORIES = {
	SHRINK: 'Shrink',
	LOSS: 'Loss',
	FLARE: 'Flare',
	YIELD: 'Yield',
	SHRUNK: 'Shrunk',
	UNSHRUNK: 'Unshrunk',
};

export const STREAM_PROPERTIES_COMPONENTS = {
	shrinkage: 'shrinkage',
	loss_flare: 'loss_flare',
	yields: 'yields',
	btu_content: 'btu_content',
};

export const STREAM_PROPERTIES_CATEGORY_MAPPINGS = {
	Shrink: STREAM_PROPERTIES_COMPONENTS.shrinkage,
	Loss: STREAM_PROPERTIES_COMPONENTS.loss_flare,
	Flare: STREAM_PROPERTIES_COMPONENTS.loss_flare,
	Yield: STREAM_PROPERTIES_COMPONENTS.yields,
	Shrunk: STREAM_PROPERTIES_COMPONENTS.btu_content,
	Unshrunk: STREAM_PROPERTIES_COMPONENTS.btu_content,
};

export const STREAM_PROPERTIES_KEY_CATEGORIES = [
	{
		key: STREAM_PROPERTIES_KEYS.OIL,
		category: STREAM_PROPERTIES_CATEGORIES.SHRINK,
		category_group: STREAM_PROPERTIES_CATEGORY_MAPPINGS[STREAM_PROPERTIES_CATEGORIES.SHRINK],
		fieldName: 'oil',
		criteria: 'Flat',
		period: 'Flat',
		source: null,
		value: 100,
		unit: '% Remaining',
	},
	{
		key: STREAM_PROPERTIES_KEYS.OIL,
		category: STREAM_PROPERTIES_CATEGORIES.LOSS,
		category_group: STREAM_PROPERTIES_CATEGORY_MAPPINGS[STREAM_PROPERTIES_CATEGORIES.LOSS],
		fieldName: 'oil_loss',
		criteria: 'Flat',
		period: 'Flat',
		source: null,
		value: 100,
		unit: '% Remaining',
	},
	{
		key: STREAM_PROPERTIES_KEYS.GAS,
		category: STREAM_PROPERTIES_CATEGORIES.SHRINK,
		category_group: STREAM_PROPERTIES_CATEGORY_MAPPINGS[STREAM_PROPERTIES_CATEGORIES.SHRINK],
		fieldName: 'gas',
		criteria: 'Flat',
		period: 'Flat',
		source: null,
		value: 100,
		unit: '% Remaining',
	},
	{
		key: STREAM_PROPERTIES_KEYS.GAS,
		category: STREAM_PROPERTIES_CATEGORIES.LOSS,
		category_group: STREAM_PROPERTIES_CATEGORY_MAPPINGS[STREAM_PROPERTIES_CATEGORIES.LOSS],
		fieldName: 'gas_loss',
		criteria: 'Flat',
		period: 'Flat',
		source: null,
		value: 100,
		unit: '% Remaining',
	},
	{
		key: STREAM_PROPERTIES_KEYS.GAS,
		category: STREAM_PROPERTIES_CATEGORIES.FLARE,
		category_group: STREAM_PROPERTIES_CATEGORY_MAPPINGS[STREAM_PROPERTIES_CATEGORIES.FLARE],
		fieldName: 'gas_flare',
		criteria: 'Flat',
		period: 'Flat',
		source: null,
		value: 100,
		unit: '% Remaining',
	},
	{
		key: STREAM_PROPERTIES_KEYS.NGL,
		category: STREAM_PROPERTIES_CATEGORIES.YIELD,
		category_group: STREAM_PROPERTIES_CATEGORY_MAPPINGS[STREAM_PROPERTIES_CATEGORIES.YIELD],
		fieldName: 'ngl',
		criteria: 'Flat',
		period: 'Flat',
		source: 'Unshrunk Gas',
		value: 0,
		unit: 'BBL/MMCF',
	},
	{
		key: STREAM_PROPERTIES_KEYS.DRIP_COND,
		category: STREAM_PROPERTIES_CATEGORIES.YIELD,
		category_group: STREAM_PROPERTIES_CATEGORY_MAPPINGS[STREAM_PROPERTIES_CATEGORIES.YIELD],
		fieldName: 'drip_condensate',
		criteria: 'Flat',
		period: 'Flat',
		source: 'Unshrunk Gas',
		value: 0,
		unit: 'BBL/MMCF',
	},
	{
		key: STREAM_PROPERTIES_KEYS.BTU,
		category: STREAM_PROPERTIES_CATEGORIES.SHRUNK,
		category_group: STREAM_PROPERTIES_CATEGORY_MAPPINGS[STREAM_PROPERTIES_CATEGORIES.SHRUNK],
		fieldName: 'shrunk_gas',
		criteria: null,
		period: null,
		source: null,
		value: 1000,
		unit: 'MBTU/MCF',
	},
	{
		key: STREAM_PROPERTIES_KEYS.BTU,
		category: STREAM_PROPERTIES_CATEGORIES.UNSHRUNK,
		category_group: STREAM_PROPERTIES_CATEGORY_MAPPINGS[STREAM_PROPERTIES_CATEGORIES.UNSHRUNK],
		fieldName: 'unshrunk_gas',
		criteria: null,
		period: null,
		source: null,
		value: 1000,
		unit: 'MBTU/MCF',
	},
];

export const STREAM_PROPERTIES_CRITERIA = {
	entire_well_life: 'Flat',
	offset_to_fpd: 'FPD',
	offset_to_as_of_date: 'As Of',
	offset_to_first_segment: 'Maj Seg',
	offset_to_end_history: 'End Hist',
	dates: 'Dates',
	oil_rate: 'Oil Rate',
	gas_rate: 'Gas Rate',
	water_rate: 'Water Rate',
};
// Inverse the above object
export const STREAM_PROPERTIES_CRITERIA_INVERSE = Object.keys(STREAM_PROPERTIES_CRITERIA).reduce((ret, key) => {
	ret[STREAM_PROPERTIES_CRITERIA[key]] = key;
	return ret;
}, {});

export const STREAM_PROPERTIES_SOURCE = {
	unshrunk_gas: 'Unshrunk Gas',
	shrunk_gas: 'Shrunk Gas',
};

export const STREAM_PROPERTIES_TEMPLATE_QUERY_KEY = ['stream-properties-template'];

export const STREAM_PROPERTIES_RATE_LABELS = ['Oil Rate', 'Gas Rate', 'Water Rate'];
