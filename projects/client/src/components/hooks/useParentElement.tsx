import { useEffect, useRef, useState } from 'react';

function getParentElement(element: HTMLElement | null, depth = 1) {
	if (!depth) return element;
	const parent = element?.parentElement;
	if (parent == null) return element;
	return getParentElement(parent, depth - 1);
}

export function useParentElement<T extends HTMLElement>(depth = 1) {
	const ref = useRef<T>(null);
	const [parentElement, setParentElement] = useState<HTMLElement | null>(null);

	const element = ref?.current;
	useEffect(() => {
		setParentElement(getParentElement(ref.current, depth) ?? null);
	}, [element, depth]);

	const component = (
		<span
			ref={ref}
			css={`
				display: none;
			`}
		/>
	);
	return { parentElement, component };
}
