/* eslint-disable no-param-reassign */
import { faAngleDoubleDown, faAngleDoubleUp, faAngleDown, faMinus, faPlus } from '@fortawesome/pro-regular-svg-icons';
import classNames from 'classnames';
import { addMonths, format, formatISO, parseISO, startOfMonth, sub } from 'date-fns';
import { cloneDeep as clone, has, transform } from 'lodash';
import styled from 'styled-components';

/* eslint-disable no-shadow */
import { Button, FontIcon } from '@/components';
import { InfoTooltip } from '@/components/tooltipped';
import { makeLocal, makeUtc } from '@/helpers/date';
import {
	RowViewCollapse,
	SheetItemDate,
	SheetItemDateRange,
	SheetItemNumber,
	SheetItemSelect,
	SheetItemSpoof,
	SheetItemText,
	getDateError,
	getDateRangeError,
	getNumError,
	getNumRangeError,
	getSelectError,
	getTextError,
} from '@/helpers/sheetItems';
import { numberWithCommas } from '@/helpers/utilities';
import { AssumptionKey, FieldType } from '@/inpt-shared/constants';

import { isBool } from '../../../../internal-api/src/shared/helpers/types';

const formatDollar = (val) => {
	if (Number.isFinite(val)) {
		return numberWithCommas(val);
	}
	return val ?? '';
};

const HorizontalStyle = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
`;
const CELL_WIDTH = 175;
const BIGGER_CELL_WIDTH = CELL_WIDTH;

const needCriteriaHeader = ['escalation_start'];

// eslint-disable-next-line complexity
export function valueRenderer(cell) {
	if (!cell) {
		return '';
	}

	let tooltip = cell.helpText && (
		<InfoTooltip
			labelTooltip={
				<div
					css={`
						white-space: pre-wrap;
					`}
				>
					{cell.helpText}
				</div>
			}
			fontSize='16px'
		/>
	);
	if ((cell.isSelect && new RegExp('read-only', 'g').test(cell.className)) || cell.showDropdownArrow) {
		if (cell.showToggle) {
			const { sheetItemData } = cell;
			const { setCollapseState, setCollapseStateProps, collapse } = sheetItemData;
			return (
				<div className='text-cell-with-arrow collapse-toggle'>
					<div>{(cell.selectedItem || {}).label || 'Select'}</div>
					<FontIcon primary>{faAngleDown}</FontIcon>
					<Button
						onClick={() => setCollapseState(setCollapseStateProps)}
						floating
						primary={collapse}
						faIcon={collapse ? faAngleDoubleDown : faAngleDoubleUp}
					/>
				</div>
			);
		}

		tooltip = (cell.selectedItem || {}).helpText && (
			<InfoTooltip labelTooltip={cell.selectedItem.helpText} fontSize='16px' />
		);

		return (
			<HorizontalStyle>
				<div className='text-cell-with-arrow'>
					{(cell.selectedItem || {}).label || 'Select'}
					<FontIcon primary>{faAngleDown}</FontIcon>
				</div>
				{tooltip}
			</HorizontalStyle>
		);
	}
	if (cell.rowBtns) {
		return (
			<div className='text-cell-with-arrow'>
				{cell.value}
				{cell.rowBtns}
				{tooltip}
			</div>
		);
	}
	if (cell.extraButton) {
		return (
			<HorizontalStyle>
				{cell.value}
				{tooltip}
				{cell.extraButton}
			</HorizontalStyle>
		);
	}
	if (cell.headerSelect) {
		return tooltip ? (
			<HorizontalStyle>
				<div>{cell.value}</div>
				{tooltip}
			</HorizontalStyle>
		) : (
			cell.value
		);
	}
	if (cell.description) {
		return (
			<HorizontalStyle>
				<div>
					{cell.value}
					<div className='small-cell-description'>{cell.description}</div>
				</div>
				{tooltip}
			</HorizontalStyle>
		);
	}
	return tooltip ? (
		<HorizontalStyle>
			<div>{cell.value}</div>
			{tooltip}
		</HorizontalStyle>
	) : (
		cell.value
	);
}

export function dataRenderer() {
	// const focus = { focus: () => {} };
	// if (!cell || !cell.component || !cell.component.props || !cell.component.props.id) {
	// 	return '';
	// }
	// setTimeout(() => (document.getElementById(cell.component.props.id) || focus).focus(), 0);
	// setTimeout(() => (document.getElementById(`${cell.component.props.id}-toggle`) || focus).focus(), 0);
}

// eslint-disable-next-line complexity
function getDisplayValue(
	value,
	valType,
	unit,
	omit = false,
	numRange = false,
	lastRow,
	error,
	errorMessage,
	isFirstRowInWellStream
) {
	if (omit) {
		return ' ';
	}
	const ignore = new Set(['_id', 'number', 'currency', 'text']);

	if (error) {
		return errorMessage;
	}

	if (numRange) {
		// valType can be months or price
		const v = value;
		const textValue = {
			/* eslint-disable no-nested-ternary */
			start: v.start || v.start === 0 ? (v.start < 0 ? `(${v.start})` : v.start) : '',
			end: v.end || v.end === 0 ? (v.end < 0 ? `(${v.end})` : v.end) : '',
			/* eslint-enable no-nested-ternary */
		};

		if (valType === 'months') {
			if (lastRow) {
				textValue.start = `${textValue.start} months`;
				textValue.end = 'Econ Limit';
			} else {
				textValue.end = `${textValue.end} ${valType}`;
			}
			return `${textValue.start} - ${textValue.end}`;
		}

		if (lastRow) {
			if (valType === 'dollars') {
				textValue.start = `$ ${formatDollar(textValue.start)}`;
			} else {
				textValue.start = `${textValue.start} ${valType}`;
			}
			textValue.end = 'inf';
		} else if (valType === 'dollars') {
			textValue.start = `$ ${formatDollar(textValue.start)}`;
		} else {
			textValue.end = `${textValue.end} ${valType}`;
		}

		return `${textValue.start} - ${textValue.end}`;
	}

	if (!valType || ignore.has(valType)) {
		return value;
	}

	if (valType === 'percentage') {
		if (isFirstRowInWellStream) {
			return `${value}`;
		}
		return `${value} %`;
	}

	if (unit) {
		if (unit === '$/FT') {
			return `${formatDollar(value)} ${unit}`;
		}

		return `${value} ${unit}`;
	}

	if (valType === 'dollars') {
		return `$ ${formatDollar(value)}`;
	}

	if (valType === 'Mdollars') {
		return `$M ${formatDollar(value)}`;
	}

	if (valType === 'multiple') {
		return `${value} \u00d7`;
	}

	if (valType === 'days') {
		return `${value} days`;
	}
	if (valType === 'months') {
		return `${value} months`;
	}
	if (valType === 'month') {
		return `month ${value}`;
	}

	if (valType === 'datetime') {
		let str = '';
		if (value && has(value, 'start_date')) {
			str += value.start_date;
			if (value.end_date && value.end_date !== 'Invalid Date') {
				const startDate = format(new Date(value.start_date), 'MM/yyyy') ?? str;
				const endDate =
					value.end_date === 'Econ Limit'
						? value.end_date
						: format(new Date(value.end_date), 'MM/yyyy') ?? value.end_date;
				str = `${startDate} - ${endDate}`;
			}
			return str;
		}
		return value;
	}

	return `${value} ${valType}`;
}

export const Types = {
	select: (props) => {
		const {
			helpText,
			Default,
			addHeader,
			arr,
			fieldName,
			fieldType,
			handleChange,
			headClassName,
			hidden,
			index,
			inputKey,
			keyList,
			menuItems,
			omitSection,
			readOnly,
			placeholder,
			required,
			stateKey,
			subKey,
			unit,
			valClassName,
			valType,
			description,
			specialColSpan,
			currRow,
			showDropdownArrow,
		} = props;

		let { value } = props;
		const valueToLabel = menuItems.reduce((dict, { value, label }) => Object.assign(dict, { [value]: label }), {});
		if (!Object.keys(valueToLabel).includes(value)) {
			// if selected option not in options (e.g. assigned escalation model been deleted)
			value = Default?.value || value;
		}

		const { error, errorMessage, items, selectedItem } = getSelectError(menuItems, value, required, omitSection);
		const checkMissing = !Default && Default !== 0 ? true : Default.value !== value;
		const notDef = !error && (value || value === 0) && checkMissing;
		const selectName = inputKey || stateKey;
		const fullMenuItems = menuItems;

		if (addHeader) {
			arr.push({
				helpText,
				description,
				readOnly: true,
				value: fieldName,
				className: headClassName,
				dataEditor: SheetItemSpoof,
			});
		}

		// to handle escalation and depreciation selection that the label should be dynamically fetched
		const newLabel = valueToLabel[value] || value;

		arr.push({
			selectedItem,
			isSelect: true,
			showDropdownArrow,
			readOnly: readOnly || omitSection,
			dataEditor: SheetItemSelect,
			width: CELL_WIDTH,
			value: getDisplayValue(newLabel, valType, unit, omitSection, undefined, undefined, error, errorMessage),
			className: classNames(
				valClassName,
				error && 'warn-icon',
				notDef && 'not-default',
				hidden && 'cell--hidden'
			),
			sheetItemData: {
				required,
				error,
				handleChange,
				placeholder,
				subKey,
				keyList,
				menuItems: items,
				selectName,
				selectValue: value,
				stateKey,
				fullMenuItems,
				index,
				currRow,
			},
			meta: {
				fieldType,
				fullMenuItems,
				index,
				keyList,
				stateKey,
				subKey,
				key: selectName,
				menuItems: items,
			},
		});

		if (specialColSpan - 2 > 0) {
			new Array(specialColSpan - 2).fill(1).forEach(() => {
				arr.push({
					readOnly: true,
					value: '',
					dataEditor: SheetItemSpoof,
					className: classNames('read-only full-width-cell'),
				});
			});
		}
	},

	date: (props) => {
		const {
			helpText,
			arr,
			hidden,
			required,
			fieldName,
			valType,
			unit,
			stateKey,
			subKey,
			handleChange,
			addHeader,
			valClassName,
			headClassName,
			index,
			omitSection,
			inputKey,
			minDate,
			maxDate,
		} = props;

		/*
		this is the date shows on FE
		*/

		const value = props.value ? makeLocal(utcCorrectDateInLocal(props.value)).toLocaleDateString() : '';
		const { error, errorMessage } = getDateError(value, required, omitSection);
		const notDef = !error && (value || value === 0);

		if (addHeader) {
			arr.push({
				helpText,
				readOnly: true,
				value: fieldName,
				className: headClassName,
				dataEditor: SheetItemSpoof,
			});
		}

		arr.push({
			readOnly: omitSection,
			dataEditor: SheetItemDate,
			width: CELL_WIDTH,
			value: getDisplayValue(value, valType, unit, omitSection, undefined, undefined, error, errorMessage),
			className: classNames(
				valClassName,
				error && 'warn-icon',
				notDef && 'not-default',
				hidden && 'cell--hidden'
			),
			sheetItemData: {
				error,
				errorMessage,
				stateKey,
				subKey,
				dateName: inputKey || stateKey,
				dateValue: value,
				handleChange,
				index,
				minDate,
				maxDate,
			},
		});
	},

	date_range: (props) => {
		const {
			helpText,
			addHeader,
			arr,
			econLimit,
			fieldName,
			fieldType,
			handleChange,
			headClassName,
			hidden,
			index,
			inputKey,
			keyList,
			maxDate,
			minDate,
			omitSection,
			stateKey,
			unit,
			valClassName,
			valType,
			value,
		} = props;

		const { error, errorMessage } = getDateRangeError(value);
		const notDef = !error && (value || value === 0);
		const key = inputKey || stateKey;

		if (addHeader) {
			arr.push({
				helpText,
				readOnly: true,
				value: fieldName,
				className: headClassName,
				dataEditor: SheetItemSpoof,
			});
		}
		arr.push({
			readOnly: omitSection,
			dataEditor: SheetItemDateRange,
			width: BIGGER_CELL_WIDTH,
			value: getDisplayValue(value, valType, unit, omitSection, undefined, undefined, error, errorMessage),
			className: classNames(
				valClassName,
				error && 'warn-icon',
				notDef && 'not-default',
				hidden && 'cell--hidden'
			),
			meta: {
				fieldType,
				index,
				key,
				keyList,
				stateKey,
			},
			sheetItemData: {
				econLimit,
				error,
				errorMessage,
				handleChange,
				index,
				key,
				keyList,
				maxDate,
				minDate,
				stateKey,
				end_date: value.end_date,
				start_date: value.start_date,
			},
		});
	},

	// eslint-disable-next-line
	number: (props) => {
		const {
			helpText,
			extraButton,
			addHeader,
			arr,
			fieldName,
			fieldType,
			fieldsObj,
			handleChange,
			headClassName,
			hidden,
			index,
			inputKey,
			keyList,
			max,
			min,
			omitSection,
			prevRow,
			readOnly,
			required,
			stateKey,
			subKey,
			unit,
			valClassName,
			valType: _valType,
			value,
			description,
			hide,
			preventDecimal,
		} = props;

		const isWellStream = 'well_stream' in fieldsObj;
		const isFirstRow = isBool(prevRow) && !prevRow;
		const isFirstRowInWellStream = isWellStream && isFirstRow;

		// HACK: first row of multiplier in Well Stream should be always a number
		const valType = isFirstRowInWellStream ? 'number' : _valType;

		if (hide) {
			return;
		}

		if (stateKey === 'discount_table' && index === 0) {
			props.Default = 0;
		}

		const { Default } = props;
		const { error, errorMessage } = getNumError(value, min, max, required, omitSection);
		const checkMissing = !Default && Default !== 0 ? true : Default !== value;
		const notDef = !error && (value || value === 0) && checkMissing;
		const placeholder = required === false ? 'optional' : undefined;
		const key = inputKey || stateKey;

		if (addHeader) {
			arr.push({
				helpText,
				extraButton,
				description,
				readOnly: true,
				value: fieldName,
				className: headClassName,
				dataEditor: SheetItemSpoof,
			});
		}

		arr.push({
			readOnly: readOnly || omitSection,
			dataEditor: SheetItemNumber,
			width: CELL_WIDTH,
			value: getDisplayValue(
				value,
				valType,
				unit,
				readOnly || omitSection,
				undefined,
				undefined,
				error,
				errorMessage,
				isFirstRowInWellStream
			),
			className: classNames(
				valClassName,
				error && 'warn-icon',
				notDef && 'not-default',
				hidden && 'cell--hidden'
			),
			meta: {
				fieldType,
				/** NumberMeta */
				index,
				key,
				keyList,
				stateKey,
				subKey,
				valType,
			},
			sheetItemData: {
				error,
				errorMessage,
				handleChange,
				index,
				key,
				keyList,
				max,
				min,
				placeholder,
				stateKey,
				subKey,
				valType,
				inputValue: value,
				required,
				preventDecimal: !!preventDecimal,
			},
		});
	},

	number_range: (props) => {
		const {
			helpText,
			addHeader,
			arr,
			fieldName,
			fieldType,
			handleChange,
			headClassName,
			hidden,
			index,
			inputKey,
			keyList,
			lastRow,
			max,
			min,
			omitSection,
			required,
			stateKey,
			subKey,
			unit,
			valClassName,
			valType,
			value,
		} = props;

		const { error, errorMessage, force } = getNumRangeError(value.period, min, max, required, omitSection);
		const notDef = !error && (value || value === 0);
		const key = inputKey || stateKey;

		if (addHeader) {
			arr.push({
				helpText,
				readOnly: true,
				value: fieldName,
				className: headClassName,
			});
		}
		arr.push({
			meta: {
				fieldType,
				/** NumberRangeMeta */
				index,
				key,
				keyList,
				stateKey,
				subKey,
				valType,
			},
			readOnly: omitSection,
			forceComponent: force,
			value: getDisplayValue(value, valType, unit, omitSection, true, lastRow, error, errorMessage),
			className: classNames(
				valClassName,
				error && 'warn-icon',
				notDef && 'not-default',
				hidden && 'cell--hidden'
			),
			sheetItemData: {
				error,
				errorMessage,
				handleChange,
				index,
				key,
				keyList,
				max,
				min,
				stateKey,
				subKey,
				valType,
				inputValue: value.period,
			},
			dataEditor: SheetItemNumber,
			width: BIGGER_CELL_WIDTH,
		});
	},

	number_range_rate: (props) => {
		const {
			helpText,
			addHeader,
			arr,
			fieldName,
			fieldType,
			handleChange,
			headClassName,
			hidden,
			index,
			inputKey,
			keyList,
			lastRow,
			max,
			min,
			omitSection,
			required,
			stateKey,
			subKey,
			unit,
			valClassName,
			valType,
			value,
		} = props;

		const { error, errorMessage, force } = getNumError(value.start, min, max, required, omitSection);
		const notDef = !error && (value || value === 0);
		const key = inputKey || stateKey;

		if (addHeader) {
			arr.push({
				helpText,
				readOnly: true,
				value: fieldName,
				className: headClassName,
			});
		}
		arr.push({
			meta: {
				fieldType,
				/** NumberRangeMeta */
				index,
				key,
				keyList,
				stateKey,
				subKey,
				valType,
			},
			readOnly: omitSection,
			forceComponent: force,
			value: getDisplayValue(value, valType, unit, omitSection, true, lastRow, error, errorMessage),
			className: classNames(
				valClassName,
				error && 'warn-icon',
				notDef && 'not-default',
				hidden && 'cell--hidden'
			),
			sheetItemData: {
				error,
				errorMessage,
				handleChange,
				index,
				min,
				max,
				key,
				keyList,
				stateKey,
				subKey,
				valType,
				inputValue: value.start,
			},
			dataEditor: SheetItemNumber,
			width: CELL_WIDTH,
		});
	},

	static: (props) => {
		let { value } = props;
		const { arr, hidden, valClassName, headClassName, addHeader, fieldName, omitSection, helpText } = props;
		value = omitSection ? ' ' : value;

		if (addHeader) {
			arr.push({
				helpText,
				readOnly: true,
				value: fieldName,
				dataEditor: SheetItemSpoof,
				className: classNames(headClassName, hidden && 'cell--hidden'),
			});
		}

		if (value !== '') {
			arr.push({
				value,
				readOnly: omitSection,
				dataEditor: SheetItemSpoof,
				className: classNames(valClassName, hidden && 'cell--hidden'),
			});
		}
	},

	text: (props) => {
		const {
			helpText,
			Default,
			arr,
			value,
			required,
			fieldName,
			valType,
			unit,
			stateKey,
			subKey,
			handleChange,
			hidden,
			maxLength,
			addHeader,
			valClassName,
			headClassName,
			index,
			omitSection,
			inputKey,
			keyList,
		} = props;

		let { error, errorMessage } = getTextError(value, maxLength, required, omitSection);
		if (fieldName === "Link to Well's ECL" && errorMessage === 'this cell is required') {
			errorMessage = 'Enter INPT ID';
		}
		const checkMissing = !Default && Default !== 0 ? true : Default !== value;
		const notDef = !error && (value || value === 0) && checkMissing;
		const placeholder = required === false ? 'optional' : undefined;
		const key = inputKey || stateKey;

		if (addHeader) {
			arr.push({
				helpText,
				readOnly: true,
				value: fieldName,
				dataEditor: SheetItemSpoof,
				className: classNames(headClassName, hidden && 'cell--hidden'),
			});
		}
		const inputName = inputKey || stateKey;
		arr.push({
			readOnly: omitSection,
			dataEditor: SheetItemText,
			width: CELL_WIDTH,
			value: getDisplayValue(value, valType, unit, omitSection, undefined, undefined, error, errorMessage),
			className: classNames(
				valClassName,
				error && 'warn-icon',
				notDef && 'not-default',
				hidden && 'cell--hidden'
			),
			meta: {
				index,
				keyList,
				stateKey,
				subKey,
				valType,
				key: inputName,
			},
			sheetItemData: {
				error,
				errorMessage,
				valType,
				handleChange,
				placeholder,
				subKey,
				stateKey,
				inputName,
				inputValue: value,
				index,
				key,
				keyList,
			},
		});
	},
};

// eslint-disable-next-line complexity
export function GenerateData(props) {
	const {
		collapseState,
		data,
		field,
		handleChange,
		hidden = false,
		index,
		prevRow,
		currRow,
		nextRow,
		setCollapseState,
		stateKey,
		subKey,
		defaultModels,
	} = props;
	let {
		// eslint-disable-next-line
		addHeader,
		arr,
		handlers,
		headClassName,
		keyList,
		omitSection,
		state,
		subFields,
		valClassName,
	} = props;

	arr = arr || [];
	handlers = handlers || {};
	subFields = subFields || {};
	valClassName = valClassName || '';
	headClassName = headClassName || '';
	addHeader = addHeader === undefined ? true : addHeader;
	omitSection = omitSection === undefined ? false : omitSection;
	keyList = keyList || [];

	// eslint-disable-next-line
	const {
		fieldName,
		fieldType,
		subItems,
		helpText,
		valType,
		menuItems,
		required,
		placeholder,
		staticValue,
		columns,
		specialColSpan,
		showDropdownArrow,
	} = field;

	if (fieldType === FieldType.sub) {
		// the logic of sub processed in header-select
		return;
	}

	if (fieldType === FieldType.select) {
		if (!state) {
			if (field.Default) {
				state = field.Default;
			} else {
				state = { label: '', value: '' };
			}
		}
		Types.select({
			fieldType,
			arr,
			...props,
			...field,
			addHeader,
			valClassName,
			headClassName,
			handleChange: handlers.select || handleChange,
			value: state.value,
			label: state.label,
			subKey,
			keyList,
			specialColSpan,
			currRow,
			showDropdownArrow,
		});
	}

	if (fieldType === FieldType.date) {
		Types.date({
			arr,
			...props,
			...field,
			addHeader,
			valClassName,
			headClassName,
			handleChange: handlers.date || handleChange,
			value: state,
		});
	}

	if (fieldType === FieldType.number) {
		if (!state && state !== 0) {
			if (field.Default || field.Default === 0) {
				state = field.Default;
			}
		}
		Types.number({
			arr,
			fieldType,
			...props,
			...field,
			addHeader,
			valClassName,
			headClassName,
			handleChange: handlers.number || handleChange,
			value: state,
			keyList,
		});
	}

	if (fieldType === FieldType.static) {
		Types.static({ arr, value: staticValue, fieldName, addHeader, hidden, omitSection });
	}

	if (fieldType === FieldType.text) {
		Types.text({
			arr,
			...props,
			...field,
			addHeader,
			valClassName,
			headClassName,
			handleChange: handlers.text || handleChange,
			value: state,
			keyList,
		});
	}

	if (fieldType === FieldType.autoOrder) {
		Types.text({
			arr,
			...props,
			...field,
			addHeader,
			valClassName,
			headClassName,
			handleChange: handlers.text || handleChange,
			value: state,
		});
	}

	if (fieldType === FieldType.criteriaSelect) {
		if (!state) {
			if (field.Default) {
				state = { criteria: field.Default, value: field.Default.Default };
			} else {
				state = { criteria: '', value: '' };
			}
		}
		const value = state.value;
		const criteria = state.criteria || {};
		const { error, items, selectedItem } = getSelectError(menuItems, state.criteria.value, false);
		const selectName = stateKey;
		const fullMenuItems = menuItems;
		const criteriaHeader = field.criteriaHeader;
		const notDef = !error && field.Default && criteria.value !== field.Default.value;
		if (criteriaHeader) {
			arr.push({
				helpText,
				readOnly: true,
				value: fieldName,
				dataEditor: SheetItemSpoof,
			});
		}
		arr.push({
			selectedItem,
			isSelect: true,
			className: classNames('read-only', notDef && 'not-default', { 'cell--hidden': hidden }),
			dataEditor: SheetItemSelect,
			width: CELL_WIDTH,
			meta: {
				fieldType,
				fullMenuItems,
				index,
				keyList,
				stateKey,
				subKey,
				key: selectName,
				menuItems: items,
			},
			sheetItemData: {
				required,
				error,
				handleChange: handlers['criteria-select'] || handleChange,
				menuItems: items,
				fullMenuItems,
				selectName,
				selectValue: { value: criteria.value, label: criteria.label },
				placeholder: 'Select Criteria',
				index,
				subKey,
			},
		});
		if (Object.keys(criteria).length === 0) {
			arr.push({
				helpText,
				value: 'select criteria',
				readOnly: true,
				dataEditor: SheetItemSpoof,
			});
		} else {
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			GenerateData({
				...props,
				data: [],
				arr,
				field: criteria,
				addHeader: false,
				state: value,
				handlers,
				handleChange: handlers.criteria || handleChange,
			});
		}
	}

	if (fieldType === FieldType.postShutInEndCriteria) {
		if (!state) {
			if (field.Default) {
				state = field.Default;
			} else {
				state = { label: '', value: '' };
			}
		}
		Types.select({
			fieldType,
			arr,
			...props,
			...field,
			addHeader,
			valClassName,
			headClassName,
			handleChange: handlers.select || handleChange,
			value: state.value,
			label: state.label,
			subKey,
			keyList,
			specialColSpan,
			currRow,
			showDropdownArrow,
		});

		let post_shut_in_type = { label: 'Dates', value: 'dates' };
		let post_shut_in_type_index = 6;
		if (arr[1].sheetItemData.dateValue === undefined) {
			post_shut_in_type = { label: 'As Of', value: 'offset_to_as_of_date' };
			post_shut_in_type_index = 5;
		}
		arr[post_shut_in_type_index].sheetItemData.fullMenuItems = [
			{ label: 'Econ Limit', value: 'econ_limit' },
			post_shut_in_type,
		];
		arr[post_shut_in_type_index].sheetItemData.menuItems = arr[post_shut_in_type_index].sheetItemData.fullMenuItems;
	}

	if (fieldType === FieldType.postShutInEnd) {
		let post_shut_in_duration_index = 6;
		if (arr[1].sheetItemData.dateValue === undefined) {
			post_shut_in_duration_index = 5;
		}
		if (arr[post_shut_in_duration_index].selectedItem.value === 'dates') {
			const shutInEnd = arr[2].value;
			const minDate = shutInEnd ? new Date(new Date(shutInEnd).setDate(new Date(shutInEnd).getDate() + 1)) : '';
			const maxDate = currRow?.repeat_range_of_dates ? getShutInMaxDate(currRow, minDate) : null;
			Types.date({
				arr,
				...props,
				...field,
				addHeader,
				valClassName,
				headClassName,
				handleChange,
				value: state,
				minDate,
				maxDate,
			});
		} else if (arr[post_shut_in_duration_index].selectedItem.value === 'econ_limit') {
			Types.static({ arr, value: ' ', fieldName, addHeader, hidden, omitSection });
		} else if (arr[post_shut_in_duration_index].selectedItem.value === 'offset_to_as_of_date') {
			if (!state && state !== 0) {
				if (field.Default || field.Default === 0) {
					state = field.Default;
				}
			}
			Types.number({
				arr,
				fieldType,
				...props,
				...field,
				addHeader,
				valClassName,
				headClassName,
				handleChange,
				value: state,
				keyList,
			});
		}
	}

	if (fieldType === FieldType.headersScheduleCriteriaSelect) {
		if (!state) {
			if (field.Default) {
				state = {
					criteria: field.Default,
					value: field.Default.Default,
					fromSchedule: field.fromSchedule.Default,
					fromScheduleValue: field.fromSchedule.Default.Default,
				};
			} else {
				state = { criteria: '', value: '', fromSchedule: '', fromScheduleValue: '' };
			}
		}
		const value = state.value;
		const fromScheduleValue = state.fromScheduleValue || field.fromSchedule.Default.Default;
		const fromHeadersValue = state.fromHeadersValue || field.fromHeaders.Default.Default;
		const criteria = state.criteria || {};
		const isFromSchedule = criteria.value === 'fromSchedule';
		const isFromHeaders = criteria.value === 'fromHeaders';
		const fromSchedule = criteria.fromSchedule || field.fromSchedule.Default;
		const fromHeaders = criteria.fromHeaders || field.fromHeaders.Default;
		const { error, items, selectedItem } = getSelectError(menuItems, state.criteria.value, false);
		const selectName = stateKey;
		const fromScheduleMenuItems = field.fromSchedule.menuItems;
		const fromHeadersMenuItems = field.fromHeaders.menuItems;
		const fullMenuItems = menuItems;
		const criteriaHeader = field.criteriaHeader;
		const notDef = !error && field.Default && criteria.value !== field.Default.value;
		if (criteriaHeader) {
			arr.push({
				helpText,
				readOnly: true,
				value: fieldName,
				dataEditor: SheetItemSpoof,
			});
		}
		arr.push({
			selectedItem,
			isSelect: true,
			className: classNames('read-only', notDef && 'not-default', { 'cell--hidden': hidden }),
			dataEditor: SheetItemSelect,
			width: CELL_WIDTH,
			meta: {
				fieldType,
				fullMenuItems,
				index,
				keyList,
				stateKey,
				subKey,
				key: selectName,
				menuItems: items,
			},
			sheetItemData: {
				required,
				error,
				handleChange: handlers['criteria-select'] || handleChange,
				menuItems: items,
				fullMenuItems,
				selectName,
				selectValue: { value: criteria.value, label: criteria.label },
				placeholder: 'Select Criteria',
				index,
				subKey,
			},
		});

		if (isFromSchedule) {
			const {
				error: fromScheduleErr,
				items: fromScheduleItems,
				selectedItem: fromScheduleSelectedItem,
			} = getSelectError(fromScheduleMenuItems, state.fromSchedule.value, false);

			arr.push({
				selectedItem: fromScheduleSelectedItem,
				isSelect: true,
				className: classNames(
					'read-only',
					notDef && 'not-default',
					{ 'cell--hidden': hidden },
					'wider-cell-input'
				),
				dataEditor: SheetItemSelect,
				width: CELL_WIDTH,
				meta: {
					fieldType,
					fullMenuItems: fromScheduleMenuItems,
					index,
					keyList,
					stateKey: 'schedule-criteria',
					subKey,
					key: 'schedule-criteria',
					menuItems: fromScheduleItems,
				},
				sheetItemData: {
					required: fromSchedule.required,
					fromScheduleErr,
					handleChange: handlers['schedule-criteria-select'] || handleChange,
					menuItems: fromScheduleItems,
					fullMenuItems: fromScheduleMenuItems,
					selectName: 'schedule-criteria',
					selectValue: { value: fromSchedule.value, label: fromSchedule.label },
					placeholder: 'Select From Schedule Criteria',
					index,
					subKey,
				},
			});
		} else if (isFromHeaders) {
			const {
				error: fromHeadersErr,
				items: fromHeadersItems,
				selectedItem: fromHeadersSelectedItem,
			} = getSelectError(fromHeadersMenuItems, state.fromHeaders.value, false);

			arr.push({
				selectedItem: fromHeadersSelectedItem,
				isSelect: true,
				className: classNames(
					'read-only',
					notDef && 'not-default',
					{ 'cell--hidden': hidden },
					'wider-cell-input'
				),
				dataEditor: SheetItemSelect,
				width: CELL_WIDTH,
				meta: {
					fieldType,
					fullMenuItems: fromHeadersMenuItems,
					index,
					keyList,
					stateKey: 'headers-criteria',
					subKey,
					key: 'headers-criteria',
					menuItems: fromHeadersItems,
				},
				sheetItemData: {
					required: fromHeaders.required,
					fromHeadersErr,
					handleChange: handlers['headers-criteria-select'] || handleChange,
					menuItems: fromHeadersItems,
					fullMenuItems: fromHeadersMenuItems,
					selectName: 'headers-criteria',
					selectValue: { value: fromHeaders.value, label: fromHeaders.label },
					placeholder: 'Select From Headers Criteria',
					index,
					subKey,
				},
			});
		} else {
			arr.push({
				value: '',
				readOnly: true,
				dataEditor: SheetItemSpoof,
			});
		}

		if (Object.keys(criteria).length === 0) {
			arr.push({
				helpText,
				value: 'select criteria',
				readOnly: true,
				dataEditor: SheetItemSpoof,
			});
		} else {
			let fieldScheduleHeaders = criteria;
			let stateScheduleHeaders = value;
			let handlerScheduleHeaders = handlers['criteria-row'];
			if (isFromSchedule) {
				fieldScheduleHeaders = fromSchedule;
				stateScheduleHeaders = fromScheduleValue;
				handlerScheduleHeaders = handlers['schedule-criteria-row'];
			} else if (isFromHeaders) {
				fieldScheduleHeaders = fromHeaders;
				stateScheduleHeaders = fromHeadersValue;
				handlerScheduleHeaders = handlers['headers-criteria-row'];
			}

			// eslint-disable-next-line new-cap -- TODO eslint fix later
			GenerateData({
				...props,
				data: [],
				arr,
				field: fieldScheduleHeaders,
				addHeader: false,
				state: stateScheduleHeaders,
				handlers,
				handleChange: handlerScheduleHeaders || handleChange,
			});
		}
	}

	if (fieldType === FieldType.header) {
		let colSpan = 2;
		if (subItems && has(subItems, 'row_view')) {
			colSpan = Object.keys(subItems.row_view.columns || {}).length;
		}
		if (specialColSpan) {
			colSpan = specialColSpan;
		}

		if (field.className !== 'ignore-header') {
			new Array(colSpan).fill(1).forEach((mm, mmi) => {
				arr.push({
					...(mmi === 0 ? { helpText } : {}),
					readOnly: true,
					fullWidthCell: true,
					dataEditor: SheetItemSpoof,
					value: mmi ? '' : fieldName,
					originalValue: mmi ? '' : field.fieldName,
					className: classNames('read-only full-width-cell', hidden && 'cell--hidden', field.className),
				});
			});

			data.push(arr);
		}

		if (subItems) {
			// generate subItem state if missing

			const sState = state ? state.subItems : generateFieldHeaders(subItems);

			Object.keys(subItems).forEach((key) => {
				const oneFiled = subItems[key];
				if (oneFiled.reliance) {
					const relianceKey = Object.keys(oneFiled.reliance)[0];
					const relianceList = oneFiled.reliance[relianceKey];

					// handle reliance state not exist
					const relianceState = sState[relianceKey] ? sState[relianceKey] : subItems[relianceKey].Default;
					const relianceValue = (relianceState.criteria || relianceState).value;

					if (!relianceList.includes(relianceValue)) {
						return;
					}
				}

				if (oneFiled.rowHeaderReliance) {
					const relianceKey = Object.keys(oneFiled.rowHeaderReliance)[0];
					const relianceList = oneFiled.rowHeaderReliance[relianceKey];
					const relianceValue = sState.row_view.headers[relianceKey].value;
					if (!relianceList.includes(relianceValue)) {
						return;
					}
				}

				// eslint-disable-next-line new-cap -- TODO eslint fix later
				GenerateData({
					...props,
					data,
					field: oneFiled,
					addHeader: true,
					state: sState[key],
					subKey: key,
					handleChange: handlers.subItems || handleChange,
					handlers: handlers.subHandlers || handlers,
					keyList: keyList.concat(key),
				});
			});
		}
		return;
	}

	if (fieldType === FieldType.flexibleHeader) {
		// this is for user changeable header, not using right now
		let colSpan = 2;
		if (subItems && has(subItems, 'row_view')) {
			colSpan = Object.keys(subItems.row_view.columns || {}).length;
		}

		if (state.customizedValue === undefined) {
			state.customizedValue = field.fieldName;
		}

		const { error, errorMessage } = getTextError(state.customizedValue, field.required, omitSection);

		new Array(colSpan).fill(1).forEach((mm, mmi) => {
			if (!mmi) {
				arr.push({
					helpText,
					readOnly: omitSection,
					dataEditor: SheetItemText,
					width: CELL_WIDTH,
					originalValue: field.fieldName,
					value: getDisplayValue(state.customizedValue, 'text'),
					className: classNames(valClassName, hidden && 'cell--hidden'),
					sheetItemData: {
						error,
						errorMessage,
						valType,
						handleChange: handlers['flexible-header'] || handleChange,
						stateKey,
						subKey,
						inputName: `${stateKey}-${subKey}`,
						inputValue: state.customizedValue,
					},
				});
			} else {
				arr.push({
					value: '',
					readOnly: true,
					dataEditor: SheetItemSpoof,
					originalValue: '',
					className: classNames('read-only full-width-cell', hidden && 'cell--hidden', field.className),
				});
			}
		});

		data.push(arr);

		if (subItems) {
			Object.keys(subItems).forEach((key) => {
				const s = subItems[key];
				// eslint-disable-next-line new-cap -- TODO eslint fix later
				GenerateData({
					...props,
					data,
					field: s,
					addHeader: true,
					state: state.subItems[key],
					subKey: key,
					handleChange: handlers.subItems || handleChange,
					keyList: keyList.concat(key),
				});
			});
		}
		return;
	}

	if (fieldType === FieldType.headerSelect) {
		const k = state.value;
		const { error, items, selectedItem } = getSelectError(menuItems, k, required);
		// const notDef = !error && field.Default && criteria.value !== field.Default.value;

		if (addHeader) {
			arr.push({
				helpText,
				readOnly: true,
				value: fieldName,
				dataEditor: SheetItemSpoof,
			});
		}
		arr.push({
			value: k,
			selectedItem,
			isSelect: true,
			headerSelect: true,
			className: classNames('read-only', { 'cell--hidden': hidden }),
			dataEditor: SheetItemSelect,
			width: CELL_WIDTH,
			sheetItemData: {
				error,
				handleChange: handlers.rowHeader || handleChange,
				menuItems: items,
				fullMenuItems: menuItems,
				selectName: stateKey,
				selectValue: k,
				placeholder,
				subKey,
				keyList,
				defaultModels,
			},
		});

		data.push(arr);

		if (k && subFields[k]) {
			const sub = subFields[k].subItems;
			const subVal = subFields[k].value.subItems;
			const subsubFields = {};

			Object.keys(sub || {}).forEach((f) => {
				const F = sub[f];
				if (F.fieldType === FieldType.sub) {
					subsubFields[f] = { ...F, value: subVal[f] };
				}
			});

			keyList = keyList.slice(0, keyList.length - 1);

			if (sub) {
				Object.keys(sub).forEach((kk) => {
					const fSub = sub[kk];
					const val = subVal[kk];

					if (fSub.reliance) {
						const relianceKey = Object.keys(fSub.reliance)[0];
						const relianceList = fSub.reliance[relianceKey];
						const relianceValue = (subVal[relianceKey].criteria || subVal[relianceKey]).value;
						if (!relianceList.includes(relianceValue)) {
							return;
						}
					}

					// eslint-disable-next-line new-cap -- TODO eslint fix later
					GenerateData({
						...props,
						data,
						field: fSub,
						addHeader: true,
						state: val,
						stateKey: k,
						subKey: kk,
						handleChange: handlers.subItems || handleChange,
						keyList: keyList.concat(k, kk),
						subFields: subsubFields,
					});
				});
			}
		}
		return;
	}

	if (fieldType === FieldType.dateRange) {
		state = has(state, 'start_date') ? state : { start_date: '', end_date: '' };

		const isEL = state.end_date === 'Econ Limit';
		let minDate = prevRow || undefined;
		if (minDate) {
			if (minDate.criteria.end_date && minDate.criteria.end_date !== 'Econ Limit') {
				minDate = new Date(
					new Date(prevRow.criteria.start_date).setDate(new Date(prevRow.criteria.start_date).getDate() + 2)
				);
			} else {
				minDate = new Date(
					new Date(prevRow.criteria.start_date).setDate(new Date(prevRow.criteria.start_date).getDate() + 2)
				);
			}
			minDate = minDate.toString() === 'Invalid Date' ? undefined : minDate;
		}

		let maxDate;
		if (nextRow && Date.parse(nextRow.criteria.start_date)) {
			const parsedDate = new Date(nextRow.criteria.start_date);
			maxDate = new Date(parsedDate.setDate(parsedDate.getDate() - 1));
		}

		Types.date_range({
			arr,
			...props,
			...field,
			fieldType,
			handleChange: handlers['date-range'] || handleChange,
			addHeader: false,
			value: state,
			minDate,
			maxDate,
			econLimit: !isEL,
			keyList,
		});
	}

	if (fieldType === FieldType.dateRangeTwo) {
		state = has(state, 'start_date') ? state : { start_date: '', end_date: '' };

		state.start_date = state.start_date ? new Date(state.start_date).toLocaleDateString() : '';
		state.end_date = state.end_date ? new Date(state.end_date).toLocaleDateString() : '';

		const minDate = state.start_date
			? new Date(new Date(state.start_date).setDate(new Date(state.start_date).getDate()))
			: '';

		// special handle for shut in repeat logic
		const maxDate = currRow?.repeat ? getShutInMaxDate(currRow, minDate) : null;

		Types.date({
			arr,
			...props,
			...field,
			addHeader,
			valClassName,
			headClassName,
			handleChange: handlers['date-range-start'] || handleChange,
			value: state.start_date,
		});

		Types.date({
			arr,
			...props,
			...field,
			addHeader,
			valClassName,
			headClassName,
			handleChange: handlers['date-range-end'] || handleChange,
			value: state.end_date,
			minDate,
			maxDate,
		});
	}

	if (fieldType === FieldType.numberRange) {
		const sMax = field.max;
		// if(!prevRow) sMax = 1200;
		state = has(state, 'start') ? state : { start: '', end: '', period: '' };

		Types.number_range({
			arr,
			fieldType,
			...props,
			...field,
			max: sMax,
			addHeader: false,
			value: state,
			handleChange: handlers[FieldType.numberRange] || handleChange,
			keyList,
		});
	}

	if (fieldType === FieldType.numberRangeRate) {
		let min = field.min;
		let max = field.max;

		if (prevRow && (prevRow.criteria.start || prevRow.criteria.start === 0)) {
			min = Math.max(prevRow.criteria.start + 1, min);
		}

		if (nextRow && (nextRow.criteria.start || nextRow.criteria.start === 0)) {
			max = Math.min(nextRow.criteria.start - 1, max);
		}

		state = has(state, 'start') ? state : { start: '', end: '', period: '' };

		Types.number_range_rate({
			arr,
			fieldType,
			...props,
			...field,
			min,
			max,
			addHeader: false,
			value: state,
			handleChange: handlers[FieldType.numberRangeRate] || handleChange,
			keyList,
		});
	}

	if (fieldType === FieldType.numberRangeTwo) {
		state = has(state, 'start') ? state : { start: '', end: '', period: '' };

		Types.number({
			arr,
			fieldType,
			...props,
			...field,
			addHeader,
			valClassName,
			headClassName,
			handleChange: handlers['number-range-start'] || handleChange,
			value: state.start,
			keyList,
		});

		const minEnd = state.start ? state.start : field.min;

		Types.number({
			arr,
			fieldType,
			...props,
			...field,
			addHeader,
			valClassName,
			headClassName,
			min: minEnd,
			handleChange: handlers['number-range-end'] || handleChange,
			value: state.end,
			keyList,
		});
	}

	if (stateKey === 'vertical_row_view') {
		let head = [];
		const value = state;
		const sRows = value.rows;

		Object.keys(columns).forEach((col) => {
			const c = columns[col];
			const r = sRows[0];
			const v = r[col];
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			GenerateData({
				...props,
				data: head,
				field: c,
				state: v,
				headClassName: sRows.length > 1 ? 'no-bottom-border' : '',
				valClassName: sRows.length > 1 ? 'no-bottom-border' : '',
				index: 0,
				stateKey: col,
				handleChange: handlers.row || handleChange,
			});
			head = head[0];
		});

		data.push(head);

		const defs = [0, 2, 5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 70, 80, 100];

		sRows.forEach((r, i) => {
			if (i === 0) {
				return;
			}
			const rows = [{ readOnly: true, value: ' ', className: 'short-row', dataEditor: SheetItemSpoof }];
			Object.keys(r).forEach((col) => {
				const v = r[col];
				const c = columns[col];
				c.Default = defs[i];

				// eslint-disable-next-line new-cap -- TODO eslint fix later
				GenerateData({
					...props,
					data: [],
					arr: rows,
					field: c,
					state: v,
					index: i,
					stateKey: col,
					addHeader: false,
					valClassName: 'short-row',
					handleChange: handlers.row || handleChange,
				});
			});
			data.push(rows);
		});
		return;
	}

	const getNestedObject = (nestedObj, pathArr) => {
		return pathArr.reduce((obj, key) => (obj && obj[key] !== 'undefined' ? obj[key] : undefined), nestedObj);
	};

	if (stateKey === 'row_view' || subKey === 'row_view') {
		const head = [];
		const value = state;
		const sRows = value.rows;
		const sHeaders = value.headers;
		const subK = subKey === 'row_view' ? '' : subKey;
		const isCollapsible = !!(sRows.length > 2 && collapseState && setCollapseState);
		const collapse =
			isCollapsible &&
			(keyList.length < 2 ? !!collapseState[stateKey] : !!getNestedObject(collapseState, keyList.slice(0, 2)));
		const columnKeys = Object.keys(columns);

		// eslint-disable-next-line complexity
		columnKeys.forEach((col, colIndex) => {
			const c = columns[col];
			const h = sHeaders[col] ? sHeaders[col] : c.fieldName;
			let stateK = stateKey;
			stateK = subKey === 'row_view' ? stateK : col;

			if (c.reliance) {
				const relianceKey = Object.keys(c.reliance)[0];
				const relianceList = c.reliance[relianceKey];
				const relianceValue = (sHeaders[relianceKey].criteria || sHeaders[relianceKey]).value;
				if (!relianceList.includes(relianceValue)) {
					return;
				}
			}

			if (c.fieldType === FieldType.headerSelect) {
				// eslint-disable-next-line
				const { error, items, selectedItem } = getSelectError(
					c.menuItems,
					h.value,
					c.required,
					omitSection,
					c.Default
				);

				const selectName = col;
				const fullMenuItems = c.menuItems;
				const value = getDisplayValue(h.label, c.valType, c.unit, omitSection);
				const checkMissing = !c.Default && c.Default !== 0 ? true : c.Default.label !== value;
				const notDef = !error && (value || value === 0) && checkMissing;

				const selectValue = h.value || c.Default?.value;

				const sheetItemData = {
					error,
					fullMenuItems,
					selectName,
					handleChange: handlers.rowHeader || handleChange,
					menuItems: items,
					placeholder: c.placeholder,
					selectValue,
					stateKey: stateK,
					keyList,
					collapse,
					setCollapseState,
					Editor: SheetItemSelect,
					setCollapseStateProps: {},
				};

				let dataEditor = SheetItemSelect;
				const showToggle = isCollapsible && colIndex === columnKeys.length - 1;

				if (showToggle) {
					dataEditor = RowViewCollapse;
					sheetItemData.setCollapseStateProps =
						keyList.length < 2 ? { [stateKey]: !collapse } : { keyList, bool: !collapse };
				}

				head.push({
					showToggle,
					dataEditor,
					width: CELL_WIDTH,
					selectedItem,
					sheetItemData,
					isSelect: true,
					readOnly: omitSection,
					className: classNames(
						notDef && 'not-default',
						'read-only',
						c.specialColSpan ? 'full-width-cell' : ''
					),
					value: getDisplayValue(h.label, c.valType, c.unit, omitSection),
					meta: {
						fieldType,
						fullMenuItems,
						index,
						keyList,
						stateKey,
						subKey,
						key: selectName,
						menuItems: items,
					},
				});

				if (c.specialColSpan) {
					new Array(c.specialColSpan - 1).fill(1).forEach(() => {
						head.push({
							readOnly: true,
							value: '',
							dataEditor: SheetItemSpoof,
							className: classNames('read-only full-width-cell'),
						});
					});
				}
			} else if (c.fieldType === FieldType.criteriaSelect) {
				new Array(2).fill(1).forEach((mm, mmi) => {
					head.push({
						helpText: mmi ? undefined : c.helpText,
						readOnly: true,
						value: mmi ? '' : h,
						dataEditor: SheetItemSpoof,
						className: classNames('read-only full-width-cell'),
					});
				});
				// head.push({ colSpan: 2, readOnly: true, value: h, dataEditor: SheetItemSpoof });
			} else if (c.fieldType === FieldType.headersScheduleCriteriaSelect) {
				const findFromSchedule = state?.rows.find((x) => {
					if (x.criteria === '') return false;
					return x?.criteria?.criteria?.value === 'fromSchedule';
				});
				const findFromHeaders = state?.rows.find((x) => {
					if (x.criteria === '') return false;
					return x?.criteria?.criteria?.value === 'fromHeaders';
				});
				const spaces = findFromSchedule || findFromHeaders ? 3 : 2;
				new Array(spaces).fill(1).forEach((mm, mmi) => {
					head.push({
						helpText: mmi ? undefined : c.helpText,
						readOnly: true,
						value: mmi ? '' : h,
						dataEditor: SheetItemSpoof,
						className: classNames('read-only full-width-cell'),
					});
				});
			} else {
				head.push({
					helpText: c.helpText,
					readOnly: true,
					value: h,
					extraButton: c.extraButton, // to add extra button in header
					dataEditor: SheetItemSpoof,
				});
			}
		});

		data.push(head);
		sRows.forEach((r, i) => {
			const rows = [];
			const prevRow = i > 0 ? sRows[i - 1] : false;
			const nextRow = i < sRows.length - 1 ? sRows[i + 1] : false;
			// eslint-disable-next-line complexity
			columnKeys.forEach((col) => {
				const v = r[col];
				const c = columns[col];
				let stateK = stateKey;
				stateK = subKey === 'row_view' ? stateK : col;

				if (c.reliance) {
					const relianceKey = Object.keys(c.reliance)[0];
					const relianceList = c.reliance[relianceKey];
					const relianceValue = (sHeaders[relianceKey].criteria || sHeaders[relianceKey]).value;
					if (!relianceList.includes(relianceValue)) {
						return;
					}
				}

				if (c.fieldType === FieldType.headerSelect) {
					const selectedHeader = sHeaders[col].value || c.Default?.value;
					const selected = c.menuItems.find((f) => f.value === selectedHeader);
					if (selected) {
						if (['number-range', 'number-range-rate'].includes(selected.fieldType)) {
							let lastRow = false;
							if (i === sRows.length - 1) {
								lastRow = true;
							}
							// eslint-disable-next-line new-cap -- TODO eslint fix later
							GenerateData({
								...props,
								data: [],
								arr: rows,
								prevRow,
								nextRow,
								currRow: r,
								subKey: subK,
								stateKey: stateK,
								inputKey: col,
								handleChange: handlers.row || handleChange,
								hidden: collapse,
								field: selected,
								state: v,
								index: i,
								addHeader: false,
								keyList,
								lastRow,
							});
						} else if (selected.fieldType === FieldType.seasonal) {
							rows.push({
								readOnly: true,
								dataEditor: SheetItemSpoof,
								className: classNames({ 'cell--hidden': collapse }),
								value: getDisplayValue(v, c.valType),
							});
						} else {
							// eslint-disable-next-line new-cap -- TODO eslint fix later
							GenerateData({
								...props,
								data: [],
								arr: rows,
								prevRow,
								currRow: r,
								nextRow,
								subKey: subK,
								stateKey: stateK,
								inputKey: col,
								handleChange: handlers.row || handleChange,
								hidden: collapse,
								field: selected,
								state: v,
								index: i,
								addHeader: false,
								keyList,
							});
						}
					} else {
						rows.push({
							readOnly: true,
							dataEditor: SheetItemSpoof,
							value: 'select criteria above',
							className: classNames(collapse && 'cell--hidden'),
						});
					}
					return;
				}
				if (c.fieldType === FieldType.criteriaSelect) {
					// eslint-disable-next-line new-cap -- TODO eslint fix later
					GenerateData({
						...props,
						data: [],
						arr: rows,
						prevRow,
						nextRow,
						subKey: subK,
						stateKey: stateK,
						hidden: collapse,
						inputKey: col,
						handleChange: handlers['criteria-row'] || handleChange,
						field: c,
						state: v,
						index: i,
						addHeader: false,
						keyList,
					});
					return;
				}
				if (c.fieldType === FieldType.headersScheduleCriteriaSelect) {
					const findFromSchedule = state?.rows.find((x) => {
						if (x.criteria === '') return false;
						return x.criteria.criteria.value === 'fromSchedule';
					});
					const findFromHeaders = state?.rows.find((x) => {
						if (x.criteria === '') return false;
						return x.criteria.criteria.value === 'fromHeaders';
					});
					let criteriaHandler = handlers['criteria-row'];
					if (findFromSchedule) {
						criteriaHandler = handlers['schedule-criteria-row'];
					}
					if (findFromHeaders) {
						criteriaHandler = handlers['headers-criteria-row'];
					}

					let criteriaFields = { ...c, fieldType: 'criteria-select' };
					if (findFromSchedule || findFromHeaders) {
						criteriaFields = c;
					}

					// eslint-disable-next-line new-cap -- TODO eslint fix later
					GenerateData({
						...props,
						data: [],
						arr: rows,
						prevRow,
						nextRow,
						subKey: subK,
						stateKey: stateK,
						hidden: collapse,
						inputKey: col,
						handleChange: criteriaHandler || handleChange,
						field: criteriaFields,
						state: v,
						index: i,
						addHeader: false,
						keyList,
					});
					return;
				}
				if (c.fieldType === FieldType.autoOrder) {
					rows.push({
						className: classNames({ 'cell--hidden': collapse }),
						readOnly: true,
						value: i + 1,
						dataEditor: SheetItemSpoof,
					});
					sRows[i][col] = i + 1;
					return;
				}
				if (c.fieldType === FieldType.autoSum) {
					const ref = c.reference;
					let thisSum = 0;
					if (i === 0) {
						thisSum = sRows[i][ref];
					} else {
						thisSum = sRows[i - 1][col] + sRows[i][ref];
					}
					thisSum = Math.round(1000 * thisSum) / 1000;

					rows.push({
						readOnly: true,
						dataEditor: SheetItemSpoof,
						className: classNames({ 'cell--hidden': collapse }),
						value: getDisplayValue(thisSum, c.valType),
					});
					sRows[i][col] = thisSum;
					return;
				}

				const readOnly = checkRowFieldReadOnly(r, stateK);

				// eslint-disable-next-line new-cap -- TODO eslint fix later
				GenerateData({
					...props,
					data: [],
					arr: rows,
					prevRow,
					subKey: subK,
					stateKey: stateK,
					hidden: collapse,
					inputKey: col,
					handleChange: handlers.row || handleChange,
					field: c,
					state: v,
					index: i,
					addHeader: false,
					keyList,
					currRow: r,
					readOnly,
				});
			});
			data.push(rows);
		});
		return;
	}

	if (arr.length > 0) {
		data.push(arr);
	}
}

function firstDayNextMonth() {
	// when get default date value, use makeUtc to make it consistent with econ datePicker which uses asUtc
	return makeUtc(startOfMonth(addMonths(new Date(), 1)));
}

export function generateFieldHeaders(field) {
	const state = {};

	const GenerateRowState = (state, key, columns, defaultRows) => {
		const r = {};
		const h = {};
		// eslint-disable-next-line complexity
		Object.keys(columns).forEach((col) => {
			const c = columns[col];
			r[col] = '';
			h[col] = c.fieldName;
			if (c.fieldType === FieldType.criteriaSelect || c.fieldType === FieldType.headersScheduleCriteriaSelect) {
				r[col] = {};
				if (c.Default) {
					r[col].criteria = c.Default;
					if (c.Default.Default || c.Default.Default === 0) {
						r[col].value = c.Default.Default;
					} else {
						r[col].value = '';
					}
				} else {
					r[col] = { criteria: {}, value: '' };
				}
				return;
			}

			if (c.fieldType === FieldType.select) {
				if (c.Default || c.Default === 0) {
					r[col] = c.Default;
				} else {
					r[col] = { label: '', value: '' };
				}
				return;
			}

			if (c.fieldType === FieldType.autoOrder) {
				r[col] = 1;
				return;
			}

			if (c.fieldType === FieldType.headerSelect) {
				h[col] = c.Default || { label: '', value: '' };
				const selected = c.menuItems.find((f) => f.value === h[col].value);
				if (selected && selected.fieldType === FieldType.static) {
					r[col] = selected.staticValue;
				} else if (selected && (selected.Default || selected.Default === 0)) {
					r[col] = selected.Default;
				}
				return;
			}

			if (!c.fieldType.includes('select') && (c.Default || c.Default === 0)) {
				r[col] = c.Default;
			}
		});
		state[key] = { headers: h, rows: defaultRows ? clone(defaultRows) : false || [r] };
	};

	const GenerateAllState = (state, field) => {
		const subs = field.subItems ? clone(field.subItems) : false;

		// eslint-disable-next-line complexity
		Object.keys(field).forEach((key) => {
			if (key === 'subItems') {
				return;
			}

			const { fieldType, subItems, Default, columns, defaultRows, staticValue } = field[key];

			if (key === 'row_view' || key === 'vertical_row_view') {
				// eslint-disable-next-line new-cap -- TODO eslint fix later
				GenerateRowState(state, key, columns, defaultRows);
				return;
			}

			state[key] = fieldType.includes('select') ? { label: '', value: '' } : '';
			if (Default || Default === 0) {
				state[key] = Default;
			}

			if (fieldType === FieldType.static) {
				state[key] = staticValue;
				return;
			}

			if (fieldType === FieldType.criteriaSelect) {
				state[key] = { criteria: {}, value: '' };
				if (Default) {
					state[key].criteria = Default;
					if (Default.Default || Default.Default === 0) {
						state[key].value = Default.Default;
					}
					if (Default.fieldType === FieldType.static) {
						state[key].value = Default.staticValue;
					}
					if (Default.fieldType === FieldType.date) {
						state[key].value = firstDayNextMonth();
						return;
					}
				}
				return;
			}

			if (fieldType === FieldType.date) {
				state[key] = firstDayNextMonth();
				return;
			}

			if (subItems && subItems !== 'subItems') {
				state[key] = { subItems: {} };
				// eslint-disable-next-line new-cap -- TODO eslint fix later
				GenerateAllState(state[key].subItems, subItems);
				return;
			}

			if (subs && subItems === 'subItems') {
				field[key].subItems = clone(subs);
				state[key] = { subItems: {} };
				Object.keys(subs).forEach((s) => {
					const ss = subs[s];
					state[key].subItems[s] = ss.fieldType.includes('select') ? { label: '', value: '' } : '';
					if (ss.Default) {
						state[key].subItems[s] = ss.Default;
					}
				});
			}
		});
		return state;
	};

	// eslint-disable-next-line new-cap -- TODO eslint fix later
	return GenerateAllState(state, field);
}

export function GenerateHeaderState(templateFields, key) {
	if (!templateFields[key]) {
		return {};
	}

	const field = templateFields[key];

	return generateFieldHeaders(field);
}

const IGNORED_FIELDS = ['state_models'];

/** Used to generate the `options` field for the default values of any empty econ model template fields */
export function GenerateNewModelHeaders(templateFields) {
	return transform(templateFields, (acc, value, key) => {
		if (IGNORED_FIELDS.includes(key) || !value) {
			return;
		}
		acc[key] = generateFieldHeaders(value);
	});
}

export function getModelState({ fieldsObj, model }) {
	const obj = { omitSection: {} };
	Object.keys(fieldsObj).forEach((key) => {
		obj[key] = clone({ ...model.options[key] });
		if (has(model.options[key], 'omitSection')) {
			obj.omitSection[key] = model.options[key].omitSection;
		}
	});
	return obj;
}

/**
 * Check if the {options, omitSection} pair are valid for a given fieldsObj, ie if it can be saved or used to create a
 * new valid econ model
 */
export function isValid({ omitSection, options }, fieldsObj) {
	let result = true;

	const changeBools = () => {
		result = false;
	};

	// eslint-disable-next-line complexity
	const checkCell = (cellState, field) => {
		if (field.fieldType && field.fieldType.includes('auto')) {
			// skip validation for auto fill in rows
			return;
		}

		if (typeof cellState !== 'object') {
			if (field.required === true) {
				if (cellState !== 0 && !cellState) {
					changeBools();
				} else {
					if (has(field, 'min') && Number(cellState) < field.min) {
						changeBools();
					}
					if (has(field, 'max') && Number(cellState) > field.max) {
						changeBools();
					}
				}
			} else if (cellState === 0 || cellState) {
				if (has(field, 'min') && Number(cellState) < field.min) {
					changeBools();
				}
				if (has(field, 'max') && Number(cellState) > field.max) {
					changeBools();
				}
			}
		}

		if (typeof cellState === 'object' && !(cellState instanceof Date)) {
			if (field.required === true) {
				if (has(cellState, 'criteria')) {
					if (cellState.criteria.required === false) {
						return;
					}
					if (cellState.criteria.fieldType && cellState.criteria.fieldType === FieldType.static) {
						return;
					}
				}
				if (has(cellState, 'value')) {
					if (!cellState.value && cellState.value !== 0) {
						changeBools();
					} else if (has(cellState, 'criteria')) {
						if (cellState.value < cellState.criteria.min) {
							changeBools();
						}
						if (cellState.value > cellState.criteria.max) {
							changeBools();
						}
					}
				}

				if (has(cellState, 'start')) {
					if (cellState.period || cellState.period === 0) {
						if (has(field, 'min') && cellState.period < field.min) {
							changeBools();
						}
						if (has(field, 'max') && cellState.period > field.max) {
							changeBools();
						}
						if (!['Econ Limit', null].includes(cellState.end) && cellState.end < cellState.start) {
							changeBools();
						}
					} else {
						if (!cellState.start && cellState.start !== 0) {
							changeBools();
						}
						if (!cellState.end && ![0, null].includes(cellState.end)) {
							changeBools();
						}
						if (cellState.start && cellState.end && cellState.start > cellState.end) {
							changeBools();
						}
					}
				}

				if (has(cellState, 'start_date') && !cellState.start_date) {
					changeBools();
				}
				if (has(cellState, 'end_date') && !cellState.end_date) {
					changeBools();
				}
				if (
					has(cellState, 'end_date') &&
					has(cellState, 'end_date') &&
					cellState.start_date &&
					cellState.end_date
				) {
					const startDate = new Date(cellState.start_date);
					const endDate = new Date(cellState.end_date);
					if (startDate > endDate) {
						changeBools();
					}
				}
			} else {
				if (
					has(cellState, 'value') &&
					has(cellState, 'criteria') &&
					(cellState.value || cellState.value === 0)
				) {
					if (cellState.value < cellState.criteria.min) {
						changeBools();
					}
					if (cellState.value > cellState.criteria.max) {
						changeBools();
					}
				}

				if (has(cellState, 'start') && (cellState.start || cellState.start === 0)) {
					if (has(field, 'min') && cellState.start < field.min) {
						changeBools();
					}
					if (has(field, 'max') && cellState.start > field.max) {
						changeBools();
					}
					if (!['Econ Limit', null].includes(cellState.end) && cellState.end < cellState.start) {
						changeBools();
					}
				}
			}
		}
	};

	const checkRowView = (rowState, field) => {
		Object.keys(rowState.headers).forEach((col) => {
			if (field.columns[col]?.required) {
				const col_header = rowState.headers[col];
				// header
				if (typeof col_header !== 'object' && col_header !== 0 && !col_header) {
					changeBools();
				}
				// header select
				if (typeof col_header === 'object' && !col_header.value) {
					changeBools();
				}
			}
		});
		rowState.rows.forEach(
			// eslint-disable-next-line
			(f) => {
				Object.keys(f).forEach((k) => {
					const r = f[k];
					const rHeader = rowState.headers[k];
					const rHeaderFields = field.columns[k];

					const getField = (rHeaderFields) => {
						switch (rHeaderFields.fieldType) {
							case 'select':
								return rHeaderFields.menuItems.find((f) => f.value === r.value);
							case 'criteria-select':
								return rHeaderFields.menuItems.find((f) => {
									return f.value === r.criteria.value;
								});
							case 'header-select': {
								const selectedHeader = rHeader.value || rHeaderFields.Default?.value;
								return rHeaderFields.menuItems.find((f) => f.value === selectedHeader);
							}
							default:
								return rHeaderFields;
						}
					};
					const rField = getField(rHeaderFields);

					if (rField) {
						checkCell(r, rField);
					} else {
						changeBools();
					}
				});
			}
		);
	};

	const checkDisable = (oneState, oneFieldObject) => {
		Object.keys(oneState).forEach((s) => {
			if (s === 'omitSection') {
				return;
			}

			const v = oneState[s];
			const field = oneFieldObject[s];

			if (field === undefined) {
				return;
			}

			if (field.reliance && !inReliance(oneFieldObject, oneState, s)) {
				return;
			}

			if (s === 'row_view' || s === 'vertical_row_view') {
				checkRowView(v, field);
				return;
			}

			if (!has(v, 'subItems')) {
				checkCell(v, field);
				return;
			}

			if (has(v, 'subItems')) {
				checkDisable(v.subItems, field.subItems);
			}
		});
	};

	Object.keys(fieldsObj).forEach((key) => {
		if (omitSection?.[key]) {
			return;
		}

		if (options[key]) {
			checkDisable(options[key], fieldsObj[key]);
		}
	});

	return result;
}

function utcCorrectDateInLocal(date) {
	/*
	the input date can be string or Date object
	if the date comes from econ datePicker w/o process, the date will be correct under UTC,
	use makeLocal here to make it convert to correct local date, to make it can be format by toLocaleDateString
	if the date is string format (from db or from datePicker w/ process),
	it can be either local date format (MM/dd/yyyy or yyyy/MM/dd from ARIES or CSV import) or ISO format with 'T' in it,
	the ISO format date string can be directly be convert to Date object,
	but the local string format will need to use function makeUtc
	*/
	let parsedDate;

	if (date instanceof Date) {
		// date from datPicker should be correct under utc
		parsedDate = date;
	}

	if (typeof date === 'string' || date instanceof String) {
		// handle string type od date
		if (date.includes('T')) {
			// string in ISO format that correct under UTC
			parsedDate = new Date(date);
		} else {
			// string in local format, correct in local time, use makeUtc to make it correct under UTC
			parsedDate = makeUtc(new Date(date));
		}
	}

	return parsedDate;
}

export function createEconFunction(options, stateKeyList) {
	const adjDate = (date) => {
		/*
		input date is from options, function convert it to the string format yyyy-mm-dd, to be saved in econ_function
		*/
		date = utcCorrectDateInLocal(date);
		date = { d: date.getUTCDate(), m: date.getUTCMonth() + 1, y: date.getUTCFullYear() };
		return `${date.y}-${date.m < 10 ? `0${date.m}` : date.m}-${date.d < 10 ? `0${date.d}` : date.d}`;
	};

	// eslint-disable-next-line complexity
	const econProcess = (item, resultState, key, subIgnore) => {
		if (item === null) {
			item = '';
		}
		const sub = item?.subItems;
		if (sub) {
			if (key === 'empty_header') {
				Object.keys(sub).forEach((subKey) => {
					if (subIgnore && subIgnore[subKey]) {
						return;
					}
					econProcess(sub[subKey], resultState, subKey, subIgnore);
				});
			} else {
				resultState[key] = {};
				if (has(item, 'customizedValue')) {
					resultState[key].customizedValue = item.customizedValue;
				}
				Object.keys(sub).forEach((subKey) => {
					if (subIgnore && subIgnore[subKey]) {
						return;
					}
					econProcess(sub[subKey], resultState[key], subKey, subIgnore);
				});
			}
		} else if (has(item, 'value')) {
			if (has(item, 'criteria')) {
				if ((has(item, 'criteriaHeader') && item.criteriaHeader === true) || needCriteriaHeader.includes(key)) {
					resultState[key] = {
						[item.criteria.value]: item.criteria.value === 'date' ? adjDate(item.value) : item.value,
					};
				} else {
					resultState[item.criteria.value] =
						item.criteria.value === 'date' ? adjDate(item.value) : item.value;
				}
			} else {
				resultState[key] = item.value;
			}
			if (has(item, 'fromSchedule') && has(item, 'fromScheduleValue')) {
				resultState[item.fromSchedule.value] = item.fromScheduleValue;
				resultState['fromSchedule'] = item.fromSchedule.value;
			}
			if (has(item, 'fromHeaders') && has(item, 'fromHeadersValue')) {
				resultState[item.fromHeaders.value] = item.fromHeadersValue;
				resultState['fromHeaders'] = item.fromHeaders.value;
			}
		} else if (key.includes('date') && item) {
			resultState[key] = adjDate(item);
		} else {
			if (key === 'empty_header') {
				return;
			}
			resultState[key] = item;
		}

		if (key === 'row_view' || key === 'vertical_row_view') {
			let rows = [];
			const h = item.headers;
			item.rows.forEach((stateRow) => {
				const econRow = {};
				Object.keys(stateRow).forEach((col) => {
					if (typeof h[col] === 'object') {
						if (has(econRow, h[col].value)) {
							econRow[h[col].value] += stateRow[col];
						} else {
							econRow[h[col].value] = stateRow[col];
						}
						if (h[col].value === 'dates') {
							const isEl = stateRow[col].end_date === 'Econ Limit';
							econRow.dates = {
								start_date: adjDate(stateRow[col].start_date),
								end_date: isEl ? 'Econ Limit' : adjDate(stateRow[col].end_date),
							};
						} else if (h[col].value === 'date') {
							econRow.date = adjDate(stateRow[col]);
						}
					} else {
						econProcess(stateRow[col], econRow, col);
					}
					// if(!stateRow[col] && stateRow[col] !== 0) econRow = {}
				});
				rows.push(econRow);
			});
			if (rows.length > 2 && Object.keys(rows[0]).length === 0) {
				rows = [];
			}
			resultState.rows = rows;
			delete resultState[key];
		}
	};

	const result = {};

	const ignore = {
		ownership: {
			segment: true,
			initial_ownership: {
				phase: true,
			},
			first_reversion: {
				phase: true,
			},
			second_reversion: {
				phase: true,
			},
			third_reversion: {
				phase: true,
			},
			fourth_reversion: {
				phase: true,
			},
			fifth_reversion: {
				phase: true,
			},
			sixth_reversion: {
				phase: true,
			},
			seventh_reversion: {
				phase: true,
			},
			eighth_reversion: {
				phase: true,
			},
			ninth_reversion: {
				phase: true,
			},
			tenth_reversion: {
				phase: true,
			},
		},
		variable_expenses: {
			phase: true,
			category: true,
		},
		fixed_expenses: {
			category: true,
		},
		price_model: {
			phase: true,
		},
	};

	stateKeyList.forEach((stateKey) => {
		result[stateKey] = {};
		const ig = ignore[stateKey] || {};

		if (!options[stateKey]) {
			return;
		}

		Object.keys(options[stateKey]).forEach((key) => {
			if (key === 'omitSection') {
				return;
			}

			const subIgnore = ig[key] || {};
			if (typeof subIgnore === 'boolean') {
				return;
			}
			const item = options[stateKey][key];
			econProcess(item, result[stateKey], key, subIgnore);
		});
	});

	return result;
}

function inReliance(field, state, key) {
	const reliance = field[key].reliance;
	const relianceKey = Object.keys(reliance)[0];
	const relianceList = reliance[relianceKey];

	const relianceSate = state[relianceKey] ? state[relianceKey] : field[relianceKey].Default;
	const relianceStateValue = (relianceSate.criteria || relianceSate).value;

	return relianceList.includes(relianceStateValue);
}

export function genData(props) {
	const { fieldsObj, state, relianceKeys } = props;

	if (state && !Object.keys(state).length) {
		return null;
	}

	const subFields = {};
	Object.keys(fieldsObj).forEach((f) => {
		const F = fieldsObj[f];
		if (F.fieldType === FieldType.sub) {
			subFields[f] = { ...F, value: state[f] };
		}
	});

	const data = [];

	Object.keys(fieldsObj).forEach((key) => {
		const field = fieldsObj[key];

		if (field.reliance && !inReliance(fieldsObj, state, key)) {
			return;
		}

		if (field.rowHeaderReliance) {
			const relianceKey = Object.keys(field.rowHeaderReliance)[0];
			const relianceList = field.rowHeaderReliance[relianceKey];
			const relianceValue = state.row_view.headers[relianceKey].value;
			if (!relianceList.includes(relianceValue)) {
				return;
			}
		}

		if (field.multiRowHeaderReliance) {
			let needField = false;
			const relianceKey = Object.keys(field.multiRowHeaderReliance)[0];
			const relianceList = field.multiRowHeaderReliance[relianceKey];
			relianceKeys.forEach((rk) => {
				const relianceValue = state[rk].subItems.row_view.headers[relianceKey].value;
				if (relianceList.includes(relianceValue)) {
					needField = true;
				}
			});
			if (!needField) {
				return;
			}
		}

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		GenerateData({ ...props, data, field: fieldsObj[key], stateKey: key, state: state[key], subFields });
	});

	if (!data.length) {
		return false;
	}

	const lastRow = data.length - 1;

	data[0][0].readOnly = false;

	data.forEach((row, rowIndex) => {
		const lastCol = row.length - 1;

		row.forEach((col, colIndex) => {
			/* eslint-disable no-param-reassign */
			col.i = rowIndex;
			col.j = colIndex;
			col.lastCol = lastCol === colIndex;
			col.lastRow = lastRow === rowIndex;
			col.lastCell = lastRow === rowIndex && col.lastCol;
			col.className = classNames(
				col.className,
				`i_${rowIndex}`,
				`j_${colIndex}`,
				col.lastCol && 'last_col',
				col.lastRow && 'last_row',
				col.lastCell && 'last_cell',
				!rowIndex && !colIndex && 'read-only'
			);
			/* eslint-enable no-param-reassign */
		});
	});

	return data;
}

export function fixCMEDate(date) {
	return formatISO(parseISO(date), { representation: 'date' });
}

export function fixCMESettlements(settlements) {
	let prevSettle = settlements.find(({ settle }) => settle !== '-')?.settle;

	if (!prevSettle) {
		return [];
	}

	return settlements.map(({ settle, date }) => {
		const resDate = fixCMEDate(date);
		const resSettle = settle === '-' ? prevSettle : settle;
		prevSettle = resSettle;
		return { date: resDate, settle: Number.parseFloat(resSettle) };
	});
}

export function priceDecksToData({ assumptionKey, products, options }) {
	const replaceRows = (current, product, rows) => {
		const criteria = { label: 'Dates', value: 'dates', disabled: false };
		return {
			...current,
			subItems: {
				...current.subItems,
				row_view: {
					headers: { ...current.subItems.row_view.headers, criteria },
					rows,
				},
			},
		};
	};
	const result = clone(options);
	products.forEach(({ settlements, product, type }) => {
		const key = type === 'price' ? 'price' : 'differential';
		const fixedSettlements = fixCMESettlements(settlements);
		if (fixedSettlements.length === 0) {
			return;
		}
		const priceRows = fixedSettlements.map(({ date, settle }, i) => {
			let nextDate = settlements[i + 1]?.date && parseISO(settlements[i + 1]?.date);
			if (nextDate) {
				nextDate = formatISO(sub(nextDate, { days: 1 }), { representation: 'date' });
			} else {
				nextDate = 'Econ Limit';
			}
			// convert the start_date and end_date to MM/DD/YYYY from YYYY-MM-DD
			// example correct answer 09/1/2022
			// example incorrect answer 2022-09-01
			const convertCmeDate = (cmeDate) => {
				if (cmeDate === 'Econ Limit') return cmeDate;
				const [year, month, day] = cmeDate.split('-');
				return `${month}/${day}/${year}`;
			};
			return {
				[key]: settle,
				criteria: { start_date: convertCmeDate(date), end_date: convertCmeDate(nextDate) },
			};
		});
		if (type === 'price' && assumptionKey === AssumptionKey.pricing) {
			result.price_model ??= {};
			result.price_model[product] = replaceRows(result.price_model[product], product, priceRows);
		} else if (type === AssumptionKey.differentials && assumptionKey === AssumptionKey.differentials) {
			result.differentials ??= {};
			result.differentials.differentials_1.subItems[product] = replaceRows(
				result.differentials.differentials_1.subItems[product],
				product,
				priceRows
			);
		}
	});
	return result;
}

export function rowNumberRangeRateChange({ rows, value, key, index }) {
	if (!has(rows[index][key], 'start')) {
		rows[index][key] = {
			start: '',
			end: '',
		};
	}

	const len = rows.length;
	const cur = rows[index][key];

	if (index > 0) {
		const prev = rows[index - 1][key] || {};
		// prev.end = value;
		if (value > prev.start) {
			prev.end = value;
		}
	}

	if (index + 1 === len) {
		cur.start = value;
		cur.end = 'inf';
	} else {
		cur.start = value;
	}
}

export function rowNumberRangeChange({ rows, value, key, index }) {
	if (!has(rows[index][key], 'start')) {
		rows[index][key] = { start: '', end: '', period: '' };
	}

	const len = rows.length;
	const cur = rows[index][key];

	cur.period = value;

	if (index === 0) {
		cur.start = 1;
		cur.end = value;
	}

	if (index > 0) {
		const prev = rows[index - 1][key] || {};
		cur.start = prev.end + 1;
		cur.end = prev.end + value;
	}

	if (value >= 1) {
		let cum = cur.end;
		if (index + 1 !== len) {
			for (let i = index + 1; i < len; i += 1) {
				if (rows[i][key].period) {
					rows[i][key].start = cum + 1;
					rows[i][key].end = cum + rows[i][key].period;
					cum = rows[i][key].end;
				}
			}
		}
	}
}

export function rowDateRangeChange({ rows, value, key, index }) {
	if (!has(rows[index][key], 'start_date')) {
		rows[index][key] = { start_date: '', end_date: '' };
	}

	const len = rows.length;
	const cur = rows[index][key];
	if (index + 1 === len) {
		cur.start_date = value;
		cur.end_date = 'Econ Limit';
	} else {
		cur.start_date = value;
	}

	/*
	this function get input variable 'value' from SheetItemDateRange,
	which already converted to string with format mm/dd/yyyy
	can directly use new Date() to make it a "locally correct" date, then subtract 1 day to get previous end_date,
	which can be directly saved as previous end date with format mm/dd/yyyy
	*/

	if (index > 0) {
		const prev = rows[index - 1][key] || {};
		const localStartDate = new Date(value);
		prev.end_date = sub(localStartDate, { days: 1 }).toLocaleDateString();
	}
}

export function addDeleteRow({ check, rowValueKey }) {
	Object.keys(check).forEach((c) => {
		const oneCheck = check[c];
		const len = oneCheck.rows.length;
		const lastRow = oneCheck.rows[len - 1];
		if (oneCheck.skipCheck) {
			return;
		}

		if (len >= 2) {
			oneCheck.delete = true;
		}
		if (lastRow[rowValueKey] || lastRow[rowValueKey] === 0) {
			// fieldType as static will not make add change to true
			if (lastRow.criteria && lastRow.criteria.start_date) {
				// fieldType as date-range
				oneCheck.add = true;
			}
			if (lastRow.criteria && (lastRow.criteria.start || lastRow.criteria.start === 0)) {
				// fieldType as number-range
				oneCheck.add = true;
			}
		}

		delete oneCheck.rows;

		if (oneCheck.add || oneCheck.delete) {
			oneCheck.showBtn = true;
		}
	});
}

export function getAddDeleteItemsInline({ check, key, data, inlineBtnInfo, addRow, deleteRow }) {
	const btnInfo = inlineBtnInfo[key];
	const { row, col } = btnInfo;
	const inlineCheck = check[btnInfo.check];

	if (inlineCheck?.showBtn) {
		const btns = [
			<Button
				disabled={!inlineCheck.add}
				key={`${key}-add-row`}
				onClick={() => addRow(key)}
				primary
				faIcon={faPlus}
			/>,
			<Button
				disabled={!inlineCheck.delete}
				key={`${key}-del-row`}
				onClick={() => deleteRow(key)}
				warning
				faIcon={faMinus}
			/>,
		];

		data[row][col].rowBtns = btns;
	}
}
export function getShutInMaxDate(currRow, minDate) {
	if (!currRow?.repeat_range_of_dates) return null;
	if (currRow.repeat_range_of_dates.value === 'monthly' && minDate) {
		return new Date(minDate.getFullYear(), minDate.getMonth() + 1, 0); // last day of the month of minDate
	}
	if (currRow.repeat_range_of_dates.value === 'yearly' && minDate) {
		return new Date(minDate.getFullYear() + 1, 0, 0); // last day of the year of minDate
	}
	return null;
}

const readOnlyInfo = {
	// risking model shut in period
	total_occurrences: {
		dependentKey: 'repeat_range_of_dates',
		dependentValues: ['no_repeat'],
		dependentField: 'value',
	},
	scale_post_shut_in_end: {
		dependentKey: 'scale_post_shut_in_end_criteria',
		dependentValues: ['econ_model'],
		dependentField: 'value',
	},
	// prob capex
	mean: {
		dependentKey: 'distribution_type',
		dependentValues: ['na', 'triangular', 'uniform'],
		dependentField: 'value',
	},
	standard_deviation: {
		dependentKey: 'distribution_type',
		dependentValues: ['na', 'triangular', 'uniform'],
		dependentField: 'value',
	},
	upper_bound: {
		dependentKey: 'distribution_type',
		dependentValues: ['na'],
		dependentField: 'value',
	},
	lower_bound: {
		dependentKey: 'distribution_type',
		dependentValues: ['na'],
		dependentField: 'value',
	},
	mode: {
		dependentKey: 'distribution_type',
		dependentValues: ['na', 'normal', 'lognormal', 'uniform'],
		dependentField: 'value',
	},
	after_econ_limit: {
		dependentKey: 'after_econ_limit',
		dependentValues: ['yes'],
		dependentField: 'na',
	},
};

function checkRowFieldReadOnly(row, fieldKey) {
	if (row && fieldKey && row[fieldKey] !== undefined && readOnlyInfo[fieldKey] !== undefined) {
		const dependentKey = readOnlyInfo[fieldKey].dependentKey;
		const dependentValues = readOnlyInfo[fieldKey].dependentValues;
		const dependentField = readOnlyInfo[fieldKey] ? readOnlyInfo[fieldKey].dependentField : 'value';
		if (dependentValues.includes(row[dependentKey][dependentField])) {
			// row[dependentKey][dependentField] handles selection, criteria-select is not handled
			return true;
		}
	}
	return false;
}

export function createNewRow(row, columnFields, headers) {
	const newRow = clone(row);

	Object.keys(newRow).forEach((k) => {
		const columnField = columnFields[k];
		if (columnField?.fieldType === FieldType.number && columnField?.Default !== undefined) {
			newRow[k] = columnField?.Default;
		} else if (columnField?.fieldType === FieldType.headerSelect && headers) {
			const headerKey = headers[k].value;
			const selectedHeaderField = columnField.menuItems.filter(
				(headerField) => headerField.value === headerKey
			)[0];
			if (selectedHeaderField && selectedHeaderField?.Default !== undefined) {
				newRow[k] = selectedHeaderField.Default;
			} else {
				newRow[k] = '';
			}
		} else {
			newRow[k] = '';
		}
	});
	return newRow;
}
