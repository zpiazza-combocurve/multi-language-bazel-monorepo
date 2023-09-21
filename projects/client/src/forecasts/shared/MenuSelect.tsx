/* eslint react/jsx-key: warn */
import { ButtonItem, MenuButton, MenuButtonProps } from '@/components/v2/menu';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
interface Item<T = any> {
	value: T;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	label: any;
}

const MENU_BUTTON_PROPS = ['color', 'startIcon', 'startIcon', 'disabled'] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
interface MenuSelectProps<T = any> extends Pick<MenuButtonProps, (typeof MENU_BUTTON_PROPS)[number]> {
	items: Item[];
	onChange?: (newValue: T) => void;
	value?: T;
}

function MenuSelect({ items, value, onChange, ...rest }: MenuSelectProps) {
	const selected = items.find((item) => item.value === value);
	const filteredItems = items.filter((item) => item.value !== value);
	// TODO what to do when there's no selection? throw error? show a default label?
	return (
		<MenuButton {...rest} label={selected?.label}>
			{filteredItems.map(({ value: itemValue, label }) => (
				<ButtonItem key={`${itemValue}-${label}`} onClick={() => onChange?.(itemValue)} label={label} />
			))}
		</MenuButton>
	);
}

export default MenuSelect;
