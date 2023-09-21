import _ from 'lodash';

const filterTypes = {
	include: 'include',
	exclude: 'exclude',
	excludeAll: 'excludeAll',
	includeAll: 'includeAll',
	geoFilter: 'geoFilter',
	headersFilter: 'headersFilter',
	projectHeadersFilter: 'projectHeadersFilter',
	vis1: 'vis1',
	excludeMode: 'excludeMode',
};

const addFilter = (filters, newFilter) => {
	const { type, well } = newFilter;

	switch (type) {
		case filterTypes.exclude: {
			let foundReverse = false;
			const filteredFilters = filters.filter((f) => {
				const isReverse = f.type === filterTypes.include && f.well === well;
				foundReverse = foundReverse || isReverse;
				return !isReverse;
			});
			return foundReverse ? filteredFilters : [...filteredFilters, newFilter];
		}
		case filterTypes.include: {
			let foundReverse = false;
			const filteredFilters = filters.filter((f) => {
				const isReverse = f.type === filterTypes.exclude && f.well === well;
				foundReverse = foundReverse || isReverse;
				return !isReverse;
			});
			return foundReverse ? filteredFilters : [...filteredFilters, newFilter];
		}
		case filterTypes.includeAll:
			return [];
		case filterTypes.excludeAll:
			return [newFilter];
		case filterTypes.geoFilter: {
			const typesToRemove = new Set([
				filterTypes.include,
				filterTypes.exclude,
				filterTypes.includeAll,
				filterTypes.excludeAll,
				filterTypes.geoFilter,
				filterTypes.vis1,
			]);
			return [
				...filters.filter((f) => !typesToRemove.has(f.type)),
				...(newFilter.polygons?.length ? [newFilter] : []),
			];
		}
		case filterTypes.headersFilter: {
			const typesToRemove = new Set([
				filterTypes.include,
				filterTypes.exclude,
				filterTypes.includeAll,
				filterTypes.excludeAll,
				filterTypes.headersFilter,
				filterTypes.vis1,
			]);
			return [...filters.filter((f) => !typesToRemove.has(f.type)), newFilter];
		}
		case filterTypes.projectHeadersFilter: {
			const typesToRemove = new Set([
				filterTypes.include,
				filterTypes.exclude,
				filterTypes.includeAll,
				filterTypes.excludeAll,
				filterTypes.projectHeadersFilter,
				filterTypes.vis1,
			]);
			return [...filters.filter((f) => !typesToRemove.has(f.type)), newFilter];
		}
		case filterTypes.vis1:
			return [...filters, newFilter];
		case filterTypes.excludeMode:
			return [...filters.filter((f) => f.type !== filterTypes.excludeMode), newFilter];
		default:
			return filters;
	}
};

const getFiltersObj = (filters = []) => {
	let geo;
	let headers;
	let projectHeaders;
	let include = [];
	let exclude = [];
	let excludeAll = false;
	let isExcluding = false;

	filters.forEach((f) => {
		switch (f.type) {
			case filterTypes.exclude:
				exclude.push(f.well);
				break;
			case filterTypes.include:
				include.push(f.well);
				break;
			case filterTypes.excludeAll:
				excludeAll = true;
				break;
			case filterTypes.geoFilter:
				geo = f.polygons;
				break;
			case filterTypes.headersFilter: {
				const { headers: headersFilters } = f;
				headers = { headers: headersFilters };
				break;
			}
			case filterTypes.projectHeadersFilter: {
				const { headers: projectHeadersFilters } = f;
				projectHeaders = { headers: projectHeadersFilters };
				break;
			}
			case filterTypes.vis1: {
				const { wells } = f;
				geo = undefined;
				headers = undefined;
				exclude = undefined;

				excludeAll = true;
				include = wells;
				break;
			}
			case filterTypes.excludeMode:
				isExcluding = f.isExcluding;
				break;
			default:
				break;
		}
	});

	return {
		...(geo && geo.length ? { geo } : {}),
		...(headers && headers.headers && headers.headers.length ? { headers } : {}),
		...(projectHeaders && projectHeaders.headers && projectHeaders.headers.length ? { projectHeaders } : {}),
		...(include && include.length ? { include } : {}),
		...(exclude && exclude.length ? { exclude } : {}),
		...(excludeAll ? { excludeAll } : {}),
		isExcluding,
	};
};

const getSeparateFilters = ({ geo, headers, projectHeaders, include, exclude, excludeAll, isExcluding } = {}) => {
	let filters = [];

	if (headers) {
		const { headers: headerFilters } = headers;
		filters = addFilter(filters, { type: filterTypes.headersFilter, headers: headerFilters });
	}

	if (projectHeaders) {
		const { headers: projectHeaderFilters } = projectHeaders;
		filters = addFilter(filters, { type: filterTypes.projectHeadersFilter, headers: projectHeaderFilters });
	}

	if (geo) {
		filters = addFilter(filters, { type: filterTypes.geoFilter, polygons: geo });
	}

	if (excludeAll) {
		filters = addFilter(filters, { type: filterTypes.excludeAll });
	}

	if (include) {
		filters = include.reduce(
			(currentFilters, w) => addFilter(currentFilters, { type: filterTypes.include, well: w }),
			filters
		);
	}

	if (exclude) {
		filters = exclude.reduce(
			(currentFilters, w) => addFilter(currentFilters, { type: filterTypes.exclude, well: w }),
			filters
		);
	}

	filters = addFilter(filters, { type: filterTypes.excludeMode, isExcluding });

	return filters;
};

const filterHeadersFilters = (headersFilter, headersToKeep) => {
	const headersSet = new Set(headersToKeep);
	return { headers: headersFilter.headers.filter(({ key }) => headersSet.has(key)) };
};

const normalizeFilterObject = ({
	geo = [],
	headers = { headers: [] },
	projectHeaders = { headers: [] },
	include = [],
	exclude = [],
	excludeAll = false,
	isExcluding = false,
}) => ({ geo, headers, projectHeaders, include, exclude, excludeAll, isExcluding });

export const areFilterObjectsEqual = (filters1, filters2) =>
	filters1.every((f1, i) => _.isEqual(normalizeFilterObject(f1), normalizeFilterObject(filters2[i] ?? {})));

export { filterTypes, addFilter, getFiltersObj, getSeparateFilters, filterHeadersFilters };
