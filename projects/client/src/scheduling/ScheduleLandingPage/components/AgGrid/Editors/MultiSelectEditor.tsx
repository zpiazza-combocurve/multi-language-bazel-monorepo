import { ClickAwayListener, Popper } from '@material-ui/core';
import { ICellEditor, ICellEditorParams } from 'ag-grid-community';
import { ForwardedRef, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

import MultiSelectField from '@/components/v2/misc/MultiSelectField';

const CustomPopper = function (props) {
	return <Popper {...props} style={{ width: 'fit-content' }} placement='bottom-start' />;
};

type OptionsType = { value: string; label: string }[];
interface MultiSelectEditorProps extends ICellEditorParams {
	options: OptionsType;
	filter?: (options: OptionsType, compareValue: string) => OptionsType;
	forceOpen?: boolean;
}

function MultiSelectEditor(props: MultiSelectEditorProps, ref: ForwardedRef<ICellEditor>) {
	const inputRef = useRef<HTMLInputElement>(null);

	const { value: initialValue } = props;
	const availableOptions = props.filter ? props.filter(props.options, props.data.stepIdx) : props.options;

	const [value, setValue] = useState(initialValue);

	useImperativeHandle(ref, () => {
		return {
			getValue: () => value,
		};
	});

	const handleChange = (value: number[]) => {
		setValue(value);
	};

	useEffect(() => {
		if (props.forceOpen) inputRef.current?.querySelector('button')?.click();
	}, [props.forceOpen]);

	return (
		<ClickAwayListener
			onClickAway={() => {
				props.stopEditing();
			}}
		>
			<div>
				<MultiSelectField
					ref={inputRef}
					menuItems={availableOptions}
					onChange={handleChange}
					value={value}
					PopperComponent={CustomPopper}
					disableTags
					disableClearable
				/>
			</div>
		</ClickAwayListener>
	);
}

export default forwardRef(MultiSelectEditor);
