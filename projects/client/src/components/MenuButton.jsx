import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import { MenuButton as MdMenuButton } from 'react-md';
import styled, { css } from 'styled-components';

import { Styled } from './Styled';

const DEFAULT_MENU_CLASSNAME = 'inpt-dropdown-menu';

const MenuButtonContainer = styled.div`
	display: inline-block;
	${({ $width }) => $width && `width: ${$width};`}
	.${({ listClassName }) => listClassName} {
		${({ menuWidth }) =>
			menuWidth &&
			css`
				min-width: ${menuWidth};
			`}
	}
`;

// TODO check if title propery exists
/**
 * @deprecated Use material-ui
 * @param {React.ComponentProps<typeof MdMenuButton> & {
 * 	width?: number;
 * 	faIcon?;
 * 	title?: string;
 * } & import('./Styled').StyledColorProps} props
 */
export function MenuButton({ position = MdMenuButton.Positions.BELOW, width, ...props }) {
	const { children, listClassName = DEFAULT_MENU_CLASSNAME, menuWidth } = props;
	return (
		<MenuButtonContainer listClassName={listClassName} menuWidth={menuWidth} $width={width}>
			<Styled
				as={MdMenuButton}
				iconBefore={false}
				position={position}
				faIcon={children === undefined ? faChevronDown : undefined}
				listClassName={listClassName}
				{...props}
			/>
		</MenuButtonContainer>
	);
}

MenuButton.Positions = MdMenuButton.Positions;
MenuButton.HorizontalAnchors = MdMenuButton.HorizontalAnchors;
MenuButton.VerticalAnchors = MdMenuButton.VerticalAnchors;
