import { RefObject } from 'react';

import { formulaHasError } from '@/networks/carbon/FormulaCompiler/helpers';
import { StreamInput } from '@/networks/carbon/FormulaCompiler/types';
import { CustomCalculationNode } from '@/networks/carbon/types';

interface RichErrorProps {
	value: string;
	inputs: CustomCalculationNode['params']['inputs'];
	scrollRef: RefObject<HTMLDivElement>;
	hasError: boolean;
}
function RichErrorDisplay(props: RichErrorProps) {
	const { value, inputs, scrollRef, hasError } = props;
	const error = formulaHasError(value, inputs.filter((i) => i.assign).map((i) => i.name as StreamInput) ?? []);
	if (error === false || typeof error === 'string') return null;
	else if (error.errorData && hasError) {
		const { startIndex, endIndex } = error.errorData;
		const before = value.slice(0, startIndex);
		const after = value.slice(endIndex);
		const errorText = value.slice(startIndex, endIndex);
		return (
			<>
				{/* This is a mask, for some reason the highlighting doesn't dissapear when the fake input scrolls */}
				<div
					css={`
						position: absolute;
						top: 0.8em;
						left: 2px;
						width: 12px;
						height: 16px;
						z-index: 1;
						background: ${({ theme }) => theme.palette.background.opaque};
					`}
				/>
				<span
					ref={scrollRef}
					css={`
						width: 100%;
						position: absolute;
						display: flex;
						align-items: center;
						white-space: pre;
						font-size: 16px;
						overflow-x: hidden;
						user-select: none;
						scrollbar-width: none;
						color: transparent;
						padding: 0.3em 14px;
						top: 0;
						background-color: transparent;
					`}
				>
					{before}
					<u
						css={`
							text-decoration-color: red;
							text-decoration-style: double;
							text-decoration-skip-ink: none;
						`}
					>
						{errorText}
					</u>
					{after}
				</span>
			</>
		);
	}
	return null;
}

export default RichErrorDisplay;
