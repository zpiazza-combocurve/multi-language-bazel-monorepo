import { useState } from 'react';

import { useDebouncedValue } from '@/helpers/debounce';

/**
 * Debounce hook interface
 *
 * @deprecated Use a combination of `useState` and `useDebouncedValue` from '@/helpers/debounce' instead
 * @todo Better api would be to swap `delay` and `initial` order, and make delay an optional arg
 */
export function useDebouncedState<T>(delay: number, initial: T) {
	const [value, setValue] = useState(initial);

	const debouncedValue = useDebouncedValue(value, delay);

	return [debouncedValue, setValue, value] as const;
}
