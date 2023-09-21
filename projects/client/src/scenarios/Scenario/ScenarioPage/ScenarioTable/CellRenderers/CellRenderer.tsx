import { faBallPile } from '@fortawesome/pro-solid-svg-icons';
import { ICellRendererParams } from 'ag-grid-community';
import { useEffect, useRef, useState } from 'react';

import { ContextMenu, IContextMenuRef } from '@/components/ContextMenu';
import { useId } from '@/components/hooks';
import { Icon } from '@/components/v2';
import {
	DASHED_CELLS_CLASS_NAME,
	NOT_ACCESSIBLE_FIELD,
} from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/constants';

import useGroup from './useGroup';

const CELL_CONTAINER_PADDING = 34;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function CellRenderer({ items, ...params }: ICellRendererParams & { items?: any[] | null | symbol }) {
	const {
		context: { scrollCallbacks },
	} = params;

	const { isGrouped, iconButton, count } = useGroup(params);

	const isWellCollection = params.data.isWellsCollectionCase && params?.colDef?.field === 'well_name';

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
				${!isGrouped &&
				`
				width: calc(100% + ${CELL_CONTAINER_PADDING}px);
				margin: 0 -${CELL_CONTAINER_PADDING / 2}px;
				`} // HACK: fix this later
				display: flex;
				overflow: hidden;
				align-items: center;
			`}
			className={items === NOT_ACCESSIBLE_FIELD ? DASHED_CELLS_CLASS_NAME : ''}
		>
			{iconButton}
			<div
				css={`
					flex: 1;
					overflow: hidden;
					display: flex;
					align-items: center;
				`}
			>
				{isWellCollection ? (
					<>
						<Icon style={{ paddingLeft: '0.5rem' }}>{faBallPile}</Icon>
						<span style={{ marginLeft: '0.5rem' }}>{params.valueFormatted}</span>
					</>
				) : (
					params.valueFormatted
				)}

				{count}
			</div>
			{!isGrouped && Array.isArray(items) && items?.length && (
				<ContextMenu ref={contextMenuRef} onVisibilityChange={setMenuIsOpen} items={items} />
			)}
		</div>
	);
}

export default CellRenderer;
