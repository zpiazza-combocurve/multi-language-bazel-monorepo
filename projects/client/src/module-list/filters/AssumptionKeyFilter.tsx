import { makeStyles } from '@material-ui/core/styles';
import _ from 'lodash';
import { useContext } from 'react';

import { Autocomplete } from '@/components/v2/misc';

import { FiltersContext } from './shared';

const anyType = {
	label: 'Any Type',
	value: '',
};

const useAutocompleteStyles = makeStyles({
	listbox: {
		maxHeight: '10rem',
	},
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export default function AssumptionKeyFilter({ menuItems }: { menuItems: { label: string; value: any }[] }) {
	const allMenuItems = [anyType, ...menuItems];

	const {
		filters: { assumptionKey },
		setFilters,
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	} = useContext(FiltersContext)!;

	const styles = useAutocompleteStyles();

	const selectedAssumption = _.find(allMenuItems, { value: assumptionKey });

	return (
		<Autocomplete
			label='Type'
			classes={styles}
			options={allMenuItems || []}
			getOptionLabel={(item) => item.label}
			value={selectedAssumption || anyType}
			onChange={(ev, type) => setFilters({ assumptionKey: type?.value || anyType?.value })}
			blurOnSelect
		/>
	);
}
