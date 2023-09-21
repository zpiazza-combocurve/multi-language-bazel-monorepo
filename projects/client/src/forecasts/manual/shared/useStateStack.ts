import _ from 'lodash';
import { useCallback, useState } from 'react';

import { useCallbackRef } from '@/components/hooks';
import { warningAlert } from '@/helpers/alerts';

const useStateStack = ({
	callback = _.noop,
	maxSize = 20,
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
{ callback?: (value: any) => void; maxSize?: number } = {}) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const [stateStack, setStateStack] = useState<any[]>([]);

	const addToStack = useCallback(
		(newState) => {
			setStateStack((currentStack) => {
				const newStack = [...currentStack];
				if (newStack.length >= maxSize) {
					newStack.shift();
				}
				newStack.push(newState);
				return newStack;
			});
		},
		[maxSize]
	);

	const undo = useCallbackRef(() => {
		if (stateStack.length - 1 > 0) {
			const undoState = stateStack[stateStack.length - 2];
			callback(undoState);

			setStateStack((curStack) => {
				const newStack = _.cloneDeep(curStack);
				newStack.pop();
				return newStack;
			});

			return undoState;
		} else {
			warningAlert('Cannot undo without changes');
		}
	});

	const resetStack = useCallback((startingValue) => setStateStack(startingValue ? [startingValue] : []), []);

	return {
		addToStack,
		canUndo: stateStack.length - 1 > 0,
		resetStack,
		undo,
	};
};

export default useStateStack;
