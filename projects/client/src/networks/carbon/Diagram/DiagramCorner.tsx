import styled from 'styled-components';

enum DiagramCornerPosition {
	topLeft,
	topRight,
	bottomLeft,
	bottomRight,
}

interface DiagramCornerProps {
	position: DiagramCornerPosition;
}

const DiagramCorner = styled.div<DiagramCornerProps>(({ theme, position }) => {
	let left = false;
	let right = false;
	let bottom = false;
	let top = false;

	switch (position) {
		case DiagramCornerPosition.topLeft:
			top = true;
			left = true;
			break;
		case DiagramCornerPosition.topRight:
			top = true;
			right = true;
			break;
		case DiagramCornerPosition.bottomLeft:
			bottom = true;
			left = true;
			break;
		case DiagramCornerPosition.bottomRight:
			bottom = true;
			right = true;
			break;
	}

	const spacing = `${theme.spacing(1)}px`;
	return {
		'z-index': '1', // HACK this needs to be on top of the paper,
		position: 'absolute',
		bottom: bottom ? spacing : undefined,
		top: top ? spacing : undefined,
		right: right ? spacing : undefined,
		left: left ? spacing : undefined,

		display: 'flex',
		gap: spacing,
		alignItems: right ? 'end' : 'start',
		flexDirection: 'column',
	};
});
// .withConfig({ shouldForwardProp: (prop: string) => prop !== 'position' })

export default Object.assign(DiagramCorner, { Position: DiagramCornerPosition });
