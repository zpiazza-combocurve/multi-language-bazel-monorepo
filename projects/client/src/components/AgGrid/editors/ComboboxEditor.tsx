import { ICellEditor, ICellEditorParams } from 'ag-grid-community';
import { ForwardedRef, forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import { Autocomplete } from '@/components/v2';
import { AutocompleteProps } from '@/components/v2/misc/Autocomplete';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
interface ComboboxEditorProps<T = any> extends ICellEditorParams {
	options: AutocompleteProps<T>['options'][];
	onChange?(value: string): void;
	forceOpen?: boolean;
}

const BACKSPACE_KEYCODE = 8;

/**
 * @example
 * 	const autocompleteColumn: ColDef = {
 * 		cellEditor: ComboboxCellEditor,
 * 		cellEditorParams: {
 * 			options: ['a', 'b', 'c'],
 * 		},
 * 	};
 *
 * @see https://v4.mui.com/components/autocomplete/#combo-box
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
function ComboboxEditor<T = any>(props: ComboboxEditorProps<T>, ref: ForwardedRef<ICellEditor>) {
	const inputRef = useRef<HTMLInputElement>(null);

	const highlightedRef = useRef<string | null>(null);
	const enterRef = useRef(false);

	const setValue = (val) => {
		if (inputRef.current) {
			inputRef.current.value = val;
		}
		props?.onChange?.(val);
	};

	useImperativeHandle(ref, () => ({
		getValue: () => {
			const inputValue = inputRef.current?.value ?? '';
			const highlightedValue = highlightedRef.current;
			const valueToParse = enterRef.current ? highlightedValue ?? inputValue : inputValue;
			return props.parseValue(valueToParse);
		},
	}));

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		if (props.keyPress === BACKSPACE_KEYCODE) {
			setValue('');
			inputRef.current?.focus();
			return;
		}
		if (props.charPress) {
			setValue(props.charPress);
			inputRef.current?.focus();
			return;
		}
		setValue('');
		inputRef.current?.focus();
		inputRef.current?.select();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		const handler = (ev) => {
			if (['Enter', 'Tab'].includes(ev.key)) {
				enterRef.current = true;
			}
		};
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		const input = inputRef.current!;
		input.addEventListener('keydown', handler);
		return () => input.removeEventListener('keydown', handler);
	}, []);

	useEffect(() => {
		if (props.forceOpen) inputRef.current?.click();
	}, [props.forceOpen]);

	return (
		<Autocomplete
			css={`
				height: 100%;
				width: 100%;
				display: flex;
				align-items: center;
				.MuiAutocomplete-inputRoot {
					padding: 0 1rem;
				}
				.MuiAutocomplete-endAdornment {
					right: 0.5rem;
				}
			`}
			autoHighlight
			openOnFocus
			disableClearable
			inputRef={inputRef}
			options={props.options}
			value={props.value}
			InputProps={{ disableUnderline: true }}
			onHighlightChange={(_ev, option) => {
				highlightedRef.current = option;
			}}
			onChange={(_ev, newValue) => {
				setValue(newValue);
				props.stopEditing();
			}}
			getOptionLabel={(v) => props.formatValue(v)}
		/>
	);
}

export default forwardRef(ComboboxEditor);
