import _ from 'lodash';
import { ComponentType } from 'react';

import { memoEx, withDefaultProps } from '@/components/shared';
import {
	CheckboxSelectItems,
	CheckboxSelectItemsProps,
	CheckboxSelectMenuButton,
	CheckboxSelectSubMenuItem,
	RadioSelectItems,
	RadioSelectItemsProps,
	RadioSelectMenuButton,
	RadioSelectSubMenuItem,
	withMenuButton,
	withSubMenu,
} from '@/components/v2/menu';

import { AxisControlSelectionItem, AxisValue } from '../charts/components/AxisControlSelection';

/**
 * Will use a radio items or checkboxes depending on the `exclusive` property, if it is using radio buttons it will add
 * a "all" item at the top by default
 */
export function SelectItems(
	props: // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	| (CheckboxSelectItemsProps<any> & { exclusive?: false; includeAll?: false })
		| (RadioSelectItemsProps & { exclusive: true; includeAll?: boolean })
) {
	const { items, includeAll = true } = props;
	if (props.exclusive) {
		return <RadioSelectItems {...props} items={includeAll ? [{ value: 'all', label: 'All' }, ...items] : items} />;
	}
	return <CheckboxSelectItems {...props} />;
}

/**
 * Will add aliases for some properties but they will not be included in the type definitions
 *
 * @example
 * 	function Component({onChange}) {}
 *
 * 	withAlias(Component, {onChange: 'onSelect'});
 *
 * 	<Component onChange={() => {}}/>
 * 	<Component onSelect={() => {}}/>
 *
 * @todo Remove after it is no longer needed
 */
const withAlias = <P,>(Component: ComponentType<P>, aliases: object): typeof Component => {
	const keys = Object.values(aliases);
	return (props) => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		return <Component {..._.mapValues(aliases, (alias) => props[alias])} {..._.omit(props, keys)} />;
	};
};

/** Adds default props, memoization and other goodies to the component */
// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
function getComponent<P, PP extends Partial<P> = {}>(
	Component: ComponentType<P>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	options: { defaultProps: PP; callbacks?: (keyof P)[]; aliases?: any } = {} as any
) {
	const { defaultProps, callbacks = [], aliases } = options;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return withAlias(memoEx(withDefaultProps(Component, defaultProps), { callbacks: callbacks as any }), aliases);
}

export const SelectItemsMenuButton = withMenuButton(SelectItems);

export const SelectItemsSubMenuButton = withSubMenu(SelectItems);

/**
 * Helpers for creating menu (menu creators), creating menu creators, in the end it should be easier to create menus
 * with this
 *
 * @example
 * 	const StatusMenu = getComponentBuilder(RadioSelectMenuButton)({
 * 		label: 'Status',
 * 		items: [
 * 			{ value: 'all', label: 'All' },
 * 			{ value: 'oil', label: 'Approved' },
 * 		],
 * 		tooltipTitle: 'Filter By Approval',
 * 	});
 *
 * 	const [value, setValue] = useState('all');
 * 	<StatusMenu value={value} onChange={setValue} />;
 *
 * 	// same as (but with performance improvements):
 * 	const StatusMenu = (props) => (
 * 		<RadioSelectMenuButton
 * 			label='Status'
 * 			items={[
 * 				{ value: 'all', label: 'All' },
 * 				{ value: 'oil', label: 'Approved' },
 * 			]}
 * 			tooltipTitle='Filter By Approval'
 * 			{...props}
 * 		/>
 * 	);
 *
 * @note component is memoized so there should be some performance improvements
 */
export const getComponentBuilder =
	<P,>(Component: ComponentType<P>) =>
	// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
	<PP extends Partial<P> = {}>(defaultProps: PP) =>
		getComponent(Component, {
			defaultProps,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			callbacks: ['onChange'] as any,
			aliases: { onChange: 'onSelect' },
		});

export const makeRadioListMenu = getComponentBuilder(RadioSelectMenuButton);

export const makeRadioListSubMenu = getComponentBuilder(RadioSelectSubMenuItem);

export const makeCheckboxListMenu = getComponentBuilder(CheckboxSelectMenuButton);

export const makeCheckboxListSubMenu = getComponentBuilder(CheckboxSelectSubMenuItem);

export const makeSelectListMenu = getComponentBuilder(SelectItemsMenuButton);

export const makeSelectListSubMenu = getComponentBuilder(SelectItemsSubMenuButton);

export const makeAxisControlSelectionItem = getComponentBuilder(AxisControlSelectionItem);

/**
 * Helper for generating menu items for forecast toolbar
 *
 * @example
 * 	getMenuItems(['oil', 'gas', 'water']);
 * 	output = [
 * 		{ value: 'oil', label: 'Oil' },
 * 		{ value: 'gas', label: 'Gas' },
 * 		{ value: 'water', label: 'Water' },
 * 	];
 */
export function getMenuItems(items: (string | number)[]) {
	return items.map((value) => ({
		value,
		label: _.capitalize(value.toLocaleString('en')),
	}));
}

// enforce AxisValue typing (only allows 'all' as a valid string)
export const forecastMinMaxArrToMenuItems = (items: AxisValue[]) =>
	items.map((value) => ({
		value,
		label: _.capitalize(value.toLocaleString('en')),
	}));
