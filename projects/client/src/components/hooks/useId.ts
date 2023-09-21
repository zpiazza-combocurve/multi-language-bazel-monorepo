import { useRef } from 'react';

import { counter } from '@/helpers/Counter';

export { counter };

export function useId(prefix?: string) {
	const ref = useRef('');
	if (!ref.current) {
		ref.current = counter.nextId(prefix);
	}
	return ref.current;
}

export function useIndex() {
	const ref = useRef(0);
	if (!ref.current) {
		ref.current = counter.next();
	}
	return ref.current;
}
