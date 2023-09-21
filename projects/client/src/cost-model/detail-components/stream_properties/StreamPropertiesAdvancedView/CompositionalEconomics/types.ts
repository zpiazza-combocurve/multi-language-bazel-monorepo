import { AdvancedTableRow } from '@/components/AdvancedTable/types';

export interface CompositionalEconomicsRow extends AdvancedTableRow {
	key?: string;
	category?: string | null;
	source?: string;
	value?: string | number;
	molPercentage?: number;
	molFactor?: number;
	plantEfficiency?: number;
	btu?: number;
	shrink?: number;
	postExtraction?: number;
}

export interface CompositionalEconomicsRowAgg {
	key: string;
	value: number;
	molPercentage: number;
	shrink?: number;
	postExtraction: number;
	btu: number;
}
