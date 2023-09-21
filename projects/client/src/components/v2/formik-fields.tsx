import { getConvertFunc } from '@combocurve/forecast/helpers';
import { FieldConfig, FieldProps, FieldValidator, useFormikContext } from 'formik';
import produce from 'immer';
import _ from 'lodash';
import * as React from 'react';
import { CSSObject } from 'styled-components';

import { Field, useField } from '@/components/FormikPrefix';
import { Prefix } from '@/components/Prefix';
import { addHOCName, getValidateFn } from '@/components/shared';

import { Box } from './Box';
import MUICheckboxField from './CheckboxField';
import ReactDatePicker from './ReactDatePicker';
import MUISwitchField from './SwitchField';
import MUITextField from './TextField';
import MUIAutoComplete, { AutocompleteProps } from './misc/Autocomplete';
import MUIRadioGroupField from './misc/RadioGroupField';
import MUSelectField from './misc/SelectField';
import SimpleSelectFieldRaw from './misc/SimpleSelectField';

const CONTROL_PROPS_KEYS = ['validate', 'name', 'type', 'value', 'innerRef'];

const getMUPropsFromMeta = (meta: FieldProps['meta']) => ({
	error: meta.touched && !!meta.error,
	helperText: meta.touched && meta.error,
});

interface ParseFormatProps<P, F> {
	formatValue?: (parsed: P) => F;
	parseValue?: (formatted: F) => P;
}

const roundValue = (value, decimalPlaces = 4) => _.round(Number(value), decimalPlaces);

/**
 * Helper to make all the components have the same structure, will convert the component to a formik component.
 * Resulting component will accept formik's `Field` (or `useField`) properties
 *
 * @deprecated
 */
// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
export function withField<P extends object, FP extends Partial<P> = {}, MP extends Partial<P> = {}>(
	Component: React.ElementType<P>,
	{
		type,
		getPropsFromField = _.identity,
		getFieldStateProps,
		alternativeOnChange,
		sharedFields = [],
	}: {
		type?: string;
		getPropsFromField?(field: FieldProps['field']): FP;
		getFieldStateProps?(meta: FieldProps['meta']): MP;
		/**
		 * By default formik related props (eg validate and type) won't be passed to the component, you can bypass this
		 * behavior here
		 */
		sharedFields?: string[];
		alternativeOnChange?: boolean;
	} = {}
) {
	function parseNumber(v) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		if ((v as any) === '') {
			return v;
		}
		const asNumber = Number(v);
		if (Number.isFinite(asNumber)) {
			return asNumber;
		}
		return v;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	type Props<PP = any, F = any> = Omit<FieldConfig<any>, 'component' | 'as' | 'children'> &
		Omit<P, keyof FieldConfig | keyof FieldProps['field'] | keyof FP | keyof MP> &
		ParseFormatProps<PP, F>;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	function WithField<PP = any, F = any>(props: Props<PP, F>) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const controlProps = { type, ...(_.pick(props, CONTROL_PROPS_KEYS) as any) } as FieldConfig;
		const fieldProps = _.omit(props, [...CONTROL_PROPS_KEYS, 'formatValue', 'parseValue']) as P;
		const { type: propType = type } = controlProps;
		const { formatValue, parseValue = propType === 'number' ? parseNumber : undefined } = props;
		const [field, meta, { setValue }] = useField(controlProps);
		const extraProps = _.pick(props, sharedFields);

		const getEventValue = type === 'checkbox' ? (ev) => ev.target.checked : (ev) => ev.target.value;

		return (
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
			// @ts-expect-error
			<Component
				{...fieldProps}
				{...getPropsFromField(field)}
				{...extraProps}
				value={formatValue?.(field.value) ?? field.value}
				onChange={
					alternativeOnChange
						? (v) => setValue(parseValue?.(v) ?? v)
						: (ev) => setValue(parseValue?.(getEventValue(ev)) ?? getEventValue(ev))
				}
				{...getFieldStateProps?.(meta)}
			/>
		);
	}

	addHOCName(WithField, 'withField', Component);
	return WithField;
}

// reexported here for ease of access
export { Prefix };

export interface UnitConversionProps {
	convert?: { appUnit?: string; userUnit?: string } | string | false;
}

/** @deprecated */
export function getFieldProps({
	convert,
	value,
	setValue,
	decimalPlaces,
}: UnitConversionProps & {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	value: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	setValue: (newValue: any) => any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	InputProps?: any;
	decimalPlaces?: number | null;
}) {
	if (typeof convert === 'string') {
		convert = { userUnit: convert, appUnit: convert };
	}

	if (!convert || !convert?.userUnit || !convert?.appUnit) {
		return {};
	}

	const convertToApp = getConvertFunc(convert.userUnit, convert.appUnit);
	const convertToUser = getConvertFunc(convert.appUnit, convert.userUnit);

	return {
		value: convertToUser(value),
		onChange: (ev) => {
			setValue(convertToApp(Number(ev.target.value)));
		},
		onBlur: (ev) => {
			let newValue = convertToApp(Number(ev.target.value));
			if (decimalPlaces) {
				newValue = roundValue(newValue, decimalPlaces);
			}
			setValue(newValue);
		},
	};
}

// TODO cleanup text field, note some of these props are used in type curve normalization, go there and change it as well
/** @deprecated */
export function TextField({
	name,
	type,
	convert,
	validate,
	roundValue = false,
	...rest
}: { name: string; validate?: FieldValidator; roundValue?: boolean } & UnitConversionProps &
	React.ComponentProps<typeof MUITextField>) {
	const [field, meta, { setValue }] = useField({ name, type, validate });
	const decimalPlaces = type === 'number' && roundValue ? 4 : null;

	return (
		<MUITextField
			error={meta.touched && !!meta.error}
			helperText={meta.touched && meta.error}
			type={type}
			{...field}
			value={field.value ?? ''} // HACK this will make the material-ui text fields controllable even if value was not passed
			{...getFieldProps({ value: field.value, setValue, convert, decimalPlaces })}
			{...rest}
		/>
	);
}

/** @deprecated */
export function NumberRangeField({
	dif = 0,
	disabled,
	endLabel = 'Max',
	endName = '1',
	fieldLabel,
	fieldLabelStyles,
	isInteger,
	enforceMinMaxOnBlur = false,
	max = Number.POSITIVE_INFINITY,
	min = Number.NEGATIVE_INFINITY,
	name,
	onBlur: _onBlur,
	onFocus,
	required,
	size,
	startLabel = 'Min',
	startName = '0',
	variant,
}: {
	dif: number;
	disabled?: boolean | string;
	endLabel?: string;
	endName?: string;
	fieldLabel?: string;
	fieldLabelStyles?: CSSObject | string;
	isInteger?: boolean;
	enforceMinMaxOnBlur?: boolean;
	max?: number;
	min?: number;
	name: string;
	required?: boolean;
	size?: string;
	startLabel?: string;
	startName?: string;
	variant?: string;
	onBlur?: (e) => void;
	onFocus?: () => void;
}) {
	// formik on blur sets touched = true so error messages are displayed
	const [{ value, onBlur: formikOnBlur }] = useField({ name });

	const { setValues } = useFormikContext();
	const [activeMin, activeMax] = value;

	const onBlur = React.useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		(e: any) => {
			if (_onBlur) _onBlur(e);
			formikOnBlur(e);

			if (enforceMinMaxOnBlur) {
				let newMin = activeMin;
				let newMax = activeMax;

				if (activeMin < min) {
					newMin = min;
				}
				if (activeMax > max) {
					newMax = max;
				}

				setValues(
					produce((draft) => {
						draft[name] = [newMin, newMax];
					})
				);
			}
		},
		[_onBlur, activeMax, activeMin, enforceMinMaxOnBlur, formikOnBlur, max, min, name, setValues]
	);

	const sharedProps = React.useMemo(
		() => ({
			onBlur,
			onFocus,
			size,
			variant,
		}),
		[onBlur, onFocus, size, variant]
	);

	return (
		<Box css='& > *:not(:first-child) { margin-left: 0.5rem }' display='flex' alignItems='center'>
			{fieldLabel && <Box css={fieldLabelStyles}>{fieldLabel}</Box>}

			<Field
				type='number'
				name={`${name}.${startName}`}
				validate={getValidateFn({
					type: 'number',
					min,
					max: Math.min(max, _.get(value, endName) - dif),
					required,
					isInteger,
				})}
			>
				{({ field, meta }) => (
					<TextField
						blurOnEnter
						type='number'
						label={startLabel}
						{...field}
						disabled={disabled}
						error={meta.touched && meta.error}
						helperText={meta.touched && meta.error}
						{...sharedProps}
					/>
				)}
			</Field>
			<Field
				type='number'
				name={`${name}.${endName}`}
				validate={getValidateFn({
					type: 'number',
					min: Math.max(min, _.get(value, startName) + dif),
					max,
					required,
					isInteger,
				})}
			>
				{({ field, meta }) => (
					<TextField
						blurOnEnter
						type='number'
						label={endLabel}
						{...field}
						disabled={disabled}
						error={meta.touched && meta.error}
						helperText={meta.touched && meta.error}
						{...sharedProps}
					/>
				)}
			</Field>
		</Box>
	);
}

/** @deprecated */
export const SelectField = withField(MUSelectField, { getFieldStateProps: getMUPropsFromMeta });

/** @deprecated */
export const DatePicker = withField(ReactDatePicker, {
	getFieldStateProps: getMUPropsFromMeta,
	alternativeOnChange: true,
	getPropsFromField: ({ value, ...rest }) => ({ selected: value, ...rest }),
});

/** @deprecated */
export const CheckboxField = withField(MUICheckboxField, { type: 'checkbox' });

/** @deprecated */
export const RadioGroupField = withField(MUIRadioGroupField, {
	getFieldStateProps: getMUPropsFromMeta,
});

/** @deprecated */
export const SwitchField = withField(MUISwitchField, { type: 'checkbox' });

/** @deprecated */
export const SimpleSelectField = withField(SimpleSelectFieldRaw, { getFieldStateProps: getMUPropsFromMeta });

/** @deprecated */
export const AutoComplete = withField(
	({ onChange, ...props }: AutocompleteProps) => (
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		<MUIAutoComplete {...props} onChange={(_ev, value) => onChange(value)} />
	),
	{ getFieldStateProps: getMUPropsFromMeta, alternativeOnChange: true }
);
