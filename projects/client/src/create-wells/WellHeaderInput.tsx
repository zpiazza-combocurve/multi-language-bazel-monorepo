import { useMemo } from 'react';

import { Autocomplete, ReactDatePicker, SwitchField, TextField } from '@/components/v2';

import { WellHeaderValue } from './models';
import { multiSelectCSS, textFieldCSS } from './shared';

const WellHeaderInput = ({
	type,
	field,
	value = undefined,
	label,
	helperText = undefined,
	onChange,
	options,
	fullWidth = true,
	inputCss,
}: {
	type: string;
	field: string;
	value?: WellHeaderValue;
	label: string;
	helperText?: string;
	onChange: (key: string, value: WellHeaderValue) => void;
	options?: { label: string; value: string }[];
	fullWidth?: boolean;
	inputCss?: string;
}) => {
	const menuItems = useMemo(() => options?.map((o) => o.value) ?? [], [options]);

	switch (type) {
		case 'multi-select':
			if (options) {
				return (
					<Autocomplete
						label={label}
						options={menuItems}
						value={value}
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
						getOptionLabel={(val) => options.find((o) => o.value === val)!.label}
						onChange={(_, newValue) => onChange(field, newValue)}
						variant='outlined'
						fullWidth={fullWidth}
						css={`
							${inputCss} ${multiSelectCSS}
						`}
						error={!!helperText}
						helperText={helperText}
					/>
				);
			}
			return (
				<TextField
					type={type}
					label={label}
					value={value}
					onChange={(e) => onChange(field, e.target.value)}
					variant='outlined'
					fullWidth={fullWidth}
					css={`
						${inputCss} ${textFieldCSS}
					`}
					error={!!helperText}
					helperText={helperText}
				/>
			);
		case 'date':
			return (
				<ReactDatePicker
					asUtc
					label={label}
					onChange={(value) => onChange(field, value as Date)}
					selected={value as Date}
					variant='outlined'
					fullWidth={fullWidth}
					css={`
						${inputCss} ${textFieldCSS}
					`}
					error={!!helperText}
					helperText={helperText}
				/>
			);
		case 'boolean':
			return (
				<SwitchField
					label={value ? 'Yes' : 'No'}
					checked={value as boolean}
					onChange={(e) => onChange(field, e.target.checked)}
					css={inputCss}
				/>
			);
		case 'number':
			return (
				<TextField
					type={type}
					label={label}
					value={value}
					onChange={(e) => onChange(field, +e.target.value)}
					variant='outlined'
					fullWidth={fullWidth}
					css={`
						${inputCss} ${textFieldCSS}
					`}
					error={!!helperText}
					helperText={helperText}
				/>
			);
		case 'string':
		default:
			return (
				<TextField
					type='text'
					label={label}
					value={value}
					onChange={(e) => onChange(field, e.target.value)}
					variant='outlined'
					fullWidth={fullWidth}
					css={`
						${inputCss} ${textFieldCSS}
					`}
					error={!!helperText}
					helperText={helperText}
				/>
			);
	}
};

export default WellHeaderInput;
