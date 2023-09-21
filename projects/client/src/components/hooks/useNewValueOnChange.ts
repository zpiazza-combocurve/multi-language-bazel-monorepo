import { useMemo } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function useNewValueOnChange<T>(value: T, deps: any[]) {
	// eslint-disable-next-line
	return useMemo(() => value, deps);
}
