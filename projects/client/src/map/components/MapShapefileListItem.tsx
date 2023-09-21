import { useAbility } from '@casl/react';
import { faBullseyePointer } from '@fortawesome/pro-regular-svg-icons';
import { ToggleButton } from '@material-ui/lab';
import styled from 'styled-components';

import { ACTIONS, AbilityContext, PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS, subject } from '@/access-policies/Can';
import { Icon, SwitchField, Tooltip } from '@/components/v2';

import { layerIsSelectable } from '../helpers';
import { Layer } from '../types';

interface ShapefileListItemProps {
	shapefile: Layer;
	onToggleShow: (event) => void;
	onToggleFilter: () => void;
}

export const LayerTogglesContainer = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
`;

export const StyledToggleButton = styled(ToggleButton)`
	color: ${({ selected, disabled, theme }) =>
		disabled
			? theme.palette.text.disabled
			: selected
			? theme.palette.secondary.main
			: theme.palette.text.secondary} !important;
`;

export const StyledSwitchField = styled(SwitchField)`
	width: 100%;
	margin: 0;
`;

export function MapShapefileListItem({ shapefile, onToggleShow, onToggleFilter }: ShapefileListItemProps) {
	const ability = useAbility(AbilityContext);
	const canViewShapefile =
		shapefile.preset ||
		(shapefile.visibility.includes('company')
			? ability.can(ACTIONS.View, SUBJECTS.CompanyShapefiles)
			: ability.can(ACTIONS.View, subject(SUBJECTS.ProjectShapefiles, shapefile)));

	return (
		<LayerTogglesContainer>
			<Tooltip title={canViewShapefile ? '' : PERMISSIONS_TOOLTIP_MESSAGE}>
				<div>
					<StyledSwitchField
						disabled={!canViewShapefile}
						label={shapefile.name}
						checked={shapefile.active}
						onChange={onToggleShow}
					/>
				</div>
			</Tooltip>
			{layerIsSelectable(shapefile) && (
				<Tooltip title='Select features' placement='right'>
					<StyledToggleButton
						size='small'
						disabled={!shapefile.active}
						selected={shapefile.filtering}
						onChange={onToggleFilter}
					>
						<Icon fontSize='inherit'>{faBullseyePointer}</Icon>
					</StyledToggleButton>
				</Tooltip>
			)}
		</LayerTogglesContainer>
	);
}
