import { ValueFormatterParams } from 'ag-grid-community';

import { ASSUMPTION_FOR_GROUPS, AssumptionKey } from '@/inpt-shared/constants';

import { NOT_MODELS, ValueFormatter } from '../shared';

export function AssumptionValueFormatter(params: ValueFormatterParams) {
	if (NOT_MODELS.includes(params?.value)) return null;
	const key = params.column.getColId();
	const isGrouped = params.node?.group;
	if (isGrouped && params?.value == null) return null;
	const isGroupCase = params.data.isGroupCase;
	if (isGroupCase && !ASSUMPTION_FOR_GROUPS.includes(key as AssumptionKey)) return null;
	return <ValueFormatter id={key} value={params?.value} type='assumption' />;
}
