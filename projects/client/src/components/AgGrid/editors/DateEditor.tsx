// https://stackoverflow.com/questions/66691588/using-react-datepicker-with-aggrid
import { ICellEditorParams, ValueFormatterParams } from 'ag-grid-community';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { ReactDatePicker } from '@/components/v2';
import { formatDate } from '@/helpers/utilities';

const HEIGHT = 42; // HACK: get value from ag-grid api

/**
 * When using this formatter, it is expected that valueGetter is not applied on the date column on which this formatter
 * is used.
 */
export const utcDateFormatter = (params: ValueFormatterParams, showNA = true) => {
	const strValue = params.value?.toJSON?.() ?? params.value;
	if (!strValue && !showNA) {
		return strValue;
	}
	return formatDate(strValue);
};

function DateEditor(props: ICellEditorParams & { asLocal: boolean; forceOpen?: boolean }, ref) {
	const { value: initialValue, stopEditing, asLocal } = props;
	const inputRef = useRef<HTMLInputElement | undefined>();
	const [value, setValue] = useState('');
	const [calendarClosed, setCalendarClose] = useState(false);

	const width = props.column.getActualWidth() - 2; // removes date picker borders
	const height = HEIGHT - 2; // removes date picker borders

	const handleChange = (newValue) => {
		setValue(newValue);
	};

	useImperativeHandle(ref, () => {
		return {
			getValue: () => {
				return value;
			},
			afterGuiAttached: () => {
				setValue(initialValue);
				inputRef.current?.focus();
				inputRef.current?.select();
			},
			isPopup: () => true,
		};
	});

	// HACK: cannot call `stopEditing` immediately after closing the picker, it will cause ag-grid not to get the correct value
	useEffect(() => {
		if (calendarClosed) {
			stopEditing();
		}
	}, [calendarClosed, stopEditing]);

	useEffect(() => {
		if (props.forceOpen) {
			inputRef.current?.click();
			setValue(props.value);
		}
	}, [props.forceOpen, props.value]);

	return (
		<ReactDatePicker
			css={`
				width: ${width}px;
				height: ${height}px;
				padding: 0 5px;
				display: flex;
				align-items: center;
				.MuiFormControl-root {
					width: 100%;
				}
			`}
			asUtc={!asLocal}
			inputRef={inputRef}
			selected={value}
			onChange={handleChange}
			onCalendarClose={() => {
				setCalendarClose(true);
			}}
			onBlur={() => stopEditing()}
			placeholder={`Enter ${props.colDef.headerName}`}
			InputProps={{ disableUnderline: true }}
			size='small'
		/>
	);
}

export default forwardRef(DateEditor);
