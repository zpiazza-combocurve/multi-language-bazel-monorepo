// https://docs.google.com/presentation/d/1Wiou5C9ezMVUuyeFRiDJgIZfojjXpV_3IsnvN-mr-EI/edit#slide=id.g8785e7956e_0_26
import styled from 'styled-components';

import { Card } from '@/components/v2';
import WellMap from '@/map/StaticWellMapWithSettings';

import WellChart from './WellChart';
import WellHeaders from './WellHeaders';
import WellProductionTable from './WellProductionTable';
import { useSingleViewWellsData } from './singleViewHooks';

const Container = styled.div`
	height: 100%;
	display: grid;
	grid-template-columns: 2fr 2fr 6fr;
	grid-template-rows: 2fr 3fr;
	grid-template-areas:
		'table1 table2 map'
		'table1 table2 chart';
	gap: 1rem;
`;

const GridArea = styled(Card)<{ $type: string }>`
	grid-area: ${({ $type }) => $type};
`;

interface SingleWellViewProps {
	onHeaderSubmitCallback?: () => void;
	wellId: string;
	isWellsCollection?: boolean;
}

function SingleWellView({ onHeaderSubmitCallback, wellId, isWellsCollection }: SingleWellViewProps) {
	const wells = useSingleViewWellsData(wellId, !!isWellsCollection);

	return (
		<Container>
			<GridArea $type='table1'>
				<WellHeaders
					onSubmitCallback={onHeaderSubmitCallback}
					wellId={wellId}
					isWellsCollection={isWellsCollection}
				/>
			</GridArea>
			<GridArea
				$type='table2'
				css={`
					overflow: unset;
				`}
			>
				<WellProductionTable wellId={wellId} isWellsCollection={!!isWellsCollection} />
			</GridArea>
			<GridArea $type='map'>
				<WellMap wells={wells} shouldShowWellsColorHeader />
			</GridArea>
			<GridArea $type='chart'>
				<WellChart wells={wells} />
			</GridArea>
		</Container>
	);
}

export default SingleWellView;
