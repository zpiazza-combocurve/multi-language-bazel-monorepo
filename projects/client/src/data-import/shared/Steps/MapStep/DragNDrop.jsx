import composeRefs from '@seznam/compose-react-refs';
import { memo, useCallback } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Paper } from 'react-md';
import styled from 'styled-components';

import { theme } from '@/helpers/styled';

const spacing = '0.25rem';

const shadowBox = (color) => `
	box-shadow: 0 0 3px 0 ${color};
`;

const paperShadowBox = (color) => `
	box-shadow: 0 2px 2px 0 ${color}, 0 1px 5px 0 ${color}, 0 3px 1px -2px ${color};
`;

const Box = styled(Paper)`
	cursor: grab;
	height: calc(3.2rem + 2 * ${spacing});
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	${paperShadowBox(theme.borderColor)}
	&:hover {
		${shadowBox(theme.secondaryColor)};
	}

	&[data-required='true'] {
		color: ${theme.purpleColor};
	}
`;

const BoxContent = styled.div`
	display: flex;
	justify-content: space-between;
	width: 100%;
`;

const TopContent = BoxContent;
const BottomContent = styled(BoxContent)`
	flex-direction: row-reverse;
	color: ${theme.secondaryColor};
`;

const ContentText = styled.span`
	flex: 1 1 0;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
`;
const ContentActions = styled.div`
	flex: 0 0 auto;
	display: flex;
	& > :not(:first-child) {
		margin-left: 0.5rem;
	}
`;

function useDnD({ type, accept, data, onDrop }) {
	const [, dragRef] = useDrag({ type, item: { data } });
	const [, dropRef] = useDrop({
		accept,
		drop: useCallback((from) => onDrop({ from, to: { type, data } }), [data, onDrop, type]),
	});
	return composeRefs(dragRef, dropRef);
}

export const DnDBox = memo(
	({
		type,
		accept,
		data,
		onDrop,
		header,
		mappedHeader,
		required,
		recommended,
		headerActions = [],
		mappedHeaderActions = [],
	}) => {
		const ref = useDnD({ type, accept, data, onDrop });
		return (
			// useComponentRef because of react-md Paper
			<Box
				componentRef={ref}
				data-mapped={!!mappedHeader}
				data-recommended={!!recommended}
				data-required={!!required}
			>
				<TopContent>
					<ContentText>{header}</ContentText>
					<ContentActions>{headerActions}</ContentActions>
				</TopContent>
				<BottomContent>
					<ContentText>{mappedHeader}</ContentText>
					<ContentActions>{mappedHeaderActions}</ContentActions>
				</BottomContent>
			</Box>
		);
	}
);
