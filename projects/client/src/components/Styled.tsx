import styled, { css } from 'styled-components';

import { useId } from '@/components/hooks/useId';
import { excludeProps, ifProp, theme, unlessProp, unlessProps } from '@/helpers/styled';
import { isValidChildren } from '@/helpers/utilities';

import { FontIcon } from './FontIcon';

const BOX_SHADOW =
	'box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12), 0 3px 1px -2px rgba(0, 0, 0, 0.2);';

const underlinedStyle = `
	border-bottom-width: 2px;
	border-bottom-style: solid;
`;

const raiseStyle = ({ color }) => css`
	&&& {
		${BOX_SHADOW}
		&:hover {
			background-color: ${color || theme.grayColorAccent};
		}
		${color &&
		css`
			color: white;
			background-color: ${color};
		`}
	}
`;

const flatStyle = ({ color, opaque = theme.grayColorAccent }) => css`
	color: ${color};
	&:hover {
		background-color: ${opaque};
	}
`;

const iconStyle = css`
	padding: 14px;
`;

const smallStyle = css`
	width: 24px;
	height: 24px;
	padding: 4px;
`;

const smallFontStyle = css`
	padding: 0.25rem 0.5rem;
	font-size: 0.8rem;
`;

const floatingStyles = css`
	width: 56px;
	height: 56px;
	padding: 18px;
`;

const raiseOnHoverStyle = (props) => css`
	${flatStyle(props)}
	:hover {
		${raiseStyle(props)}
	}
`;

const paddedStyle = css`
	padding: 0.5rem 1rem;
`;

const fullWidthStyle = css`
	width: 100%;
`;

const fullHeightStyle = css`
	height: 100%;
`;

const disabledStyles = ({ raised }) => css`
	&& {
		color: ${theme.textColorDisabled};
		background: ${raised ? theme.borderColor : 'transparent'};
		cursor: default;
	}
`;

const customColorStyle = (props) =>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	css(({ disabled, raiseOnHover, flat, icon, raised, floating }: any) => {
		if (disabled) {
			return '';
		}
		if (raiseOnHover) {
			return raiseOnHoverStyle(props);
		}
		if (flat || icon) {
			return flatStyle(props);
		}
		if (raised || floating) {
			return raiseStyle(props);
		}
		return '';
	});

export const colors = {
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
	oilColor: {
		color: theme.oilColor,
		opaque: theme.oilColorRgb,
	},
	gasColor: {
		color: theme.gasColor,
		opaque: theme.gasColorRgb,
	},
	waterColor: {
		color: theme.waterColor,
		opaque: theme.waterColorRgb,
	},
};

const STYLED_PROPS = [
	'fullHeight',
	'fullWidth',
	'padded',
	'purple',
	'small',
	'transform',
	'underlined',
	'warning',
	'warningAlt',
	'gasColor',
	'oilColor',
	'waterColor',
];

const StyledStyles = styled.div.withConfig({ shouldForwardProp: excludeProps(STYLED_PROPS) })`
	&,
	& .md-icon-separator .md-icon-text {
		display: inline-flex;
		align-items: center;
		justify-content: space-around;
	}

	${unlessProp('transform', 'text-transform: unset;')}
	${unlessProps(['icon', 'floating'], 'min-width: unset;')}
	${ifProp('underlined', underlinedStyle)}

	// COLORS START
	// needs double specificity because of react-md dark theme styles
	&&& {
		${ifProp('primary', unlessProp('swapTheming', customColorStyle(colors.primary)))};
		${ifProp('secondary', customColorStyle(colors.secondary))};
		${ifProp('purple', customColorStyle(colors.purple))};
		${ifProp('warning', customColorStyle(colors.warning))};
		${ifProp('warningAlt', customColorStyle(colors.warningAlt))};
		${ifProp('oilColor', customColorStyle(colors.oilColor))};
		${ifProp('gasColor', customColorStyle(colors.gasColor))};
		${ifProp('waterColor', customColorStyle(colors.waterColor))};
		${ifProp('$disabled', disabledStyles)}
	}
	// COLORS END

	${ifProp('icon', iconStyle)}
	${ifProp('floating', iconStyle)}
	${ifProp('small', smallStyle)}
	${ifProp('floating', unlessProp('small', floatingStyles))}
	${ifProp('padded', paddedStyle)}
	${ifProp('fullWidth', fullWidthStyle)}
	${ifProp('fullHeight', fullHeightStyle)}
	${ifProp('smallFont', smallFontStyle)}
`;

/** @deprecated */
export type StyledColorProps = { [P in Exclude<keyof typeof colors, 'normal'>]?: boolean };

/** @deprecated */
export interface StyledProps {
	children?: React.ReactNode;
	faIcon?;
	iconEl?;
	flat?: boolean;
	icon?: boolean;
	floating?: boolean;
	raised?: boolean;
	warning?: boolean;
	fullWidth?: boolean;
	fullHeight?: boolean;
	warningAlt?: boolean;
	small?: boolean;
	smallIcon?: boolean;
	underlined?: boolean;
	transform?: boolean;
	padded?: boolean;
	disabled?: boolean;
	onChange?;
	tooltipLabel?: string;
	onClick?;
	swapTheming?: boolean;
	as?: string | React.ComponentType;
}

/** @deprecated */
export function Styled({
	children,
	faIcon,
	iconEl: iconElProp,
	flat: flatProp,
	icon: iconProp,
	floating: floatingProp,
	raised: raisedProp,
	warning,
	fullWidth,
	fullHeight,
	warningAlt,
	small,
	smallIcon,
	underlined,
	transform,
	padded,
	disabled,
	onChange,
	onClick,
	...props
}: StyledProps & StyledColorProps & { as?: string | React.ComponentType }) {
	const { tooltipLabel } = props;
	const fakeDisabled = disabled && tooltipLabel;
	const uniqueId = useId();
	const commonProps = {
		id: uniqueId,
		fullWidth,
		fullHeight,
		warning,
		warningAlt,
		small,
		underlined,
		transform,
		padded,
		$disabled: fakeDisabled,
		disabled: !fakeDisabled && disabled,
		onChange: !fakeDisabled && onChange ? onChange : undefined,
		onClick: !fakeDisabled && onClick ? onClick : undefined,
	};
	const isIcon = !!(!isValidChildren(children) && (iconElProp || faIcon));
	const iconEl =
		iconElProp ??
		(faIcon ? (
			<FontIcon inherit disabled={disabled} forceSize={small || smallIcon ? 16 : 20}>
				{faIcon}
			</FontIcon>
		) : null);
	if (isIcon) {
		const icon = flatProp || iconProp || !(floatingProp || raisedProp);
		const floating = !icon;
		return <StyledStyles {...commonProps} {...{ icon, floating, iconEl, children }} {...props} />;
	}

	const flat = flatProp || !raisedProp;
	const raised = !flat;

	return <StyledStyles {...commonProps} {...{ flat, raised, iconEl, children }} {...props} />;
}
