import { useRef } from 'react';

import { useCompactDependencies } from './useCompactDependencies';

/** Tells if dependency array has changed */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function useHasChanged(deps: any[]) {
	const key = useCompactDependencies(deps);
	const lastKey = useRef<symbol | undefined>(undefined);
	const hasChanged = key !== lastKey.current;
	lastKey.current = key;
	return hasChanged;
}
