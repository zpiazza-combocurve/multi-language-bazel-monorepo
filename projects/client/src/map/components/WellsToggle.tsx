import { faRoute } from '@fortawesome/pro-regular-svg-icons';

import { Icon, Tooltip } from '@/components/v2';

import { LayerTogglesContainer, StyledSwitchField, StyledToggleButton } from './MapShapefileListItem';

interface WellsToggleProps {
	onWellToggleChange: (ev) => void;
	onDirectionalSurveyChange: (ev) => void;
	wellsChecked: boolean;
	showDirectionalSurvey: boolean;
}
export const WellsToggle = ({
	onWellToggleChange,
	onDirectionalSurveyChange,
	wellsChecked,
	showDirectionalSurvey,
}: WellsToggleProps) => {
	return (
		<LayerTogglesContainer>
			<StyledSwitchField label='Wells' name='colorLayer' checked={wellsChecked} onChange={onWellToggleChange} />
			<Tooltip title='Show Directional Survey' placement='right'>
				<StyledToggleButton size='small' selected={showDirectionalSurvey} onChange={onDirectionalSurveyChange}>
					<Icon fontSize='inherit'>{faRoute}</Icon>
				</StyledToggleButton>
			</Tooltip>
		</LayerTogglesContainer>
	);
};
