import { useEffect, useRef, useState } from 'react';

/** @deprecated Use 'react-virtualized-auto-sizer' instead */
export function useClientWidth() {
	const [width, setWidth] = useState<number>(0);

	const elRef = useRef<HTMLInputElement>(null);
	const observerRef = useRef(
		new ResizeObserver((entries) => {
			const { width: elWidth } = entries[0].contentRect;
			setWidth(elWidth);
		})
	);

	useEffect(() => {
		const observer = observerRef.current;
		if (elRef.current) {
			observer.observe(elRef.current);
		}

		return () => {
			if (observer) {
				observer.disconnect();
			}
		};
	}, [elRef]);

	return Object.assign([elRef, width] as const, { elRef, width });
}
