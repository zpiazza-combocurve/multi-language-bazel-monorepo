import { useCallback } from 'react';

function useConvert({ format, parse }) {
	const onFormat = useCallback(
		(value) => {
			if (typeof format === 'function') {
				return format(value);
			}
			return value;
		},
		[format]
	);
	const onParse = useCallback(
		(value) => {
			if (typeof parse === 'function') {
				return parse(value);
			}
			return value;
		},
		[parse]
	);
	return { onFormat, onParse };
}

/** @deprecated Use formik-helpers components, don't mix normal components with formik, it's not needed everywhere */
export function useFormikField({ field, form, name, onChange, setFieldValue, value, format, parse }) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const inputProps = {} as any;

	/**
	 * Support Formik's `setFieldValue(field, value)` function:
	 *
	 * Here we are adding support for an additional prop `setFieldValue`, `onChange` continues to work the same.
	 */
	inputProps.value = value;
	inputProps.onChange = useCallback(
		(newValue, ...args) => {
			if (setFieldValue) {
				setFieldValue(name, newValue);
			}
			if (onChange) {
				return onChange(newValue, ...args);
			}
			return undefined;
		},
		[name, onChange, setFieldValue]
	);

	/**
	 * Support Formik's <Field /> component:
	 *
	 * Here we are adding support for an additional prop `field`, provided by Formik's `Field` component.
	 */
	const handleFieldOnChange = useCallback(
		(newValue) => form.setFieldValue(field.name, newValue),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[form?.setFieldValue, field?.name]
	);
	if (field && typeof field === 'object' && form && typeof form === 'object') {
		if (!field.name) {
			throw new Error('Prop `name` was not passed to `Field`');
		}
		inputProps.name = field.name;
		inputProps.onBlur = field.onBlur(field.name);
		inputProps.onChange = handleFieldOnChange;
		inputProps.value = field.value;
	}

	/**
	 * Support redux-form style format/parse Here we are adding support for 2 additional props `format` and `parse`.
	 * (Not necessarily a Formik concern, yet). There's an open issue to add this to formik:
	 * https://github.com/jaredpalmer/formik/issues/1525
	 *
	 * - `format` changes the value coming from the form state before is passed to the input component
	 * - `parse` changes the value coming from the input compnent before is stored in the form state
	 *
	 * @example
	 * 	<Field format={convertIdxToDate} parse={convertDateToIdx} ... />,
	 */
	const { onFormat, onParse } = useConvert({ format, parse });
	const prevOnChange = inputProps.onChange;

	inputProps.value = onFormat(inputProps.value);
	inputProps.onChange = useCallback(
		// add support for parse()
		(newValue, ...extra) => prevOnChange(onParse(newValue), ...extra),
		[prevOnChange, onParse]
	);

	return inputProps;
}
