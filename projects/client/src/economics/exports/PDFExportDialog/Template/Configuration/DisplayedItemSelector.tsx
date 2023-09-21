import { MouseEventHandler } from 'react';

import AutocompleteWithCheckboxes from '@/components/AutocompleteWithCheckboxes';
import SelectedItemContainer from '@/components/SelectedItemContainer';
import { DEFAULT_SELECTED_ITEMS_LIMIT } from '@/economics/exports/PDFExportDialog/shared/constants';
import { Option, SelectedOption } from '@/inpt-shared/economics/reports/types/base';

type DisplayedItemSelectorProps = {
	type: string;
	options: Option[];
	onOptionClick: (key: string, keyType: string, isDisabled?: boolean) => MouseEventHandler<HTMLLIElement> | undefined;
	items: SelectedOption[];
	onDeleteItem: (key: string, keyType: string) => void;
	onSort: (keyType: string) => (changedItems: SelectedOption[]) => void;
	onSortPriorityChange?: () => void;
	selectedItemsLimit?: number;
	placeholder?: string;
	children?: null | JSX.Element;
};

export const DisplayedItemSelector = (props: DisplayedItemSelectorProps) => {
	const {
		type,
		options,
		onOptionClick,
		items,
		onDeleteItem,
		onSort,
		selectedItemsLimit = DEFAULT_SELECTED_ITEMS_LIMIT,
		placeholder = '',
		children,
	} = props;
	return (
		<>
			{children}
			<AutocompleteWithCheckboxes
				placeholder={placeholder}
				type={type}
				options={options}
				onOptionClick={onOptionClick}
				selectedItemsLimit={selectedItemsLimit}
			/>
			<div
				css={{
					marginTop: '1rem',
					minHeight: '1rem',
				}}
			>
				<SelectedItemContainer
					items={items}
					onDeleteItem={onDeleteItem}
					onSort={onSort(type)}
					disableAutoSize
				/>
			</div>
		</>
	);
};

export default DisplayedItemSelector;
