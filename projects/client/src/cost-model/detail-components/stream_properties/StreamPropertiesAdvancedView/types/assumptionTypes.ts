import { SavedFields, SavedFieldsData } from '@/cost-model/detail-components/AdvancedModelView/types';

export type CriteriaRowViewHeader = {
	label: string;
	value: string;
	disabled?: boolean;
	helpText?: string;
};

export type CriteriaRowViewRow =
	| {
			start?: number;
			end?: number;
			period?: number;
			start_date?: string;
			end_date?: string;
	  }
	| string;

export type StreamPropertiesOptionsGenericRowView = {
	criteria: CriteriaRowViewRow;
	yield?: number;
	gas_type?: string;
	pct_remaining?: number;
};

export type YieldsRowViewRow = {
	yield: number;
	criteria: CriteriaRowViewRow;
	gas_type: string;
};

export type YieldsOptions = {
	subItems: {
		row_view: {
			headers: {
				yield: string;
				criteria: CriteriaRowViewHeader;
				gas_type: { label: string; value: string };
			};
			rows: YieldsRowViewRow[];
		};
	};
};

export type ShrinkageRowViewRow = {
	pct_remaining: number;
	criteria: CriteriaRowViewRow;
};

export type ShrinkageOptions = {
	subItems: {
		row_view: {
			headers: {
				pct_remaining: string;
				criteria: CriteriaRowViewHeader;
			};
			rows: ShrinkageRowViewRow[];
		};
	};
};

export type LossFlareRowViewRow = {
	pct_remaining: number;
	criteria: CriteriaRowViewRow;
};

export type LossFlareOptions = {
	subItems: {
		row_view: {
			headers: {
				pct_remaining: string;
				criteria: CriteriaRowViewHeader;
			};
			rows: LossFlareRowViewRow[];
		};
	};
};

export type CompositionalEconomicsOptionsRows = {
	category: string;
	key: string;
	mol_factor: number;
	mol_percentage: number;
	plant_efficiency: number;
	post_extraction: number;
	shrink: number;
	source: string;
	value: number;
};

export type StreamPropertiesAssumptionOptions = {
	yields: {
		drip_condensate: YieldsOptions;
		ngl: YieldsOptions;
		rate_type: object;
		rows_calculation_method: object;
		user_created: string[];
	};
	shrinkage: {
		gas: ShrinkageOptions;
		oil: ShrinkageOptions;
		rate_type: object;
		rows_calculation_method: object;
		user_created: string[];
	};
	loss_flare: {
		gas_flare: LossFlareOptions;
		gas_loss: LossFlareOptions;
		oil_loss: LossFlareOptions;
		rate_type: object;
		rows_calculation_method: object;
		user_created: string[];
	};
	btu_content: {
		shrunk_gas: number;
		unshrunk_gas: number;
		user_created: string[];
	};
	compositional_economics?: {
		rows: CompositionalEconomicsOptionsRows[];
		omitSection: boolean;
	};
	metadata?: {
		saved_from: string;
		saved_fields: SavedFields;
		saved_fields_data: SavedFieldsData;
	};
};

export interface StreamPropertiesAssumption {
	econ_function;
	options: StreamPropertiesAssumptionOptions;
}
