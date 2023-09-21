import { InfoIcon } from '.';
import { Checkbox, FormControl, FormControlLabel, FormGroup, FormHelperText, FormLabel } from '..';
import { TextFieldProps } from '../TextField';

export interface CheckboxGroupFieldItem {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	value: any;
	label?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	key?: any;
	disabled?: boolean;
}
export type CheckboxGroupFieldProps = {
	disabled?: boolean;
	items: Array<CheckboxGroupFieldItem>;
	label?: string;
	tooltipTitle?: string;
	onChange?(newValue): void;
	value: string[];
	row?: boolean;
} & Pick<TextFieldProps, 'error' | 'helperText'>;
export default function CheckboxGroupField({
	disabled: allDisabled,
	items,
	onChange,
	value,
	helperText,
	error,
	label,
	tooltipTitle,
	row,
	...rest
}: CheckboxGroupFieldProps) {
	const handleChange = (item) => {
		if (!onChange) return;
		if (value.includes(item)) return onChange(value.filter((i) => i !== item));
		else return onChange([...value, item]);
	};

	const isChecked = (item) => value.includes(item);

	return (
		<FormControl {...rest} error={error}>
			{label && (
				<FormLabel component='legend'>
					{label} {tooltipTitle && <InfoIcon tooltipTitle={tooltipTitle} withLeftMargin />}
				</FormLabel>
			)}
			<FormGroup row={row}>
				{items.map(({ value: itemValue, label: itemLabel, key, disabled }) => (
					<FormControlLabel
						key={key ?? itemLabel}
						disabled={disabled || allDisabled}
						label={itemLabel}
						control={<Checkbox checked={isChecked(itemValue)} />}
						onChange={() => handleChange(itemValue)}
					/>
				))}
			</FormGroup>
			{helperText && <FormHelperText error={error}>{helperText}</FormHelperText>}
		</FormControl>
	);
}
