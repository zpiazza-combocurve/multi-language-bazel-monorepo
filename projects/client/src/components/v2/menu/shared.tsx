import { List, PopperPlacementType } from '@material-ui/core';
import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state';
import { ComponentType, ReactNode } from 'react';
import styled from 'styled-components';

import { addHOCName } from '@/components/shared';
import { theme } from '@/helpers/styled';

import PopperMenu from './PopperMenu';

const withList = (list: boolean | undefined, children) => (list ? <List>{children}</List> : children);

// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
export type WithPopupProps<P extends { onClick? } = {}, CK extends string = 'label'> = Omit<P, 'onClick' | 'children'> &
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	Record<CK, any> & { children?: ReactNode; list?: boolean };

export const CLOSE_ATTR_NAME = 'data-cc-close-menu';

const WithActiveWrapper = styled.div`
	.active-state-button {
		background-color: ${theme.backgroundOpaque};
	}
`;

/**
 * Will make any component with a `onClick` property behave like a menu
 *
 * @example
 * 	const MenuButton = withPopup(Button);
 *
 * 	<MenuButton label='Show Menu'>menu content goes here</MenuButton>;
 */
export const withPopup = <P extends { onClick? }, CK extends string = 'label', DDEK extends keyof P = 'onClick'>(
	Component: ComponentType<P>,
	{
		childrenKey = 'label' as CK,
		dropdownEventKey = 'onClick' as DDEK,
		placement,
		disablePortal = true,
	}: {
		/** New property key to pass as children */
		childrenKey?: CK;
		/** Allows changing the component event that dispatches the menu, by default is 'onClick' */
		dropdownEventKey?: DDEK;
		onClose?: () => void;
		onClick?: () => void;
		placement?: PopperPlacementType;
		disablePortal?: boolean;
	} = {}
) => {
	type ElementExProps = Omit<P, DDEK | 'children'> &
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		Record<CK, any> & {
			children?: ReactNode;
			list?: boolean;
			popperPlacement?: PopperPlacementType;
			disablePortal?: boolean;
			onClose?: () => void;
			onClick?: () => void;
			className?: string;
			/**
			 * Closes the menu when the menu or any component inside is clicked, if you want to disable the behavior for
			 * a specific item stop event propagation on the click event. Useful when a click propogates from a nested
			 * element (ex. tooltip icon)
			 */
			hideMenuOnClick?: boolean;
			customZIndex?: number;
			customMaxHeight?: string;
			customPadding?: string;
			customMaxWidth?: string;
		};

	const bindTriggerEx =
		dropdownEventKey === 'onClick'
			? bindTrigger
			: (...params: Parameters<typeof bindTrigger>) => {
					const { onClick, ...rest } = bindTrigger(...params);
					return { ...rest, [dropdownEventKey]: onClick };
			  };

	function ElementEx({
		[childrenKey]: label,
		children,
		list,
		popperPlacement,
		disablePortal: disableElementPortal,
		// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
		onClose = () => {},
		// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
		onClick = () => {},
		className,
		hideMenuOnClick,
		customZIndex,
		customMaxHeight,
		customPadding,
		customMaxWidth,
		...rest
	}: ElementExProps) {
		return (
			<PopupState variant='popper'>
				{(popupState) => (
					<>
						<WithActiveWrapper>
							{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later */}
							{/* @ts-expect-error */}
							<Component
								{...rest}
								{...bindTriggerEx(popupState)}
								className={`${className} ${popupState.isOpen && 'active-state-button'}`}
								// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
								onClick={(e: any) => {
									popupState.open(e);
									onClick();
								}}
							>
								{label}
							</Component>
						</WithActiveWrapper>

						<PopperMenu
							css={`
								z-index: ${(props) => props.customZIndex ?? props.theme.zIndex.modal};
							`}
							customZIndex={customZIndex}
							customMaxHeight={customMaxHeight}
							customMaxWidth={customMaxWidth}
							customPadding={customPadding}
							{...bindMenu(popupState)}
							disablePortal={disableElementPortal ?? disablePortal}
							placement={popperPlacement ?? placement}
							onClose={() => {
								onClose();
								popupState.close();
							}}
							onClick={(ev) => {
								// @ts-expect-error yes it does exist?
								if (hideMenuOnClick || ev.target?.getAttribute(CLOSE_ATTR_NAME)) {
									onClose();
									popupState.close();
								}
							}}
						>
							{withList(list, children)}
						</PopperMenu>
					</>
				)}
			</PopupState>
		);
	}

	return addHOCName(ElementEx, 'withPopup', Component);
};
