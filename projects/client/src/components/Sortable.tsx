import { produce } from 'immer';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';

import { useCallbackRef, useDerivedState } from '@/components/hooks';

const SORTABLE_TYPE = '__SORTABLE_TYPE';

// TODO: improve types
interface ISortableItemProps {
	id;
	index;
	insertItem;
	onDrop;
	item;
	renderItem;
	style;
}

export const SortableItem = memo<ISortableItemProps>(function ({
	id,
	index,
	insertItem,
	item,
	renderItem,
	style,
	onDrop,
}) {
	const [{ isDragging }, drag] = useDrag({
		type: SORTABLE_TYPE,
		item: { id },
		end: () => {
			onDrop();
		},
		collect: (monitor) => {
			return { isDragging: monitor.isDragging() };
		},
	});
	const [, drop] = useDrop<{ id }>({
		accept: SORTABLE_TYPE,
		canDrop: () => false,
		hover({ id: draggedId }) {
			if (id !== draggedId) {
				window.setTimeout(() => insertItem(draggedId, index), 30);
			}
		},
	});

	const dragRef = (realRef) => drag(realRef);
	const dropRef = (realRef) => drop(realRef);
	const ref = (realRef) => drag(drop(realRef));
	return renderItem({ ref, dragRef, dropRef, item, index, isDragging, style });
});

export interface SortableProps<T> {
	items: T[];
	onSort?(items: T[]): void;
	renderItem: (props: {
		item: T;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dragRef: React.Ref<any>;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dropRef: React.Ref<any>;
		index: number;
		isDragging?: boolean;
		style?;
	}) => JSX.Element;
	getKey?(item: T): string;
	index?;
	autoSize?: boolean;
	itemSize?: number;
	dontWrapItems?: boolean;
}

function ListItem({
	data: { items, onDrop, insertItem, renderItem },
	index,
	style,
	dontWrap,
}: {
	data;
	index: number;
	style?: CSSStyleDeclaration;
	dontWrap?: boolean;
}) {
	const SortableListItem = (
		<SortableItem
			style={style}
			key={items[index].id}
			id={items[index].id}
			index={index}
			onDrop={onDrop}
			insertItem={insertItem}
			item={items[index].item}
			renderItem={renderItem}
		/>
	);
	if (dontWrap) {
		return SortableListItem;
	}
	return <div key={items[index].id}>{SortableListItem}</div>;
}

const ID = 'sortable-id';

export function Sortable<T>(objProps: SortableProps<T>) {
	const { items: originalItems, onSort, renderItem, autoSize, itemSize, getKey, dontWrapItems } = objProps;
	const [items, setItems] = useDerivedState(
		useMemo(
			() => originalItems.map((item, index) => ({ id: getKey?.(item) ?? index, item })),
			[getKey, originalItems]
		)
	);

	const onDrop = useCallbackRef(() => {
		onSort?.(items.map(({ item }) => item));
	});
	const insertItem = useCallback(
		(originalIndex, position) => {
			setItems(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				produce((itemsDraft: Array<any> = []) => {
					const item = itemsDraft.find(({ id }) => originalIndex === id);
					const index = itemsDraft.indexOf(item);
					itemsDraft.splice(index, 1);
					itemsDraft.splice(position, 0, item);
				})
			);
		},
		[setItems]
	);

	const data = { items, onDrop, insertItem, renderItem };

	useEffect(() => {
		if (!autoSize) return;
		let mousePosition: number | null = null;
		const dropEvents = ['dragend', 'dragleave', 'drop'];
		const onDrag = (event: MouseEvent) => (mousePosition = event.clientY);
		const onDragStop = () => {
			mousePosition = null;
			window.setTimeout(() => onDrop(), 90);
		};
		window.addEventListener('dragover', onDrag);
		dropEvents.forEach((ev) => window.addEventListener(ev, onDragStop));
		const interval = window.setInterval(() => {
			const container = document.querySelector(`#${ID} > div > div`);
			if (container == null || mousePosition == null) return;
			const { bottom, top } = container.getBoundingClientRect();
			if (mousePosition < top + 10) {
				container.scrollBy({ top: -20 });
			}
			if (mousePosition > bottom - 10) {
				container.scrollBy({ top: 20 });
			}
		}, 30);
		return () => {
			window.clearInterval(interval);
			window.removeEventListener('dragover', onDrag);
			dropEvents.forEach((ev) => window.removeEventListener(ev, onDragStop));
		};
	}, [onDrop, autoSize]);

	const itemsList = autoSize ? (
		<div
			id={ID}
			css={`
				height: 100%;
				width: 100%;
				overflow: auto;
			`}
		>
			<AutoSizer>
				{({ height, width }) => (
					// MAGIC NUMBER!
					<List
						height={height}
						itemCount={items.length}
						itemSize={itemSize ?? 48.95}
						width={width}
						itemData={data}
					>
						{ListItem}
					</List>
				)}
			</AutoSizer>
		</div>
	) : (
		// eslint-disable-next-line react/jsx-no-useless-fragment
		<>
			{items?.map(({ id }, index) => (
				<ListItem key={id} {...{ index, data }} dontWrap={dontWrapItems} />
			))}
		</>
	);

	return items ? itemsList : null;
}
