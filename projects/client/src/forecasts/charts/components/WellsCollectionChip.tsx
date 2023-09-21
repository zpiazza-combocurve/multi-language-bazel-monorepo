import { faBallPile } from '@fortawesome/pro-solid-svg-icons';
import styled from 'styled-components';

import { Box, Icon } from '@/components/v2';
import { pluralize } from '@/helpers/text';

const ChipText = styled.span`
	font-size: 12px;
	font-weight: 500;
	color: var(--grey-wells-color);
`;

export const WellsCollectionChip = ({ wellCollectionNumber }) => {
	const text = pluralize(wellCollectionNumber, 'Well', 'Wells');
	return (
		<Box
			css={`
				border-radius: 24px;
				background-color: var(--wells-background);
				display: inline-flex;
				justify-content: center;
				align-items: center;
				padding: 4px 8px;
			`}
		>
			<Icon
				fontSize='small'
				css={`
					color: var(--grey-wells-color);
					height: 1em;
					width: 1em;
					margin-right: 4px;
					margin-bottom: 1px;
					font-size: 14px;
				`}
			>
				{faBallPile}
			</Icon>
			<ChipText>{text}</ChipText>
		</Box>
	);
};
