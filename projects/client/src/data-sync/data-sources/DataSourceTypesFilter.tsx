import { makeStyles } from '@material-ui/core/styles';
import _ from 'lodash';
import { useContext, useMemo } from 'react';
import * as uuid from 'uuid';

import { Autocomplete } from '@/components/v2/misc';
import { FiltersContext } from '@/module-list/filters/shared';

const anyDataSourceType: Inpt.DataSourceType = {
	_id: '' as Inpt.ObjectId,
	id: '' as Inpt.ObjectId,
	name: 'Any data source type',
	key: 'any',
	isReadOnly: false,
};

const useAutocompleteStyles = makeStyles({
	listbox: {
		maxHeight: '10rem',
	},
});

interface DataSourceTypesFilterProps {
	dataSourceTypes?: Inpt.DataSourceType[];
}

export default function DataSourceTypesFilter(props: DataSourceTypesFilterProps) {
	const { dataSourceTypes } = props;
	const {
		filters: { dataSourceTypeId },
		setFilters,
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	} = useContext(FiltersContext)!;
	const id = useMemo(() => uuid.v4(), []);

	const mergedDataSourceTypes = [anyDataSourceType, ...(dataSourceTypes || [])];
	const selectedDataSourceType = _.find(mergedDataSourceTypes, { _id: +dataSourceTypeId });

	const styles = useAutocompleteStyles();

	return (
		<Autocomplete
			label='Data Source Type'
			classes={styles}
			id={id}
			options={mergedDataSourceTypes}
			getOptionLabel={(dataSourceType) => dataSourceType.name}
			value={selectedDataSourceType || anyDataSourceType}
			onChange={(_, type) => setFilters({ dataSourceTypeId: type?._id || anyDataSourceType?._id })}
			blurOnSelect
		/>
	);
}
