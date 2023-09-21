import OriginalReactDataGrid, {
	Column as OriginalColumn,
	ReactDataGridProps as OriginalReactDataGridProps,
	Row,
} from 'react-data-grid';
import AutoSizer from 'react-virtualized-auto-sizer';
import styled, { css } from 'styled-components';

import { withExtraProps } from '@/helpers/extend-component';
import { theme } from '@/helpers/styled';

import copyPastePlugin from './ReactDataGrid/copy-paste';
import freezableColumnsPlugin, { WithFreezableColumnsProps } from './ReactDataGrid/freezable-columns';
import renderNotifierPlugin from './ReactDataGrid/render-notifier';
import rowsPlugin from './ReactDataGrid/rows';
import selectionPlugin from './ReactDataGrid/selection';
import { RowKey } from './ReactDataGrid/shared';

const TEXT_HEIGHT = '20px';
export const getCustomRowHeightStyles = (height: number) => `
	.react-grid-HeaderCell {
		padding: calc((${height}px - ${TEXT_HEIGHT}) / 2) 8px;
	}
`;

const dataGridStyles = css<{ $rowHeight?: number }>`
	.react-grid-Main {
		background-color: ${theme.background};
		outline-color: ${theme.borderColor};
	}
	.react-grid-Header {
		background-color: ${theme.background};
		box-shadow: 0px 0px 4px 0px ${theme.backgroundOpaque};
	}
	.react-grid-Grid {
		background-color: ${theme.background};
		border-color: ${theme.borderColor};
	}
	.react-grid-HeaderCell,
	.react-grid-Cell {
		background-color: ${theme.background};
		border-right-color: ${theme.borderColor};
		border-bottom-color: ${theme.borderColor};
	}
	.react-grid-Canvas {
		background-color: ${theme.background};
	}
	.react-grid-Row:hover .react-grid-Cell,
	.react-grid-Row.row-context-menu .react-grid-Cell {
		background-color: ${theme.backgroundOpaque};
	}
	${({ $rowHeight }) => $rowHeight && getCustomRowHeightStyles($rowHeight)}
`;

const Container = styled.div`
	width: 100%;
	height: 100%;
	overflow: hidden;
	.react-grid-Container {
		${dataGridStyles}
	}
`;

type FullSizeProps = Omit<OriginalReactDataGridProps, 'minWidth' | 'minHeight'> & { className?: string };

function FullSizeDataGrid({ className, rowHeight, ...props }: FullSizeProps) {
	return (
		<Container className={className} $rowHeight={rowHeight}>
			<AutoSizer>
				{({ width, height }) => (
					<OriginalReactDataGrid
						// @ts-expect-error height and width can be undefined
						minHeight={height}
						// @ts-expect-error height and width can be undefined
						minWidth={width}
						rowHeight={rowHeight}
						{...props}
					/>
				)}
			</AutoSizer>
		</Container>
	);
}

export type Column = OriginalColumn & {
	valueValidate?;
	valueParse?;
	valueFormat?;
	locked?: boolean;
};

export type ReactDataGridProps = Omit<
	OriginalReactDataGridProps,
	'minWidth' | 'minHeight' | 'rowsCount' | 'rowGetter' | 'columns'
> & {
	className?: string;
	rowsCount?: number;
	rowGetter?: (idx: number) => Row;
	onGetKey?: (key: string) => void;
	rowKey?: RowKey;
	rows?: Row[];
	selection?: import('@/components/hooks/useSelection').Selection;
	disableSelectionKey?: RowKey;

	allowCopyPaste?: boolean;
	onUpdateRows?;
	parsePaste?;
	columns: Column[];
} & WithFreezableColumnsProps;

/**
 * Full size react-data-grid and with inpt theme colors
 *
 * - Added aditional property to aid with async loading: `onGetKey`, name could be better but it is the same used by the
 *   tables/Table component. Need to pass `rowKey` as well
 * - Allows passing `rows` property like react-data-grid@canary instead of `rowGetter` and `rowsCount`
 * - Selection
 *
 * @deprecated Use ag-grid
 * @see [React Data Grid Docs](https://adazzle.github.io/react-data-grid/docs/ReactDataGrid)
 */
export default withExtraProps<ReactDataGridProps>(
	FullSizeDataGrid,
	rowsPlugin,
	freezableColumnsPlugin,
	selectionPlugin,
	renderNotifierPlugin,
	copyPastePlugin
);
