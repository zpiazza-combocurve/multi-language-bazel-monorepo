import { AdvancedTableRow } from '@/components/AdvancedTable/types';

export type CapexRow = AdvancedTableRow & {
	key?: string;
	category?: string | null;

	criteria?: string;
	unit?: string;

	period?: string | number;
	value?: string | number;
};

export interface CapexRowSchemaContext {
	type?: string;
	parentRow?: CapexRow;
	prevRow?: CapexRow;
	eltsCount: Record<string, number>;
}

export type CapexVariableCategory =
	| 'drilling'
	| 'completion'
	| 'legal'
	| 'pad'
	| 'facilities'
	| 'artificial lift'
	| 'workover'
	| 'leasehold'
	| 'development'
	| 'pipelines'
	| 'exploration'
	| 'waterline'
	| 'appraisal'
	| 'other investment'
	| 'abondonment'
	| 'salvage';

export interface SimpleCapexData {
	value: string;
	label: string;
}

export interface CapexColumdData {
	fieldName: string;
	fieldType: string;
	menuItems?: CapexMenuItem[];
	Default?: SimpleCapexData | string | number;
}

export interface CapexColumsData {
	[key: string]: CapexColumdData;
}

export interface CapexMenuItem {
	label: string;
	value: string;
	Default?: number;
}

export interface CapexColumn {
	fieldName: string;
	menuItems: CapexMenuItem[];
}

export interface CapexDescriptionColumn {
	valType: string;
	fieldName: string;
	fieldType: string;
	maxLength: number;
}

export interface CapexColumnEscalationStart extends CapexColumn {
	Default: CapexCriteriaOptions;
}

export interface CapexColumns {
	criteria: {
		fieldName: string;
		menuItems: CapexCriteriaOptions[];
		Default: CapexCriteriaOptions;
		fromSchedule: {
			Default: CapexCriteriaOptions;
			menuItems: CapexCriteriaOptions[];
		};
		fromHeaders: {
			Default: CapexCriteriaOptions;
			menuItems: CapexCriteriaOptions[];
		};
	};
	category: CapexColumn;
	escalation_start: CapexColumnEscalationStart;
	capex_expense: CapexColumn;
	description: CapexDescriptionColumn;
	escalation_model: CapexColumn;
	depreciation_model: CapexColumn;
}

export interface CapexTemplate {
	other_capex: {
		row_view: {
			minRows: number;
			maxRows: number;
			columns: CapexColumns;
		};
	};
}

export type EscalationStartOption = 'apply_to_criteria' | 'fpd' | 'as_of_date' | 'econ_limit';

export interface OtherCapexAssumptionRow {
	category: string;
	description: string;
	tangible: number;
	intangible: number;
	capex_expense: string;
	after_econ_limit: string;
	calculation: string;
	escalation_model: string;
	escalation_start: {
		[key in EscalationStartOption]: number;
	};
	depreciation_model: string;
	deal_terms: number;
	distribution_type: string;
	mean: number;
	standard_deviation: number;
	lower_bound: number;
	upper_bound: number;
	mode: number;
	seed: number;
	// criteria related fields
	offset_to_fpd?: number;
	offset_to_as_of_date?: number;
	offset_to_discount_date?: number;
	offset_to_first_segment?: number;
	offset_to_econ_limit?: number;
	fromSchedule?: number;
}

export interface CapexCriteriaOptions {
	label: string;
	value: string;
	fieldType: string;
	valType: string;
	min: number;
	max: number;
	Default: number;
	required?: boolean;
}

export interface CapexAssumption {
	econ_function: {
		other_capex: {
			rows: OtherCapexAssumptionRow[];
		};
	};
	options: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		completion_cost?: Record<string, any>;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		drilling_cost?: Record<string, any>;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		other_capex?: Record<string, any>;
	};
	embeddedLookupTables?: Inpt.ObjectId<'embedded-lookup-table'>[];
}

export interface CapexAssumptionNotEditableParts {
	econ_function?: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		other_capex?: Record<string, any>;
	};
	options?: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		completion_cost?: Record<string, any>;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		drilling_cost?: Record<string, any>;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		other_capex?: Record<string, any>;
	};
}
