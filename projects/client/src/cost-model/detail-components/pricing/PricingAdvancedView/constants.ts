import { mapValues } from 'lodash';

import { CellRendererRowGroup } from '@/components/AdvancedTable/ag-grid-shared';
import { PricingColumns } from '@/cost-model/detail-components/pricing/PricingAdvancedView/types';

export const PRICING_COLUMNS: PricingColumns = {
	key: { field: 'key', label: 'Key', cellRenderer: CellRendererRowGroup, minWidth: 150 },
	criteria: { field: 'criteria', label: 'Criteria', minWidth: 180 },
	period: { field: 'period', label: 'Period', minWidth: 240, enabledForTimeSeries: true },
	value: { field: 'value', label: 'Value', enabledForTimeSeries: true },
	unit: { field: 'unit', label: 'Unit', minWidth: 130 },
	escalation: { field: 'escalation', label: 'Escalation' },
	cap: { field: 'cap', label: 'Cap ($)' },
	price_ratio: { field: 'price_ratio', label: 'Price Ratio' },
};

export const pricing_category_column = {
	field: 'category',
	label: 'Category',
	columnIndex: 1,
	enabledForTimeSeries: false,
};

export const PRICING_KEYS_CONFIG = {
	OIL: { label: 'Oil', periodDisabled: false, optionsKey: 'oil' },
	GAS: { label: 'Gas', periodDisabled: false, optionsKey: 'gas' },
	NGL: { label: 'NGL', periodDisabled: false, optionsKey: 'ngl' },
	DRIP_COND: { label: 'Drip Cond', periodDisabled: false, optionsKey: 'drip_condensate' },
	BREAK_EVEN: { label: '8/8ths Break Even', periodDisabled: true, optionsKey: 'breakeven' },
};

export const PRICING_KEYS = mapValues(PRICING_KEYS_CONFIG, (config) => config.label);

export const PRICING_CATEGORIES_CONF = {
	NOT_APPLIES: { label: 'N/A', optionsKey: 'default', key: 'NOT_APPLIES' },
	FULL_STREAM: { label: 'Full Stream', optionsKey: 'full_stream', key: 'FULL_STREAM' },
};

export const COMPOSITIONAL_PRICING_CATEGORIES_CONF = {
	REMAINING: { label: 'Remaining', optionsKey: 'remaining', key: 'REMAINING' },
	N2: { label: 'N2', optionsKey: 'n2', key: 'N2' },
	CO2: { label: 'CO2', optionsKey: 'co2', key: 'CO2' },
	C1: { label: 'C1', optionsKey: 'c1', key: 'C1' },
	C2: { label: 'C2', optionsKey: 'c2', key: 'C2' },
	C3: { label: 'C3', optionsKey: 'c3', key: 'C3' },
	IC4: { label: 'iC4', optionsKey: 'ic4', key: 'IC4' },
	NC4: { label: 'nC4', optionsKey: 'nc4', key: 'NC4' },
	IC5: { label: 'iC5', optionsKey: 'ic5', key: 'IC5' },
	NC5: { label: 'nC5', optionsKey: 'nc5', key: 'NC5' },
	IC6: { label: 'iC6', optionsKey: 'ic6', key: 'IC6' },
	NC6: { label: 'nC6', optionsKey: 'nc6', key: 'NC6' },
	C7: { label: 'C7', optionsKey: 'c7', key: 'C7' },
	C8: { label: 'C8', optionsKey: 'c8', key: 'C8' },
	C9: { label: 'C9', optionsKey: 'c9', key: 'C9' },
	'C10+': { label: 'C10+', optionsKey: 'c10+', key: 'C10+' },
	H2S: { label: 'H2S', optionsKey: 'h2s', key: 'H2S' },
	H2: { label: 'H2', optionsKey: 'h2', key: 'H2' },
	H2O: { label: 'H2O', optionsKey: 'h2o', key: 'H2O' },
	HE: { label: 'He', optionsKey: 'he', key: 'HE' },
	O2: { label: 'O2', optionsKey: 'o2', key: 'O2' },
};

export const PRICING_KEYS_CATEGORIES = {
	[PRICING_KEYS.OIL]: [PRICING_CATEGORIES_CONF.NOT_APPLIES],
	[PRICING_KEYS.GAS]: [PRICING_CATEGORIES_CONF.FULL_STREAM],
	[PRICING_KEYS.NGL]: [PRICING_CATEGORIES_CONF.FULL_STREAM],
	[PRICING_KEYS.DRIP_COND]: [PRICING_CATEGORIES_CONF.NOT_APPLIES],
	[PRICING_KEYS.BREAK_EVEN]: [PRICING_CATEGORIES_CONF.NOT_APPLIES],
};

export const PRICING_COMPOSITIONAL_KEYS_CATEGORIES = {
	[PRICING_KEYS.GAS]: Object.values(COMPOSITIONAL_PRICING_CATEGORIES_CONF),
	[PRICING_KEYS.NGL]: Object.values(COMPOSITIONAL_PRICING_CATEGORIES_CONF),
};

export const PRICING_UNITS = {
	PER_BBL: '$/BBL',
	PER_MMBTU: '$/MMBTU',
	PER_MCF: '$/MCF',
	PER_GAL: '$/GAL',
	PERCENTAGE_OF_OIL_PRICE: '% of Oil Price',
	NPV_DISCOUNT: 'NPV Discount %',
};

export const PRICING_CRITERIA = {
	FLAT: 'Flat',
	AS_OF: 'As Of',
	DATES: 'Dates',
	BASED_ON_PRICE_RATIO: 'Based on Price Ratio',
	DIRECT: 'Direct',
};

const DEFAULT_ESCALATION = 'None';

export const PRICING_UNITS_MAPPINGS = {
	[PRICING_KEYS.OIL]: [PRICING_UNITS.PER_BBL],
	[PRICING_KEYS.GAS]: [PRICING_UNITS.PER_MMBTU, PRICING_UNITS.PER_MCF],
	[PRICING_KEYS.NGL]: [PRICING_UNITS.PERCENTAGE_OF_OIL_PRICE, PRICING_UNITS.PER_BBL, PRICING_UNITS.PER_GAL],
	[PRICING_KEYS.DRIP_COND]: [PRICING_UNITS.PER_BBL, PRICING_UNITS.PERCENTAGE_OF_OIL_PRICE],
	[PRICING_KEYS.BREAK_EVEN]: [PRICING_UNITS.NPV_DISCOUNT],
};

export const PRICING_CRITERIA_MAPPINGS = {
	[PRICING_KEYS.OIL]: [PRICING_CRITERIA.FLAT, PRICING_CRITERIA.AS_OF, PRICING_CRITERIA.DATES],
	[PRICING_KEYS.GAS]: [PRICING_CRITERIA.FLAT, PRICING_CRITERIA.AS_OF, PRICING_CRITERIA.DATES],
	[PRICING_KEYS.NGL]: [PRICING_CRITERIA.FLAT, PRICING_CRITERIA.AS_OF, PRICING_CRITERIA.DATES],
	[PRICING_KEYS.DRIP_COND]: [PRICING_CRITERIA.FLAT, PRICING_CRITERIA.AS_OF, PRICING_CRITERIA.DATES],
	[PRICING_KEYS.BREAK_EVEN]: [PRICING_CRITERIA.DIRECT, PRICING_CRITERIA.BASED_ON_PRICE_RATIO],
};

export const PRICING_KEYS_COLUMNS = Object.values(PRICING_KEYS_CONFIG).map(
	({ label: pricingKey, periodDisabled, optionsKey }) => {
		const defaultUnit = PRICING_UNITS_MAPPINGS[pricingKey][0];
		const defaultCategory: string | null =
			PRICING_KEYS_CATEGORIES[pricingKey][0].label === 'N/A'
				? null
				: PRICING_KEYS_CATEGORIES[pricingKey][0].label ?? null;
		const defaultCriteria = PRICING_CRITERIA_MAPPINGS[pricingKey][0];
		const escalation = pricingKey !== PRICING_KEYS_CONFIG.BREAK_EVEN.label ? DEFAULT_ESCALATION : undefined;

		return {
			key: pricingKey,
			category: defaultCategory,
			unit: defaultUnit,
			criteria: defaultCriteria,
			period: periodDisabled ? undefined : defaultCriteria,
			value: defaultUnit === PRICING_UNITS.PERCENTAGE_OF_OIL_PRICE ? 100 : 0,
			escalation,
			optionsKey,
		};
	}
);

/**
 * This accounts only for compositional Default rows. The reason to split them is to enable proper Feature Flagging.
 * Also doing it separately to keep the original order (comps after the full 5 pricing items).
 */
export const PRICING_COMPOSITIONAL_KEYS_COLUMNS = Object.entries(PRICING_KEYS_CONFIG).flatMap(
	([, { label, periodDisabled, optionsKey }]) => {
		if (!PRICING_COMPOSITIONAL_KEYS_CATEGORIES[label]) return [];
		return Object.values(PRICING_COMPOSITIONAL_KEYS_CATEGORIES[label])?.map((category) => {
			const defaultUnit = PRICING_UNITS_MAPPINGS[label][0];
			const defaultCategory: string = PRICING_KEYS_CATEGORIES[label][0].label;
			const defaultCriteria = PRICING_CRITERIA_MAPPINGS[label][0];
			const escalation = label !== PRICING_KEYS_CONFIG.BREAK_EVEN.label ? DEFAULT_ESCALATION : undefined;

			return {
				key: label,
				category: category.label ?? defaultCategory,
				unit: defaultUnit,
				criteria: defaultCriteria,
				period: periodDisabled ? undefined : defaultCriteria,
				value: defaultUnit === PRICING_UNITS.PERCENTAGE_OF_OIL_PRICE ? 100 : 0,
				escalation,
				optionsKey,
			};
		});
	}
);

/** This combines the Compositional and Non-Compositional Default Rows */
export const FULL_PRICING_KEYS_COLUMNS = [...PRICING_KEYS_COLUMNS, ...PRICING_COMPOSITIONAL_KEYS_COLUMNS];

export const PRICING_TEMPLATE_QUERY_KEY = ['pricing-template'];

export const PRICING_ASSUMPTION_UNIT_AND_KEY_TO_FIELD_NAME_MAPPING = {
	[PRICING_KEYS.OIL]: {
		[PRICING_UNITS.PER_BBL]: 'price',
	},
	[PRICING_KEYS.GAS]: {
		[PRICING_UNITS.PER_MMBTU]: 'dollar_per_mmbtu',
		[PRICING_UNITS.PER_MCF]: 'dollar_per_mcf',
	},
	[PRICING_KEYS.NGL]: {
		[PRICING_UNITS.PERCENTAGE_OF_OIL_PRICE]: 'pct_of_oil_price',
		[PRICING_UNITS.PER_BBL]: 'dollar_per_bbl',
		[PRICING_UNITS.PER_GAL]: 'dollar_per_gal',
	},
	[PRICING_KEYS.DRIP_COND]: {
		[PRICING_UNITS.PER_BBL]: 'dollar_per_bbl',
		[PRICING_UNITS.PERCENTAGE_OF_OIL_PRICE]: 'pct_of_oil_price',
	},
};

export const pricingProductNameToKey = {
	oil: 'OIL',
	gas: 'GAS',
};
