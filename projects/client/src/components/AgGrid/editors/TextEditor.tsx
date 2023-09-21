// https://stackblitz.com/edit/react-hooks-complex-editor?file=src%2FComponents%2FEditors%2FAutoCompleteEditor.jsx
import { Input } from '@material-ui/core';
import { ICellEditor, ICellEditorParams } from 'ag-grid-community';
import { ForwardedRef, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

function TextEditor(props: ICellEditorParams, ref: ForwardedRef<ICellEditor>) {
	const { charPress, value: initialValue } = props;
	const { stopEditing } = props;

	const inputRef = useRef<HTMLInputElement | undefined>();
	const [value, setValue] = useState('');

	useImperativeHandle(ref, () => {
		return {
			getValue: () => props.parseValue(value),
		};
	});

	useEffect(() => {
		if (charPress) {
			setValue(charPress);
			inputRef.current?.focus();
			return;
		}
		setValue(initialValue);
		inputRef.current?.focus();
		inputRef.current?.select();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<Input
			css={{ width: '100%', height: '100%', padding: '0 5px' }}
			margin='dense'
			inputRef={inputRef}
			value={value}
			onChange={(e) => {
				setValue(e.target.value);
			}}
			onBlur={() => stopEditing()}
			placeholder={`Enter ${props.colDef.headerName}`}
			disableUnderline
		/>
	);
}

export default forwardRef(TextEditor);
