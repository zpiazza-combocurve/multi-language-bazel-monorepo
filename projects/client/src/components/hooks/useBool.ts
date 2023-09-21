import { useCallback, useState } from 'react';

export function useBool(init = false) {
	// is it actually that useful? remove usage if possible
	const [value, setValue] = useState(!!init); // enforce boolean
	const on = useCallback(() => setValue(true), [setValue]);
	const off = useCallback(() => setValue(false), [setValue]);
	const toggle = useCallback(
		(newValue) => {
			if (newValue === false || newValue === true) {
				setValue(newValue);
			} else {
				setValue((p) => !p);
			}
		},
		[setValue]
	);
	return Object.assign([value, on, off, toggle, setValue] as const, { value, on, off, toggle, setValue });
}
