import { useEffect, useRef, useState } from 'react';

/**
 * This hook is used to resize containers also known as 'boxes' in this case. An example of usage can be seen in
 * ExpensesV2.tsx and EmbeddedLookupTableEditView.tsx. In order for this to work properly, you must pay attention to the
 * styling. This utilizes flex to resize the boxes within a wrapper. It's best to have the wrapper at a fixed size while
 * the boxes have their flex property set to (flex: 1 1 auto) and (box-sizing: border-box). Review expenses.module.scss
 * for ExpensesV2 and elt.module.scss for EmbeddedLookupTableEditView.tsx.
 *
 * MinSize: arbitrary minimum width set on box A, otherwise its inner content will collapse to width of 0
 */

type Props = {
	mode?: 'horizontal' | 'vertical';
	minSize?: number;
};

export function useDraggingResize({ mode = 'vertical', minSize = 100 }: Props) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const dividerRef = useRef<any>();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const boxARef = useRef<any>();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const wrapperRef = useRef<any>();

	const [isHandlerDragging, _setIsHandlerDragging] = useState(false);

	const isHandlerDraggingRef = useRef(isHandlerDragging);
	const setIsHandlerDragging = (isDragging) => {
		isHandlerDraggingRef.current = isDragging;
		_setIsHandlerDragging(isDragging);
	};

	useEffect(() => {
		const setIsDragging = (e, state) => {
			// If mousedown event is fired from .handler, toggle flag to true
			if (e.target === dividerRef.current && state) {
				setIsHandlerDragging(true);
			} else {
				setIsHandlerDragging(false);
			}
		};

		const dragVertically = (e) => {
			// Don't do anything if dragging flag is false
			if (!isHandlerDraggingRef.current) {
				return false;
			}

			e.preventDefault();

			// Get offset
			const containerOffsetTop = wrapperRef.current.getBoundingClientRect().top;

			// Get y-coordinate of pointer relative to container
			const pointerRelativeY = e.clientY - containerOffsetTop;

			// Resize box A
			// * Set flex-grow to 0 to prevent it from growing
			boxARef.current.style.height = Math.max(minSize, pointerRelativeY) + 'px';
			boxARef.current.style.flexGrow = 0;
		};

		const dragHorizontally = (e) => {
			// Don't do anything if dragging flag is false
			if (!isHandlerDraggingRef.current) {
				return false;
			}

			e.preventDefault();

			// Get offset
			const containerOffsetLeft = wrapperRef.current.getBoundingClientRect().left;

			// Get x-coordinate of pointer relative to container
			const pointerRelativeX = e.clientX - containerOffsetLeft;

			// Resize box A
			// * Set flex-grow to 0 to prevent it from growing
			boxARef.current.style.width = Math.max(minSize, pointerRelativeX) + 'px';
			boxARef.current.style.flexGrow = 0;
		};

		const drag = mode === 'vertical' ? dragVertically : dragHorizontally;
		const mouseDown = (ev) => {
			setIsDragging(ev, true);
		};
		const mouseUp = (ev) => {
			setIsDragging(ev, false);
		};

		document.addEventListener('mousemove', drag);
		document.addEventListener('mousedown', mouseDown);
		document.addEventListener('mouseup', mouseUp);

		return () => {
			document.removeEventListener('mousemove', drag);
			document.removeEventListener('mousedown', mouseDown);
			document.removeEventListener('mouseup', mouseUp);
		};
	}, [minSize, mode]);

	return { dividerRef, boxARef, wrapperRef };
}
