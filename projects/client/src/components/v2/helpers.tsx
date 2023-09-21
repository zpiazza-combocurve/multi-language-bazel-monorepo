import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Icon, InputAdornment, TooltipProps as MUTooltipProps, useTheme, withStyles } from '@material-ui/core';
import classnames from 'classnames';
import _ from 'lodash';
import { forwardRef, useCallback } from 'react';
import * as React from 'react';

/** @file Add Support for using any palette color in material-ui components. This seems to be supported in material-ui@5 */
import { addHOCName } from '@/components/shared';

import Tooltip from './Tooltip';
import styles from './mui-custom-colors.module.scss';

/**
 * Helpers for fontawesome + material-ui
 *
 * @deprecated Use `import("@/components/v2").Icon` instead
 * @example
 * 	import { faIcon } from '@components/v2/helpers';
 * 	import { faSearch } from '@fortawesome/pro-solid-svg-icons';
 * 	import { Icon, IconButton } from '@material-ui/core';
 *
 * 	<Icon fontSize='small'>{faIcon(faSearch)}</Icon>;
 * 	<IconButton size='small'>{faIcon(faSearch)}</IconButton>;
 */
export function faIcon(icon) {
	return (
		<Icon
			css={`
				display: flex; // HACK
				align-items: center;
				justify-content: center;
			`}
		>
			<FontAwesomeIcon
				css={`
					font-size: calc(1em - 4px);
				`}
				icon={icon}
			/>
		</Icon>
	);
}

// babel typescript doesn't support this yet :(, TODO upgrade plugin
// type IncludeProps<Props extends Record<string, any>, Prefix extends string> = {
// 	// @ts-ignore
// 	[Key in keyof Props as `${Prefix}${Capitalize<Key>}`]: Props[Key];
// };

// HACK this is all a hack to support extra colors
// TODO unify all tooltips props under the same names, picking `title` and `placement` here out of material-ui tooltip component props
// when making the change typescript will help
// export type TooltipProps = IncludeProps<Pick<MUTooltipProps, 'title' | 'placement' | 'enterDelay'>, 'tooltip'>; // unsuported by typescript
export interface TooltipProps {
	tooltipTitle?: MUTooltipProps['title'];
	tooltipPlacement?: MUTooltipProps['placement'];
	tooltipEnterDelay?: MUTooltipProps['enterDelay'];
}

export interface DisabledTooltipProps {
	disabled?: string | boolean | NonNullable<React.ReactNode>;
}

export const TooltipWrapper = forwardRef(function TooltipWrapper(
	{
		children,
		tooltipTitle,
		tooltipPlacement = 'bottom',
		tooltipEnterDelay,
	}: { children: React.ReactNode } & TooltipProps,
	ref
) {
	if (tooltipTitle) {
		return (
			<Tooltip ref={ref} title={tooltipTitle} placement={tooltipPlacement} enterDelay={tooltipEnterDelay}>
				{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later */}
				{/* @ts-expect-error */}
				{children}
			</Tooltip>
		);
	}
	// fragment is useful here, this allows passing string and other literals that would otherwise fail
	// eslint-disable-next-line react/jsx-no-useless-fragment
	return <>{children}</>;
});

export function withTooltip<P>(Component: React.ElementType<P>) {
	function TooltippedComponent(
		{ tooltipTitle, tooltipPlacement, tooltipEnterDelay, ...props }: P & TooltipProps,
		ref
	) {
		return (
			<TooltipWrapper
				tooltipTitle={tooltipTitle}
				tooltipPlacement={tooltipPlacement}
				tooltipEnterDelay={tooltipEnterDelay}
			>
				{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later */}
				{/* @ts-expect-error */}
				<Component ref={ref} {...props} />
			</TooltipWrapper>
		);
	}
	return addHOCName(forwardRef(TooltippedComponent), 'withTooltip', Component);
}

/** HOC for passing tooltip title in the disabled property */
export function withDisabledTooltip<P extends { disabled?: boolean } & TooltipProps>(
	Component: React.ComponentType<P>
) {
	function TooltippedComponent({ disabled, ...props }: Assign<P, DisabledTooltipProps>, ref) {
		if (!(typeof disabled === 'boolean' || _.isNull(disabled) || _.isUndefined(disabled))) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
			// @ts-expect-error
			return <Component ref={ref} disabled {...props} tooltipTitle={disabled} />;
		}
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		return <Component ref={ref} disabled={disabled} {...props} />;
	}
	return addHOCName(forwardRef(TooltippedComponent), 'withDisabledTooltip', Component);
}

/**
 * Hack for tooltips on disabled components
 *
 * @see [SO question](https://stackoverflow.com/questions/61115913/is-it-possible-to-render-a-tooltip-on-a-disabled-material-ui-button-within-a)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
function adjustDisabledProps<P extends { disabled?: boolean; component?: any; onClick?: any }>({
	disabled,
	onClick,
	component,
	...props
}: P): P {
	const adjustedButtonProps = {
		disabled,
		component: disabled ? 'div' : component,
		onClick: disabled ? undefined : onClick,
	};
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	return { ...props, ...adjustedButtonProps };
}

/**
 * HACK for tooltips on disabled components
 *
 * @see [SO question](https://stackoverflow.com/questions/61115913/is-it-possible-to-render-a-tooltip-on-a-disabled-material-ui-button-within-a)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function withPointerEvents<P extends { disabled?: boolean; component?: any; onClick?: any }>(
	Component: React.ComponentType<P>
) {
	function CustomComponent(props: P, ref) {
		return <Component ref={ref} {...adjustDisabledProps(props)} />;
	}
	const WithStyles = withStyles({
		root: {
			'&.Mui-disabled': {
				pointerEvents: 'auto',
			},
		},
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
	})(forwardRef(CustomComponent));
	return addHOCName(WithStyles, 'withPointerEvents', Component);
}

const customColors = ['warning', 'error', 'purple'] as const;

export type CustomColorsProps = {
	color?: 'inherit' | 'default' | 'primary' | 'secondary' | 'warning' | 'error' | 'purple';
};

/** Allows using more colors from the theme palette */
export function withCustomColors<P extends { color?: string }>(Component: React.ComponentType<P>) {
	function CustomComponent({ color, ...props }: Assign<P, CustomColorsProps>, ref) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		if (color && customColors.includes(color as any)) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			const className = classnames(!(props as any).disabled && styles[color], (props as any).className);
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
			// @ts-expect-error
			return <Component ref={ref} color='primary' {...props} className={className} />;
		}
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		return <Component ref={ref} color={color as P['color']} {...props} />;
	}
	return addHOCName(forwardRef(CustomComponent), 'withCustomColors', Component);
}

export function iconAdornment(icon, position: 'start' | 'end' = 'end') {
	return (
		<InputAdornment position={position}>
			<span
				css={`
					font-size: 1rem; // HACK: do it right
					margin-left: 0.5rem;
					margin-right: 0.5rem;
				`}
			>
				{faIcon(icon)}
			</span>
		</InputAdornment>
	);
}

export function useGetColor() {
	const theme = useTheme();
	return useCallback((color) => theme?.palette?.[color]?.main, [theme?.palette]);
}

export function getMaxZIndex() {
	return Math.max(
		...Array.from(document.querySelectorAll('body *'), (el) =>
			parseFloat(window.getComputedStyle(el).zIndex)
		).filter((zIndex) => !Number.isNaN(zIndex) && zIndex !== 9999),
		0
	);
}
