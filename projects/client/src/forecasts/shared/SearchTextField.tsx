import { faSearch } from '@fortawesome/pro-regular-svg-icons';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import styled from 'styled-components';

import { TextField } from '@/components/v2';
import { iconAdornment } from '@/components/v2/helpers';

interface SearchTextFieldProps {
	value?: string;
	onChange?: (value: string) => void;
	onApply?: (value: string) => void;
	placeholder?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	style?: any;
}

const SearchFieldWrapper = styled.div`
	div {
		margin-top: 0;
		margin-bottom: 0;
		margin-left: 4px;

		& > div {
			padding-right: 3px;
		}
	}

	input {
		font-size: 0.75rem;
		line-height: 1rem;
	}

	button {
		width: 30px;
		height: 30px;

		* {
			margin: 0;
		}
	}
`;

function SearchTextField({
	placeholder,
	value = '',
	onChange,
	onApply,
	style,
	variant,
	margin,
}: SearchTextFieldProps & React.ComponentProps<typeof TextField>) {
	const handleSearch = () => onApply?.(value);

	const searchButton = {
		endAdornment: (
			<InputAdornment position='end' disablePointerEvents={false} onClick={handleSearch}>
				<IconButton>{iconAdornment(faSearch)}</IconButton>
			</InputAdornment>
		),
	};

	return (
		<SearchFieldWrapper>
			<TextField
				variant={variant}
				margin={margin}
				type='text'
				value={value}
				placeholder={placeholder}
				id='forecast-well-name-search'
				className='forecast-well-name-search-container'
				InputProps={searchButton}
				style={style}
				onKeyPress={({ key }) => {
					if (key === 'Enter') {
						handleSearch();
					}
				}}
				onChange={({ target }) => onChange?.(target.value)}
			/>
		</SearchFieldWrapper>
	);
}

export default SearchTextField;
