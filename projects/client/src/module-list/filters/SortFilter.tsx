import { useContext } from 'react';

import { Box, IconButton, MenuItem, TextField } from '@/components/v2';
import { FeatureIcons } from '@/helpers/features';

import { FiltersContext } from './shared';

export default function SortFilter({ sortItems }: { sortItems: { label: string; value: string }[] }) {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const { filters, setFilters } = useContext(FiltersContext)!;

	const { sort, sortDir } = filters;

	return (
		<Box display='flex' alignItems='baseline'>
			<TextField
				label='Sort'
				value={sort}
				onChange={(ev) => setFilters({ sort: ev.target.value })}
				select
				fullWidth
				SelectProps={{
					MenuProps: {
						getContentAnchorEl: null,
						anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
						transformOrigin: { vertical: 'top', horizontal: 'center' },
					},
				}}
			>
				{sortItems.map(({ value, label }) => (
					<MenuItem key={value} value={value}>
						{label}
					</MenuItem>
				))}
			</TextField>
			<IconButton
				tooltipTitle='Asc/Dsc'
				color='secondary'
				onClick={() => setFilters({ sortDir: sortDir === -1 ? 1 : -1 })}
			>
				{sortDir === -1 ? FeatureIcons.sortAsc : FeatureIcons.sortDesc}
			</IconButton>
		</Box>
	);
}
