import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import { Accordion, AccordionDetails, AccordionSummary } from '@material-ui/core';
import styled from 'styled-components';

import { Box, Icon, Typography } from '@/components/v2';
import { Filter } from '@/inpt-shared/filters/shared';

import HeaderColorsList from './HeaderColorList';
import MapLabelSelect from './MapLabelSelect';
import SizeBySettings from './SizeBySettings';

const HeadersLegendContainer = styled.div`
	width: 15rem;
	overflow-x: hidden;
	overflow-y: auto;
`;

const StyledMapSettingsSelectDiv = styled.div`
	width: 100%;

	& > :not(:first-child) {
		margin-top: 0.5rem;
	}
`;

type MapInlineSettingsPropsType = {
	project: Inpt.Project;
	wells?: Array<string | { id: string }>;
	filters?: Filter[];
	shouldShowWellsColorHeader?: boolean;
};

export const MapInlineSettingsPanel = ({
	project,
	wells,
	filters,
	shouldShowWellsColorHeader = false,
}: MapInlineSettingsPropsType) => {
	const actualFilters =
		filters ?? (wells ? [{ excludeAll: true, include: wells.map((w) => (typeof w === 'string' ? w : w.id)) }] : []);

	return (
		<HeadersLegendContainer>
			<Box css={{ padding: '4px 16px' }}>
				<Typography variant='h6'>Map Settings</Typography>
			</Box>

			<Accordion>
				<AccordionDetails>
					<StyledMapSettingsSelectDiv>
						<MapLabelSelect project={project} />
					</StyledMapSettingsSelectDiv>
				</AccordionDetails>
			</Accordion>
			<Accordion>
				<AccordionSummary expandIcon={<Icon>{faChevronDown}</Icon>}>Wells Size</AccordionSummary>
				<AccordionDetails>
					<StyledMapSettingsSelectDiv>
						<SizeBySettings project={project} filters={actualFilters} />
					</StyledMapSettingsSelectDiv>
				</AccordionDetails>
			</Accordion>
			{shouldShowWellsColorHeader && (
				<Accordion>
					<AccordionSummary expandIcon={<Icon>{faChevronDown}</Icon>}>Wells Color</AccordionSummary>
					<AccordionDetails>
						<StyledMapSettingsSelectDiv>
							<HeaderColorsList project={project} filters={actualFilters} />
						</StyledMapSettingsSelectDiv>
					</AccordionDetails>
				</Accordion>
			)}
		</HeadersLegendContainer>
	);
};
