/**
 * Helpers for creating menus with material-ui
 *
 * - Uses popper instead of popover for the menus
 * - Allows nesting menus
 *
 * @file
 * @example
 * 	<MenuButton label='Options'>
 * 		<ButtonItem label='download' onClick={handleDownload} />
 * 		<SubMenuButton label='File'>
 * 			<ButtonItem label='export' onClick={handleExport} />
 * 			<ButtonItem label='import' onClick={handleImport} />
 * 		</SubMenuButton>
 * 	</MenuButton>;
 */
import { faChevronRight } from '@fortawesome/pro-regular-svg-icons';
import { Checkbox, ListItemProps, Radio, Switch } from '@material-ui/core';
import produce from 'immer';
import _ from 'lodash';
import { ComponentProps, ElementType } from 'react';
import styled from 'styled-components';

import Button from '../Button';
import Icon from '../Icon';
import IconButton from '../IconButton';
import ListItem from '../ListItem';
import TextField, { TextFieldProps } from '../TextField';
import Autocomplete, { AutocompleteProps } from '../misc/Autocomplete';
import { InfoTooltipWrapper } from '../misc/InfoIcon';
import SliderField, { SliderFieldProps } from '../misc/SliderField';
import { CLOSE_ATTR_NAME, withPopup } from './shared';

/* Naming guidelines:
   - top level menus will be prefixed with "Menu", eg for Button "MenuButton", for IconButton "MenuIconButton"
   - menu items will be suffixed with "Item", eg clickable Button "ButtonItem", checkbox "CheckboxItem", radio "RadioItem"
   - submenu items will be suffixed with "SubMenuItem", eg SubMenuItem, RadioSelectSubMenuItem
   - collection of items wil be suffixed with "Items", eg RadioSelectItems
 */

/** `Button` menu component */
export const MenuButton = withPopup(Button, { placement: 'bottom-start' });

export type MenuButtonProps = ComponentProps<typeof MenuButton>;

/** `IconButton` menu component */
export const MenuIconButton = withPopup(IconButton, { placement: 'bottom-start', childrenKey: 'icon' });

interface ItemProps {
	label: string;
}

// Items
// HACK to make all the items the same size
export const FixedText = styled.span`
	padding-top: 12px;
	padding-bottom: 12px;
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const wrapAdditionalInfo = (label: any, additionalInfo: any | undefined, placeIconAfter?: boolean) =>
	additionalInfo ? (
		<InfoTooltipWrapper tooltipTitle={additionalInfo} placeIconAfter={placeIconAfter}>
			{label}
		</InfoTooltipWrapper>
	) : (
		label
	);

/**
 * Helper for menu item
 *
 * @example
 * 	<Item additionalInfo='Tooltip description' hideOnClick primaryText='Item Label' secondary='Item description' />;
 *
 * @param [additionalInfo] Value passed in is the tooltipTitle for the information tooltip.
 * @param [placeInfoAfter] Boolean to decide where the information icon is placed
 * @param [hideOnClick] If true, popper menu will close on item click
 * @param [primaryText] Text display for the item
 * @param [secondary] Secondary text display
 */
export function Item({
	// information tooltip properties
	additionalInfo,
	disabled,
	hideOnClick,
	placeInfoAfter,
	primaryText,
	secondary,
	onClick,
	...props
}: Pick<ListItemProps, 'button' | 'onClick' | 'tabIndex' | 'dense' | 'selected'> & {
	additionalInfo?: string | undefined;
	className?: string;
	disabled?: boolean | string;
	hideOnClick?: boolean;
	placeInfoAfter?: boolean;
	primaryText: string;
	secondary?;
}) {
	const closeProp = hideOnClick ? { [CLOSE_ATTR_NAME]: true } : {};
	const innerClick = (ev) => {
		if (!disabled) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			onClick?.(ev as any);
		} else {
			ev.stopPropagation();
		}
	};
	return (
		<ListItem
			{...props}
			css={`
				display: flex;
				align-items: center;
				justify-content: space-between;
			`}
			onClick={innerClick}
			disabled={disabled}
			ContainerComponent='div'
			{...closeProp}
		>
			{Boolean(primaryText?.length) &&
				wrapAdditionalInfo(
					<FixedText {...closeProp} css='flex-grow: 1;'>
						{primaryText}
					</FixedText>,
					additionalInfo,
					placeInfoAfter
				)}
			{secondary && <div>{secondary}</div>}
		</ListItem>
	);
}

// Items

export function TextItem({ label }: ItemProps) {
	return <Item primaryText={label} />;
}

/**
 * Nested menu item
 *
 * @example
 * 	<SubMenuItem label='Show more'>
 * 		<ButtonItem label='download' />
 * 		<ButtonItem label='export' />
 * 	</SubMenuItem>;
 */
export const SubMenuItem = withPopup(
	({
		children,
		onClick,
		dense,
		disabled,
		...rest
	}: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		children?: any;
		onClick;
		dense?: boolean;
		disabled?: string | boolean;
		tooltipTitle?: string | boolean;
	}) => (
		<Item
			{...rest}
			disabled={disabled}
			dense={dense}
			button
			onClick={onClick}
			primaryText={children}
			secondary={<Icon fontSize='small'>{faChevronRight}</Icon>}
		/>
	),
	{ placement: 'right-start', disablePortal: false }
);

type SubMenuItemProps = ComponentProps<typeof SubMenuItem>;

interface ButtonItemProps extends ItemProps {
	additionalInfo?: string | undefined;
	dense?: boolean;
	disabled?: boolean | string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onClick?(value?: any): void;
	placeInfoAfter?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	secondaryAction?: any;
	selected?: boolean;
	hideOnClick?: boolean;
}

/**
 * Clickable menu list item
 *
 * @example
 * 	<ButtonItem label='Download XSLX' onClick={download} />;
 */
export function ButtonItem({
	additionalInfo,
	dense,
	disabled,
	label,
	onClick,
	placeInfoAfter,
	secondaryAction,
	hideOnClick = true,
	...props
}: ButtonItemProps) {
	return (
		<Item
			additionalInfo={additionalInfo}
			button
			dense={dense}
			disabled={disabled}
			hideOnClick={hideOnClick}
			onClick={onClick}
			placeInfoAfter={placeInfoAfter}
			primaryText={label}
			secondary={secondaryAction}
			{...props}
		/>
	);
}

interface SwitchItemProps extends ItemProps {
	value: boolean;
	onChange?(newValue: boolean): void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	additionalInfo?: any;
	disabled?: boolean;
	className?: string;
	/* eslint-enable react/no-unused-prop-types */
}

/**
 * Switch item
 *
 * @example
 * 	<SwitchItem value={trueOrFalse} onChange={(newValue) => setState(newValue)} />;
 */
export function SwitchItem({ label, value, onChange, additionalInfo, disabled, className }: SwitchItemProps) {
	return (
		<Item
			className={className}
			additionalInfo={additionalInfo}
			button
			disabled={disabled}
			onClick={() => onChange?.(!value)}
			primaryText={label}
			secondary={<Switch onChange={(ev) => onChange?.(ev.target.checked)} checked={value} disabled={disabled} />}
			tabIndex={-1}
		/>
	);
}

export function CheckboxItem({ additionalInfo, label, value, onChange, disabled }: SwitchItemProps) {
	return (
		<Item
			additionalInfo={additionalInfo}
			button
			disabled={disabled}
			onClick={() => onChange?.(!value)}
			primaryText={label}
			tabIndex={-1}
			secondary={<Checkbox checked={value} disabled={disabled} />}
		/>
	);
}

export function RadioItem({ disabled, label, value, onChange }: SwitchItemProps) {
	return (
		<Item
			button
			disabled={disabled}
			onClick={() => onChange?.(value)}
			primaryText={label}
			secondary={<Radio checked={value} disabled={disabled} onChange={(ev) => onChange?.(ev.target.checked)} />}
			tabIndex={-1}
		/>
	);
}

export function AutocompleteItem(props: AutocompleteProps) {
	return (
		<ListItem>
			<Autocomplete {...props} fullWidth />
		</ListItem>
	);
}

export function TextFieldItem(props: TextFieldProps) {
	return (
		<ListItem>
			<TextField {...props} />
		</ListItem>
	);
}

export function SliderFieldItem(props: SliderFieldProps) {
	return (
		<ListItem>
			<SliderField {...props} />
		</ListItem>
	);
}

// extra menus

export interface RadioSelectItemsProps {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	items: { value: any; label: string; key?: string }[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onChange?(newValue: any): void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	value: any;
}

/** Allow selecting one option from a list */
export function RadioSelectItems({ items, value, onChange }: RadioSelectItemsProps) {
	return (
		<>
			{items.map(({ value: itemValue, label: itemLabel, key }) => (
				<RadioItem
					key={key ?? itemLabel}
					value={itemValue === value}
					onChange={() => onChange?.(itemValue)}
					label={itemLabel}
				/>
			))}
		</>
	);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
type Collection<T = any> = Array<T> | Set<T>;

export interface CheckboxSelectItemsProps<T extends Collection = Collection> {
	disabled?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	items: { value: any; label: string; key?: string; disabled?: boolean; additionalInfo?: string }[];
	onChange?(newValue: T): void;
	selectAll?: boolean;
	value: T;
}

/** Allow selecting many options from a list */
export function CheckboxSelectItems<T extends Collection = Collection>({
	disabled: allDisabled,
	items,
	onChange,
	selectAll,
	value,
}: CheckboxSelectItemsProps<T>) {
	const handleChange = (itemValue) => {
		if (!onChange) {
			return;
		}
		onChange(
			produce(value, (draft) => {
				if (Array.isArray(draft)) {
					if (draft.includes(itemValue)) {
						_.pull(draft, itemValue);
					} else {
						draft.push(itemValue);
					}
				} else if (draft.has(itemValue)) {
					draft.delete(itemValue);
				} else {
					draft.add(itemValue);
				}
			})
		);
	};

	const isActive = Array.isArray(value) ? (v) => value.includes(v) : (v) => value.has(v);

	const allSelected = items.every((item) => isActive(item.value));
	const handleToggleSelectAll = () => {
		if (Array.isArray(value)) {
			if (allSelected) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				onChange?.([] as any);
				return;
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			onChange?.(_.map(items, 'value') as any);
		}
		// TODO implement for sets
	};

	return (
		<>
			{selectAll && <CheckboxItem value={allSelected} onChange={handleToggleSelectAll} label='Select All' />}
			{items.map(({ value: itemValue, label: itemLabel, additionalInfo, key, disabled }) => (
				<CheckboxItem
					additionalInfo={additionalInfo}
					disabled={allDisabled || disabled}
					key={key ?? itemLabel}
					label={itemLabel}
					onChange={() => handleChange(itemValue)}
					value={isActive(itemValue)}
				/>
			))}
		</>
	);
}

// menus and sub menus extra helpers

const MENU_BUTTON_PROPS = ['label', 'list', 'color', 'tooltipTitle', 'startIcon', 'disabled'] as const;

export function withMenuButton<P>(Component: ElementType<P>) {
	return (props: Pick<MenuButtonProps, (typeof MENU_BUTTON_PROPS)[number]> & P) => (
		<MenuButton {..._.pick(props, MENU_BUTTON_PROPS)}>
			{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later */}
			{/* @ts-expect-error */}
			<Component {..._.omit(props, MENU_BUTTON_PROPS)} />
		</MenuButton>
	);
}

const SUB_MENU_ITEM_PROPS = ['label', 'list', 'popperPlacement'] as const;

export function withSubMenu<P>(Component: ElementType<P>) {
	return (props: Pick<SubMenuItemProps, (typeof SUB_MENU_ITEM_PROPS)[number]> & P) => (
		<SubMenuItem {..._.pick(props, SUB_MENU_ITEM_PROPS)}>
			{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later */}
			{/* @ts-expect-error */}
			<Component {..._.omit(props, SUB_MENU_ITEM_PROPS)} />
		</SubMenuItem>
	);
}

export const RadioSelectSubMenuItem = withSubMenu(RadioSelectItems);

export type RadioSelectSubMenuItemProps = ComponentProps<typeof RadioSelectSubMenuItem>;

export const RadioSelectMenuButton = withMenuButton(RadioSelectItems);

export type RadioSelectMenuButtonProps = ComponentProps<typeof RadioSelectMenuButton>;

export const CheckboxSelectSubMenuItem = withSubMenu(CheckboxSelectItems);

export type CheckboxSelectSubMenuItemProps = ComponentProps<typeof CheckboxSelectSubMenuItem>;

export const CheckboxSelectMenuButton = withMenuButton(CheckboxSelectItems);

export type CheckboxSelectMenuButtonProps = ComponentProps<typeof CheckboxSelectMenuButton>;

export { withPopup };
