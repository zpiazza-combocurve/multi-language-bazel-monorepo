import { faMinus, faPlus } from '@fortawesome/pro-regular-svg-icons';
import { ListItem } from '@material-ui/core';
import _ from 'lodash-es';
import { useCallback, useEffect, useState } from 'react';
import styled, { css } from 'styled-components';

import { useGetter } from '@/components/hooks';
import { IconButton, TextField as MuiTextField } from '@/components/v2';
import { ifProp } from '@/helpers/styled';

type AxisValue = number | 'all';

interface AxisItem {
	label: string;
	value: AxisValue;
}

interface AxisControlSelectionProps {
	addPaddingBottom?: boolean;
	isItem?: boolean;
	items: AxisItem[];
	onBlur?: () => void;
	onChange: (value: AxisValue) => void;
	onFocus?: () => void;
	rotateBottom?: boolean;
	rotateTop?: boolean;
	scaleToCalc?: (value: number) => number;
	scaleToView?: (value: number) => number;
	value: AxisValue;
}

const rotateTopStyle = css<{ addPaddingBottom?: boolean }>(
	({ addPaddingBottom }) => `
	position: absolute;
	transform-origin: 0 0;

	// origin is from the top-left, to displace from the top need to adjust for the full width
	${
		addPaddingBottom
			? 'transform: rotate(-90deg) translateX(calc(-75% + 0.5rem));'
			: 'transform: rotate(-90deg) translateX(-75%);'
	}
`
);

const rotateBottomStyle = css<{ addPaddingBottom?: boolean }>(
	({ addPaddingBottom }) => `
	position: absolute;
	transform-origin: 0 0;
	transform: rotate(
		-90deg
	); // origin is from the top-left, to displace from the bottom, we need 50% of the height and 50% of the width

	${addPaddingBottom ? 'top: calc(100% - 1rem);' : 'top: 100%;'}
`
);

const ControlsContainer = styled.div<{ addPaddingBottom?: boolean; rotateBottom?: boolean; rotateTop?: boolean }>`
	align-items: center;
	display: flex;
	justify-content: space-between;
	${ifProp('rotateBottom', rotateBottomStyle)}
	${ifProp('rotateTop', rotateTopStyle)}
`;

const ControlsLabel = styled.span<{ isItem?: boolean; wide?: boolean }>`
	margin: 0 0.25rem;
	text-align: center;

	// 2.75rem supports up to 6 digits; 4.5rem supports up to 9 digits
	width: ${ifProp('wide', '4.5rem', '2.75rem')};

	${ifProp('isItem', 'width: 5rem;')}
`;

const ListItemLabelContainer = styled.div`
	align-items: center;
	column-gap: 1rem;
	display: flex;
	justify-content: space-between;
	padding: 0.5rem 0;
	width: 100%;
`;

const TextField = styled(MuiTextField)`
	.MuiInputBase-root {
		font-size: 0.75rem;
	}
`;

const ScaleIconButton = styled(IconButton)`
	padding: 1px;
`;

// this is to prevent the current focused element from losing focus, e.g. the manual chart in manual editing
const handleMouseDown = (e) => e.preventDefault();

const AxisControlSelection = ({
	addPaddingBottom,
	isItem,
	items: itemsIn,
	onBlur,
	onChange,
	onFocus,
	rotateBottom,
	rotateTop,
	scaleToCalc = _.identity,
	scaleToView = _.identity,
	value,
}: AxisControlSelectionProps) => {
	const [fieldValue, setFieldValue] = useState<string | number>('all');

	const getItems = useGetter(itemsIn);
	const getValue = useGetter(value);

	const select = useCallback(
		(dir) => {
			// assume 'all' is always provided with at least 2 additional numbers in the list
			const items = getItems();
			const value = getValue();

			// field value is all
			// go up - loop to lowest value
			// go down - go down 1
			if (value === 'all') {
				return onChange(items[dir > 0 ? 0 : items.length - 2].value);
			}

			// @ts-expect-error TODO fix: cannot compare string|number to number
			const foundIdx = items.findIndex((item) => item.value >= value);

			// field value is > maximum value of item list
			// go up - go to all
			// go down - go to all
			if (foundIdx === -1) {
				return onChange('all');
			}

			// field value is equal to a value in the items array
			// go up - go to the next value in the array
			// go down - go to the previous value in the array
			if (value === items[foundIdx].value) {
				if (foundIdx === 0) {
					return onChange(dir > 0 ? items[1].value : 'all');
				}
				return onChange(items[dir > 0 ? foundIdx + 1 : foundIdx - 1].value);
			}

			// field value is less than the minimum value in the array
			// go up - go to the minimum value
			// go down - go to all
			if (foundIdx === 0) {
				return onChange(dir > 0 ? items[0].value : 'all');
			}

			// field value is in between two values in the items array
			// go up - go to the closest value larger than the current value
			// go down - go to the closest value less than the current value
			return onChange(items[dir > 0 ? foundIdx : foundIdx - 1].value);
		},
		[getItems, getValue, onChange]
	);

	const applyFieldValue = useCallback(
		(value) => {
			const currentValue = getValue();
			const items = getItems();
			const parsedNumber = Number(value);

			if (currentValue === parsedNumber) {
				return;
			}
			if (Number.isFinite(parsedNumber)) {
				// disallow negative and 0 values
				onChange(parsedNumber <= 0 ? items[0].value : scaleToCalc(parsedNumber));
			} else {
				onChange('all');
			}
		},
		[getItems, getValue, onChange, scaleToCalc]
	);

	const selectNext = useCallback(() => select(1), [select]);
	const selectPrevious = useCallback(() => select(-1), [select]);

	useEffect(() => {
		setFieldValue(typeof value === 'number' ? _.round(scaleToView(value), 2) : value);
	}, [scaleToView, value]);

	return (
		<ControlsContainer addPaddingBottom={addPaddingBottom} rotateBottom={rotateBottom} rotateTop={rotateTop}>
			<ScaleIconButton onClick={selectPrevious} size='small' onMouseDown={handleMouseDown}>
				{faMinus}
			</ScaleIconButton>

			<ControlsLabel isItem={isItem} wide={fieldValue?.toString().length > 6}>
				<TextField
					fullWidth={false}
					inputProps={{ style: { textAlign: 'center' } }}
					onFocus={onFocus}
					onBlur={(ev) => {
						applyFieldValue(ev.target.value);
						onBlur?.();
					}}
					onChange={(ev) => setFieldValue(ev.target.value)}
					onKeyDown={(ev) => {
						if (ev.key === 'Enter') {
							(ev.target as HTMLElement)?.blur();
						}
					}}
					size='small'
					value={fieldValue}
				/>
			</ControlsLabel>

			<ScaleIconButton onClick={selectNext} size='small' onMouseDown={handleMouseDown}>
				{faPlus}
			</ScaleIconButton>
		</ControlsContainer>
	);
};

function AxisControlSelectionItem({ label, ...rest }: AxisControlSelectionProps & { label: string }) {
	return (
		<ListItem>
			<ListItemLabelContainer>
				{label}
				<AxisControlSelection {...rest} isItem />
			</ListItemLabelContainer>
		</ListItem>
	);
}

export default AxisControlSelection;
export { AxisValue, AxisItem, AxisControlSelectionItem };
