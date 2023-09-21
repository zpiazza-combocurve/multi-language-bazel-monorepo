/** @file Extends Data grid with rows prop */
import { useMemo } from 'react';
import { ReactDataGridProps, Row } from 'react-data-grid';

export type WithRowsProps = Omit<ReactDataGridProps, 'rowGetter' | 'rowsCount'> & {
	rowsCount?: number;
	rowGetter?(idx): Row;
	rows?: Row[];
};

export default [
	(props: WithRowsProps) => !('rowsCount' in props) && !('rowGetter' in props) && 'rows' in props,
	({ rows }: WithRowsProps) => useMemo(() => ({ rowGetter: (i) => rows?.[i], rowsCount: rows?.length ?? 0 }), [rows]),
] as const;
