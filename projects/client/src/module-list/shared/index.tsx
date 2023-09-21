import _ from 'lodash';
import { useRef } from 'react';

import { useSelection } from '@/components/hooks';

export { default as ImportDialog } from './ImportDialog';

/** Similar to the `componentDidUpdate` function, will provide the previous value */
function useCustomMemo<T>(fn: (prevValue: T | undefined) => T) {
	const prevValueRef = useRef<undefined | T>(undefined);
	prevValueRef.current = fn(prevValueRef.current);
	return prevValueRef.current;
}

/**
 * Tells if two arrays have the same elements
 *
 * @example
 * 	haveSameElements([1, 2, 3], [3, 2, 1]); // true
 */
function haveSameElements(a, b) {
	if (a === b) {
		return true;
	}
	return _.isEqual(_.sortBy(a), _.sortBy(b));
}

export function useItemsSelection(itemsIds: string[]) {
	return useSelection(
		useCustomMemo((prevValues = itemsIds) => {
			if (haveSameElements(prevValues, itemsIds)) {
				return prevValues;
			}
			return itemsIds;
		})
	);
}
