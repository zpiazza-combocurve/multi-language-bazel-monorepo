import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function parseString(value, defaultValue = '') {
	try {
		return JSON.parse(value) || defaultValue;
	} catch (err) {
		return defaultValue;
	}
}

/**
 * Like React useState but for storing the value in the querystring
 *
 * @example
 * 	const [filter, setFilter] = useQueryStringState('name', '');
 * 	useEffect(() => getItems(filter), [filter]);
 * 	return <TextField onChange={setFilter} value={filter} />;
 *
 * @template T
 * @param key `query-string` key to store the state
 * @returns Returns the current value and the setter just like useState
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function useQueryStringState<T = any>(key: string, defaultState = ''): [T, (newValue: T) => void] {
	const navigate = useNavigate();
	const location = useLocation();

	const query = useMemo(() => new URLSearchParams(location.search), [location.search]);

	const queryValue = parseString(query.get(key), defaultState);

	const setQuery = useCallback(
		(value) => {
			query.set(key, JSON.stringify(value));
			navigate({
				...location,
				search: query.toString(),
			});
		},
		[navigate, key, location, query]
	);
	return [queryValue, setQuery];
}

/**
 * Handles the querystring
 *
 * @example
 * 	const [urlSearch, setUrlSearch] = useURLSearchParams();
 * 	return <input onChange={(ev) => setUrlSearch({ name: ev.target.value })} value={urlSearch.get('name')} />;
 */
export function useURLSearchParams(): [
	urlSearch: URLSearchParams,
	setUrlSearch: (values: Record<string, string>) => void
] {
	const navigate = useNavigate();
	const location = useLocation();

	const urlSearch = useMemo(() => new URLSearchParams(location.search), [location.search]);

	const setUrlSearch = useCallback(
		(values) => {
			const newQuery = new URLSearchParams(values);
			Object.entries(values).forEach(([key, value]) => {
				if (value === undefined || value === null || Array.isArray(value) || value === '') {
					newQuery.delete(key);
				}

				// If value is array we need to mark param name with brackets: "param[]"
				if (Array.isArray(value) && value.length !== 0) {
					newQuery.set(`${key}[]`, value.join(','));
				}
			});
			navigate({ ...window.location, search: newQuery.toString() });
		},
		[navigate]
	);
	return [urlSearch, setUrlSearch];
}
