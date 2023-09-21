import { useMemo } from 'react';

/**
 * Get a key from the dependency array, if one dependency changes a new key is generated
 *
 * @example
 * 	const [a, setState] = useState(props.a);
 * 	const [b, setState] = useState(props.b);
 *
 * 	const abKey = useCompactDependencies([a, b]); // abKey will have a new value whenever a or b changes
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function useCompactDependencies(deps: any[], keyFn = () => Symbol('useDerivedState dependency key')) {
	// eslint-disable-next-line react-hooks/exhaustive-deps
	return useMemo(keyFn, deps);
}
