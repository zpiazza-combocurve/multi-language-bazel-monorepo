import { CriteriaHeader, TemplateHeaderSelect } from '@/components/AdvancedTable/types';
import { Dates, OffsetToAsOfDate, SavedFields } from '@/cost-model/detail-components/AdvancedModelView/types';
import {
	BaseNumericPropField,
	BasePropField,
	BaseSelectionPropField,
} from '@/cost-model/detail-components/shared_types/standard_view_types';

interface BreakevenPriceRatioPropField extends BasePropField {
	max: number;
	min: { value: number; include: boolean };
	reliance: { based_on_price_ratio: 'yes' | 'no' };
	unit: string;
}

export type BreakevenFields = {
	based_on_type_ratio: BaseSelectionPropField;
	npv_discount: BaseNumericPropField;
	price_ratio: BreakevenPriceRatioPropField;
};

export type BreakevenState = {
	based_on_price_ratio: { label: string; value: string };
	npv_discount: number;
	price_ratio: string;
};

export type BreakevenProps = {
	fieldsObj: BreakevenFields;
	handleChange: object;
	state: BreakevenState;
};

type PriceModelCapField = {
	fieldName: string;
	fieldType: string;
	min: { value: number; include: boolean };
	required: boolean;
	valType: string;
};

type PriceModelRowViewField = {
	headers?: { criteria: CriteriaHeader; price: object | string };
	columns?: {
		criteria: TemplateHeaderSelect;
		price: BaseSelectionPropField | BaseNumericPropField;
		maxRows: number;
		minRows: number;
	};
	rows?: {
		criteria: string | object;
		price: number;
	};
};

export type PriceModelField = {
	fieldName: string;
	fieldType: string;
	subItems: {
		cap: PriceModelCapField;
		escalation_model: BaseSelectionPropField;
		row_view: PriceModelRowViewField;
	};
	min?: number;
	max?: number;
};

export type PriceModelFields = {
	drip_condensate: PriceModelField;
	gas: PriceModelField;
	ngl: PriceModelField;
	oil: PriceModelField;
};

export type PriceModelProps = {
	collapseState: object;
	fieldsObj: PriceModelFields;
	handlers: object;
	setCollapseState: object;
	state: object;
};

export type PricingTemplate = {
	breakeven: BreakevenFields;
	price_model: PriceModelFields;
};

/*
 * Base Pricing Row to encompass the common period attributes for rows
 * The period attributes are mutually exclusive: entire_well_life, offset_to_as_of_date, or dates.
 */

export type BasePricingPeriodRows = {
	price?: number;
	dollar_per_mmbtu?: number;
	dollar_per_bbl?: number;
	dollar_per_gal?: number;
	dollar_per_mcf?: number;
	pct_of_oil_price?: number;
	criteria?: Dates | OffsetToAsOfDate;
	entire_well_life?: string;
};

export type RowViewHeader = { label: string; value: string; disabled?: boolean };

export interface RowViewHeaders {
	price?: string | RowViewHeader;
	category?: RowViewHeader;
	criteria: RowViewHeader;
}

export type PriceModelComponent = {
	cap: string | number;
	escalation_model: string | { label: string; value: string };
	row_view: {
		headers: RowViewHeaders;
		rows: BasePricingPeriodRows[];
	};
};

export interface PriceModel {
	oil: { subItems: PriceModelComponent };
	gas: { subItems: PriceModelComponent };
	ngl: { subItems: PriceModelComponent };
	drip_condensate: { subItems: PriceModelComponent };
}

export type CompositionalEconomicsComponent = {
	key: string;
	category?: string | null;
	criteria?: string | null;
	period?: (string | number)[];
	value: (string | number)[];
	unit?: string;
	escalation_model: { label: string; value: string };
	cap?: string | number;
};

export interface CompositionalEconomicsModel {
	gas?: CompositionalEconomicsComponent[];
	ngl: CompositionalEconomicsComponent[];
	omitSection: boolean;
}

export interface Breakeven {
	npv_discount: number;
	based_on_price_ratio: { label: 'Yes' | 'No'; value: 'yes' | 'no' };
	price_ratio: number | string;
}

// Assumption used for saving Pricing to the database
export interface PricingAssumptionModel {
	price_model: PriceModel;
	breakeven: Breakeven;
	compositional_economics?: CompositionalEconomicsModel;
	metadata?: {
		saved_from: string;
		saved_fields: SavedFields;
	};
}

export interface PricingAssumption {
	econ_function;
	options: PricingAssumptionModel;
}
