import { TextField } from '@/components';
import { useDebounce } from '@/helpers/debounce';

export function DebouncedSearchInput({ onChange, ...rest }) {
	const handleOnChange = useDebounce(onChange, 200);
	return <TextField onChange={handleOnChange} {...rest} />;
}
