import { ColDef } from 'ag-grid-community';

import { AdvancedTableRowWithPeriod } from '@/cost-model/detail-components/AdvancedModelView/types';

export interface StreamPropertiesRow extends AdvancedTableRowWithPeriod {
	category?: string | null;
	category_group?: string;
	unit?: string;
	source?: string;
	rate_type?: string;
	rows_calculation_method?: string;
}

export interface StreamPropertiesRowSchemaContext {
	type: string;
	keyCategoryCount: Record<string, number>;
	parentRow?: StreamPropertiesRow;
	row?: StreamPropertiesRow;
	prevRow?: StreamPropertiesRow;
	isLastTimeSeries: boolean;
	rowData: StreamPropertiesRow[];
}

type StreamPropertiesColDef = ColDef & {
	label: string;
	enabledForTimeSeries?: boolean;
	otherColumns?: boolean;
	linkedBy?: string;
};

export interface StreamPropertiesColumns extends Record<string, StreamPropertiesColDef> {
	[key: string]: StreamPropertiesColDef;
}
