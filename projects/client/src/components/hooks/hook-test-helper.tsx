import { act, renderHook } from '@testing-library/react-hooks';
import { useRef } from 'react';

/** Count amount of times hook has rendered */
export function useRenderCount() {
	const renders = useRef(0);
	renders.current++;
	return renders.current;
}

/** Wrapper over `renderHookExt` to check how many rerenders are wasted in a hook */
export function renderHookExt<T, R>(fn: (t: T) => R, options?: { initialProps?: T }) {
	const { result, rerender, ...rest } = renderHook<T, R>(
		(initialProps) => ({ ...fn(initialProps), renders: useRenderCount() }),
		options
	);
	// count expected rerenders, should only increment one per action
	let renders = 1;
	const check = (expected) => {
		expect(result.current).toMatchObject({ ...expected, renders });
	};
	const actExt = (handler) => {
		renders++;
		return act(() => handler(result.current));
	};
	const rerenderExt = (props) => {
		rerender(props);
		renders++;
	};
	return { check, act: actExt, result, rerender: rerenderExt, ...rest };
}
