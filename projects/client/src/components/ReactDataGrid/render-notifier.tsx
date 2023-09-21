/** @file Add `onGetKey` callback to notify when a row is renderer, useful for async loading */
import { useMemo } from 'react';
import { ReactDataGridProps } from 'react-data-grid';

import { RowKey, useRowKeyGetter } from './shared';

export interface WithRenderNotifierProps extends ReactDataGridProps {
	onGetKey?: (key: string) => void;
	rowKey?: RowKey;
}

export default [
	(props: WithRenderNotifierProps) => props.onGetKey,
	({ onGetKey, rowKey, rowRenderer: PropRowRenderer }: WithRenderNotifierProps) => {
		const getRowKey = useRowKeyGetter(rowKey);
		return {
			rowRenderer: useMemo(
				() =>
					function RowRenderer(rowRendererProps) {
						const { row, renderBaseRow } = rowRendererProps;
						if (getRowKey && onGetKey) {
							onGetKey(getRowKey(row));
						}
						if (PropRowRenderer) {
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
							// @ts-expect-error
							return <PropRowRenderer {...rowRendererProps} />;
						}
						return renderBaseRow(rowRendererProps);
					},
				[PropRowRenderer, onGetKey, getRowKey]
			),
		};
	},
] as const;
