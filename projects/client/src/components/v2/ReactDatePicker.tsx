import { faCalendar } from '@fortawesome/pro-regular-svg-icons';
import classNames from 'classnames';
import * as React from 'react';
import RDP, { ReactDatePickerProps as OriginalProps } from 'react-datepicker';

import 'react-datepicker/dist/react-datepicker.css';

// do not remove, needed for built-in date picker styles
import styled, { createGlobalStyle, css } from 'styled-components';

import { useSetHotkeyScope } from '@/components/hooks/useHotkey';
import { makeLocal, makeUtc } from '@/helpers/date';
import { theme } from '@/helpers/styled';

import { useFormikField } from '../hooks';
import TextField from './TextField';
import { iconAdornment } from './helpers';

export const containerStyle = ({ colorDisabled, color, background, hover, selected }) => css`
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
	.react-datepicker__time-list-item,
	.react-datepicker__time-name {
		color: ${color};
	}
	.react-datepicker__time-list {
		background-color: ${background};
	}

	.react-datepicker__navigation--previous {
		border-right-color: ${color};
	}
	.react-datepicker__navigation--next {
		border-left-color: ${color};
	}

	// hover color
	.react-datepicker__time-list-item:hover {
		background-color: ${hover} !important;
	}

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

export const CalendarContainer = styled.div`
	${containerStyle({
		color: theme.textColor,
		colorDisabled: theme.textColorDisabled,
		background: theme.background,
		hover: 'var(--grey-color-opaque)',
		selected: 'var(--grey-color-opaque)',
	})}
`;

/** Class to apply to react-date-picker wrapper when input is full width */
const FULL_WIDTH_CLASS = '__inpt_date_pickerfullWidth';

const ReactDatePickerWrapperStyles = createGlobalStyle`
	.${FULL_WIDTH_CLASS} {
		width: 100%;
	}

	.react-datepicker-popper {
		z-index: ${({ theme }) => theme.zIndex.datePicker};
	}
`;

const DEFAULT_DATE_FORMAT = ['MM/dd/yyyy', 'MM-dd-yyyy'];

const INVALID_DATE = 'Invalid Date';

/** Detects `Invalid Date` */
const isInvalidDate = (date) => date instanceof Date && isNaN(date.valueOf());
/** @see https://stackoverflow.com/questions/10589732/checking-if-a-date-is-valid-in-javascript */
const isValid = (date) => date instanceof Date && !isNaN(date.valueOf());

/**
 * Will convert string to date for react-datepicker
 *
 * @note if receives `Invalid Date` it will be converted to `null`
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
function forceDate(date: any) {
	if (date && typeof date === 'string') {
		const newDate = new Date(date);
		if (!isValid(newDate)) return null;
		return newDate;
	}
	if (isInvalidDate(date)) return null;
	return date;
}

export type ReactDatePickerProps = Pick<
	OriginalProps,
	'filterDate' | 'readOnly' | 'portalId' | 'onCalendarClose' | 'onCalendarOpen' | 'onKeyDown'
> & {
	// TODO: check types, this should be in OriginalProps already
	showMonthYearPicker?: boolean;
	showTimeSelect?: boolean;
	dateFormat?: string | string[] | undefined;
	startDate?;
	endDate?;
	selectsStart?;

	/** Hack for well headers type='date' kind='date' */
	asUtc?: boolean;
	selected?: OriginalProps['selected'] | string;
	value?: string;
	onChange: (newValue: Date | null) => void;
	inline?: boolean;
	// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
	format?: (date) => {};
} & Omit<React.ComponentProps<typeof TextField>, 'onChange' | 'value'>;

// TODO Fix Warning: Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?
// possibly https://github.com/Hacker0x01/react-datepicker/issues/862

/**
 * Bridge for react-datepicker + material-ui
 *
 * `react-datepicker` props:
 *
 * - Selected
 * - FilterDate
 * - OnChange
 *
 * Rest of the props from material-ui `TextField` component
 */
export default function ReactDatePicker({
	portalId,
	asUtc = false,
	dateFormat = DEFAULT_DATE_FORMAT,
	selected,
	onChange,
	disabled,
	className,
	placeholder,
	filterDate,
	inline,
	readOnly,
	required,
	onFocus,
	onBlur,
	onCalendarClose,
	onCalendarOpen: _onCalendarOpen,
	onKeyDown,
	showMonthYearPicker,
	startDate,
	endDate,
	selectsStart,
	showTimeSelect,
	value,
	...muiProps
}: ReactDatePickerProps) {
	const { format } = muiProps;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const overrideProps = useFormikField(muiProps as any);
	const { onChange: formikOnChange, value: formikValue } = overrideProps;
	const onChangeHandler = onChange ?? formikOnChange;

	const utcOnChange = (value) => {
		onChangeHandler?.(makeUtc(value));
	};

	const setScope = useSetHotkeyScope();
	const onCalendarOpen = () => {
		setScope('reactDatePicker');
		if (_onCalendarOpen) _onCalendarOpen();
	};

	const formattedDate = format ? format(selected ?? value) : selected ?? value;

	const parsedDate = forceDate(formattedDate?.toString() !== INVALID_DATE ? formattedDate : formikValue);

	return (
		<>
			<RDP
				calendarContainer={CalendarContainer}
				dateFormat={dateFormat}
				disabled={!!disabled || readOnly}
				filterDate={filterDate}
				inline={inline}
				onBlur={onBlur}
				onCalendarClose={onCalendarClose}
				onCalendarOpen={onCalendarOpen}
				onChange={asUtc ? utcOnChange : onChangeHandler}
				onFocus={onFocus}
				startDate={startDate}
				endDate={endDate}
				selectsStart={selectsStart}
				onKeyDown={onKeyDown}
				placeholderText={placeholder}
				portalId={portalId ?? 'root'} // always use portalId to the root of the app, double check if this is causing any issues, but it seems it is always needed when using the date pickers in the dialogs and doesn't cause issues when outside of dialogs
				selected={asUtc ? makeLocal(parsedDate) : parsedDate}
				wrapperClassName={classNames(className, muiProps.fullWidth && FULL_WIDTH_CLASS)}
				readOnly={readOnly}
				required={required}
				showMonthYearPicker={showMonthYearPicker}
				showTimeSelect={showTimeSelect}
				customInput={
					<TextField
						{...muiProps}
						disabled={disabled}
						InputProps={{
							endAdornment: iconAdornment(faCalendar),
							...muiProps.InputProps,
						}}
					/>
				}
			/>
			<ReactDatePickerWrapperStyles />
		</>
	);
}
