import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import { useState } from 'react';

import { Box, ButtonItem, Divider, Icon, MenuButton, TextFieldItem } from '@/components/v2';
import { filterSearch } from '@/helpers/utilities';

interface Option {
	key: string;
	label: string;
}

interface SearchableMenuProps {
	title: string;
	options?: Option[];
	onSelectOption?: (string) => void;
	selectedOption?: string;
	warningTooltip?: string;
	startIcon?: React.ReactElement;
	endIcon?: React.ReactElement;
}

export const SearchableMenu = ({
	title,
	options,
	onSelectOption,
	selectedOption,
	startIcon,
	endIcon = <Icon>{faChevronDown}</Icon>,
}: SearchableMenuProps) => {
	const [selected, setSelected] = useState(selectedOption);
	const [search, setSearch] = useState('');

	const filteredList = filterSearch(options ?? [], search, 'label');

	const handleOnSelectOption = (item: Option) => {
		setSelected(item?.key);
		onSelectOption?.(item.key);
	};

	return (
		<MenuButton
			label={
				<>
					{startIcon}
					<Box mr={1}>{title}</Box>
					{endIcon}
				</>
			}
			style={{ minWidth: 'auto' }}
		>
			<TextFieldItem
				css={`
					margin-top: 6px;
				`}
				label='Search'
				id='search'
				size='small'
				fullWidth
				variant='outlined'
				value={search}
				onChange={(ev) => setSearch(ev.target.value)}
			/>
			<Divider />
			{filteredList.map((item) => {
				const { key, label } = item;
				return (
					<ButtonItem
						selected={selected === key}
						dense
						key={key}
						label={label}
						onClick={() => handleOnSelectOption(item)}
					/>
				);
			})}
		</MenuButton>
	);
};
