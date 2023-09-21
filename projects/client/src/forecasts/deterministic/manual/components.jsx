import { KeyboardDatePicker } from '@material-ui/pickers';
import styled from 'styled-components';

import { NumberField as ReactNumberField } from '@/helpers/inputFields';

import { ControlFieldContainer, ControlFieldLabel } from './layout';

const NumberField = styled(ReactNumberField)`
	flex-grow: 1;
	.MuiInputBase-root {
		font-size: 0.75rem;
	}
	.Mui-error.MuiInput-underline {
		&.Mui-focused,
		&:hover {
			&::before {
				display: none;
			}
			&::after {
				border-bottom-width: 3px;
			}
		}
	}
	.MuiInput-underline.Mui-focused {
		&::after {
			border-bottom-width: 3px;
		}
	}
`;

const DateField = styled(KeyboardDatePicker)`
	flex-grow: 1;
	.MuiInputAdornment-positionEnd {
		display: none;
	}
`;

const ManualNumberFieldContainer = styled(ControlFieldContainer)`
	align-items: baseline;
`;

const ManualNumberField = (props) => {
	// HACK: used for additional field for now
	const { addComponent, label, param, ...rest } = props;
	return (
		<ManualNumberFieldContainer>
			<ControlFieldLabel small>{`${label}:`}</ControlFieldLabel>
			<NumberField id={param} clearErrorOnBlur name={param} rightIconStateful={false} {...rest} />
			{addComponent}
		</ManualNumberFieldContainer>
	);
};

const ManualDateField = (props) => {
	const { label, param, ...rest } = props;
	return (
		<ControlFieldContainer>
			<ControlFieldLabel small>{`${label}:`}</ControlFieldLabel>
			<DateField
				css={`
					.MuiInputBase-root {
						font-size: 0.75rem;
					}
				`}
				id={param}
				name={param}
				format='MM/dd/yyyy'
				open={false}
				// eslint-disable-next-line consistent-return
				onKeyDown={(ev) => {
					if (ev.key === 'Enter') {
						ev.target.blur();
						return false;
					}
				}}
				keyboardIcon={null} // HACKY, and does not remove the circle around the calendar Icon
				size='small'
				maxDate='2200-01-01' // See segmentParent.dateIdxLarge
				minDate='1900-01-01' // See segmentParent.dateIdxSmall
				{...rest}
			/>
		</ControlFieldContainer>
	);
};

export { ManualDateField, ManualNumberField };
