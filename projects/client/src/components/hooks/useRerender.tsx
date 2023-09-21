import { useCallback, useState } from 'react';

/** Force a component rerender */
export function useRerender() {
	const [, setState] = useState({});
	return useCallback(() => {
		setState({});
	}, []);
}
