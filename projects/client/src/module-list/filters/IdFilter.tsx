import { useContext } from 'react';

import { TextField } from '@/components/v2';

import { FiltersContext } from './shared';

export default function IdFilter({ name = 'tenantId', label = 'Tenant Id' }) {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const { filters, setFilters } = useContext(FiltersContext)!;
	return (
		<TextField
			label={label}
			value={filters[name]}
			onChange={(ev) => setFilters({ [name]: ev.target.value })}
			nativeOnChange
			fullWidth
		/>
	);
}
