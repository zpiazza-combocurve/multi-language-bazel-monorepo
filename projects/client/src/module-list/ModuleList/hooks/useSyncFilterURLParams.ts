import _ from 'lodash';
import { useContext, useEffect, useRef } from 'react';

import { useURLSearchParams } from '@/components/hooks/useQuery';
import { assert } from '@/helpers/utilities';
import { FiltersContext } from '@/module-list/filters';

const useSyncFilterURLParams = () => {
	const filtersContext = useContext(FiltersContext);

	assert(filtersContext);

	const { filters, setFilters } = filtersContext;

	const [urlSearch, setUrlSearch] = useURLSearchParams();

	const ref = useRef({ filters });

	// Sync filters state according to URL Params on first render
	useEffect(() => {
		// We should run this effect only if we have one of search params in filters keys
		const shouldSynchronize = Array.from(urlSearch.keys()).some((keySearch) =>
			Object.keys(filters).includes(keySearch)
		);

		if (shouldSynchronize) {
			const initialFilters = {
				project: '',
			};

			for (const [key, value] of urlSearch.entries()) {
				// If key has brackets, then we should transform it's value to array
				if (key.includes('[]')) {
					initialFilters[key.slice(0, -2)] = value.split(',');
				} else {
					switch (key) {
						case 'sortDir':
							initialFilters[key] = Number(value);
							break;
						case 'projectExactMatch':
							initialFilters[key] = value === 'true' ?? false;
							break;
						default:
							initialFilters[key] = value;
							break;
					}
				}
			}

			ref.current.filters = initialFilters;
			setFilters(initialFilters);
		}

		//eslint-disable-next-line
	}, []);

	// Sync URL Params according to filters state
	useEffect(() => {
		const shouldChangeURL = Object.keys(filters).some(
			(key) => !_.isEqual(ref.current.filters?.[key], filters?.[key])
		);

		if (shouldChangeURL) {
			const prevURLParamsObj = Object.fromEntries(urlSearch.entries());

			// Left only params that have no relations to filtering options
			const otherParams = {};

			const filterKeys = Object.keys(filters);

			for (const paramName in prevURLParamsObj) {
				if (!filterKeys.includes(paramName)) {
					otherParams[paramName] = prevURLParamsObj[paramName];
				}
			}

			ref.current.filters = filters;
			setUrlSearch({
				...otherParams,
				...filters,
			});
		}
	}, [filters, setFilters, setUrlSearch, urlSearch]);

	return null;
};

export default useSyncFilterURLParams;
