import 'react-datepicker/dist/react-datepicker.css';

import { faCalendarAlt } from '@fortawesome/pro-regular-svg-icons';
import classnames from 'classnames';
import DatePicker, { ReactDatePickerProps } from 'react-datepicker';
import { TextField, TextFieldProps } from 'react-md';
import styled, { createGlobalStyle, css } from 'styled-components';

import { makeLocal, makeUtc } from '@/helpers/date';
import { theme } from '@/helpers/styled';

import { FontIcon } from './FontIcon';

const CustomDatePickerInput = ({ onChange, ...props }: Assign<TextFieldProps, { onChange?: (ev) => void }>) => (
	<TextField {...props} onChange={(_, ev) => onChange?.(ev)} />
);

const containerStyle = ({ colorDisabled, color, background, hover, selected }) => css`
	& {
		color: ${color};
		background-color: ${background};
	}
	.react-datepicker__header {
		color: ${color};
		background-color: ${background};
	}
	.react-datepicker__day--keyboard-selected,
	.react-datepicker__month-text--keyboard-selected,
	.react-datepicker__quarter-text--keyboard-selected,
	.react-datepicker__year-text--keyboard-selected {
		color: ${color};
	}
	.react-datepicker__current-month,
	.react-datepicker-time__header,
	.react-datepicker-year-header,
	.react-datepicker__day-name,
	.react-datepicker__day,
	.react-datepicker__time-name {
		color: ${color};
	}
	.react-datepicker__navigation--previous {
		border-right-color: ${color};
	}
	.react-datepicker__navigation--next {
		border-left-color: ${color};
	}
	// hover color
	.react-datepicker__day:hover,
	.react-datepicker__month-text:hover,
	.react-datepicker__quarter-text:hover {
		background-color: ${hover};
	}
	// selected color
	.react-datepicker__day--keyboard-selected,
	.react-datepicker__month-text--keyboard-selected,
	.react-datepicker__quarter-text--keyboard-selected,
	.react-datepicker__day--selected,
	.react-datepicker__day--in-selecting-range,
	.react-datepicker__day--in-range,
	.react-datepicker__month-text--selected,
	.react-datepicker__month-text--in-selecting-range,
	.react-datepicker__month-text--in-range,
	.react-datepicker__quarter-text--selected,
	.react-datepicker__quarter-text--in-selecting-range,
	.react-datepicker__quarter-text--in-range {
		background-color: ${selected};
	}
	.react-datepicker__day--disabled,
	.react-datepicker__month-text--disabled,
	.react-datepicker__quarter-text--disabled {
		color: ${colorDisabled};
	}
`;

const CalendarContainer = styled.div`
	${containerStyle({
		color: theme.textColor,
		colorDisabled: theme.textColorDisabled,
		background: theme.background,
		hover: 'var(--grey-color-opaque)',
		selected: 'var(--grey-color-opaque)',
	})}
`;

const ReactDatePickerWrapperStyles = createGlobalStyle`
	.__inpt_date_picker.fullWidth {
		width: 100%;
	}
	.react-datepicker-popper {
		z-index: ${({ theme }) => theme.zIndex.modal};
	}
`;

// https://reactdatepicker.com/
// https://github.com/Hacker0x01/react-datepicker

function isValidDate(d) {
	// https://stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript#1353711
	return d instanceof Date && !Number.isNaN(d.getTime());
}

const forceDate = (value: string | undefined | Date | null | number) => {
	const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
	return isValidDate(date) ? date : null;
};

type DatePickerMdProps = Assign<
	TextFieldProps,
	Assign<
		Pick<
			ReactDatePickerProps,
			| 'portalId'
			| 'value'
			| 'className'
			| 'dateFormat'
			| 'minDate'
			| 'maxDate'
			| 'onBlur'
			| 'filterDate'
			| 'showMonthYearPicker'
			| 'showTwoColumnMonthYearPicker'
			| 'autoFocus'
			| 'disabled'
			| 'selected'
			| 'onCalendarClose'
		>,
		{
			wrapperClassName?: string;
			placeholder?: string;
			asUtc?: boolean;
			icon?: boolean;
			fullWidth?: boolean;
			onChange?: (newValue: Date | null | undefined) => void;
		}
	>
>;

/**
 * Better behaved react-datepicker
 *
 * @deprecated Use material-ui version
 */
export function DatePickerMD({
	placeholder = 'MM/DD/YYYY',
	// other props
	asUtc = false, // parse date as utc
	icon = true, // show icon by default
	// datepicker props
	dateFormat = ['MM/dd/yyyy', 'MM-dd-yyyy'],
	className = '',
	wrapperClassName = '',
	// parse = undefined, // actually not used?
	value = undefined,
	onChange: originalOnChange,
	minDate = new Date('1/1/1900'),
	maxDate,
	onBlur = undefined,
	filterDate,
	showMonthYearPicker,
	showTwoColumnMonthYearPicker,
	autoFocus,
	disabled,
	selected,
	// text field props
	fullWidth,
	portalId,
	onKeyDown,
	...props
}: DatePickerMdProps) {
	const onChange = (inputDate) => {
		const parsedDate = asUtc ? makeUtc(inputDate) : makeLocal(inputDate);
		originalOnChange?.(parsedDate);
	};

	const parsedValue = forceDate(value ?? selected);

	return (
		<>
			<DatePicker
				{...{
					autoFocus,
					className,
					onChange,
					dateFormat,
					minDate,
					maxDate,
					placeholder,
					// parse, // not needed?
					filterDate,
					showMonthYearPicker,
					showTwoColumnMonthYearPicker,
					portalId,
				}}
				onKeyDown={onKeyDown}
				disabled={disabled}
				selected={parsedValue}
				showPopperArrow={false}
				calendarContainer={CalendarContainer}
				placeholderText={placeholder}
				wrapperClassName={classnames(wrapperClassName, '__inpt_date_picker', { fullWidth })} // https://github.com/Hacker0x01/react-datepicker/issues/2099#issuecomment-704194903
				onBlur={onBlur}
				customInput={
					<CustomDatePickerInput
						lineDirection='center'
						rightIcon={
							icon ? (
								<FontIcon small rightIcon inherit>
									{faCalendarAlt}
								</FontIcon>
							) : undefined
						}
						{...{ fullWidth }}
						{...props}
					/>
				}
			/>
			<ReactDatePickerWrapperStyles />
		</>
	);
}
