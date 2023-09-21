import { faSearchMinus, faSearchPlus } from '@fortawesome/pro-regular-svg-icons';
import { Divider } from '@material-ui/core';
import { useEffect, useRef, useState } from 'react';

import { Doggo } from '@/components';

import diagramBackground from './background.svg';
import { ZoomContainer, ZoomIcon } from './styles';
import { useDiagram } from './useDiagram';

const DiagramWrapper = ({ svg, scale, setScale, handleZoomIn, handleZoomOut }) => {
	const containerRef = useRef<HTMLDivElement>(null);

	const [dragging, setDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

	const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
		event.preventDefault();

		const { clientX, clientY } = event;
		setDragging(true);
		setDragStart({ x: clientX, y: clientY });
	};

	const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
		if (!dragging) return;

		const { clientX, clientY } = event;
		const offsetX = clientX - dragStart.x;
		const offsetY = clientY - dragStart.y;

		setDragOffset((prevOffset) => ({
			x: prevOffset.x + offsetX,
			y: prevOffset.y + offsetY,
		}));
		setDragStart({ x: clientX, y: clientY });
	};

	const handleMouseUp = () => {
		setDragging(false);
		setDragStart({ x: 0, y: 0 });
	};

	const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
		const { deltaY } = event;

		if (deltaY > 0) {
			handleZoomOut();
		} else {
			handleZoomIn();
		}
	};

	useEffect(() => {
		setDragStart({ x: 0, y: 0 });
		setDragOffset({ x: 0, y: 0 });
		setScale(1);
	}, [svg, setScale]);

	useEffect(() => {
		const handleMouseLeave = () => setDragging(false);

		const container = containerRef.current;
		container?.addEventListener('mouseleave', handleMouseLeave);
		return () => {
			container?.removeEventListener('mouseleave', handleMouseLeave);
		};
	}, []);

	return (
		<div
			ref={containerRef}
			css={`
				display: flex;
				align-items: center;
				justify-content: center;
				background: url(${diagramBackground});
				background-opacity: 0.3;
				cursor: grab;
				border: 1px solid #565556;
				width: 100%;
				position: relative;
				overflow: hidden;

				&:active {
					cursor: grabbing;
				}
			`}
			onMouseDown={handleMouseDown}
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
			onWheel={handleWheel}
		>
			<div
				css={`
					width: 100%;
					transform: translate(${dragOffset.x}px, ${dragOffset.y}px);
				`}
			>
				<div
					className='diagram'
					css={`
						display: flex;
						justify-content: center;
						transform: scale(${scale});
						transition: 0.2s ease-in-out;
					`}
					/* eslint-disable-next-line react/no-danger */
					dangerouslySetInnerHTML={{ __html: svg }}
				/>
			</div>
		</div>
	);
};

export const DiagramComponent = ({ values, hasCyclicSteps }) => {
	const { svg, loading, error } = useDiagram(values, hasCyclicSteps);

	const [scale, setScale] = useState(1);

	const handleZoomIn = () => {
		setScale((prevScale) => Math.min(prevScale + 0.25, 5));
	};

	const handleZoomOut = () => {
		setScale((prevScale) => Math.max(prevScale - 0.25, 1));
	};

	return (
		<div
			css={`
				position: relative;
				display: flex;
				min-height: 80px;
				flex: auto;
			`}
		>
			{loading && <Doggo small />}
			{error && <div>{error}</div>}
			<ZoomContainer>
				<ZoomIcon size='small' onClick={handleZoomIn}>
					{faSearchPlus}
				</ZoomIcon>
				<Divider light />
				<ZoomIcon size='small' onClick={handleZoomOut}>
					{faSearchMinus}
				</ZoomIcon>
			</ZoomContainer>
			<DiagramWrapper
				svg={svg}
				scale={scale}
				setScale={setScale}
				handleZoomIn={handleZoomIn}
				handleZoomOut={handleZoomOut}
			/>
		</div>
	);
};
