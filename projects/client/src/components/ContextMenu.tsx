import { faEllipsisH } from '@fortawesome/pro-regular-svg-icons';
import { ClickAwayListener, MenuList, Paper, Popper } from '@material-ui/core';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { useParentElement } from '@/components/hooks';
import { Z_INDEX_COLUMN_POPUP_MENU_MAIN, Z_INDEX_COLUMN_POPUP_MENU_SUBMENU } from '@/components/misc/constants';
import { Button, FixedText, Icon, MenuItem, SubMenuItem } from '@/components/v2';
import { ifProp, theme } from '@/helpers/styled';

export const DEFAULT_SIZE = 39;

const PAPER_ELAVATION = 5;

export type Item =
	| { separator: true }
	| {
			label: string;
			children: Item[];
			separator?: false;
	  }
	| {
			label: string;
			onClick?(event): void;
			component?;
			to?: string;
			disabled?: boolean | string;
			children?: null;
			separator?: false;
	  }
	| null;

export const getItem = (label, onClick, disabled?) => (onClick ? { label, onClick, disabled } : null);
export const getURLItem = (label, url) => (url ? { label, component: Link, to: url } : null);

export interface IMenuProps {
	visible: boolean;
	anchorEl?;
	closeMenu;
	items: Item[];
	selected?: boolean;
}

const Separator = () => <hr style={{ borderBottom: 0 }} />;

function ItemElement({ closeMenu, ...item }: Item & { closeMenu?(event): void }) {
	const { separator } = item;

	if (separator) {
		return <MenuItem key='separator' component={Separator} />;
	}

	const { children, label } = item;

	if (children != null) {
		return (
			<SubMenuItem
				label={label}
				// customZIndex is fixing overlapping issue between main and sub-menus
				// https://combocurve.atlassian.net/browse/CC-17084
				customZIndex={Z_INDEX_COLUMN_POPUP_MENU_SUBMENU}
			>
				{children
					.filter((item) => item)
					.map((nestedItem, index) => (
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
						<ItemElement key={index} closeMenu={closeMenu} {...nestedItem!} />
					))}
			</SubMenuItem>
		);
	}

	const { onClick, component, to, disabled } = item;

	return (
		<MenuItem
			key={label}
			component={component}
			to={to}
			disabled={disabled}
			onClick={(ev) => {
				onClick?.(ev);
				closeMenu?.(ev);
			}}
		>
			{label}
		</MenuItem>
	);
}

export function ContextMenuList({ anchorEl: _anchorEl, closeMenu, items, selected, visible }: IMenuProps) {
	const { parentElement, component } = useParentElement();
	const anchorEl = _anchorEl ?? parentElement;

	return (
		<>
			{component}
			{visible && anchorEl && (
				<ClickAwayListener onClickAway={closeMenu} mouseEvent='onMouseDown' touchEvent='onTouchStart'>
					<Popper
						css={`
							background: ${theme.backgroundOpaque};
							min-width: ${anchorEl.clientWidth + (selected ? 2 : 0)}px;
							max-height: 80vh;
							// 1 more than modular economics dialog (Z_INDEX_ECONOMICS_DIALOGUE)
							z-index: ${Z_INDEX_COLUMN_POPUP_MENU_MAIN};

							li,
							a {
								&:hover {
									background: ${theme.background};
								}
								height: ${DEFAULT_SIZE}px;
								padding-left: 8px;
								padding-right: 8px;
								font-size: 1rem;
							}
						`}
						open={!!anchorEl}
						anchorEl={anchorEl}
						placement='bottom-end'
					>
						<Paper
							css={`
								// background: ${theme.backgroundOpaque}; // HACK: look in Paper props to change background

								// TODO: merge these styles with v2/menu/helpers
								.MuiListItem-button {
									font-size: 0.875rem;
									padding: 8px;
								}
								${FixedText} {
									padding: 0;
								}
							`}
							elevation={PAPER_ELAVATION}
						>
							<MenuList autoFocus>
								{items
									.filter((item) => !!item)
									.map((item, index) => (
										// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
										<ItemElement key={index} closeMenu={closeMenu} {...item!} />
									))}
							</MenuList>
						</Paper>
					</Popper>
				</ClickAwayListener>
			)}
		</>
	);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const ContextMenuIcon = styled<any>(Button).attrs({ children: <Icon>{faEllipsisH}</Icon> })`
	transition: 0ms background;
	border-radius: 0;
	font-size: 24px;
	min-width: ${DEFAULT_SIZE}px;
	height: ${DEFAULT_SIZE}px;
	${ifProp('hover', `background: ${theme.backgroundOpaque};`)}
`;

export const ShowOnHover = styled.div<{ visible?: boolean }>`
	display: none;
	align-items: center;
	&&&& {
		// force visibility
		${ifProp('visible', 'display: inline-flex;')}
	}
`;

export const SEPARATOR: Item = { separator: true };

interface IContextMenuProps {
	items: (() => Item[]) | Item[];
	onVisibilityChange?: (isOpen: boolean) => void;
}

export interface IContextMenuRef {
	setMenuVisibility: (open: boolean) => void;
}

export const ContextMenu = forwardRef<IContextMenuRef, IContextMenuProps>(
	({ items: _items, onVisibilityChange }, ref) => {
		const { parentElement, component } = useParentElement();
		const [menuIsOpen, setMenuIsOpen] = useState(false);
		const [iconIsVisible, setIconIsVisible] = useState(false);

		useImperativeHandle(ref, () => ({
			setMenuVisibility: setMenuIsOpen,
		}));

		useEffect(() => {
			onVisibilityChange?.(menuIsOpen);
		}, [onVisibilityChange, menuIsOpen]);

		useEffect(() => {
			if (parentElement) {
				const onContextMenu = (ev) => {
					ev?.preventDefault();
					setMenuIsOpen((state) => !state);
				};
				const onHover = (ev) => {
					ev?.preventDefault();
					setIconIsVisible(true);
				};
				const onLeave = (ev) => {
					ev?.preventDefault();
					setIconIsVisible(false);
				};
				parentElement.addEventListener('mouseenter', onHover);
				parentElement.addEventListener('mouseleave', onLeave);
				parentElement.addEventListener('contextmenu', onContextMenu);
				return () => {
					parentElement.removeEventListener('mouseenter', onHover);
					parentElement.removeEventListener('mouseleave', onLeave);
					parentElement.removeEventListener('contextmenu', onContextMenu);
				};
			}
			return () => null;
		}, [parentElement]);

		const items = typeof _items === 'function' ? _items() : _items;

		return (
			<>
				{component}
				<ContextMenuList
					anchorEl={parentElement}
					visible={menuIsOpen}
					items={items}
					closeMenu={(event) => {
						event.stopPropagation();
						setMenuIsOpen(false);
					}}
				/>
				<ShowOnHover visible={iconIsVisible || menuIsOpen}>
					{menuIsOpen ? (
						<div>
							<ContextMenuIcon hover={menuIsOpen.toString()} />
						</div>
					) : (
						<ContextMenuIcon
							hover={menuIsOpen.toString()}
							onClick={(ev) => {
								ev?.preventDefault();
								setMenuIsOpen((state) => !state);
							}}
						/>
					)}
				</ShowOnHover>
			</>
		);
	}
);
