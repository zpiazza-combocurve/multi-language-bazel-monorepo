import { ClickAwayListener, Popper } from '@material-ui/core';
import { ICellEditor, ICellEditorParams } from 'ag-grid-community';
import { ForwardedRef, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ColorResult, SketchPicker } from 'react-color';
import styled from 'styled-components';

import ColoredCircle from '../../ColoredCircle';

const Container = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100%;
	margin-left: -20px;
	margin-top: -2px;
`;

function ColorPickerEditor(
	props: ICellEditorParams & { presetColors: string[] | undefined },
	ref: ForwardedRef<ICellEditor>
) {
	const { value: initialValue, presetColors } = props;

	const coloredCircleRef = useRef<HTMLInputElement>(null);

	const [value, setValue] = useState(initialValue);
	const [visible, setVisible] = useState(false);

	useImperativeHandle(ref, () => {
		return {
			getValue: () => value,
		};
	});

	const handleChange = (newColor: ColorResult) => {
		setValue(newColor.hex);
	};

	const handleClose = () => {
		setVisible(false);
		props.stopEditing();
	};

	useEffect(() => {
		coloredCircleRef.current?.click();
	}, []);

	return (
		<ClickAwayListener onClickAway={handleClose}>
			<Container>
				<Popper open={visible} anchorEl={coloredCircleRef.current} placement='bottom' css={{ zIndex: 10000 }}>
					<SketchPicker color={value} disableAlpha presetColors={presetColors} onChange={handleChange} />
				</Popper>
				<ColoredCircle ref={coloredCircleRef} $size='20px' $color={value} onClick={() => setVisible(true)} />
			</Container>
		</ClickAwayListener>
	);
}

export default forwardRef(ColorPickerEditor);
