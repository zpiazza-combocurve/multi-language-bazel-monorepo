import { ClickAwayListener } from '@material-ui/core';
import { ICellEditor, ICellEditorParams } from 'ag-grid-community';
import { ForwardedRef, forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import { useId } from '@/components/hooks';
import { Autocomplete } from '@/components/v2';

const BACKSPACE_KEYCODE = 8;

export const FreeSoloCellEditor = forwardRef(
	(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		props: ICellEditorParams & { options: any[]; onChange?(value: string): void; renderOption; getOptionDisabled },
		ref: ForwardedRef<ICellEditor>
	) => {
		const {
			context: { scrollCallbacks },
			stopEditing,
		} = props;

		const id = useId();
		useEffect(() => {
			scrollCallbacks[id] = stopEditing;
			return () => {
				delete scrollCallbacks[id];
			};
		}, [stopEditing, scrollCallbacks, id]);

		const inputRef = useRef<HTMLInputElement>(null);

		const highlightedRef = useRef<string | null>(null);
		const enterRef = useRef(false);
		const [inputValue, setInputValue] = useState('');

		const setValue = (val) => {
			if (inputRef.current) {
				inputRef.current.value = val;
			}
			props?.onChange?.(val);
			setInputValue(val);
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
				open
				openOnFocus
				disableClearable
				inputRef={inputRef}
				options={props.options}
				inputValue={inputValue}
				onInputChange={(_ev, newValue) => setValue(newValue)}
				InputProps={{ disableUnderline: true }}
				filterOptions={(options) => options}
				onHighlightChange={(_ev, option) => {
					highlightedRef.current = option;
				}}
				onChange={(_ev, newValue) => {
					setValue(props.formatValue(newValue));
					stopEditing();
				}}
				renderOption={props.renderOption ?? ((itemValue) => itemValue)}
				getOptionDisabled={props.getOptionDisabled}
				// https://v4.mui.com/api/autocomplete/#props use ListboxComponent property to catch clicks outside of the <ul />
				ListboxComponent={useMemo(
					// eslint-disable-next-line react/no-unstable-nested-components -- TODO eslint fix later
					() => (listboxProps) =>
						(
							<ClickAwayListener
								onClickAway={() => stopEditing()}
								mouseEvent='onMouseDown'
								touchEvent='onTouchStart'
							>
								<ul {...listboxProps} />
							</ClickAwayListener>
						),
					[stopEditing]
				)}
			/>
		);
	}
);
