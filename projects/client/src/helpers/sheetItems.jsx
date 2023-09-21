/* eslint react/prefer-stateless-function: "warn" */
import {
	faAngleDoubleDown,
	faAngleDoubleUp,
	faDollarSign,
	faPercent,
	faTimes,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { startOfMonth } from 'date-fns';
import { PureComponent } from 'react';
import { Button } from 'react-md';
import styled from 'styled-components';

import { TextField } from '@/components';
import { DatePickerMD as DatePicker } from '@/components/ReactDatePicker';
import ReactSelect from '@/components/ReactSelect';
import { makeLocal } from '@/helpers/date';

const DEFAULT_MAX_DATE = new Date('2262-04-1'); // this max date is according to the limit that pandas can handle

export function getDisplayValue(valType, omit = false) {
	const ignore = new Set(['datetime', 'number', 'currency']);

	if (omit || !valType || ignore.has(valType)) {
		return '';
	}

	if (valType === 'Mdollars') {
		return 'M$';
	}

	return valType;
}

export function getId(key, stateKey, keyList, index) {
	if (keyList.length > 1) {
		let keyStr = '';
		keyList.forEach((k) => {
			keyStr = `${keyStr}-${k}`;
		});
		return `${keyStr}-data-sheet-number`;
	}

	let id = stateKey ? `${stateKey}-${key}` : `${key}`;

	if (index || index === 0) {
		id += `-row#${index}`;
	}

	id += '-data-sheet-number';

	return id;
}

export function parseNum(val) {
	// eslint-disable-next-line no-param-reassign
	val = val === '' ? '' : Number(val);
	if (!Number.isNaN(val) && /^[+-]?(?=.)(?:\d+,)*\d*(?:\.\d+)?$/.test(val)) {
		return val;
	}
	return '';
}

export class SheetItemText extends PureComponent {
	change = (value) => {
		const {
			cell: { sheetItemData },
		} = this.props;
		const { inputName, handleChange, valType, stateKey, subKey, index, keyList } = sheetItemData;

		handleChange({ value, key: inputName, index, subKey, stateKey, valType, keyList });
	};

	render() {
		const {
			onCommit,
			cell: { sheetItemData },
		} = this.props;
		const { key, index, error, keyList, stateKey, inputValue, placeholder, errorMessage } = sheetItemData;

		const val = inputValue || '';

		return (
			<TextField
				autoFocus
				value={val}
				error={error}
				// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
				onChange={this.change}
				errorText={errorMessage}
				placeholder={placeholder}
				className='data-sheet-input'
				id={getId(key, stateKey, keyList, index)}
				onKeyPress={(e) => e.key === 'Enter' && onCommit(val)}
			/>
		);
	}
}

export class SheetItemSelect extends PureComponent {
	changed = (value) => {
		const {
			onCommit,
			cell: { sheetItemData },
		} = this.props;
		const { index, subKey, keyList, selectName, handleChange, defaultModels, fullMenuItems, stateKey, currRow } =
			sheetItemData;

		handleChange({
			index,
			value,
			subKey,
			currRow,
			keyList,
			stateKey,
			selectName,
			defaultModels,
			isSelect: true,
			key: selectName,
			fullMenuItem: fullMenuItems.find((f) => f.value === value.value) || value || {},
		});
		onCommit(value.label);
	};

	// keeping here for future reference if we need to add portal for dropdowns. it currently has an issue where the
	//event will not bubble up and the selected field will not be applied.

	// currentTheme = useAlfaStore.getState().theme;

	// currentThemeColors = getCurrentTheme();

	// menuPortalStyle = (base) => {
	// 	return { ...base, zIndex: 9999, width: 'unset' };
	// };

	// menuStyle = () => {
	// 	const styles = css`
	// 		background: ${this.currentThemeColors.background};
	// 		box-shadow: 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12),
	// 			0 2px 4px -1px rgba(0, 0, 0, 0.4);
	// 		overflow-y: auto;
	// 	`;
	// 	return styles;
	// };

	// optionStyle = (base) => {
	// 	return {
	// 		...base,
	// 		cursor: 'pointer',
	// 		':hover': {
	// 			backgroundColor: this.currentTheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
	// 		},
	// 		color: this.currentTheme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.54)',
	// 		backgroundColor: 'transparent',
	// 	};
	// };

	render() {
		const {
			cell: { sheetItemData },
		} = this.props;
		const { error, menuItems, selectName, selectValue } = sheetItemData;
		const value = menuItems.find((f) => f.value === (selectValue.value || selectValue).toString());

		return (
			<ReactSelect
				autoFocus
				value={value}
				closeOnSelect
				openMenuOnFocus
				options={menuItems}
				// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
				onChange={this.changed}
				// menuPortalTarget={document.body}
				// styles={{ menuPortal: this.menuPortalStyle, menu: this.menuStyle, option: this.optionStyle }}
				color={error ? 'warn' : 'primary'}
				id={`${selectName}-data-sheet-select-${Date.now()}`}
				className={classNames('data-sheet-select', error && 'error-error')}
			/>
		);
	}
}

const PercentIcon = styled.span`
	top: 15px;
`;

export class SheetItemNumber extends PureComponent {
	constructor(props) {
		super(props);
		const { inputValue, error, errorMessage } = props.cell.sheetItemData;
		this.state = { value: inputValue ?? '', error, errorMessage };
	}

	componentWillUnmount() {
		this.handleCommit();
	}

	change = (val) => {
		const {
			cell: { sheetItemData },
		} = this.props;
		const { handleChange, index, key, keyList, max, min, startEnd, stateKey, subKey, valType, preventDecimal } =
			sheetItemData;

		let value = parseNum(val, min, max);

		if (preventDecimal) {
			value = Math.floor(value);
		}

		handleChange({
			key,
			index,
			value,
			subKey,
			keyList,
			valType,
			stateKey,
			startEnd: startEnd || 'start',
			preventDecimal,
		});
	};

	display = (valueType) => {
		const {
			cell: { sheetItemData },
		} = this.props;
		const { omitSection, error } = sheetItemData;

		if (valueType === 'percentage') {
			return <FontAwesomeIcon className={classNames(error && 'warn-icon')} icon={faPercent} />;
		}
		if (valueType === 'dollars') {
			return <FontAwesomeIcon className={classNames(error && 'warn-icon')} icon={faDollarSign} />;
		}
		if (valueType === 'multiple') {
			return <FontAwesomeIcon className={classNames(error && 'warn-icon')} icon={faTimes} />;
		}
		return getDisplayValue(valueType, omitSection);
	};

	handleChange = (val) => {
		const {
			cell: { sheetItemData },
		} = this.props;
		const { max, min, required, omit } = sheetItemData;
		const value = parseNum(val, min, max);
		const { error, errorMessage } = getNumError(value, min, max, required, omit);
		this.setState({ value, error, errorMessage });
	};

	handleCommit = () => {
		const {
			onCommit,
			cell: { sheetItemData },
		} = this.props;
		const { max, min } = sheetItemData;
		const { value, error } = this.state;

		if (error) {
			return;
		}

		this.change(value);
		onCommit(parseNum(value, min, max));
	};

	render() {
		const {
			cell: { sheetItemData },
		} = this.props;
		const { index, key, keyList, placeholder, stateKey, valType } = sheetItemData;
		const { error, errorMessage, value } = this.state;

		return (
			<TextField
				autoFocus
				value={value}
				error={error}
				type='number'
				onChange={this.handleChange}
				onBlur={this.handleCommit}
				errorText={errorMessage}
				placeholder={placeholder}
				className='data-sheet-input'
				id={getId(key, stateKey, keyList, index)}
				onKeyPress={(e) => e.key === 'Enter' && this.handleCommit()}
				inlineIndicator={<PercentIcon>{this.display(valType)}</PercentIcon>}
				onFocus={(ev) => ev.target.select()}
			/>
		);
	}
}

export class SheetItemDate extends PureComponent {
	handleChange = (val) => {
		const {
			onCommit,
			cell: { sheetItemData },
		} = this.props;
		const { dateName, handleChange, index, stateKey, subKey } = sheetItemData;

		/*
		this is the date saved in options of econ model document,
		it will looks "wrong" in local time zone when use `new Date(val)`, but correct when convert to UTC string,
		it will be converted into UTC string when store into database
		*/
		const value = new Date(val);

		if (val) {
			handleChange({ key: dateName, value, index, stateKey, subKey });

			onCommit(value);
		}
	};

	render() {
		const {
			cell: { sheetItemData },
		} = this.props;
		const { dateValue, dateName, minDate } = sheetItemData;

		let { maxDate } = sheetItemData;

		maxDate = maxDate && maxDate.getTime() < DEFAULT_MAX_DATE.getTime() ? maxDate : DEFAULT_MAX_DATE;

		return (
			<DatePicker
				autoFocus
				color='primary'
				minDate={minDate}
				maxDate={maxDate}
				onChange={this.handleChange}
				className='data-sheet-date'
				selected={new Date(dateValue)}
				id={`${dateName}-data-sheet-date`}
				onFocus={(ev) => ev.target.select()}
				/*
				econ datePicker always convert date to correct value in UTC,
				which means directly create a js date by Date() function may result in days off,
				when use it need to always treat it as UTC
				*/
				asUtc
			/>
		);
	}
}

// eslint-disable-next-line react/prefer-stateless-function -- TODO eslint fix later
export class SheetItemSpoof extends PureComponent {
	render() {
		const {
			onCommit,
			cell: { value },
		} = this.props;

		onCommit(value); // yes this is throwing a warning. leave it lol

		return (
			<span tabIndex='0' role='button' className='value-viewer'>
				{value}
			</span>
		);
	}
}

export class SheetItemDateRange extends PureComponent {
	handleChange = (val) => {
		const {
			cell: { sheetItemData },
		} = this.props;
		const { handleChange, index, stateKey, key, keyList } = sheetItemData;

		/*
		this is the date saved in options of econ model document,
		val is date that correct in UTC but may off in local date
		use makeLocal + toLocaleDateString to make it correct string with format mm/dd/yyyy (consistent with old model)
		*/

		const value = startOfMonth(makeLocal(new Date(val))).toLocaleDateString(); // first of the month

		if (val) {
			handleChange({ value, key, index, startEnd: 'start', stateKey, keyList });
		}
	};

	render() {
		const {
			onCommit,
			cell: { sheetItemData },
		} = this.props;
		const { minDate, maxDate, start_date, error, key } = sheetItemData;

		const start = start_date ? new Date(start_date).toLocaleDateString() : '';

		const lastDayOfMonth = new Date(minDate?.getFullYear(), minDate?.getMonth() + 1, 0); // HACK: exclude last date
		const maxMonth = maxDate ? new Date(maxDate?.getFullYear(), maxDate?.getMonth(), 1) : DEFAULT_MAX_DATE; // HACK: exclude last date

		return (
			<DatePicker
				autoFocus
				minDate={minDate && lastDayOfMonth}
				maxDate={maxMonth}
				onChange={this.handleChange}
				selected={new Date(start)} // the start is string with format mm/dd/yyyy
				className='data-sheet-start-date'
				color={error ? 'warn' : 'primary'}
				id={`${key}-data-sheet-date-start`}
				onKeyDown={(e) => e.key === 'Enter' && onCommit()}
				placeholder='MM/DD/YYYY'
				//dateFormat='MM/dd/yyyy'
				showMonthYearPicker
				showTwoColumnMonthYearPicker
				/*
				econ datePicker always convert date to correct value in UTC
				*/
				asUtc
			/>
		);
	}
}

// eslint-disable-next-line react/prefer-stateless-function -- TODO eslint fix later
export class RowViewCollapse extends PureComponent {
	render() {
		const {
			cell: { sheetItemData },
		} = this.props;
		const { Editor, setCollapseState, setCollapseStateProps, collapse } = sheetItemData;

		return (
			<div className='row-view-collapse'>
				<Editor {...this.props} />
				<Button onClick={() => setCollapseState(setCollapseStateProps)} floating primary={collapse}>
					<FontAwesomeIcon icon={collapse ? faAngleDoubleDown : faAngleDoubleUp} />
				</Button>
			</div>
		);
	}
}

// eslint-disable-next-line complexity
export function getNumError(val, min, max, required = true, omit = false) {
	const force = !val && val !== 0;
	if (omit) {
		return { error: false, errorMessage: '', force: false };
	}
	if (!required && force) {
		return { error: false, errorMessage: '', force };
	}
	if (val === '') {
		return { error: true, errorMessage: 'this cell is required', force: true };
	}
	if (typeof min === 'object') {
		if (min.include) {
			if (val < min.value) {
				return { error: true, errorMessage: `the minimum allowed value is ${min.value}`, force: true };
			}
		} else if (val <= min.value) {
			return { error: true, errorMessage: `the value should be larger than ${min.value}`, force: true };
		}
	} else if (val < min) {
		return { error: true, errorMessage: `the minimum allowed value is ${min}`, force: true };
	}
	if (typeof max === 'object') {
		if (max.include) {
			if (val > max.value) {
				return { error: true, errorMessage: `the maximum allowed value is ${max.value}`, force: true };
			}
		} else if (val >= max.value) {
			return { error: true, errorMessage: `the value should be smaller than ${max.value}`, force: true };
		}
	} else if (val > max) {
		return { error: true, errorMessage: `the maximum allowed value is ${max}`, force: true };
	}
	return { error: false, errorMessage: '', force };
}

export function getTextError(val, maxLength, required = true, omit = false) {
	const force = !val && val !== 0;
	if (omit) {
		return { error: false, errorMessage: '', force: false };
	}
	if (!required && force) {
		return { error: false, errorMessage: '', force };
	}
	if (val === '' || val === undefined) {
		return { error: true, errorMessage: 'this cell is required', force: true };
	}
	if (val.length > maxLength) {
		return { error: true, errorMessage: `the maximum number of characters allowed is ${maxLength}`, force: true };
	}
	return { error: false, errorMessage: '', force };
}

export function getNumRangeError(period, min, max, required = true, omit = false) {
	const force = !period && period !== 0;
	if (omit) {
		return { error: false, errorMessage: '', force: false };
	}
	if (!required && force) {
		return { error: false, errorMessage: '', force };
	}
	if (period === '') {
		return { error: true, errorMessage: 'this cell is required', force: true };
	}
	if (period < min) {
		return { error: true, errorMessage: `the minimum allowed value is ${min}`, force: true };
	}
	if (period > max) {
		return { error: true, errorMessage: `the maximum allowed value is ${max}`, force: true };
	}
	if (!Number.isInteger(period)) {
		return { error: true, errorMessage: 'decimals are not allowed', force: true };
	}
	return { error: false, errorMessage: '', force };
}

export function getDateError(val, required = true, omit = false) {
	const force = !val || val.toString() === 'Invalid Date';
	if (omit) {
		return { error: false, errorMessage: '', force: false };
	}
	if (!required) {
		return { error: false, errorMessage: '', force };
	}
	if (force) {
		return { error: true, errorMessage: 'a date is required', force };
	}
	return { error: false, errorMessage: '', force };
}

export function getDateRangeError(dateRange) {
	const { start_date, end_date } = dateRange;
	const startDate = new Date(start_date);
	const endDate = new Date(end_date);

	const force = !startDate || startDate.toString() === 'Invalid Date';
	if (force) {
		return { error: true, errorMessage: 'a date is required', force };
	}
	if (startDate && endDate && endDate !== 'Econ Limit' && startDate > endDate) {
		return { error: true, errorMessage: 'start date should be less than end date', force };
	}
	return { error: false, errorMessage: '', force };
}

export function getSelectError(menuItems, value, required = true, omit = false, defaultOption = false) {
	let selected = false;
	let selectedItem = false;

	const items = menuItems.map((m) => {
		const item = { label: m.label, value: m.value, disabled: !!m.disabled, helpText: m.helpText };
		if (m.value === value || m.value === (value || {}).value) {
			selected = true;
			selectedItem = item;
		}
		return item;
	});
	if (omit) {
		return { error: false, errorMessage: '', items, force: false, selectedItem };
	}
	if (!required) {
		return { error: false, errorMessage: '', items, force: false, selectedItem };
	}
	if (!selected) {
		if (defaultOption) {
			return { error: false, errorMessage: '', items, force: false, selectedItem: defaultOption };
		}
		return { error: true, errorMessage: 'selection required', items, force: false, selectedItem };
	}
	return { error: false, errorMessage: '', items, force: false, selectedItem };
}
