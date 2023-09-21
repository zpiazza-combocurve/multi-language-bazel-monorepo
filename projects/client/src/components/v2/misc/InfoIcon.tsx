import { faInfoCircle } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { forwardRef } from 'react';
import * as React from 'react';

import { TooltipProps, TooltipWrapper } from '../helpers';

export type InfoIconProps = {
	className?: string;
	iconColor?: string;
	iconFontSize?: string;
	withLeftMargin?: boolean;
	withRightMargin?: boolean;
} & TooltipProps;

function InfoIcon({
	className,
	iconColor,
	iconFontSize,
	tooltipPlacement,
	tooltipTitle,
	withLeftMargin,
	withRightMargin,
}: InfoIconProps) {
	return (
		<TooltipWrapper tooltipPlacement={tooltipPlacement} tooltipTitle={tooltipTitle}>
			<span>
				<FontAwesomeIcon
					css={{
						cursor: 'help',
						marginRight: withRightMargin ? '0.5rem' : undefined,
						marginLeft: withLeftMargin ? '0.5rem' : undefined,
						width: '1em',
						fontSize: iconFontSize,
						color: iconColor,
					}}
					className={className}
					icon={faInfoCircle}
				/>
			</span>
		</TooltipWrapper>
	);
}

export type InfoTooltipWrapperProps = {
	children?: React.ReactNode;
	denseTooltipIcon?: boolean;
	iconColor?: string;
	iconFontSize?: string;
	placeIconAfter?: boolean;
} & TooltipProps;

export function InfoTooltipWrapper({
	children,
	denseTooltipIcon,
	iconColor,
	iconFontSize,
	placeIconAfter,
	tooltipEnterDelay,
	tooltipPlacement,
	tooltipTitle,
}: InfoTooltipWrapperProps) {
	if (tooltipTitle) {
		return (
			<div
				css={`
					display: flex;
					align-items: center;
				`}
			>
				{placeIconAfter && children}
				<InfoIcon
					iconColor={iconColor}
					iconFontSize={iconFontSize}
					tooltipEnterDelay={tooltipEnterDelay}
					tooltipPlacement={tooltipPlacement}
					tooltipTitle={tooltipTitle}
					withLeftMargin={!denseTooltipIcon && placeIconAfter}
					withRightMargin={!denseTooltipIcon && !placeIconAfter}
				/>
				{!placeIconAfter && children}
			</div>
		);
	}
	// eslint-disable-next-line react/jsx-no-useless-fragment -- TODO eslint fix later
	return <>{children}</>;
}

/** @note it might mess layout */
export function withInfoTooltip<P>(Component: React.ComponentType<P>) {
	type TooltippedComponentProps = P & TooltipProps & { denseTooltipIcon?: boolean };
	function TooltippedComponent(
		{ tooltipTitle, tooltipPlacement, tooltipEnterDelay, denseTooltipIcon, ...props }: TooltippedComponentProps,
		ref
	) {
		return (
			<InfoTooltipWrapper
				tooltipTitle={tooltipTitle}
				tooltipPlacement={tooltipPlacement}
				tooltipEnterDelay={tooltipEnterDelay}
				denseTooltipIcon={denseTooltipIcon}
			>
				{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later */}
				{/* @ts-expect-error */}
				<Component ref={ref} {...props} />
			</InfoTooltipWrapper>
		);
	}
	return forwardRef(TooltippedComponent);
}

export default InfoIcon;
