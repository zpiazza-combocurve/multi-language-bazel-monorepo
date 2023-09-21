import { Schema } from 'yup';

import { PERIOD_DATA_KEY } from '@/components/AdvancedTable/constants';
import { AdvancedTableRow } from '@/components/AdvancedTable/types';

export interface AdvancedTableRowWithPeriod extends AdvancedTableRow {
	[PERIOD_DATA_KEY]?: {
		isLastRow: boolean;
		criteria: string;
		nextPeriod;
		start;
		end;
	};

	key?: string;
	category?: string | null;
	criteria?: string | null;
	period?: string | number;
	value?: string | number;
	unit?: string;
}

export interface OrganizableRowProps {
	key?: string | null;
	category?: string | null;
	isELTRow?: boolean;
	isFromELTDataLines?: boolean;
}

export interface YupNumberValidationProps {
	schema: Schema;
	min: number | null | undefined;
	max: number | null | undefined;
	valueName?: string;
}

// Assumption Fields

export type Flat = 'Flat';

export type OffsetToAsOfDate = {
	start: number;
	end: number | string;
	period?: number | string;
};

export type Dates = {
	start_date: string;
	end_date: string;
	period?: number | string;
};

export interface SavedFields extends Record<string, string[]> {
	[key: string]: string[];
}

export interface SavedFieldsData extends Record<string, Record<string, unknown>> {
	[key: string]: Record<string, unknown>;
}

export type BaseAssumptionsCriteriaKeys = 'price' | 'differential';

export type BaseAssumptionsCriteriaRows = {
	[key in BaseAssumptionsCriteriaKeys]?: number;
} & {
	dollar_per_mmbtu?: number;
	dollar_per_bbl?: number;
	dollar_per_gal?: number;
	dollar_per_mcf?: number;
	pct_of_oil_price?: number;
	criteria?: Dates | OffsetToAsOfDate | 'Flat';
	entire_well_life?: string;
};

export interface Dictionary<T> {
	[index: string]: T;
}
