import { faCheckCircle, faChevronDown, faCircle, faExclamation } from '@fortawesome/pro-regular-svg-icons';
import { FieldProps, FieldValidator } from 'formik';
import _ from 'lodash';
import * as React from 'react';
import { useState } from 'react';
import { SelectField, SelectionControlGroup, TextField } from 'react-md';

import { withField } from '@/components/v2/formik-fields';
import { Resolver, resolveValue } from '@/helpers/promise';

import Button from './Button';
import { InptCheckbox } from './Checkbox';
import { FontIcon } from './FontIcon';
import { ValidateProps, addHOCName, getValidateFn, withDefaultProps, withFakeId, withInlineLabel } from './shared';
import { ReactDatePicker } from './v2';

// +Custom Components
interface CheckboxButtonProps {
	onChange: (newValue: boolean) => void;
	defaultChecked?: boolean;
	value?: boolean;
	onLabel: string;
	offLabel: string;
}

/** Like a checkbox but it's a button */
function CheckboxButton({ onChange, defaultChecked, value, onLabel, offLabel, ...rest }: CheckboxButtonProps) {
	return (
		<Button onClick={() => onChange(!value)} {...rest}>
			{value ?? defaultChecked ? onLabel : offLabel}
		</Button>
	);
}

const RawSelectField = withFakeId(
	withDefaultProps(SelectField, {
		dropdownIcon: <FontIcon rightIcon>{faChevronDown}</FontIcon>,
		simplifiedMenu: false,
		sameWidth: true,
	})
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
interface AsyncSelectFieldProps<R = any> {
	label: string;
	select: Resolver<R | undefined | null>;
	error?: string | boolean;
	onChange: (newValue: R) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	value?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	checkValue?: any;
}

function AsyncSelectField<R>({
	label,
	select,
	error,
	onChange,
	value,
	checkValue,
	...props
}: AsyncSelectFieldProps<R>) {
	const [loading, setLoading] = useState(false);

	const handleClick = async () => {
		try {
			setLoading(true);
			const result = await resolveValue(select);
			if (result) {
				onChange(result);
			}
		} finally {
			setLoading(false);
		}
	};
	return (
		<Button
			{...props}
			onClick={handleClick}
			disabled={loading}
			faIcon={(!value || !checkValue) && faExclamation}
			warningAlt={!value || !checkValue}
			tooltipLabel={error}
			fullWidth
			fullHeight
		>
			{label}
		</Button>
	);
}
// -Custom Components

/** Will add validation to the formik component */
function withExField<P extends { validate?: FieldValidator }, F extends keyof ValidateProps>(
	Component: React.ElementType<P>,
	// TODO improve names
	{ validateFields = [], sharedFields = [] }: { validateFields?: F[]; sharedFields?: F[] } = {}
) {
	function ComponentEx({ validate, ...props }: P & Pick<ValidateProps, F>, ref) {
		const ownProps = _.omit(props, validateFields);
		const validateProps = _.pick(props, validateFields);
		const sharedProps = _.pick(props, sharedFields);
		return (
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
			// @ts-expect-error
			<Component ref={ref} {...ownProps} {...sharedProps} validate={validate ?? getValidateFn(validateProps)} />
		);
	}
	return addHOCName(React.forwardRef(ComponentEx), 'withExField', Component);
}

const getRMDPropsFromMeta = (meta: FieldProps['meta']) => ({
	error: meta.touched && !!meta.error,
	errorText: meta.touched && meta.error,
});

// TODO add * on required fields
/** @deprecated Use react-hook-form or the mui+formik wrappers in @/components/v2/formik-fields */
export const FormikSelectField = withInlineLabel(
	withExField(
		withField(RawSelectField, {
			alternativeOnChange: true,
			getFieldStateProps: getRMDPropsFromMeta,
		}),
		{ validateFields: ['required'] }
	)
);

// TODO add * on required fields
/** @deprecated Use react-hook-form or the mui+formik wrappers in @/components/v2/formik-fields */
export const FormikTextField = withExField(
	withField(TextField, {
		alternativeOnChange: true,
		getFieldStateProps: getRMDPropsFromMeta,
		sharedFields: ['type'],
	}),
	{ validateFields: ['required', 'type', 'min', 'max', 'isInteger'], sharedFields: ['type'] }
);

/** @deprecated Use react-hook-form or the mui+formik wrappers in @/components/v2/formik-fields */
export const FormikCheckbox = withField(withFakeId(InptCheckbox), {
	alternativeOnChange: true,
	type: 'checkbox',
});

/** @deprecated Use react-hook-form or the mui+formik wrappers in @/components/v2/formik-fields */
export const FormikCheckboxButton = withField(CheckboxButton, { alternativeOnChange: true });

// TODO check if these properties are needed
// const [field, { error, touched }, { setValue, setTouched }] = useField({
// onFocus={() => setTouched(true)}
// onBlur={() => setTouched(true)}
/** @deprecated Use react-hook-form or the mui+formik wrappers in @/components/v2/formik-fields */
export const FormikDatePicker = withExField(
	withField(ReactDatePicker, {
		alternativeOnChange: true,
		getFieldStateProps: getRMDPropsFromMeta,
		type: 'date',
	}),
	{ validateFields: ['required'] }
);

/** @deprecated Use react-hook-form or the mui+formik wrappers in @/components/v2/formik-fields */
export const FormikAsyncSelectField = withExField(
	withField(AsyncSelectField, {
		alternativeOnChange: true,
		getFieldStateProps: (meta) => ({ error: meta.touched && meta.error }),
	}),
	{ validateFields: ['required'] }
);

/** @deprecated Use react-hook-form or the mui+formik wrappers in @/components/v2/formik-fields */
export const FormikRadioButtonSelect = withExField(
	withField(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		withDefaultProps(SelectionControlGroup as any, {
			type: 'radio',
			uncheckedRadioIcon: <FontIcon>{faCircle}</FontIcon>,
			checkedRadioIcon: <FontIcon>{faCheckCircle}</FontIcon>,
		}),
		{
			alternativeOnChange: true,
			// @ts-expect-error SelectionControlGroup typings are not so good
			getFieldStateProps: getRMDPropsFromMeta,
		}
	),
	{ validateFields: ['required'] }
);
