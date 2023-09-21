import classNames from 'classnames';

import { Cell, CellRenderer, CellRendererProps } from '@/components/AdvancedTable/ag-grid-shared';
import { LOOKUP_BY_FIELDS_KEY, LT_CELL_STRING_VALUE } from '@/components/AdvancedTable/constants';
import ColoredCircle from '@/components/misc/ColoredCircle';
import { getHexColorForString } from '@/helpers/color';
import { assert } from '@/helpers/utilities';

export function LookupCellRenderer(props: CellRendererProps) {
	const { data, column, error } = props;

	assert(column);

	const colId = column.getColId();
	const rowLookupByData = (data[LOOKUP_BY_FIELDS_KEY] ?? {}) as Record<string, string>;

	if (!rowLookupByData[colId]) {
		return <CellRenderer {...props} />;
	}

	const fieldColor = getHexColorForString(colId);

	const cell = (
		<Cell css={{ display: 'flex', justifyContent: 'flex-end' }} className={classNames({ error: Boolean(error) })}>
			<span>
				<ColoredCircle $color={fieldColor} />
			</span>
			<span css={{ color: 'var(--secondary-color)', marginLeft: '0.5rem' }}>{LT_CELL_STRING_VALUE}</span>
		</Cell>
	);

	return cell;
}
