import { Chip, TextFieldProps } from '@material-ui/core';
import { Autocomplete, AutocompleteProps } from '@material-ui/lab';
import _ from 'lodash';
import { ForwardedRef, KeyboardEventHandler, ReactNode, forwardRef } from 'react';

import Checkbox from '../Checkbox';
import TextField from '../TextField';

export type MultiSelectFieldProps = {
	name?: string;
	label?: string;
	required?: boolean;
	menuItems: { value: string; label: string }[];
	fixedOptions?: string[];
	defaultLabel?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onChange?(newValue: any): void;
	disableTags?: boolean;
	variant?: 'standard' | 'filled' | 'outlined';
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	renderBeforeOptionLabel?(value: any): ReactNode;
	onTextFieldKeyDown?: KeyboardEventHandler<HTMLDivElement>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
} & Omit<AutocompleteProps<any, any, any, any>, 'options' | 'renderInput' | 'onChange'> &
	Pick<TextFieldProps, 'error' | 'helperText'>;

/**
 * @example
 * 	const [state, setState] = useState([]);
 *
 * 	<MultiSelectField
 * 		value={state}
 * 		onChange={setState}
 * 		menuItems={[
 * 			{ value: 'user', label: 'User' },
 * 			{ value: 'admin', label: 'Admin' },
 * 		]}
 * 	/>;
 */
function MultiSelectField(
	{
		menuItems,
		label,
		onChange,
		required = false,
		fixedOptions = [],
		error,
		helperText,
		defaultLabel = 'Unknown',
		disableTags = false,
		variant = 'standard',
		renderBeforeOptionLabel,
		onTextFieldKeyDown,
		groupBy,
		renderGroup,
		...rest
	}: MultiSelectFieldProps,
	ref: ForwardedRef<unknown>
) {
	const menuItemMap = _.keyBy<{ value: string; label: string }>(menuItems, 'value');
	return (
		<Autocomplete
			ref={ref}
			{...rest}
			multiple
			options={menuItems.map(({ value: itemValue }) => itemValue)}
			getOptionLabel={(itemValue: string) => menuItemMap[itemValue].label}
			onChange={(_event, newValue) => onChange?.(_.uniq([...fixedOptions, ...newValue]))}
			disableCloseOnSelect
			renderOption={(itemValue, { selected }) => (
				<>
					<Checkbox
						style={{ marginRight: 8 }}
						disabled={fixedOptions.indexOf(itemValue) !== -1}
						checked={selected}
					/>
					{renderBeforeOptionLabel?.(itemValue)}
					{menuItemMap[itemValue].label}
				</>
			)}
			groupBy={groupBy}
			renderGroup={renderGroup}
			renderTags={(tagValue, getTagProps) =>
				disableTags
					? undefined
					: tagValue.map((itemValue, index) => (
							<Chip
								key={index.toString()}
								label={menuItemMap[itemValue]?.label ?? defaultLabel}
								{...getTagProps({ index })}
								disabled={fixedOptions.indexOf(itemValue) !== -1}
							/>
					  ))
			}
			renderInput={(params) => (
				<TextField
					label={label}
					required={required}
					error={error}
					helperText={helperText}
					variant={variant}
					onKeyDown={onTextFieldKeyDown}
					{...params}
				/>
			)}
		/>
	);
}

export default forwardRef(MultiSelectField);
