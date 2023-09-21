import { TemplateHeaderSelect } from '@/components/AdvancedTable/types';

type StreamPropertiesFieldTypes = 'number' | 'number-range' | 'static' | 'number-range-rate' | 'date-range' | 'select';
type StreamPropertiesFieldValueDateTypes = 'months' | 'datetime';
type StreamPropertiesFieldValueUnitTypes =
	| 'BBL/MMCF'
	| 'BBL/D'
	| 'MMCF/D'
	| 'BBL'
	| 'MMCF'
	| 'D'
	| 'MBTU/MCF'
	| 'MCF/D';
type StreamPropertiesFieldValueTextTypes = 'text' | 'number';
type StreamPropertiesFieldValueAllTypes =
	| StreamPropertiesFieldValueDateTypes
	| StreamPropertiesFieldValueUnitTypes
	| StreamPropertiesFieldValueTextTypes;
type StreamPropertiesHeaderFieldTypes = 'header' | 'header-select';
type StreamPropertiesMultiRowHeaderRelianceCriteriaTypes = 'oil_rate' | 'gas_rate' | 'water_rate' | 'total_revenue';
type StreamPropertiesRateTypeMenuValues = 'gross_well_head';
type StreamPropertiesRowsCalculationMethodMenuValues = 'non_monotonic' | 'monotonic';

export type BaseCategoryFieldType = {
	fieldType: StreamPropertiesHeaderFieldTypes;
	fieldName: string;
	helpText?: string;
	subItems: {
		row_view: {
			minRows: number;
			maxRows: number;
			columns: {
				criteria: TemplateHeaderSelect;
				gas_type?: BaseCriteriaColumn;
				pct_remaining?: BaseNumericColumn;
				yield?: BaseNumericColumn;
			};
		};
	};
};

type BaseDefinitionsType = {
	required: boolean;
	valType: StreamPropertiesFieldValueAllTypes;
	fieldName: string;
	fieldType: StreamPropertiesFieldTypes;
	placeholder: string;
	specialColSpan?: number;
	Default?: {
		label: string;
		value: string;
	};
	menuItems?: {
		label: string;
		value: string;
	}[];
	multiRowHeaderReliance?: {
		criteria: StreamPropertiesMultiRowHeaderRelianceCriteriaTypes[];
	};
};

interface RateDefinitionType extends BaseDefinitionsType {
	Default: {
		label: string;
		value: StreamPropertiesRateTypeMenuValues;
	};
	menuItems: {
		label: string;
		value: StreamPropertiesRateTypeMenuValues;
	}[];
}

interface RowsCalculationMethodDefinitionType extends BaseDefinitionsType {
	Default: {
		label: string;
		value: StreamPropertiesRowsCalculationMethodMenuValues;
	};
	menuItems: {
		label: string;
		value: StreamPropertiesRowsCalculationMethodMenuValues;
	}[];
}

type BaseStreamPropertiesColumn = {
	required: boolean;
	fieldType: string;
	valType: string;
	fieldName: string;
	helpText?: string;
	placeholder?: string;
	description?: string;
};

interface BaseNumericColumn extends BaseStreamPropertiesColumn {
	min: number;
	max: number;
	unit: StreamPropertiesFieldValueUnitTypes;
	Default: number;
	fieldType: 'number';
	valType: 'number' | 'dollars' | 'percentage';
}

interface BaseStaticColumn extends BaseStreamPropertiesColumn {
	Default: {
		label: string;
		value: string;
	};
	menuItems: {
		required: boolean;
		label: string;
		value: string;
		staticValue: string;
		fieldType: string;
		fieldName?: string;
	}[];
}

interface BaseCriteriaColumn extends BaseStreamPropertiesColumn {
	Default: {
		label: string;
		value: string;
	};
	menuItems: {
		required: boolean;
		label: string;
		value: string;
		fieldType: string;
		fieldName?: string;
		staticValue?: string;
		valType?: string;
		min?: number;
		max?: number;
		unit?: string;
	}[];
}

type BtuContent = {
	unshrunk_gas: BaseNumericColumn;
	shrunk_gas: BaseNumericColumn;
};

interface LossFlareCategoryFieldType extends BaseCategoryFieldType {
	subItems: {
		row_view: {
			minRows: number;
			maxRows: number;
			columns: {
				pct_remaining: BaseNumericColumn;
				criteria: TemplateHeaderSelect;
			};
		};
	};
}

type LossFlare = {
	rate_type: RateDefinitionType;
	rows_calculation_method: RowsCalculationMethodDefinitionType;
	oil_loss: LossFlareCategoryFieldType;
	gas_loss: LossFlareCategoryFieldType;
	gas_flare: LossFlareCategoryFieldType;
};

interface ShrinkageCategoryFieldType extends BaseCategoryFieldType {
	subItems: {
		row_view: {
			minRows: number;
			maxRows: number;
			columns: {
				pct_remaining: BaseNumericColumn;
				criteria: TemplateHeaderSelect;
			};
		};
	};
}

type Shrinkage = {
	rate_type: RateDefinitionType;
	rows_calculation_method: RowsCalculationMethodDefinitionType;
	oil: ShrinkageCategoryFieldType;
	gas: ShrinkageCategoryFieldType;
};

interface YieldCategoryFieldType extends BaseCategoryFieldType {
	subItems: {
		row_view: {
			minRows: number;
			maxRows: number;
			columns: {
				yield: BaseNumericColumn;
				criteria: TemplateHeaderSelect;
				gas_type: BaseStaticColumn;
			};
		};
	};
}

type Yield = {
	rate_type: RateDefinitionType;
	rows_calculation_method: RowsCalculationMethodDefinitionType;
	ngl: YieldCategoryFieldType;
	drip_condensate: YieldCategoryFieldType;
};

export type StreamPropertiesTemplate = {
	yields: Yield;
	shrinkage: Shrinkage;
	loss_flare: LossFlare;
	btu_content: BtuContent;
};
