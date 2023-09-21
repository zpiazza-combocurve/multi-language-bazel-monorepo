import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Popper from '@material-ui/core/Popper';
import { useRef, useState } from 'react';
import { ColorResult, SketchPicker, SketchPickerProps } from 'react-color';
import styled from 'styled-components';

import ColoredCircle from '@/components/misc/ColoredCircle';
import TextField, { TextFieldProps } from '@/components/v2/TextField';

type ColorPickerFieldProps = Assign<
	TextFieldProps,
	Pick<SketchPickerProps, 'presetColors'> & { value?: string; onChange(value: string): void } & {
		displayColorHint?: boolean;
	}
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const Container = styled.div<{ $fullWidth?: any }>`
	${({ $fullWidth }) => $fullWidth && `width: 100%;`}
`;

function ColorPickerField({ className, style, fullWidth, ...props }: ColorPickerFieldProps) {
	const { displayColorHint, value, presetColors, ...inputProps } = props;
	const { onChange } = props;
	const [visible, setVisible] = useState(false);

	const handleChange = (newColor: ColorResult) => {
		onChange(newColor.hex);
	};

	const handleClose = () => {
		setVisible(false);
	};

	const ref = useRef();

	return (
		<ClickAwayListener onClickAway={handleClose}>
			<Container className={className} style={style} $fullWidth={fullWidth}>
				{visible && (
					<Popper open anchorEl={ref.current} placement='bottom' css={{ zIndex: 10000 }}>
						<SketchPicker color={value} disableAlpha presetColors={presetColors} onChange={handleChange} />
					</Popper>
				)}
				<TextField
					ref={ref}
					onFocus={() => setVisible(true)}
					InputProps={{
						readOnly: true,
						endAdornment: displayColorHint ? <ColoredCircle $color={value} $size='1.5rem' /> : undefined,
					}}
					type='text'
					{...inputProps}
					fullWidth={fullWidth}
					value={value}
					onChange={(ev) => onChange(ev.target.value)}
				/>
			</Container>
		</ClickAwayListener>
	);
}

export default ColorPickerField;
