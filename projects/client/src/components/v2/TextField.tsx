import MUITextField from '@material-ui/core/TextField';
import { forwardRef } from 'react';
import * as React from 'react';

import { useDerivedState } from '@/components/hooks/useDerivedState';
import { useDebounce } from '@/helpers/debounce';

import { withDisabledTooltip, withPointerEvents, withTooltip } from './helpers';

const DEFAULT_DEBOUNCE_TIME = 250;

/**
 * Same text field but `onChange` event will behave the same as the native on change events from inputs.
 *
 * @note if `onChange` event returns false it will reset the input value, this is hackish but it's good enough for now
 * @see https://stackoverflow.com/questions/38256332/in-react-whats-the-difference-between-onchange-and-oninput
 * @see https://facebook.github.io/react/docs/forms.html
 * @see https://github.com/facebook/react/issues/3964
 * @see https://reactjs.org/docs/events.html
 */
function NativeOnChangeTextField({ value, onChange, onBlur, ...props }: React.ComponentProps<typeof MUITextField>) {
	const [derivedValue, setValue] = useDerivedState(value);
	return (
		<MUITextField
			{...props}
			value={derivedValue}
			onChange={(ev) => setValue(ev.target.value)}
			onBlur={(ev) => {
				if (onBlur) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
					// @ts-expect-error
					if (onChange?.(ev) === false) {
						setValue(value);
					}
					return onBlur(ev);
				}
				const result = onChange?.(ev);
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
				// @ts-expect-error
				if (result === false) {
					setValue(value);
				}
				return result;
			}}
			onKeyPress={(ev) => {
				if (ev.key === 'Enter') {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					onChange?.(ev as any);
					return false;
				}
			}}
		/>
	);
}

/** Debounces the execution of `onChange` by `debounce` ms or `DEFAULT_DEBOUNCE_TIME` if true */
function DebouncedTextField({
	value,
	onChange,
	onBlur,
	debounce,
	...props
}: React.ComponentProps<typeof MUITextField> & { debounce: number | true }) {
	const debouncedOnChange = useDebounce(onChange, debounce === true ? DEFAULT_DEBOUNCE_TIME : debounce);
	const [derivedValue, setValue] = useDerivedState(value);
	return (
		<MUITextField
			{...props}
			value={derivedValue}
			onChange={(ev) => {
				ev.persist(); // https://reactjs.org/docs/legacy-event-pooling.html
				debouncedOnChange(ev);
				return setValue(ev.target.value);
			}}
			onBlur={(ev) => {
				debouncedOnChange.cancel();
				if (onBlur) {
					onChange?.(ev);
					return onBlur(ev);
				}
				return onChange?.(ev);
			}}
			onKeyPress={(ev) => {
				if (ev.key === 'Enter') {
					debouncedOnChange.cancel();
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					onChange?.(ev as any);
					return false;
				}
			}}
		/>
	);
}

/** Blurs the text field onKeyPress if the key is "Enter" */
function BlurOnEnterTextField({ onChange, ...props }: React.ComponentProps<typeof MUITextField>) {
	return (
		<MUITextField
			{...props}
			onChange={onChange}
			onKeyPress={(ev) => {
				if (ev.key === 'Enter') {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					onChange?.(ev as any);

					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					const target = ev.target as any;
					target.blur();
					return false;
				}
			}}
		/>
	);
}

/**
 * Extends material-ui TextField with `nativeOnChange` and `debounce` properties
 *
 * @see [Material-UI Docs](https://material-ui.com/components/text-fields/)
 */
function TextField(
	{
		blurOnEnter,
		debounce,
		nativeOnChange,
		...props
	}: React.ComponentProps<typeof MUITextField> & {
		/** Makes the input `onChange` behaves as the native `onChange` event */
		nativeOnChange?: boolean;
		/** Debounce onChange events, implies nativeOnChange */
		debounce?: boolean | number;
		/** Enables blur onKeyPress if the key is "Enter". Runs the `onChange` event before blurring */
		blurOnEnter?: boolean;
	},
	ref
) {
	if (blurOnEnter) {
		return <BlurOnEnterTextField ref={ref} {...props} />;
	}
	if (debounce) {
		return <DebouncedTextField ref={ref} {...props} debounce={debounce} />;
	}
	if (nativeOnChange) {
		return <NativeOnChangeTextField ref={ref} {...props} />;
	}
	return <MUITextField ref={ref} {...props} />;
}

const Default = withDisabledTooltip(withTooltip(withPointerEvents(forwardRef(TextField))));

export type TextFieldProps = React.ComponentPropsWithRef<typeof Default>;

export default Default;
