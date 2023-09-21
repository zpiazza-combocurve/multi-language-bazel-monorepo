/**
 * @file Material-ui + react-hook-form `Controller` integration, aking to formik-fields
 * @example
 * 	import { useForm } from 'react-hook-form';
 *
 * 	import { Button, RHFTextField } from '@/components/v2';
 *
 * 	const { control, handleSubmit } = useForm({
 * 		defaultValues: { name: 'World', greeting: 'Hello' },
 * 		mode: 'onChange',
 * 	});
 *
 * 	return (
 * 		<form
 * 			onSubmit={handleSubmit((values) => {
 * 				// handle submit
 * 			})}
 * 		>
 * 			<RHFTextField control={control} name='name' />
 * 			<RHFTextField control={control} name='greeting' />
 * 			<Button type='submit'>Submit</Button>
 * 		</form>
 * 	);
 *
 * @note convetion is to use `RHF` as a prefix for react-hook-form fields, eg withRHFControl(TextField) would be RHFTextField
 */
import { ReactNode } from 'react';
import {
	ControllerFieldState,
	ControllerRenderProps,
	DefaultValues,
	FieldValues,
	FormProvider,
	SubmitHandler,
	UseFormReturn,
} from 'react-hook-form';

import { withRHFControl } from '@/components/react-hook-form-helpers';

import CheckboxField from './CheckboxField';
import ReactDatePicker from './ReactDatePicker';
import SwitchField from './SwitchField';
import TextField from './TextField';
import Autocomplete from './misc/Autocomplete';
import CircleColorPicker from './misc/CircleColorPicker';
import ColorPickerField from './misc/ColorPickerField';
import MultiSelectField from './misc/MultiSelectField';
import RadioGroupField from './misc/RadioGroupField';
import SelectField from './misc/SelectField';
import SliderField from './misc/SliderField';
import TagsMultiSelectField from './misc/TagsMultiSelectField';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function RHFForm<T extends FieldValues = any>({
	id,
	className,
	form,
	onSubmit,
	defaultValues,
	children,
}: {
	id?: string;
	className?: string;
	form: UseFormReturn<T>;
	onSubmit?: SubmitHandler<T>;
	defaultValues?: DefaultValues<T>;
	children?: ReactNode;
}) {
	return (
		<FormProvider {...form}>
			<form
				id={id}
				className={className}
				onSubmit={onSubmit && form.handleSubmit(onSubmit)}
				onReset={() => {
					if (defaultValues) {
						form.reset(defaultValues);
					}
				}}
			>
				{children}
			</form>
		</FormProvider>
	);
}

export const getMuiPropsFromRHFFieldState = (fieldState: ControllerFieldState) => ({
	error: !!fieldState.error,
	...(fieldState.error?.message ? { helperText: fieldState.error?.message } : {}),
});

const getMuiCheckboxPropsFromRHFField = ({ value, ...rest }: ControllerRenderProps) => ({ checked: value, ...rest });

const getReactDatePickerPropsFromRHFField = ({ value, ...rest }: ControllerRenderProps) => ({
	selected: value,
	...rest,
});

export const RHFTextField = withRHFControl(TextField, {
	getPropsFromFieldState: getMuiPropsFromRHFFieldState,
});

export const RHFSelectField = withRHFControl(SelectField, {
	getPropsFromFieldState: getMuiPropsFromRHFFieldState,
});

export const RHFReactDatePicker = withRHFControl(ReactDatePicker, {
	getPropsFromFieldState: getMuiPropsFromRHFFieldState,
	getPropsFromField: getReactDatePickerPropsFromRHFField,
});

export const RHFCheckboxField = withRHFControl(CheckboxField, {
	getPropsFromField: getMuiCheckboxPropsFromRHFField,
	defaultValue: false,
});

export const RHFSwitchField = withRHFControl(SwitchField, {
	getPropsFromField: getMuiCheckboxPropsFromRHFField,
	defaultValue: false,
});

export const RHFRadioGroupField = withRHFControl(RadioGroupField, {
	getPropsFromFieldState: getMuiPropsFromRHFFieldState,
});

export const RHFMultiSelectField = withRHFControl(MultiSelectField, {
	getPropsFromFieldState: getMuiPropsFromRHFFieldState,
});

export const RHFTagsMultiSelectField = withRHFControl(TagsMultiSelectField, {
	getPropsFromFieldState: getMuiPropsFromRHFFieldState,
});

export const RHFAutocomplete = withRHFControl(Autocomplete, {
	getPropsFromFieldState: getMuiPropsFromRHFFieldState,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	getPropsFromField: ({ freeSolo, value, onChange, ...rest }: any) => {
		if (freeSolo) {
			return {
				freeSolo: true,
				...rest,
				inputValue: value,
				onInputChange: (_ev, newValue) => onChange(newValue),
			};
		}
		return { value, onChange: (_ev, newValue) => onChange(newValue), ...rest };
	},
});

export const RHFColorPickerField = withRHFControl(ColorPickerField, {
	getPropsFromFieldState: getMuiPropsFromRHFFieldState,
});

export const RHFCircleColorPicker = withRHFControl(CircleColorPicker);

export const RHFSliderField = withRHFControl(SliderField, {
	getPropsFromField: (props: ControllerRenderProps) => ({
		...props,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		onChange: ((_ev, value) => props.onChange(value)) as any,
	}),
});

/** TextField but enforces numerical inputs only onChange; casts value to number or defaults to 0 onBlur */
export const RHFNumberField = withRHFControl(TextField, {
	getPropsFromFieldState: getMuiPropsFromRHFFieldState,
	getPropsFromField: (field) => ({
		...field,
		onChange: (ev) => {
			// add exceptions for values starting with a decimal point (.) or negative sign (-)
			if (ev.target.value === '.' || ev.target.value === '-') {
				return field.onChange(ev.target.value);
			}
			return field.onChange(!Number.isNaN(Number(ev.target.value)) ? ev.target.value : field.value);
		},
		onBlur: (ev) => {
			return field.onChange(Number.isFinite(Number(ev.target.value)) ? Number(ev.target.value) : 0);
		},
	}),
});
