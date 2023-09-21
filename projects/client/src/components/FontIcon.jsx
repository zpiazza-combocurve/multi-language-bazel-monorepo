import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FontIcon as MdFontIcon } from 'react-md';
import styled, { css } from 'styled-components';

import { ifProp, theme } from '@/helpers/styled';

export const DEFAULT_CONTROL_TOGGLE_SIZE = 48;

export const DEFAULT_ICON_SIZE = 24;

const colors = {
	normal: {
		color: theme.textColor,
		opaque: theme.textColorOpaque,
	},
	primary: {
		color: theme.primaryColor,
		opaque: theme.primaryColorOpaque,
	},
	secondary: {
		color: theme.secondaryColor,
		opaque: theme.secondaryColorOpaque,
	},
	warning: {
		color: theme.warningColor,
		opaque: theme.warningColorOpaque,
	},
	warningAlt: {
		color: theme.warningAlternativeColor,
		opaque: theme.warningAlternativeColorOpaque,
	},
	purple: {
		color: theme.purpleColor,
		opaque: theme.purpleColorOpaque,
	},
};

const customColorStyle = ({ color }) => css`
	color: ${color};
`;

const forceStyle = ({ forceSize }) => css`
	width: ${forceSize}px;
	height: ${forceSize}px;
`;

const rightIconStyles = () => css`
	margin-left: 1rem;
`;
const leftIconStyles = () => css`
	margin-right: 1rem;
`;
const inheritStyles = () => css`
	&.md-text--inherit {
		color: inherit;
	}
`;

/** @deprecated Use material-ui Icon */
export const StyledMdFontIcon = styled(MdFontIcon)`
	// override default neutral color on dark theme
	&& {
		${ifProp('primary', customColorStyle(colors.primary))}
		${ifProp('secondary', customColorStyle(colors.secondary))}
		${ifProp('$warning', customColorStyle(colors.warning))}
		${ifProp('$warningAlt', customColorStyle(colors.warningAlt))}
		${ifProp('$purple', customColorStyle(colors.purple))}
		${ifProp('$leftIcon', leftIconStyles)}
		${ifProp('$rightIcon', rightIconStyles)}
		.svg-inline--fa {
			vertical-align: 0;
			${ifProp('forceSize', forceStyle)}
		}
		${ifProp('inherit', inheritStyles)}
	}
`;

/**
 * @deprecated Use material-ui Icon
 * @param {any} props
 */
export function FontIcon({
	children,
	forceSize = DEFAULT_ICON_SIZE,
	warning = false,
	warningAlt = false,
	purple = false,
	plain = false,
	leftIcon = undefined,
	rightIcon = undefined,
	...props
}) {
	const { inherit, primary: primaryProp, secondary: secondaryProp } = props;
	const commonProps = {
		$purple: purple,
		$plain: plain,
		$warning: warning,
		$warningAlt: warningAlt,
		$leftIcon: leftIcon,
		$rightIcon: rightIcon,
	};

	return (
		<StyledMdFontIcon
			{...commonProps}
			forceFontSize
			forceSize={forceSize}
			{...props}
			inherit={inherit && !(primaryProp || secondaryProp || warning || warningAlt || plain)}
		>
			<FontAwesomeIcon icon={children} />
		</StyledMdFontIcon>
	);
}
