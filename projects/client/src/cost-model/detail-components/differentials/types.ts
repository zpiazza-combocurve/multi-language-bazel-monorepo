import { TemplateHeaderSelect } from '@/components/AdvancedTable/types';
import { Dates, OffsetToAsOfDate, SavedFields } from '@/cost-model/detail-components/AdvancedModelView/types';

import { BaseSelectionPropField } from '../shared_types/standard_view_types';

export type BaseDifferentialsPeriodRows = {
	differential?: number;
	dollar_per_mmbtu?: number;
	dollar_per_bbl?: number;
	dollar_per_gal?: number;
	dollar_per_mcf?: number;
	pct_of_oil_price?: number;
	criteria?: Dates | OffsetToAsOfDate;
	entire_well_life?: string;
};

export type DifferentialsComponent = {
	escalation_model: string | { label: string; value: string };
	row_view: {
		headers: {
			differential?: string | { label: string; value: string; disabled?: boolean };
			criteria: { label: string; value: string; disabled?: boolean };
		};
		rows: BaseDifferentialsPeriodRows[];
	};
};

export interface DifferentialsPhases {
	oil: { subItems: DifferentialsComponent };
	gas: { subItems: DifferentialsComponent };
	ngl: { subItems: DifferentialsComponent };
	drip_condensate: { subItems: DifferentialsComponent };
}

export type DifferentialsTemplate = {
	differentials_1: DifferentialsPhases;
	differentials_2: DifferentialsPhases;
	differentials_3: DifferentialsPhases;
};

export type DifferentialsColumn = {
	criteria?: TemplateHeaderSelect;
	differential: TemplateHeaderSelect;
};

export type DifferentialsColumnComponent = {
	fieldName: string;
	fieldType: string;
	subItems: {
		escalation_model: BaseSelectionPropField;
		row_view: { minRows: number; maxRows: number; columns: DifferentialsColumn };
	};
};

export type DifferentialsColumnFields = {
	oil: DifferentialsColumnComponent;
	gas: DifferentialsColumnComponent;
	ngl: DifferentialsColumnComponent;
	drip_condensate: DifferentialsColumnComponent;
};

export type DifferentialsColumns = {
	fieldName: string;
	fieldType: string;
	subItems: DifferentialsColumnFields;
};

export type DifferentialsFieldsTemplate = {
	differentials_1: DifferentialsColumns;
	differentials_2: DifferentialsColumns;
	differentials_3: DifferentialsColumns;
};

export type RawDifferentialsFieldsTemplate = {
	differentials: DifferentialsFieldsTemplate;
};

export type DifferentialsProps = {
	differentials: DifferentialsTemplate; // A.K.A. Rows
	fields: DifferentialsFieldsTemplate; // A.K.A. Tables and Columns
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onSelect: (x, y) => any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	setDifferentials: (x, y) => any;
	selected: object;
};

export interface DifferentialModelComponentFields {
	oil: { subItems: DifferentialsComponent };
	gas: { subItems: DifferentialsComponent };
	ngl: { subItems: DifferentialsComponent };
	drip_condensate: { subItems: DifferentialsComponent };
}

export interface DifferentialModel {
	differentials_1: { subItems: DifferentialModelComponentFields };
	differentials_2: { subItems: DifferentialModelComponentFields };
	differentials_3: { subItems: DifferentialModelComponentFields };
}

// Assumption used for saving Differentials to the database
export interface DifferentialsAssumptionModel {
	differentials: DifferentialModel;
	metadata?: {
		saved_from: string;
		saved_fields: SavedFields;
	};
}

export interface DifferentialsAssumption {
	econ_function;
	options: DifferentialsAssumptionModel;
}
