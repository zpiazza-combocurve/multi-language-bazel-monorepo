import { MenuItem, TextField, TextFieldProps } from '@material-ui/core';
import { ForwardedRef, forwardRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export interface MenuItem<V = any> {
	key?: string;
	label: string | JSX.Element;
	value?: V;
	icon?: JSX.Element;
	disabled?: boolean;
	css?: string;
}

export type SelectFieldProps = { menuItems: MenuItem[]; inline?: boolean } & TextFieldProps;

/**
 * Wrapper over `Select` from material-ui
 *
 * Adds `menuItems` property to make it easier to move from react-md
 */
function SelectField({ menuItems, ...rest }: SelectFieldProps, ref: ForwardedRef<HTMLDivElement>) {
	return (
		<TextField {...rest} select ref={ref}>
			{menuItems.map(({ key, label, value, disabled, icon, css }) => (
				<MenuItem key={key || value} value={value} disabled={disabled} css={css}>
					{icon}
					{icon ? ' ' : ''}
					{label}
				</MenuItem>
			))}
		</TextField>
	);
}

export default forwardRef(SelectField);
