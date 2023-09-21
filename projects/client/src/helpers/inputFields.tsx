import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import { useEffect, useState } from 'react';

import { parseNum } from './sheetItems';

const checkNumErr = (val, min, max, required = false) => {
	const parsed = parseNum(val);

	if (parsed === '' && required) {
		return { error: true, errorText: 'This field is required' };
	}
	if (+parsed < min && min !== null) {
		return { error: true, errorText: `Minimum allowed value is ${min}` };
	}
	if (+parsed > max && max !== null) {
		return { error: true, errorText: `Maximum allowed value is ${max}` };
	}
	return { error: false, errorText: '' };
};

const checkNumRangeErr = ({ values, min, max, dif, invalid, required = false }) => {
	const parsed = values.map((v) => parseNum(v));
	const errors = { lower: { error: false, msg: '' }, upper: { error: false, msg: '' } };

	// check lower first
	const [lower, upper] = parsed;
	if (lower === '' && required) {
		errors.lower = { error: true, msg: 'This field is required' };
	}
	if (lower < min) {
		errors.lower = { error: true, msg: `Minimum allowed value is ${min}` };
	}
	if (lower > max) {
		errors.lower = { error: true, msg: `Maximum allowed value is ${max}` };
	}
	if (lower > upper - dif && upper - dif > min) {
		errors.lower = { error: true, msg: `Must be less than upper range` };
	}
	if (invalid.includes(lower)) {
		errors.lower = { error: true, msg: 'Invalid value' };
	}

	// check upper value
	if (upper === '' && required) {
		errors.upper = { error: true, msg: 'This field is required' };
	}
	if (upper < min) {
		errors.upper = { error: true, msg: `Minimum allowed value is ${min}` };
	}
	if (upper > max) {
		errors.upper = { error: true, msg: `Maximum allowed value is ${max}` };
	}
	if (upper < lower + dif && lower + dif < max) {
		errors.upper = { error: true, msg: `Must be greater than lower range` };
	}
	if (invalid.includes(upper)) {
		errors.upper = { error: true, msg: 'Invalid value' };
	}

	return errors;
};

type NumberFieldProps = {
	id;
	clearErrorOnBlur;
	max;
	min;
	name;
	onBlur;
	onError;
	required;
	setVal;
	value;
};

const NumberField = (props: NumberFieldProps) => {
	// pull out min/max it's causing some default title to appear on the field
	const { id, name, value, onBlur, min, max, required, onError, setVal, clearErrorOnBlur, ...rest } = props;

	const [state, setState] = useState({ error: false, errorText: '' });

	const { error, errorText } = state;

	useEffect(() => {
		setState(checkNumErr(value, min, max, required));
	}, [value, min, max, required]);

	const handleChange = (...args) => {
		const val = parseNum(args[0].target.value);
		const check = checkNumErr(val, min, max, required);

		setState(checkNumErr(value, min, max, required));

		setVal(val, name);
		onError(check.error, name);
	};

	const handleBlur = () => {
		if (clearErrorOnBlur) {
			const { error } = checkNumErr(value, min, max, required);
			setState({ error, errorText: '' });
			onBlur(value, name);
		} else {
			onBlur(value, name);
		}
	};

	const handleKeyDown = (e) => {
		if (e.key === 'Enter') {
			document.getElementById(id)?.blur();
		}
	};

	return (
		<TextField
			{...rest}
			id={id}
			error={error}
			helperText={errorText}
			onBlur={handleBlur}
			onChange={handleChange}
			onKeyDown={handleKeyDown}
			type='number'
			value={value}
		/>
	);
};

NumberField.defaultProps = {
	className: '',
	clearErrorOnBlur: false,
	disabled: false,
	id: '',
	label: '',
	max: Infinity,
	min: 0,
	name: '',
	// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
	onBlur: () => {},
	// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
	onError: () => {},
	placeholder: '',
	required: false,
	// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
	setVal: () => {},
};

const getInitialState = (props) => ({
	errors: {
		lower: { error: false, msg: '' },
		upper: { error: false, msg: '' },
	},
	lower: parseNum(props.values[0]),
	upper: parseNum(props.values[1]),
});

type NumberRangeFieldProps = {
	values;
	min;
	max;
	dif;
	invalid;
	required;
	setVal;
	onError;
	names;
	innerKey?; // TODO probably not needed, check if useful
	onBlur;
	disabled;
	className;
	showLabel;
	cy?; // TODO what is cy for?
	rightIcon?;
};

const useNumberRangeFieldsStyles = makeStyles({
	root: {
		margin: '.5rem 0',
		'& .MuiInputBase-input': {
			fontSize: '13px',
		},
		'& .MuiInput-underline:before': {
			borderBottomColor: 'rgba(255, 255, 255, .12)',
		},
	},
});

const NumberRangeField = (props: NumberRangeFieldProps) => {
	const [state, setState] = useState(getInitialState(props));

	const styledClassName = useNumberRangeFieldsStyles();

	const {
		values,
		min,
		max,
		dif,
		invalid,
		required,
		setVal,
		onError,
		names,
		innerKey,
		onBlur,
		disabled,
		className,
		showLabel,
		cy,
	} = props;
	const [firstValue, secondValue] = values;

	useEffect(() => {
		const lower = parseNum(firstValue);
		const upper = parseNum(secondValue);
		const errors = checkNumRangeErr({ values: [lower, upper], min, max, dif, invalid, required });
		setState({ errors, lower, upper });
	}, [firstValue, secondValue, min, max, dif, invalid, required]);

	const handleChange = (...args) => {
		const val = parseNum(args[0].target.value);

		const id = args[0].target.id;
		const name = id === 'lower' ? names[0] : names[1];

		let { lower, upper } = state;
		const inputArr = id === 'lower' ? [val, upper] : [lower, val];
		const errors = checkNumRangeErr({ values: inputArr, min, max, dif, invalid, required });

		if (id === 'lower') {
			lower = val;
		} else {
			upper = val;
		}

		setState({ errors, lower, upper });
		setVal(val, name);
		onError(errors.lower.error, names[0]);
		onError(errors.upper.error, names[1]);
	};

	const { errors, lower, upper } = state;

	return (
		<section
			className='number-range-field'
			css={`
				display: flex;
				gap: ${({ theme }) => theme.spacing(1)}px;
			`}
		>
			<TextField
				id='lower'
				className={classNames(className, 'lower-input-range', styledClassName.root)}
				data-cy={`${cy}-lower`}
				disabled={disabled}
				error={errors.lower.error}
				helperText={errors.lower.msg}
				key={`${innerKey}-lower`}
				label={showLabel ? `Min (${min})` : undefined}
				onBlur={onBlur}
				onChange={handleChange}
				placeholder={`Min (${min})`}
				type='number'
				value={lower}
			/>

			<TextField
				id='upper'
				className={classNames(className, 'upper-input-range', styledClassName.root)}
				data-cy={`${cy}-upper`}
				disabled={disabled}
				error={errors.upper.error}
				helperText={errors.upper.msg}
				key={`${innerKey}-upper`}
				label={showLabel ? `Max (${max})` : undefined}
				onBlur={onBlur}
				onChange={handleChange}
				placeholder={`Max (${max})`}
				type='number'
				value={upper}
			/>
		</section>
	);
};

NumberRangeField.defaultProps = {
	className: '',
	cy: '',
	dif: 0.2,
	disabled: false,
	invalid: [],
	max: 999999,
	min: 0,
	names: [],
	// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
	onBlur: () => {},
	// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
	onError: () => {},
	required: false,
	// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
	setVal: () => {},
	showLabel: true,
};

export { NumberField, NumberRangeField };
