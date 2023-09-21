import { faFilter, faUndo } from '@fortawesome/pro-regular-svg-icons';
import { useContext } from 'react';

import { Box, IconButton, Typography } from '@/components/v2';

import { FiltersContext } from './shared';

export default function FiltersControls() {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const { resetFilters, runFilters } = useContext(FiltersContext)!;

	return (
		<Box display='flex' justifyContent='space-between' alignItems='center'>
			<Typography variant='h5' component='h2'>
				Filters
			</Typography>
			<IconButton tooltipTitle='Apply' color='secondary' onClick={runFilters}>
				{faFilter}
			</IconButton>
			<IconButton tooltipTitle='Reset' color='error' onClick={resetFilters}>
				{faUndo}
			</IconButton>
		</Box>
	);
}
