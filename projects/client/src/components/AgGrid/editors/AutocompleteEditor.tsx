// https://stackblitz.com/edit/react-hooks-complex-editor?file=src%2FComponents%2FEditors%2FAutoCompleteEditor.jsx
import { ICellEditorParams } from 'ag-grid-community';
import _ from 'lodash';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import Autocomplete, { AutocompleteProps } from '@/components/v2/misc/Autocomplete';

export type AutocompleteEditorOptions = { label: string; value: string }[];

type AutocompleteEditorParams = ICellEditorParams &
	Pick<AutocompleteProps, 'options' | 'getOptionLabel' | 'disableClearable' | 'freeSolo' | 'getOptionSelected'> & {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		getOptions?: (colId: string | undefined, rowData: any) => AutocompleteEditorOptions;
	} & { forceOpen?: boolean };

function AutocompleteEditor(props: AutocompleteEditorParams, ref) {
	const { stopEditing, options: _options, getOptions, colDef, data } = props;
	const inputRef = useRef<HTMLInputElement | undefined>();
	const [value, setValue] = useState('');

	const handleChange = (e, newValue) => {
		setValue(newValue);
	};

	useImperativeHandle(ref, () => {
		return {
			getValue: () => {
				return value;
			},
			afterGuiAttached: () => {
				setValue(props.value);
				inputRef.current?.focus();
				inputRef.current?.select();
			},
		};
	});

	const options = useMemo(() => {
		if (getOptions) {
			return getOptions(colDef.field, data);
		}

		return _options ?? [];
	}, [getOptions, _options, colDef.field, data]);

	useEffect(() => {
		if (props.forceOpen) inputRef.current?.click();
	}, [props.forceOpen]);

	return (
		<Autocomplete
			css={{ width: '100%', height: '100%', padding: '0px 5px' }}
			inputRef={inputRef}
			value={value}
			onBlur={() => stopEditing()}
			options={options}
			{..._.pick(props, 'getOptionLabel', 'disableClearable', 'freeSolo', 'getOptionSelected')}
			onChange={handleChange}
			placeholder={`Enter ${colDef.headerName}`}
			openOnFocus
			size='small'
			autoSelect
		/>
	);
}

export default forwardRef(AutocompleteEditor);
