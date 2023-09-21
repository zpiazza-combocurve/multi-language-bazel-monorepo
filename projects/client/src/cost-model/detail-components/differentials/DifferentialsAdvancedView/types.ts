import { ColDef } from 'ag-grid-community';

import { AdvancedTableRowWithPeriod } from '@/cost-model/detail-components/AdvancedModelView/types';

type DifferentialsColDef = ColDef & {
	label: string;
	enabledForTimeSeries?: boolean;
	otherColumns?: boolean;
	linkedBy?: string;
};

export interface DifferentialsColumns extends Record<string, DifferentialsColDef> {
	[key: string]: DifferentialsColDef;
}
export interface DifferentialsRow extends AdvancedTableRowWithPeriod {
	category?: string | null;
	escalation?: string | { label: string; value: string };
}
export interface DifferentialsRowContext {
	type: string;
	keyCategoryCount: Record<string, number>;
	parentRow?: DifferentialsRow;
	row?: DifferentialsRow;
	prevRow?: DifferentialsRow;
	isLastTimeSeries: boolean;
	rowData: DifferentialsRow[];
}
