import { faCheck, faTimes } from '@fortawesome/pro-regular-svg-icons';
import { InputAdornment } from '@material-ui/core';
import { useRef, useState } from 'react';

import { IconButton, TextField } from '@/components/v2';

// TODO: merge with module list rename input;
export const SubmitableTextField = ({ onSubmit, minValue, maxValue, value, disabled, ...props }) => {
	const [editing, setEditing] = useState(false);
	const [inputValue, setInputValue] = useState(value);
	const belowLimit = inputValue < (minValue || 1);
	const aboveLimit = inputValue > maxValue;
	const isNaN = inputValue === '';
	const error = belowLimit || aboveLimit || isNaN;
	const changed = parseInt(inputValue, 10) !== value;
	const actionRequired = error || editing || changed;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const inputRef = useRef<any>(null);
	const errorMessage = (() => {
		if (isNaN) {
			return `Rows must be a number`;
		}
		if (belowLimit) {
			return `Cannot have less rows than ${minValue}`;
		}
		if (aboveLimit) {
			return `Cannot have more rows than ${maxValue}`;
		}
		return '';
	})();
	return (
		<TextField
			{...props}
			disabled={disabled}
			css={`
				width: 15rem;
			`}
			ref={inputRef}
			onChange={(ev) => setInputValue(ev.target.value)}
			value={inputValue}
			onFocus={() => setEditing(true)}
			onBlur={() => setEditing(false)}
			error={error}
			helperText={errorMessage}
			InputProps={{
				endAdornment: (
					<InputAdornment
						css={`
							flex: 0 0 auto;
							margin-left: 0.5rem;
							margin-right: 0.5rem;
						`}
						position='end'
					>
						{actionRequired && (
							<>
								{!error && (
									<IconButton
										disabled={disabled}
										onClick={() => {
											onSubmit(inputValue.toString());
											inputRef?.current?.blur();
										}}
										color='secondary'
										size='small'
									>
										{faCheck}
									</IconButton>
								)}
								<IconButton
									onClick={() => {
										setInputValue(value);
									}}
									size='small'
								>
									{faTimes}
								</IconButton>
							</>
						)}
					</InputAdornment>
				),
			}}
		/>
	);
};
