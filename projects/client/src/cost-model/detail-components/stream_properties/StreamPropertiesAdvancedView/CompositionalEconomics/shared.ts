import { ColDef, ColGroupDef, GetGroupRowAggParams } from 'ag-grid-community';
import { mapValues, sumBy } from 'lodash';

import { eltColumnDefinition } from '@/components/AdvancedTable/ag-grid-shared';
import { ValidationInfoOptions } from '@/cost-model/detail-components/AdvancedModelView/shared';
import {
	CompositionalEconomicsRow,
	CompositionalEconomicsRowAgg,
} from '@/cost-model/detail-components/stream_properties/StreamPropertiesAdvancedView/CompositionalEconomics/types';

import { COMPOSITIONAL_ECONOMICS_COLUMNS, GAL_PER_LB_MOL_FACTORS } from './constants';

export const getCompEconColumnsDef = (enableELTColumn: boolean): ColGroupDef[] => {
	const compEconChildren: ColDef[] = [];

	if (enableELTColumn) {
		compEconChildren.push(eltColumnDefinition);
	}

	const mapHeaderName = (field) => ({ ...field, headerName: field.label });
	const columnsMappedWithHeaderName = Object.values(COMPOSITIONAL_ECONOMICS_COLUMNS).map(mapHeaderName);

	compEconChildren.push(...columnsMappedWithHeaderName);

	return [
		{
			headerName: 'Compositional Economics',
			children: compEconChildren,
		},
	];
};

export const computePlantEfficiency = (rowData: CompositionalEconomicsRow): number => {
	// Plant Eff = (Yield / ((((Mol%/100) * Gal/lb-mol Factor)/379.49) * 1000 * 1000 / 42)) * 100
	const category = rowData.category;
	const yieldValue = Number(rowData.value ?? 0);
	const molPercentage = Number(rowData.molPercentage) ?? 0;
	const molFactor = Number(rowData.molFactor) ?? GAL_PER_LB_MOL_FACTORS[category as string];
	// When calculating, we convert NaNs caused by empty values to 0
	return (yieldValue / (((((molPercentage / 100) * molFactor) / 379.49) * 1000 * 1000) / 42)) * 100 || 0;
};

export const computeYield = (rowData: CompositionalEconomicsRow): number => {
	// Yield = (Plant eff (%) / 100) * (((Mol%/100) * Gal/lb-mol Factor)/379.49) * 1000 * 1000 / 42
	const category = rowData.category;
	const plantEfficiency = Number(rowData.plantEfficiency) ?? 0;
	const molPercentage = Number(rowData.molPercentage) ?? 0;
	const molFactor = Number(rowData.molFactor) ?? GAL_PER_LB_MOL_FACTORS[category as string];
	// When calculating, we convert NaNs caused by empty values to 0
	return ((plantEfficiency / 100) * (((molPercentage / 100) * molFactor) / 379.49) * 1000 * 1000) / 42 || 0;
};

export const computeShrinkPercentRemaining = (rowData: CompositionalEconomicsRow): number => {
	// Shrink = (1 - (Plant Eff (%) / 100)) * Mol%
	const plantEfficiency = Number(rowData.plantEfficiency) ?? 0;
	const molPercentage = Number(rowData.molPercentage) ?? 0;
	// When calculating, we convert NaNs caused by empty values to 0
	return (1 - plantEfficiency / 100) * molPercentage || 0;
};

export const computePostExtraction = (rowData: CompositionalEconomicsRow, subtotalShrink: number): number => {
	// Post Extraction = (Component Shrink / Subtotal Shrink) * 100
	const componentShrink = Number(rowData.shrink) ?? 0;
	// When calculating, we convert NaNs caused by empty values to 0
	return (componentShrink / subtotalShrink) * 100 || 0;
};

export const computeRemainingMolPercentage = (componentsRows: CompositionalEconomicsRow[]): number => {
	const remainingMolPercentage =
		100 - componentsRows.reduce((acc, { molPercentage }) => Number(acc) + Number(molPercentage ?? 0), 0);

	return remainingMolPercentage;
};

export const calculateGroupRowAggState = (
	params: GetGroupRowAggParams
): { groupRowAgg: CompositionalEconomicsRowAgg; rowsLength: number } => {
	const { nodes } = params;
	const compEconGroupRowAgg: CompositionalEconomicsRowAgg = {
		key: 'Subtotal',
		value: sumBy(nodes, (node) => Number(node.data.value)),
		molPercentage: sumBy(nodes, (node) => Number(node.data.molPercentage)),
		shrink: nodes.length ? sumBy(nodes, (node) => Number(node.data.shrink)) : undefined,
		postExtraction: sumBy(nodes, (node) => Number(node.data.postExtraction)),
		btu: 0,
	};

	compEconGroupRowAgg.btu = nodes.reduce(
		(accumulator, { data }) => Number(accumulator) + (Number(data.postExtraction) / 100) * Number(data.btu),
		0
	);

	const groupRowAgg = mapValues(compEconGroupRowAgg, (value, key) => {
		if (key === 'key') return value?.toString();
		return value !== undefined ? parseFloat(Number(value).toFixed(2)) : value;
	}) as CompositionalEconomicsRowAgg;

	return { groupRowAgg, rowsLength: nodes.length };
};

export const validationOptions: ValidationInfoOptions<CompositionalEconomicsRow> = {
	includeInContext: { keyCategoryCount: true, rowData: true },
	matchKeyCasing: true,
};
