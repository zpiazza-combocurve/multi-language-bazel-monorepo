import { Slider, SliderProps, Typography, TypographyProps } from '@material-ui/core';
import _ from 'lodash';
import styled from 'styled-components';

import { ifProp } from '@/helpers/styled';

const Container = styled.div<{ adjustSliderSize?: boolean }>`
	align-items: center;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	width: 100%;

	// TODO: check if this is necessary
	${ifProp('adjustSliderSize', 'padding-right: 1.4rem;')}
`;

const MinMaxContainer = styled.div`
	display: flex;
	justify-content: space-between;
	width: 100%;
`;

const MinMaxLabel = styled.span`
	font-size: 0.75rem;
`;

export type SliderFieldProps = SliderProps &
	Pick<TypographyProps, 'variant'> & {
		adjustSliderSize?: boolean;
		fullWidth?: boolean;
		label?: string;
		minMaxLabel?: boolean;
	};

/**
 * Wrapper over `Slider` from material-ui:
 *
 * - Adds `label` property
 * - Adds `adjustSliderSize` property to fix slider overflow issues
 * - Adds `fullWidth` property to expand the field's with to 100%
 * - Adds `minMaxLabel` property. When enabled, it displays the min and max of the scale below the slider. Requires min
 *   and max properties.
 * - Picks `variant` property from Typography. The input value affects the typogrpahy of the label
 *
 * @example
 * 	<SliderField label='Slider with label' adjustSliderSize {...restOfSliderProps} />;
 */
export default function SliderField({
	adjustSliderSize,
	className,
	fullWidth,
	label,
	max,
	min,
	minMaxLabel,
	scale = _.identity,
	style,
	variant,
	...props
}: SliderFieldProps) {
	if (!label) {
		if (adjustSliderSize) {
			return (
				<Container className={className} style={style}>
					<Slider {...props} />
				</Container>
			);
		}
		return <Slider {...props} className={className} style={style} />;
	}

	return (
		<div
			css={{
				display: 'flex',
				flexDirection: 'column',
				width: fullWidth ? '100%' : undefined,
			}}
			className={className}
			style={style}
		>
			<Typography variant={variant} gutterBottom>
				{label}
			</Typography>

			<Container adjustSliderSize={adjustSliderSize}>
				<Slider {...props} min={min} max={max} scale={scale} />
				{minMaxLabel && (
					<MinMaxContainer>
						{Number.isFinite(min) && <MinMaxLabel>{scale(Number(min))}</MinMaxLabel>}
						{Number.isFinite(max) && <MinMaxLabel>{scale(Number(max))}</MinMaxLabel>}
					</MinMaxContainer>
				)}
			</Container>
		</div>
	);
}
