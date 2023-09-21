import { faInfoCircle } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip as MUITooltip, withStyles } from '@material-ui/core';
import { forwardRef } from 'react';
import { injectTooltip } from 'react-md';
import styled from 'styled-components';

// Some wrapped components aren't class components or pure components and require a div for a valid ref;
// refer to: https://stackoverflow.com/questions/57527896/material-ui-tooltip-doesnt-display-on-custom-component-despite-spreading-props
/** @deprecated Use material-ui */
export const MuiTooltipContainer = styled.div``;

const TooltipContainer = styled.div`
	position: relative;
	display: inline-block;
`;

// https://react-md.dev/v1/components/tooltips#custom-examples
const Tooltip = injectTooltip(
	forwardRef((props, ref) => (
		<TooltipContainer ref={ref}>
			{props.tooltip}
			{props.children}
		</TooltipContainer>
	))
);

/**
 * @deprecated Use material-ui
 * @template P
 * @param {React.ComponentType<P>} Component
 */
export const tooltipped = (Component) =>
	/**
	 * @param {P & {
	 * 	tooltipLabel?: string;
	 * 	tooltipPosition?: string;
	 * 	className?: string;
	 * 	style?: React.CSSProperties;
	 * }} props
	 */
	function Tooltipped({ className, style, tooltipLabel, tooltipPosition, ...props }) {
		if (tooltipLabel) {
			return (
				<Tooltip {...{ tooltipLabel, tooltipPosition, className, style }}>
					<Component {...props} />
				</Tooltip>
			);
		}
		return <Component className={className} style={style} {...props} />;
	};

export const LargerMUITooltip = withStyles(() => ({
	tooltip: {
		fontSize: 16,
		maxWidth: '500px',
	},
}))(MUITooltip);

const LabelContainer = styled.span`
	flex: 1;
	display: flex;
	align-items: center;
	white-space: nowrap;
	& > *:not(:first-child) {
		margin-left: 0.5rem;
	}
`;

/** @deprecated See '/components/v2/helpers'.withTooltip */
export const muiTooltiped = (Component) =>
	/** @param {any} props */
	function Tooltipped({ labelTooltip = undefined, placement = 'bottom', enterDelay = 500, ...props }) {
		if (labelTooltip) {
			return (
				<LargerMUITooltip title={labelTooltip} placement={placement} enterDelay={enterDelay}>
					<MuiTooltipContainer>
						<Component {...props} />
					</MuiTooltipContainer>
				</LargerMUITooltip>
			);
		}
		return <Component {...props} />;
	};

/** @deprecated Use material-ui */
export const InfoTooltip = muiTooltiped(({ fontSize = 'inherit', className }) => (
	<div
		css={`
			cursor: help;
			font-size: ${fontSize};
		`}
		className={className}
	>
		<FontAwesomeIcon style={{ width: '1em' }} icon={faInfoCircle} />
	</div>
));

/** @deprecated Use '@/components/v2/misc'.InfoTooltipWrapper */
export const TooltipedLabel = ({ labelTooltip, children }) => {
	return (
		<LabelContainer>
			{labelTooltip ? (
				<>
					<InfoTooltip labelTooltip={labelTooltip} />
					<span>{children}</span>
				</>
			) : (
				children
			)}
		</LabelContainer>
	);
};
