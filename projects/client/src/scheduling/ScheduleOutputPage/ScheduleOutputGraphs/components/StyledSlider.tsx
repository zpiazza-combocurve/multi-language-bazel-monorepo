import { Box, Slider, SliderTypeMap, useTheme } from '@material-ui/core';

export const StyledSlider = (props: SliderTypeMap['props']) => {
	const theme = useTheme();

	const backgroundBox = theme.palette.type === 'dark' ? theme.palette.grey[800] : theme.palette.grey[300];
	const backgroundRail = theme.palette.type === 'dark' ? theme.palette.grey[700] : theme.palette.grey[300];
	const backgroundMark = theme.palette.type === 'dark' ? theme.palette.grey[600] : theme.palette.grey[600];
	const backgroundTooltip = theme.palette.type === 'dark' ? theme.palette.grey[600] : theme.palette.grey[300];

	return (
		<Box
			css={`
				background: ${backgroundBox};
				padding: 0 2rem;
			`}
		>
			<Slider
				css={`
					text-align: center;
					span {
						font-size: 0.6rem;
					}
					.MuiSlider-track,
					.MuiSlider-thumb,
					.MuiSlider-mark {
						background: ${backgroundMark};
					}
					.MuiSlider-mark {
						width: 6px;
						height: 6px;
						top: 50%;
						transform: translateY(-50%);
					}
					.MuiSlider-rail {
						background-color: ${backgroundRail};
					}
					.MuiSlider-thumb:hover,
					.MuiSlider-active {
						box-shadow: 0px 0px 0px 8px rgba(255, 255, 255, 0.16);
					}
					.MuiSlider-markLabel {
						font-size: 0.65rem;
					}
					.MuiSlider-valueLabel > span {
						background: ${backgroundTooltip};
					}
				`}
				{...props}
			/>
		</Box>
	);
};
