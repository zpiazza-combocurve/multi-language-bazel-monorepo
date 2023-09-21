/* eslint-disable jest/expect-expect */
import { useState } from 'react';

import { renderHookExt, useRenderCount } from './hook-test-helper';
import { useDerivedState } from './useDerivedState';

describe('hooks/useDerivedState', () => {
	test('should work', () => {
		const { rerender, act, check } = renderHookExt(() => {
			const [state, setState] = useState(0);
			const [derived, setDerived] = useDerivedState(state);
			return { state, setState, derived, setDerived, renders: useRenderCount() };
		});

		const incState = () => act(({ setState }) => setState((p) => p + 1));
		const incDerived = () => act(({ setDerived }) => setDerived((p) => p + 1));

		check({ derived: 0, state: 0 });
		incDerived();
		check({ derived: 1, state: 0 });
		incDerived();
		incDerived();
		check({ derived: 3, state: 0 });
		incState();
		check({ derived: 1, state: 1 });
		rerender();
		check({ derived: 1, state: 1 });
	});
	test('should work with deps options', () => {
		const { rerender, act, check } = renderHookExt(
			(deps) => {
				const [state, setState] = useState(0);
				const [derived, setDerived] = useDerivedState(state, deps);
				return { state, setState, derived, setDerived };
			},
			{ initialProps: [1] }
		);
		check({ derived: 0 });
		act(({ setState }) => setState(3));
		check({ state: 3, derived: 0 });
		act(({ setDerived }) => setDerived((prev) => prev + 1));
		check({ state: 3, derived: 1 });
		rerender([2]);
		check({ state: 3, derived: 3 });
	});
});
