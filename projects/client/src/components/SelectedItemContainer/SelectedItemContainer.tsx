import { memo, useCallback } from 'react';

import { Sortable } from '@/components';
import { SelectedOption } from '@/inpt-shared/economics/reports/types/base';

import SelectedItem from './SelectedItem';

type SelectedItemContainerProps = {
	items: SelectedOption[];
	onDeleteItem: (key: string, keyType: string) => void;
	onSort: (changedItems: SelectedOption[]) => void;
	onSortPriorityChange?: (key: string) => void;
	circleColor?: string;
	disableAutoSize?: boolean;
};

export const SelectedItemContainer = memo(function SelectedItemContainer(props: SelectedItemContainerProps) {
	const { items, onDeleteItem, onSort, onSortPriorityChange = null, circleColor, disableAutoSize } = props;

	const getKey = useCallback(({ key }) => key, []);

	const renderItem = useCallback(
		({ style, item, dragRef, dropRef }) => (
			<SelectedItem
				style={style}
				item={item}
				dragRef={dragRef}
				dropRef={dropRef}
				onDeleteItem={onDeleteItem}
				onSortPriorityChange={onSortPriorityChange}
				circleColor={circleColor}
				itemSize={48.95} // MAGIC NUMBER!
			/>
		),
		[circleColor, onDeleteItem, onSortPriorityChange]
	);

	return (
		<Sortable items={items} renderItem={renderItem} onSort={onSort} autoSize={!disableAutoSize} getKey={getKey} />
	);
});

export default SelectedItemContainer;
