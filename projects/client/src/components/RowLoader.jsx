import ContentLoader from 'react-content-loader';
import styled from 'styled-components';

const Loader = styled(ContentLoader)`
	width: ${({ width }) => width}px;
	height: ${({ height }) => height}px;
`;

export function RowContentLoader({ width = 100, height = 40, radius = 8 }) {
	const contentHeight = radius * 2;
	const padding = (height - contentHeight) / 2;
	return (
		<Loader {...{ width, height }} backgroundColor='#b3b3b3' foregroundColor='#b3b3b3' animate={false}>
			<rect y={padding + 1} rx='5' ry='5' width={width - 3 - padding} height={contentHeight} />
		</Loader>
	);
}
