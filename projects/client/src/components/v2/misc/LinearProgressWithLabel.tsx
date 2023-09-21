// see https://v4.mui.com/components/progress/
import { Box, LinearProgress, LinearProgressProps, Typography } from '@material-ui/core';
import _ from 'lodash';
import { CSSProp } from 'styled-components';

type LinearProgressWithLabelProps = LinearProgressProps & { value: number; labelAdjacent?: boolean };

function LinearProgressWithLabel({
	className,
	style,
	value,
	labelAdjacent = false,
	...props
}: LinearProgressWithLabelProps) {
	const labelStyle = labelAdjacent
		? {
				display: 'flex',
				justifyContent: 'flex-end',
				minWidth: '40px',
		  }
		: ({
				position: 'fixed',
				top: '0.4rem',
				transition: 'left 0.4s linear',
				fontSize: '0.75rem',
				transform: 'translateX(-100%)',
		  } as CSSProp);
	return (
		<Box display='flex' alignItems='center' style={style} className={className}>
			<LinearProgress css={{ width: '100%' }} variant='determinate' value={value} {...props} />
			<Typography css={labelStyle} style={{ left: `${value}%` }} variant='body2' color='primary'>{`${_.round(
				value,
				1
			)}%`}</Typography>
		</Box>
	);
}
export default LinearProgressWithLabel;
