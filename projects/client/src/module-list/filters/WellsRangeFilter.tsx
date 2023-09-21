import { faTint } from '@fortawesome/pro-regular-svg-icons';
import { useContext } from 'react';

import { TextField } from '@/components/v2';
import { iconAdornment } from '@/components/v2/helpers';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';

import { FiltersContext } from './shared';

const validationRegex = /^\d+$/;

export default function WellsRangeFilter({ nameMin = 'wellsMin', nameMax = 'wellsMax' }) {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const { filters, setFilters } = useContext(FiltersContext)!;

	const onChange = (ev, field: string) => {
		const val = ev.target.value;

		if (validationRegex.test(val) || !val) {
			setFilters({ [field]: val });

			return true;
		}

		return false;
	};

	const { isWellsCollectionsEnabled } = useLDFeatureFlags();

	return (
		<>
			<TextField
				type='number'
				value={filters[nameMin] ?? ''}
				onChange={(ev) => onChange(ev, nameMin)}
				label={isWellsCollectionsEnabled ? 'Wells Min (Includes Collections)' : 'Wells Min'}
				nativeOnChange
				fullWidth
				InputProps={{
					endAdornment: iconAdornment(faTint),
				}}
			/>
			<TextField
				type='number'
				value={filters[nameMax] ?? ''}
				onChange={(ev) => onChange(ev, nameMax)}
				label={isWellsCollectionsEnabled ? 'Wells Max (Includes Collections)' : 'Wells Max'}
				nativeOnChange
				fullWidth
				InputProps={{
					endAdornment: iconAdornment(faTint),
				}}
			/>
		</>
	);
}
