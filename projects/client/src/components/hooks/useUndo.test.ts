import { act, renderHook } from '@testing-library/react-hooks';
import { useState } from 'react';

import useUndo from './useUndo';

test('https://combocurve.atlassian.net/browse/CC-12744', () => {
	const { result } = renderHook(() => {
		const [state, setState] = useState(0);
		const undoBag = useUndo(state, setState);
		return { state, setState, undoBag };
	});

	const inc = () =>
		act(() => {
			result.current.setState((p) => p + 1);
		});

	const undo = () =>
		act(() => {
			result.current.undoBag.prevState();
		});

	expect(result.current.state).toBe(0);
	inc();
	expect(result.current.state).toBe(1);
	inc();
	expect(result.current.state).toBe(2);
	undo();
	expect(result.current.state).toBe(1);
	inc();
	expect(result.current.state).toBe(2);
	inc();
	expect(result.current.state).toBe(3);
	inc();
	expect(result.current.state).toBe(4);
	undo();
	expect(result.current.state).toBe(3);
});
