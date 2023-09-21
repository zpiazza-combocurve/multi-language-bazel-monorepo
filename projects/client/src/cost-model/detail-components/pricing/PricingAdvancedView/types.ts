import { ColDef } from 'ag-grid-community';

import { DeckProduct } from '@/cost-model/detail-components/AdvancedModelView/extra-components/price-deck/types';
import { AdvancedTableRowWithPeriod } from '@/cost-model/detail-components/AdvancedModelView/types';

export interface PricingRow extends AdvancedTableRowWithPeriod {
	category?: string | null;
	price_ratio?: number;
	escalation?: string | { label: string; value: string };
	cap?: number;
}

type PricingColDef = ColDef & {
	label: string;
	enabledForTimeSeries?: boolean;
	otherColumns?: boolean;
	linkedBy?: string;
};

export interface PricingColumns extends Record<string, PricingColDef> {
	[key: string]: PricingColDef;
}

export interface PricingRowContext {
	type: string;
	keyCount: Record<string, number>;
	parentRow?: PricingRow;
	row?: PricingRow;
	prevRow?: PricingRow;
	isLastTimeSeries: boolean;
	rowData: PricingRow[];
}

export interface PriceDeckProduct extends DeckProduct {
	link: string;
	name: string;
	product: string;
}
