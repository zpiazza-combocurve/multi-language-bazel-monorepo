import { useAbility } from '@casl/react';

import { ACTIONS, AbilityContext, PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS, subject } from '@/access-policies/Can';

import { Layer } from '../types';
import { LayerListItem, LayerListItemProps } from './LayerListItem';

type ShapefileListItemProps = {
	shapefile: Layer;
	first?: boolean;
	last?: boolean;
} & Pick<LayerListItemProps, 'selected' | 'onToggle' | 'onMoveUp' | 'onMoveDown' | 'onClick'>;
export function ShapefileListItem({
	shapefile,
	first,
	last,
	selected,
	onToggle,
	onMoveUp,
	onMoveDown,
	onClick,
}: ShapefileListItemProps) {
	const ability = useAbility(AbilityContext);

	const canViewShapefile = shapefile.visibility.includes('company')
		? ability.can(ACTIONS.View, SUBJECTS.CompanyShapefiles)
		: ability.can(ACTIONS.View, subject(SUBJECTS.ProjectShapefiles, shapefile));

	return (
		<LayerListItem
			name={shapefile.name}
			active={shapefile.active}
			selected={selected}
			disableClick={!canViewShapefile && PERMISSIONS_TOOLTIP_MESSAGE}
			disableToggle={!canViewShapefile && PERMISSIONS_TOOLTIP_MESSAGE}
			disableMoveUp={first}
			disableMoveDown={last}
			onToggle={onToggle}
			onMoveUp={onMoveUp}
			onMoveDown={onMoveDown}
			onClick={onClick}
		/>
	);
}
