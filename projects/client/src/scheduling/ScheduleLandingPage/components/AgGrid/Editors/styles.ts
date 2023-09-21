import styled from 'styled-components';

import { Autocomplete } from '@/components/v2';

export const StyledAutoComplete = styled(Autocomplete)`
	height: 100%;
	width: 100%;
	display: flex;
	align-items: center;
	.MuiAutocomplete-inputRoot {
		padding: 0 1rem;
	}
	.MuiAutocomplete-endAdornment {
		right: 0.5rem;
	}
`;
