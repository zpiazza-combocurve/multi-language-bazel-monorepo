import SvgIcon, { type SvgIconProps } from '@mui/material/SvgIcon';
import { forwardRef } from 'react';

type FontAwesomeSvgIconProps = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	children: any;
} & Omit<SvgIconProps, 'children'>;

/**
 * Fontawesome wrapper to play nice with @mui/material
 *
 * @example
 * 	import { faEllipsisV } from '@fortawesome/free-solid-svg-icons/faEllipsisV';
 * 	import FontAwesomeSvgIcon from '@/components/v5/FontAwesomeSvgIcon';
 *
 * 	<FontAwesomeSvgIcon>{faEllipsisV}</FontAwesomeSvgIcon>;
 *
 * @see https://mui.com/material-ui/icons/#font-awesome
 */
const FontAwesomeSvgIcon = forwardRef<SVGSVGElement, FontAwesomeSvgIconProps>((props, ref) => {
	const { children: icon, ...svgIconProps } = props;

	const {
		icon: [width, height, , , svgPathData],
	} = icon;

	return (
		<SvgIcon ref={ref} viewBox={`0 0 ${width} ${height}`} {...svgIconProps}>
			{typeof svgPathData === 'string' ? (
				<path d={svgPathData} />
			) : (
				/**
				 * A multi-path Font Awesome icon seems to imply a duotune icon. The 0th path seems to be the faded
				 * element (referred to as the "secondary" path in the Font Awesome docs) of a duotone icon. 40% is the
				 * default opacity.
				 *
				 * @see https://fontawesome.com/how-to-use/on-the-web/styling/duotone-icons#changing-opacity
				 */
				svgPathData.map((d: string, i: number) => <path key={i} style={{ opacity: i === 0 ? 0.4 : 1 }} d={d} />)
			)}
		</SvgIcon>
	);
});

export default FontAwesomeSvgIcon;
