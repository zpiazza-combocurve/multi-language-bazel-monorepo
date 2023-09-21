import { ValueFormatterParams } from 'ag-grid-community';

import { EMPTY } from '@/tables/Table/useAsyncRows';

import { ValueFormatter } from '../shared';

export function HeaderValueFormatter(params: ValueFormatterParams) {
	const key = params.column.getColId();
	if (params.node?.group && key !== params.node?.rowGroupColumn?.getColId()) return null;
	const valueToRender = params?.value === '' ? EMPTY : params.value;
	return <ValueFormatter id={key} value={valueToRender} type='header' />;
}
