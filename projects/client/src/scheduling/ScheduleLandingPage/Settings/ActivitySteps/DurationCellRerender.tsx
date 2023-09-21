import { ICellRendererParams } from 'ag-grid-community';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ContextMenu, IContextMenuRef, getItem } from '@/components/ContextMenu';
import { useId } from '@/components/hooks';

export function DurationCellRerender(params: ICellRendererParams) {
	const {
		node: { data: step },
		context: { buildLookupTable },
	} = params;

	const items = useMemo(() => {
		return [getItem('Build Lookup Table', () => buildLookupTable(step))];
	}, [buildLookupTable, step]);

	return <CellRenderer {...params} items={items} />;
}

const CELL_CONTAINER_PADDING = 34;

type Item = { disabled?: boolean; label: string; onClick: () => void } | null;

function CellRenderer({ items, ...params }: ICellRendererParams & { items?: Item[] | null | symbol }) {
	const {
		context: { scrollCallbacks },
	} = params;

	const contextMenuRef = useRef<IContextMenuRef>(null);

	const [menuIsOpen, setMenuIsOpen] = useState(false);

	const id = useId();

	useEffect(() => {
		if (menuIsOpen) {
			scrollCallbacks[id] = () => contextMenuRef.current?.setMenuVisibility(false);
			return () => {
				delete scrollCallbacks[id];
			};
		}
		return () => undefined;
	}, [menuIsOpen, scrollCallbacks, id]);

	return (
		<div
			css={`
				height: 100%;
				width: calc(100% + ${CELL_CONTAINER_PADDING}px);
				margin: 0 -${CELL_CONTAINER_PADDING / 2}px;
				display: flex;
				overflow: hidden;
				align-items: center;
			`}
		>
			<div
				css={`
					flex: 1;
					overflow: hidden;
					display: flex;
					align-items: center;
				`}
			>
				<span style={{ marginLeft: '1rem' }}>{params.valueFormatted}</span>
			</div>
			{Array.isArray(items) && items?.length && (
				<ContextMenu ref={contextMenuRef} onVisibilityChange={setMenuIsOpen} items={items} />
			)}
		</div>
	);
}
