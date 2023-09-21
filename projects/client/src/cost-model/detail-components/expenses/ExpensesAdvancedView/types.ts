import { AdvancedTableRowWithPeriod } from '@/cost-model/detail-components/AdvancedModelView/types';

export interface ExpenseRow extends AdvancedTableRowWithPeriod {
	category?: string | null;
	unit?: string;
}

export interface ExpensesRowSchemaContext {
	type: string;
	keyCategoryCount: Record<string, number>;
	parentRow?: ExpenseRow;
	row?: ExpenseRow;
	prevRow?: ExpenseRow;
	isLastTimeSeries: boolean;
	eltsCount: Record<string, number>;
}
