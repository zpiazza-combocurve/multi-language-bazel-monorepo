import _ from 'lodash';

import { useDataSourceTypesQuery } from './queries';

export const useDataSourceTypes = () => {
	const { data: dataSourceTypes } = useDataSourceTypesQuery({
		placeholderData: [],
		select: (data) => {
			if (!data.items) return []; // TODO check this test is needed
			const newDataSourceTypes = data.items.filter((type) => type?.name);
			const sortedDataSourceTypes = _.sortBy(newDataSourceTypes, (type) => type.name.toLowerCase());

			return sortedDataSourceTypes;
		},
	});

	return dataSourceTypes;
};
