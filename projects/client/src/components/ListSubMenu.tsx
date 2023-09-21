import { CheckboxSelectItems, RadioSelectItems } from '@/components/v2';

type ListSubMenuProps =
	// TODO add types for value, items and onChange
	| {
			exclusive?: true;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			items: { value: any; label: string; key?: string }[];
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			onClick?(newValue: any): void;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			curSelection: any;
	  }
	| {
			exclusive: false;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			items: { value: any; label: string; key?: string; disabled?: boolean }[];
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			onClick?(newValue: any): void;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			curSelection: any;
	  };

function ListSubMenu(props: ListSubMenuProps) {
	const { curSelection, exclusive = true, items = [], onClick } = props;

	if (exclusive) {
		// use radio buttons
		return <RadioSelectItems items={items} onChange={onClick} value={curSelection} />;
	}

	// use checkboxes
	return <CheckboxSelectItems items={items} onChange={onClick} value={curSelection} />;
}

export default ListSubMenu;
