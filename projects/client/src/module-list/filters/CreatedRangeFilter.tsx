import { endOfDay, startOfDay } from 'date-fns';
import { useContext } from 'react';

import { ReactDatePicker } from '@/components/v2';

import { FiltersContext } from './shared';

export default function CreatedRangeFilter({
	labelMin = 'Start Date',
	labelMax = 'End Date',
	nameMin = 'dateMin',
	nameMax = 'dateMax',
}) {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const { filters, setFilters } = useContext(FiltersContext)!;

	const setStartDate = (date: null | Date) => {
		setFilters({ [nameMin]: date ? startOfDay(date).toISOString() : '' });
	};

	const setEndDate = (date: null | Date) => {
		setFilters({ [nameMax]: date ? endOfDay(date).toISOString() : '' });
	};

	return (
		<>
			<ReactDatePicker
				selected={filters[nameMin]}
				onChange={setStartDate}
				label={labelMin}
				fullWidth
				portalId='root'
			/>
			<ReactDatePicker
				selected={filters[nameMax]}
				onChange={setEndDate}
				label={labelMax}
				fullWidth
				portalId='root'
			/>
		</>
	);
}
