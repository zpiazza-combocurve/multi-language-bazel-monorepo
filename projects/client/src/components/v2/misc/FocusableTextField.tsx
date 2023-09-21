import { faCheck, faPen, faTimes } from '@fortawesome/pro-regular-svg-icons';
import { InputAdornment } from '@material-ui/core';
import { useRef, useState } from 'react';

import { useDerivedState } from '@/components/hooks/useDerivedState';
import IconButton from '@/components/v2/IconButton';
import TextField from '@/components/v2/TextField';

/**
 * Underline Text Field which is kind of a form in itself. Hitting enter will cause the onChange to trigger. Will show
 * an underline, an accept and cancel buttons when focussed.
 */
export function FocusableTextField({
	getError,
	...props
}: React.ComponentProps<typeof TextField> & {
	getError?: (id: string) => string | boolean;
	onChange: (value: string) => void;
}) {
	const { defaultValue, onChange, InputProps, ...restProps } = props;
	const [inputValue, setInputValue] = useDerivedState<string>(defaultValue as string);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const inputRef = useRef<any>();
	const [editing, setEditing] = useState(false);
	const changed = inputValue !== defaultValue;
	const error = inputValue === '' || getError?.(inputValue as string);

	const actionRequired = error || editing || (!editing && changed);

	return (
		<TextField
			inputRef={inputRef}
			error={!!error || (!editing && changed)}
			variant='standard'
			css={`
				flex: 1 1 0;
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;

				&:not(:hover) .hover {
					display: none;
				}
			`}
			InputProps={{
				disableUnderline: !actionRequired,

				endAdornment: (
					<InputAdornment
						css={`
							flex: 0 0 auto;
							margin-left: 0.5rem;
							margin-right: 0.5rem;
						`}
						position='end'
					>
						{actionRequired ? (
							<>
								{changed && (
									<IconButton
										disabled={error}
										onClick={() => {
											onChange(inputValue);
										}}
										color='secondary'
										size='small'
									>
										{faCheck}
									</IconButton>
								)}
								<IconButton
									key='close-button'
									onClick={() => {
										setInputValue(defaultValue as string);
									}}
									size='small'
								>
									{faTimes}
								</IconButton>
							</>
						) : (
							<IconButton
								key='open-button'
								className='hover'
								onClick={() => {
									inputRef.current.focus();
								}}
								size='small'
							>
								{faPen}
							</IconButton>
						)}
					</InputAdornment>
				),
				...InputProps,
			}}
			onFocus={() => setEditing(true)}
			onBlur={() => setEditing(false)}
			onChange={(ev) => setInputValue(ev.target.value)}
			value={inputValue}
			onKeyDown={(event) => {
				if (event.key === 'Enter' && !error) {
					onChange(inputValue);
					inputRef.current?.blur();
					event.preventDefault();
				}
			}}
			{...restProps}
		/>
	);
}
