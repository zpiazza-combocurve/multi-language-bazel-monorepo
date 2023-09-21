import { useDerivedState } from '@/components/hooks';

import TextField, { TextFieldProps } from './v2/TextField';

interface PageFieldProps extends Omit<TextFieldProps, 'onChange'> {
	onChange: (pageNumber: number) => void;
	page: number;
	maxPage: number;
	fieldSize?: number;
}

export function PageField({ onChange, maxPage = 9999, fieldSize, page = 1, ...rest }: PageFieldProps) {
	const [currentValue, setCurrentValue] = useDerivedState(page);

	const submit = () => {
		if (currentValue) {
			const validPage = Math.max(1, Math.min(currentValue, maxPage));
			onChange(validPage);
			if (validPage !== currentValue) {
				setCurrentValue(validPage);
			}
		} else {
			setCurrentValue(page);
		}
	};

	const handleChange = (ev) => setCurrentValue(ev.target.value);

	const handleFocus = () => {
		setCurrentValue(page);
	};

	const handleBlur = () => {
		submit();
	};

	const handleKeyUp = (event) => {
		if (event.keyCode === 13) {
			/* ENTER */
			submit();
			// document.getElementById('inpt-page-field').blur();
		}
	};

	const maxLength = Math.trunc(Math.log10(maxPage)) + 1;

	return (
		<TextField
			{...rest}
			id='inpt-page-field'
			inputProps={{ style: { textAlign: 'center' } }}
			onBlur={handleBlur}
			onChange={handleChange}
			onFocus={handleFocus}
			onKeyUp={handleKeyUp}
			style={{ width: `${fieldSize ?? maxLength + 1}em` }}
			type='number'
			value={currentValue}
		/>
	);
}
