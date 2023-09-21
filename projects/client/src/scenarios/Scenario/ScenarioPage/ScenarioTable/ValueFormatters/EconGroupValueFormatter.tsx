import { ValueFormatterParams } from 'ag-grid-community';

import { ValueFormatter } from '../shared';

export function EconGroupValueFormatter(params: ValueFormatterParams) {
	const key = params.column.getColId();
	return <ValueFormatter id={key} value={params?.value?.name ?? null} type='header' />;
}
