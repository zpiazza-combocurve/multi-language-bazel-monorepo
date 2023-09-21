import MUAutocomplete, { AutocompleteProps as MUAutocompleteProps } from '@material-ui/lab/Autocomplete';
import _ from 'lodash';
import { forwardRef } from 'react';

import TextField, { TextFieldProps } from '../TextField';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export type AutocompleteProps<T = any, D extends boolean = boolean, F extends boolean = boolean> = Omit<
	MUAutocompleteProps<T, false, D, F>,
	'renderInput'
> &
	Pick<
		TextFieldProps,
		| 'InputLabelProps'
		| 'InputProps'
		| 'SelectProps'
		| 'autoFocus'
		| 'error'
		| 'helperText'
		| 'inputRef'
		| 'label'
		| 'name'
		| 'placeholder'
		| 'size'
		| 'variant'
		| 'id'
	>;

const TEXT_FIELD_PROPS = [
	'InputLabelProps',
	'InputProps',
	'SelectProps',
	'autoFocus',
	'error',
	'helperText',
	'inputRef',
	'label',
	'name',
	'placeholder',
	'size',
	'variant',
];
const SHARED_PROPS = ['size'];

function Autocomplete(props: AutocompleteProps, ref) {
	return (
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		<MUAutocomplete
			ref={ref}
			{..._.omit(props, TEXT_FIELD_PROPS)}
			{..._.pick(props, SHARED_PROPS)}
			renderInput={(params) => (
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
				// @ts-expect-error
				<TextField
					{...params}
					{..._.pick(props, TEXT_FIELD_PROPS)}
					InputProps={{ ...props.InputProps, ...params.InputProps }}
				/>
			)}
		/>
	);
}

export default forwardRef(Autocomplete);
