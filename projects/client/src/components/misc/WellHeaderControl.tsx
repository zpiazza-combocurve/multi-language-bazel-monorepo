import { TextFieldProps } from '@material-ui/core';
import _ from 'lodash';
import { memo } from 'react';
import { FieldValues, UseControllerProps } from 'react-hook-form';
import * as yup from 'yup';

import { RHFAutocomplete, RHFNumberField, RHFReactDatePicker, RHFTextField } from '@/components/v2';
import { hasNonWhitespace } from '@/helpers/text';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export interface WellHeaderControlProps<T extends FieldValues = any> extends Omit<UseControllerProps<T>, 'control'> {
	className?: string;
	label: string | JSX.Element;
	type: string;
	options?: { label: string; value: string }[];
	size?: TextFieldProps['size'];
	kind?: string;
	readOnly?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
function getAutoCompleteOptions(items: { value: any; label: string }[]) {
	const byValue = _.keyBy(items, 'value');
	return {
		options: _.map(items, 'value'),
		getOptionLabel: (value) => {
			return byValue[value]?.label ?? value;
		},
	};
}

// https://github.com/jquense/yup/issues/332
const numberSchema = yup.number().typeError('Invalid Input - Please enter a number');

function getValidate(schema) {
	return (value) => {
		try {
			if (value != null && value !== '') {
				schema.validateSync(value);
			}
			return true;
		} catch (err) {
			return err.errors[0];
		}
	};
}

const validateNumber = getValidate(numberSchema);

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
function WellHeaderControl<T extends FieldValues = any>({
	className,
	label,
	name,
	options,
	type,
	size,
	kind,
	readOnly,
	defaultValue,
}: WellHeaderControlProps<T>) {
	const shared = _.pickBy(
		{
			name,
			label,
			fullWidth: true,
			InputLabelProps: { shrink: true },
			className,
			size,
			InputProps: readOnly ? { readOnly } : undefined,
			readOnly,
			defaultValue,
		},
		(v) => v != null
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	) as any;

	switch (type) {
		case 'multi-select':
			if (options) {
				return (
					<RHFAutocomplete
						freeSolo
						{...shared}
						{...getAutoCompleteOptions(options.map((o) => ({ value: o.label, label: o.value })))} // value and label are somehow swapped :\, this is from well headers types
					/>
				);
			}
			return <RHFTextField {...shared} />;
		case 'date':
			return <RHFReactDatePicker {...shared} asUtc={kind === 'date'} />;
		case 'boolean':
			return (
				<RHFAutocomplete
					{...shared}
					{...getAutoCompleteOptions([
						{ value: false, label: 'No' },
						{ value: true, label: 'Yes' },
					])}
				/>
			);
		case 'number':
			return <RHFNumberField {...shared} rules={{ validate: validateNumber }} />;
		case 'string':
		default:
			return (
				<RHFTextField
					{...shared}
					rules={name === 'well_name' ? { required: true, validate: (v) => hasNonWhitespace(v) } : undefined}
				/>
			);
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export default memo(WellHeaderControl) as <T extends FieldValues = any>(
	props: WellHeaderControlProps<T>
) => JSX.Element;
