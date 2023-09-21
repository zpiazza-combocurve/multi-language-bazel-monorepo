import { clamp, isEqual } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';

import { SetStateFunction } from '@/helpers/utilities';

const onBeforeComparingDefault = <T>(state: T) => state;

/**
 * The hook for providing the undo/redo functionality for the state changes.
 *
 * @example
 * 	const [state, setState] = useState<any>({});
 * 	const undoActions = useUndo(state, setState);
 *
 * 	...
 * 	<button onClick={() => undoActions.setUndoStates([])}>Clear</button>
 * 	<button onClick={undoActions.prevState} disabled={!undoActions.canUndo}>Undo</button>
 * 	<button onClick={undoActions.nextState} disabled={!undoActions.canRedo}>Redo</button>
 * 	...
 */
export function useUndo<T>(
	state: T,
	setState: SetStateFunction<T>,
	onBeforeComparing: (state: T) => T = onBeforeComparingDefault,
	isEqualAfterUpdate: (current: T, previous: T) => boolean = isEqual
) {
	const statesRef = useRef([] as T[]);
	const positionRef = useRef(0);
	const [canUndo, setCanUndo] = useState(false);
	const [canRedo, setCanRedo] = useState(false);

	const updateStates = useCallback(() => {
		setCanUndo(positionRef.current > 0);
		setCanRedo(positionRef.current < statesRef.current.length - 1);
	}, []);

	const moveState = useCallback(
		(d: number) => {
			const next = clamp(positionRef.current + d, 0, statesRef.current.length - 1);

			if (next === positionRef.current) return;

			positionRef.current = next;

			setState(statesRef.current[positionRef.current]);
			updateStates();
		},
		[setState, updateStates]
	);

	const prevState = useCallback(() => moveState(-1), [moveState]);
	const nextState = useCallback(() => moveState(1), [moveState]);

	const setUndoStates = useCallback(
		(states: T[] = []) => {
			statesRef.current = states;
			positionRef.current = states.length - 1;
			updateStates();
		},
		[updateStates]
	);

	useEffect(() => {
		if (!isEqualAfterUpdate(onBeforeComparing(state), onBeforeComparing(statesRef.current[positionRef.current]))) {
			positionRef.current += 1;
			statesRef.current = statesRef.current.slice(0, positionRef.current);
			statesRef.current.push(state);
		}

		updateStates();
	}, [state, isEqualAfterUpdate, updateStates, onBeforeComparing]);

	//we should always have initial state which is the first element
	if (statesRef.current.length === 0) {
		positionRef.current = 0;
		statesRef.current.push(state);

		updateStates();
	}

	return { prevState, nextState, canUndo, canRedo, setUndoStates };
}

export default useUndo;
