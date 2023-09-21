import flatten from 'lodash/flatten';
import mapValues from 'lodash/mapValues';

import { CellRendererRowGroup } from '@/components/AdvancedTable/ag-grid-shared';
import { DifferentialsColumns } from '@/cost-model/detail-components/differentials/DifferentialsAdvancedView/types';

export const DIFFERENTIALS_COLUMNS: DifferentialsColumns = {
	key: { field: 'key', label: 'Key', cellRenderer: CellRendererRowGroup, minWidth: 150 },
	category: { field: 'category', label: 'Category' },
	criteria: { field: 'criteria', label: 'Criteria' },
	period: { field: 'period', label: 'Period', minWidth: 240, enabledForTimeSeries: true },
	value: { field: 'value', label: 'Value', enabledForTimeSeries: true },
	unit: { field: 'unit', label: 'Unit' },
	escalation: { field: 'escalation', label: 'Escalation' },
};

export const DIFFERENTIALS_KEYS_CONFIG = {
	OIL: { label: 'Oil', periodDisabled: false, optionsKey: 'oil', key: 'OIL' },
	GAS: { label: 'Gas', periodDisabled: false, optionsKey: 'gas', key: 'GAS' },
	NGL: { label: 'NGL', periodDisabled: false, optionsKey: 'ngl', key: 'NGL' },
	DRIP_COND: { label: 'Drip Cond', periodDisabled: false, optionsKey: 'drip_condensate', key: 'DRIP_COND' },
};

export const DIFFERENTIALS_KEYS = mapValues(DIFFERENTIALS_KEYS_CONFIG, (config) => config.label);

export const DIFFERENTIALS_CATEGORIES = {
	firstDiff: '1st Diff',
	secondDiff: '2nd Diff',
	thirdDiff: '3rd Diff',
};

const DIFFERENTIALS_CATEGORIES_KEYS_MAPPINGS = Object.fromEntries(
	Object.values(DIFFERENTIALS_CATEGORIES).map((category) => [category, Object.values(DIFFERENTIALS_KEYS_CONFIG)])
);

const DEFAULT_ESCALATION = 'None';

// This is the way the menuItem label for % Base Price Remaining
// is received from the API
export const PERCENTAGE_OF_BASE_PRICE_REPHRASED = '% Base Price Rem';

export const DIFFERENTIALS_UNITS = {
	PER_BBL: '$/BBL',
	PER_MMBTU: '$/MMBTU',
	PER_MCF: '$/MCF',
	PER_GAL: '$/GAL',
	PERCENTAGE_OF_BASE_PRICE: '% Base Price Remaining',
};

export const DIFFERENTIALS_UNITS_MAPPINGS = {
	[DIFFERENTIALS_KEYS.OIL]: [DIFFERENTIALS_UNITS.PER_BBL, DIFFERENTIALS_UNITS.PERCENTAGE_OF_BASE_PRICE],
	[DIFFERENTIALS_KEYS.GAS]: [
		DIFFERENTIALS_UNITS.PER_MMBTU,
		DIFFERENTIALS_UNITS.PER_MCF,
		DIFFERENTIALS_UNITS.PERCENTAGE_OF_BASE_PRICE,
	],
	[DIFFERENTIALS_KEYS.NGL]: [
		DIFFERENTIALS_UNITS.PER_BBL,
		DIFFERENTIALS_UNITS.PER_GAL,
		DIFFERENTIALS_UNITS.PERCENTAGE_OF_BASE_PRICE,
	],
	[DIFFERENTIALS_KEYS.DRIP_COND]: [DIFFERENTIALS_UNITS.PER_BBL, DIFFERENTIALS_UNITS.PERCENTAGE_OF_BASE_PRICE],
};

export const DIFFERENTIALS_CRITERIA = {
	FLAT: 'Flat',
	AS_OF: 'As Of',
	DATES: 'Dates',
};

export const defaultCriteria = DIFFERENTIALS_CRITERIA.FLAT;

export const DIFFERENTIALS_KEYS_COLUMNS = flatten(
	Object.entries(DIFFERENTIALS_CATEGORIES_KEYS_MAPPINGS).map(([differentialCategory, differentialKeys]) =>
		differentialKeys.map(({ label: differentialKeyLabel, optionsKey }) => {
			const defaultCategory = DIFFERENTIALS_CATEGORIES.firstDiff;
			const defaultUnit = DIFFERENTIALS_UNITS_MAPPINGS[differentialKeyLabel]?.[0] ?? '';
			return {
				key: differentialKeyLabel,
				category: differentialCategory ?? defaultCategory,
				criteria: defaultCriteria,
				period: defaultCriteria,
				value: 0,
				unit: defaultUnit,
				escalation: DEFAULT_ESCALATION,
				optionsKey,
			};
		})
	)
);

export const DIFFERENTIALS_TEMPLATE_QUERY_KEY = ['differentials-template'];

export const DIFFERENTIAL_ASSUMPTION_UNIT_AND_KEY_TO_FIELD_NAME_MAPPING = {
	[DIFFERENTIALS_KEYS.OIL]: {
		[DIFFERENTIALS_UNITS.PER_BBL]: 'dollar_per_bbl',
		[DIFFERENTIALS_UNITS.PERCENTAGE_OF_BASE_PRICE]: 'pct_of_base_price',
	},
	[DIFFERENTIALS_KEYS.GAS]: {
		[DIFFERENTIALS_UNITS.PER_MMBTU]: 'dollar_per_mmbtu',
		[DIFFERENTIALS_UNITS.PER_MCF]: 'dollar_per_mcf',
		[DIFFERENTIALS_UNITS.PERCENTAGE_OF_BASE_PRICE]: 'pct_of_base_price',
	},
	[DIFFERENTIALS_KEYS.NGL]: {
		[DIFFERENTIALS_UNITS.PER_BBL]: 'dollar_per_bbl',
		[DIFFERENTIALS_UNITS.PER_GAL]: 'dollar_per_gal',
		[DIFFERENTIALS_UNITS.PERCENTAGE_OF_BASE_PRICE]: 'pct_of_base_price',
	},
	[DIFFERENTIALS_KEYS.DRIP_COND]: {
		[DIFFERENTIALS_UNITS.PER_BBL]: 'dollar_per_bbl',
		[DIFFERENTIALS_UNITS.PERCENTAGE_OF_BASE_PRICE]: 'pct_of_base_price',
	},
};
