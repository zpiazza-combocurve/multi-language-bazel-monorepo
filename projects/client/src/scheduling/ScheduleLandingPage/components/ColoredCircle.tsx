// extracted from misc folder
import styled from 'styled-components';

const SIZE = '0.7rem';

/**
 * @example
 * 	<ColoredCircle $color='blue' $size='1rem' />; // size is optional
 */
const ColoredCircle = styled.div<{ $color?: string; $size?: string; $disableMargin?: boolean }>(
	({ $color, $size = SIZE, $disableMargin }) => `
	${!$disableMargin && 'margin-right: 0.5rem;'};
	min-height: ${$size};
	min-width: ${$size};
	height: ${$size};
	width: ${$size};
	background-color: ${$color ?? 'transparent'};
	border-radius: 50%;
  border: ${$color ? '' : 'solid gray 1px'};
`
);

export default ColoredCircle;
