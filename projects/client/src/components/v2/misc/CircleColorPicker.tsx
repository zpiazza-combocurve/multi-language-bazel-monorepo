import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Popper from '@material-ui/core/Popper';
import { useRef, useState } from 'react';
import { ColorResult, SketchPicker, SketchPickerProps } from 'react-color';

import { ColoredCircle } from '@/components/misc';
import { Button } from '@/components/v2';

type CircleColorPickerProps = Pick<SketchPickerProps, 'presetColors'> & {
	value?: string;
	onChange(value: string): void;
};

function CircleColorPicker({ onChange, presetColors, value }: CircleColorPickerProps) {
	const [visible, setVisible] = useState<boolean>(false);

	const handleChange = (newColor: ColorResult) => {
		onChange(newColor.hex);
	};

	const ref = useRef<HTMLInputElement>(null);
	return (
		<ClickAwayListener onClickAway={() => setVisible(false)}>
			<section>
				{visible && (
					<Popper anchorEl={ref.current} open placement='bottom' css={{ zIndex: 10_000 }}>
						<SketchPicker
							css='margin-top: 0.5rem;'
							color={value}
							disableAlpha
							onChange={handleChange}
							presetColors={presetColors}
						/>
					</Popper>
				)}

				<Button
					endIcon={faChevronDown}
					onClick={() => setVisible(true)}
					ref={ref}
					size='small'
					tooltipTitle='Select color'
				>
					<ColoredCircle $color={value} $size='1.5rem' />
				</Button>
			</section>
		</ClickAwayListener>
	);
}

export default CircleColorPicker;
