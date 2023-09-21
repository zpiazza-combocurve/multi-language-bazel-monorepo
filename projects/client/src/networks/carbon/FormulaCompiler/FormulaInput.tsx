import { InputBaseComponentProps } from '@material-ui/core';
import { useRef } from 'react';

import { RHFTextField } from '@/components/v2';

import RichErrorDisplay from '../Diagram/forms/RichErrorDisplay';
import { CustomCalculationNode } from '../types';

interface FormulaInputProps {
	name: string;
	inputProps: InputBaseComponentProps;
	inputRef: React.MutableRefObject<HTMLInputElement | null> | null;
	value: string;
	inputs: CustomCalculationNode['params']['inputs'];
	hasError: boolean;
}

function FormulaInput(props: FormulaInputProps) {
	const { name, inputProps, inputRef, value, inputs, hasError } = props;
	const scrollRef = useRef<HTMLDivElement>(null);
	const syncScroll = (e) => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = e.target.scrollTop;
			scrollRef.current.scrollLeft = e.target.scrollLeft;
		}
	};

	return (
		<div
			css={`
				position: relative;
				width: 100%;
				input {
					width: 100%;
					z-index: 1;
				}
			`}
		>
			<RHFTextField
				autoComplete='off'
				name={name}
				fullWidth
				helperText=' '
				variant='outlined'
				size='small'
				inputProps={{
					...inputProps,
					onScroll: syncScroll,
				}}
				inputRef={inputRef}
			/>
			<RichErrorDisplay value={value} inputs={inputs} scrollRef={scrollRef} hasError={hasError} />
		</div>
	);
}

export default FormulaInput;
