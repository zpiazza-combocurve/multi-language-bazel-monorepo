import _ from 'lodash';
import { useMemo } from 'react';
import { Row } from 'react-data-grid';

export type RowKey = string | ((row: Row) => string);

export function useRowKeyGetter(rowKey: RowKey | undefined) {
	return useMemo(() => {
		if (!rowKey) {
			return rowKey as undefined;
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		return _.iteratee(rowKey) as (value: any) => string;
	}, [rowKey]);
}
