// extracted from scenario page
import styled from 'styled-components';

const SIZE = '0.7rem';

/**
 * @example
 * 	<ColoredCircle $color='blue' $size='1rem' />; // size is optional
 */
const ColoredCircle = styled.div<{ $color?: string; $size?: string; $disableMargin?: boolean }>(
	({ $color, $size = SIZE, $disableMargin, theme }) => `
	font-size: 0.8rem;
	text-align: center;
	vertical-align: middle;
	line-height: 0.9rem;
	color: ${theme.palette.getContrastText($color || 'transparent')};
	font-weight: bold;
	display: ${$color ? 'inline-block' : 'hidden'};
	${!$disableMargin && 'margin-right: 0.5rem;'};
	min-height: ${$size};
	min-width: ${$size};
	height: ${$size};
	width: ${$size};
	background-color: ${$color};
	border-radius: 50%;
`
);

export default ColoredCircle;
