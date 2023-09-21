import { ClickAwayListener } from '@material-ui/core';
import { createFilterOptions } from '@material-ui/lab';
import { ICellEditor, ICellEditorParams } from 'ag-grid-community';
import { ForwardedRef, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { Autocomplete } from '@/components/v2';
import { AutocompleteProps } from '@/components/v2/misc/Autocomplete';

type Option = {
	key: string;
	label: string;
	hide: boolean;
};

const CUSTOM_OPTION = { key: 'Custom' };

interface CreatableComboboxEditorProps extends ICellEditorParams {
	options: AutocompleteProps<Option>['options'];
	onChange?(value: string): void;
}

const filter = createFilterOptions();

function CreatableComboboxEditor(props: CreatableComboboxEditorProps, ref: ForwardedRef<ICellEditor>) {
	const inputRef = useRef<HTMLInputElement>(null);

	const [isCustom, setIsCustom] = useState(
		!props.options.some((option) => option.label === props.value) || props.value === CUSTOM_OPTION.key
	);
	const [visible, setVisible] = useState(!!props.value);

	const setValue = (val) => {
		if (inputRef.current) inputRef.current.value = val;
	};

	useImperativeHandle(ref, () => ({
		getValue: () => props.parseValue(inputRef.current?.value),
	}));

	useEffect(() => {
		if (isCustom && inputRef.current) inputRef.current.focus();
	}, [isCustom]);

	return (
		<ClickAwayListener
			onClickAway={() => {
				setVisible(false);
				props.stopEditing();
			}}
		>
			<div>
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
							display: none;
						}
					`}
					autoHighlight
					open={visible}
					openOnFocus
					disableClearable
					handleHomeEndKeys
					inputRef={inputRef}
					options={[...props.options.filter((option) => !option.hide), CUSTOM_OPTION]}
					InputProps={{ disableUnderline: true }}
					getOptionLabel={(v) => {
						if (typeof v === 'string') {
							return props.formatValue(v);
						} else {
							return props.formatValue(v.key);
						}
					}}
					value={props.value}
					disabled={!isCustom}
					onChange={(_ev, newValue) => {
						if (newValue.key === CUSTOM_OPTION.key) {
							setIsCustom(true);
						} else {
							setValue(newValue.key);
							props.stopEditing();
						}
					}}
					getOptionSelected={(option, value) => option.name === value.name}
					filterOptions={(options, params) => {
						const filtered = filter(options, params);

						const { inputValue } = params;

						const isExisting = options.some((option) => inputValue === option.label);
						const ignoreValues = ['', CUSTOM_OPTION.key];
						if (!ignoreValues.includes(inputValue) && !isExisting) {
							filtered.push({ key: inputValue, label: inputValue });
						}

						return filtered;
					}}
				/>
			</div>
		</ClickAwayListener>
	);
}

export default forwardRef(CreatableComboboxEditor);
