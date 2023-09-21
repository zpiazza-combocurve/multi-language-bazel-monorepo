// TODO add some tests
import produce from 'immer';
import _ from 'lodash';
import { useCallback, useState } from 'react';

/**
 * For when you can't know the well ids, will only keep track of if it has selected all or not, and individual
 * selected/deselected items
 *
 * Useful in company wells page or well filter when it's not scoped to a project, because getting all the well ids it's
 * not feasible
 *
 * @todo Initial state including if it is selecting all and initial selected/deselected
 */
export function useFlexibleSelection() {
	const [state, setState] = useState(() => ({
		/** When it has selected all selecting individual items will be inverted (deselected) */
		allSelected: false,
		/**
		 * Inverted here means it's different than allSelected value, eg if allSelected is false (default state most of
		 * the time), `invertedIds` will have selceted nodes. however if allSelected is true `invertedIds` will have
		 * deselected ids
		 */
		invertedIds: new Set<string>(),
	}));

	type State = typeof state;

	/** Will set the selection of all elements */
	const setAll = useCallback((allSelected) => {
		setState({ allSelected, invertedIds: new Set() });
	}, []);

	/** Will toggle the selection of all elements */
	const toggleAll = useCallback(() => {
		setState((p) => ({ allSelected: !p.allSelected, invertedIds: new Set() }));
	}, []);

	/** Will select or deselect one or many elements */
	const setMany = useCallback((ids: string | string[], selected: boolean) => {
		setState(
			produce((draft: State) => {
				_.castArray(ids).forEach((id) => {
					// if not "all selected" and want to select, we add
					// if "all selected" and want to deselect, we add
					// if not "all selected" and want to deselect, we remove
					// if "all selected" and want to select, we remove
					if (draft.allSelected === selected) {
						draft.invertedIds.delete(id);
					} else {
						draft.invertedIds.add(id);
					}
				});
			})
		);
	}, []);

	/** Will toggle the selection of one or many elements */
	const toggleMany = useCallback((ids: string | string[]) => {
		setState(
			produce((draft: State) => {
				_.castArray(ids).forEach((id) => {
					if (draft.invertedIds.has(id)) {
						draft.invertedIds.delete(id);
					} else {
						draft.invertedIds.add(id);
					}
				});
			})
		);
	}, []);

	/** Whether element is selected */
	const isSelected = useCallback(
		(id: string) => {
			const isMarked = state.invertedIds.has(id);
			// all selected, is marked -> false
			// all selected, not is marked -> true
			// not all selected, is marked -> true
			// not all selected, not is marked -> false
			return state.allSelected !== isMarked;
		},
		[state]
	);

	return {
		state,
		setState,
		setAll,
		toggleAll,
		setMany,
		toggleMany,
		isSelected,
	};
}
