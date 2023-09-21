import {
	faTimes as baseAttachIcon,
	faExpandArrows as baseDetachIcon,
	faArrows,
} from '@fortawesome/pro-regular-svg-icons';
import { Portal } from '@material-ui/core';
import { ReactNode, useRef, useState } from 'react';
import { DraggableCore } from 'react-draggable';
import styled, { css } from 'styled-components';

import { ifProp, ifProps, theme, themeProp } from '@/helpers/styled';

import { Toolbar } from './Toolbar';
import { useHotkey } from './hooks';
import useMousePosition from './hooks/useMousePosition';
import { Icon, IconButton } from './v2';

const FloatingContainer = styled.div`
	padding: 0 1rem 0.5rem;
	height: 100%;
`;

const FloaterContainer = styled.div<{ width?: string }>`
	// z-index must be 1300. Otherwise, Material UI  drop-downs will appear behind the floater
	${ifProp('floating', 'position: fixed; border-radius: 5px; border: 1px solid; z-index: 1300; overflow: auto;')}
	${ifProps(
		['floating', 'width'],
		css`
			&& {
				width: ${themeProp('width')};
			}
		`
	)}
	background: ${theme.background};
`;

/**
 * Adds a button to detach the element and make it floating, if onToggle and detached properties are passed the
 * component will be controlled instead
 */
export function Floater({
	attachIcon = baseAttachIcon,
	center,
	children,
	color,
	detached,
	detachIcon = baseDetachIcon,
	disableDrag = false,
	disableToolbar = false,
	enablePositionHotkey = false,
	handle,
	left,
	minimal = true,
	onToggle,
	portal = false,
	right,
	setPosition,
	shouldCheckPosition = true,
	width: floaterWidth,
	...props
}: {
	attachIcon?: ReactNode;
	/** What to put at the center of the header */
	center?: ReactNode;
	children?: ReactNode;
	/** Border color when detached */
	color?: string;
	detached?: boolean;
	detachIcon?: ReactNode;
	disableDrag?: boolean;
	disableToolbar?: boolean;
	enablePositionHotkey?: boolean;
	/** Element ID for dragging by handle */
	handle?: string;
	/** What to put at the left of the header */
	left?: ReactNode;
	minimal?: boolean;
	onToggle?: () => void;
	portal?: boolean;
	/** What to put at the right of the header */
	right?: ReactNode;
	/** Enables forcing the floater to the viewport */
	shouldCheckPosition?: boolean;
	startOnCursor?: boolean;
	width?: string;
	// function for parent to keep track of current position
	setPosition?: (position: { left?: string; top?: string }) => void;
}) {
	const [floating_, setFloating] = useState(false);
	// TODO: check if we can incorporate onToggle to floating value
	const floating = onToggle ? detached : floating_;
	const handleToggle = onToggle ?? (() => setFloating((p) => !p));

	const ref = useRef<HTMLDivElement | undefined>(undefined);

	const mousePosition = useMousePosition();

	const checkPosition = () => {
		if (!(ref.current && shouldCheckPosition)) {
			return;
		}

		const style = window.getComputedStyle(ref.current, null);
		const lastX = parseInt(style.getPropertyValue('left'), 10);
		const lastY = parseInt(style.getPropertyValue('top'), 10);
		const height = parseInt(style.getPropertyValue('height'), 10);
		const width = parseInt(style.getPropertyValue('width'), 10);

		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		let newLeft;
		let newTop;
		if (lastX < 0) {
			newLeft = '10px';
		}
		if (lastY < 0) {
			newTop = '10px';
		}
		if (lastX + width > viewportWidth) {
			newLeft = `${viewportWidth - width - 10}px`;
		}
		if (lastY + height > viewportHeight) {
			newTop = `${viewportHeight - height - 10}px`;
		}

		if (newLeft) {
			ref.current.style.left = newLeft;
			setPosition?.({ left: newLeft });
		}
		if (newTop) {
			ref.current.style.top = newTop;
			setPosition?.({ top: newTop });
		}
	};

	const onStart = (ev) => {
		// https://github.com/react-grid-layout/react-draggable/issues/549
		if (ev.target.tagName.toLowerCase() !== 'input') {
			// don't skip event for inputs
			ev.stopPropagation();
			ev.preventDefault();
		}
	};
	const onStop = (ev) => {
		// https://github.com/react-grid-layout/react-draggable/issues/549
		checkPosition();

		ev.stopPropagation();
		ev.preventDefault();
	};
	const onDrag = (ev, { deltaX, deltaY }) => {
		if (!ref.current) {
			return;
		}
		const style = window.getComputedStyle(ref.current, null);
		const lastX = parseInt(style.getPropertyValue('left'), 10);
		const lastY = parseInt(style.getPropertyValue('top'), 10);
		const x = lastX + deltaX;
		const y = lastY + deltaY;

		const newLeft = `${x}px`;
		const newTop = `${y}px`;

		ref.current.style.left = newLeft;
		ref.current.style.top = newTop;

		setPosition?.({ left: newLeft, top: newTop });
		// https://github.com/react-grid-layout/react-draggable/issues/549
		ev.stopPropagation();
		ev.preventDefault();
	};

	useHotkey('shift+s', () => {
		if (enablePositionHotkey && ref.current) {
			const { x, y } = mousePosition;

			const newLeft = `${x}px`;
			const newTop = `${y}px`;

			ref.current.style.left = newLeft;
			ref.current.style.top = newTop;

			setPosition?.({ left: newLeft, top: newTop });
			checkPosition();
		}

		return false;
	});

	const content = (
		<FloaterContainer
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
			// @ts-expect-error
			ref={ref}
			floating={floating}
			style={floating ? { borderColor: color ?? theme.textColor } : {}}
			width={floaterWidth}
			{...props}
		>
			{!disableToolbar && (
				<Toolbar
					minimal={minimal}
					left={
						<>
							{floating && (
								<Icon
									css={`
										margin-right: 12px;
									`}
									fontSize='small'
									tooltipPlacement='left'
								>
									{faArrows}
								</Icon>
							)}
							{left}
						</>
					}
					css={`
						cursor: grab;
						padding: 0 11px;
					`}
					className='draggable-heading'
					center={center}
					right={
						<>
							{right}
							<IconButton size='small' onClick={handleToggle}>
								{floating ? attachIcon : detachIcon}
							</IconButton>
						</>
					}
				/>
			)}
			{floating ? <FloatingContainer>{children}</FloatingContainer> : children}
		</FloaterContainer>
	);

	const draggableContent = (
		<DraggableCore
			disabled={!floating || disableDrag}
			handle={handle ? `#${handle}` : '.draggable-heading'}
			offsetParent={document.body}
			onDrag={onDrag}
			onStart={onStart}
			onStop={onStop}
		>
			{content}
		</DraggableCore>
	);

	return portal ? <Portal container={document.body}>{draggableContent}</Portal> : draggableContent;
}
