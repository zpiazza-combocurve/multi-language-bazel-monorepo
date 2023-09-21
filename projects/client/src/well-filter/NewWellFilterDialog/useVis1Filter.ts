import { Dispatch, SetStateAction, useState } from 'react';

import { filterTypes } from '@/helpers/filters';
import { Filter, Vis1Filter } from '@/inpt-shared/filters/shared';

import { DEFAULT_VIS1_HEADERS } from '../shared';

export const useVis1Filter = (
	addFilter: (filter) => void,
	selectionFilters: (Filter | Vis1Filter)[],
	setSelectionFilter: Dispatch<SetStateAction<Filter[]>>
) => {
	const [vis1Filters, setVis1Filters] = useState<Vis1Filter[]>([]);
	const applyVis1Filter = (wells, header, values, id) =>
		addFilter({ type: filterTypes.vis1, id, header, values, wells });

	const deleteVis1Filter = ({ id }) => {
		const index = (selectionFilters as Vis1Filter[]).findIndex(
			({ type, id: filterId }) => type === filterTypes.vis1 && filterId === id
		);

		setSelectionFilter((prev) => prev.slice(0, index));
	};
	return {
		vis1Filters,
		setVis1Filters,
		applyVis1Filter,
		deleteVis1Filter,
		defaultVis1Headers: DEFAULT_VIS1_HEADERS,
	};
};
