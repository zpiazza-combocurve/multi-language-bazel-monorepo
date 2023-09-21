import _ from 'lodash';
import { useContext } from 'react';

import TagsMultiSelectField from '@/components/v2/misc/TagsMultiSelectField';
import { useGetAllTags } from '@/tags/queries';

import { FiltersContext } from './shared';

const TagsFilter = () => {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const { filters, setFilters } = useContext(FiltersContext)!;
	const { data: allTags, isLoading } = useGetAllTags();

	const sortedAllTags = _.sortBy(allTags ?? [], ({ name }) => name.toLowerCase());

	// If it's loading show an empty multi-select
	const selectedTags = isLoading ? [] : filters.tags ?? [];

	return (
		<TagsMultiSelectField
			value={selectedTags}
			onChange={(value) => setFilters({ tags: value })}
			label='Tags'
			name='tags'
			fullWidth
			menuItems={sortedAllTags.map(({ _id, name, color }) => ({
				value: _id,
				label: name,
				color,
			}))}
		/>
	);
};

export default TagsFilter;
