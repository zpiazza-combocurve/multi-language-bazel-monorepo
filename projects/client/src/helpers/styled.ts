import { CSSProperties } from '@material-ui/core/styles/withStyles';
import { css } from 'styled-components';

export const ifProp =
	(prop: string, a, b = '') =>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	({ [prop]: value }: any) =>
		value ? a : b;
export const ifProps =
	(props: string[], a, b = '') =>
	(allProps) =>
		props.every((prop) => allProps[prop]) ? a : b;
export const unlessProp = (prop: string, a, b = '') => ifProp(prop, b, a);
export const unlessProps = (props: string[], a, b = '') => ifProps(props, b, a);
export const themeProp =
	(prop: string) =>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	({ [prop]: value }: any) =>
		value;

/**
 * @example
 * 	const StyledButton = styled(Button).withConfig({ shouldForwardProp: excludeProps(['primary']) })`
 * 		// primary property wont be passed to children, ie react-md wont complain and trash our console
 * 	`;
 */
export const excludeProps = <P extends string>(props: P[] = []) => {
	const set = new Set(props);
	return (prop) => !set.has(prop);
};

/** @deprecated Use material-ui theme `$({theme}) => theme.palette.background.default}`, etc */
export const theme = {
	background: 'var(--background)',
	backgroundOpaque: 'var(--background-opaque)',
	primaryColor: 'var(--primary-color)',
	primaryColorRGB: 'var(--primary-color--rgb)',
	primaryColorOpaque: 'var(--primary-color-opaque)',
	primaryColorSolidOpaque: 'var(--primary-color-solid-opaque)',
	primaryColorSolidOpaqueDark: 'var(--primary-color-solid-opaque-dark)',
	purpleColor: 'var(--purple-color)',
	purpleColorOpaque: 'var(--purple-color-opaque)',
	secondaryColor: 'var(--secondary-color)',
	secondaryColorRGB: 'var(--secondary-color--rgb)',
	secondaryColorOpaque: 'var(--secondary-color-opaque)',
	secondaryColorSolidOpaque: 'var(--secondary-color-solid-opaque)',
	secondaryColorSolidOpaqueDark: 'var(--secondary-color-solid-opaque-dark)',
	textColor: 'var(--text-color)',
	textColorOpaque: 'var(--text-color-secondary)',
	textColorDisabled: 'var(--text-color-disabled)',
	warningAlternativeColorOpaque: 'var(--warning-alternative-color-opaque)',
	warningAlternativeColor: 'var(--warning-alternative-color)',
	warningColor: 'var(--warning-color)',
	warningColorOpaque: 'var(--warning-color-opaque)',
	warningColorSolidOpaque: 'var(--warning-color-solid-opaque)',
	warningColorSolidOpaqueDark: 'var(--warning-color-solid-opaque-dark)',
	borderColor: 'var(--border-color)',
	grayColorAccent: 'var(--grey-color-accent)',

	boxShadow1: 'var(--box-shadow-1)',

	textUnitColor: 'var(--text-unit-color)',

	oilColor: 'var(--oil-color)',
	oilColorRgb: 'var(--oil-color--rgb)',
	gasColor: 'var(--gas-color)',
	gasColorRgb: 'var(--gas-color--rgb)',
	waterColor: 'var(--water-color)',
	waterColorRgb: 'var(--water-color--rgb)',

	gridReadOnlyBackground: 'var(--data-grid-cell-readonly)',

	grey: 'var(--grey-color)',

	spaceXs: '0.25rem',
	spaceSm: '0.5rem',
	spaceMd: '1rem',
	spaceLg: '1.5rem',
	spaceXl: '2rem',
};

/** @deprecated Use material-ui theme */
export const space = {
	xs: theme.spaceXs,
	sm: theme.spaceSm,
	md: theme.spaceMd,
	lg: theme.spaceLg,
	xl: theme.spaceXl,
};

export function withHalfWidthStyles(props?: { spacing?: number }) {
	const spacing = props?.spacing ?? 0.5;
	return css`
		width: calc((100% - ${spacing}rem) / 2);
	`;
}

export function withSpacedStyles(props?: { horizontal?: boolean; margin?: number }) {
	const horizontal = props?.horizontal ?? false;
	const margin = props?.margin ?? 0.5;
	return css`
		& > *:not(:first-child) {
			margin-${horizontal ? 'left' : 'top'}: ${margin}rem;
		}
	`;
}

export function withHiddenStyles(hidden: boolean, mode: 'display' | 'visibility' = 'visibility') {
	return css`
		${mode === 'visibility' && hidden && `visibility: hidden;`} // layout will not change
		${mode === 'display' && hidden && `display: none;`} // layout will change
	`;
}

export function getEllipseStyle(width = '70%'): CSSProperties {
	return { textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', width };
}

export default theme;
