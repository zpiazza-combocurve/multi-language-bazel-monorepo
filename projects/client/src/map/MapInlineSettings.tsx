import React, { useState } from 'react';

import { useAlfa } from '@/helpers/alfa';

import { Filter } from '../filters/shared';
import { MapInlineSettingsPanel } from './MapSettings/MapInlineSettingsPanel';
import { StyledSwitchField } from './components/MapShapefileListItem';

interface MapInlineSettingsProps {
	wells?: Array<string | { id: string }>;
	filters?: Filter[];
	className?: string;
	shouldShowWellsColorHeader?: boolean;
	children?: (mapMenuSwitch: React.ReactNode) => React.ReactNode;
}

/**
 * Wraps around any map, showing a panel with map settings to the left. Receives as children a function with a
 * SwitchItem that the children component can place where it decides, which toggles the settings panel visibility.
 */
function MapInlineSettings({
	wells,
	filters,
	className,
	shouldShowWellsColorHeader,
	children,
}: MapInlineSettingsProps) {
	const [showingMapSettings, setShowingMapSettings] = useState(false);

	const { project } = useAlfa(['project']);

	return (
		<div
			className={className}
			css={`
				display: flex;
				flex-direction: row;
				overflow-x: hidden;
				overflow-y: auto;
				width: 100%;
				height: 100%;
			`}
		>
			{showingMapSettings && !!project && (
				<MapInlineSettingsPanel
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					project={project as any}
					wells={wells}
					filters={filters}
					shouldShowWellsColorHeader={shouldShowWellsColorHeader}
				/>
			)}
			{children?.(
				(project ?? null) && (
					<StyledSwitchField
						css={`
							margin-left: 0px;
							width: 100%;
						`}
						checked={showingMapSettings}
						onChange={(ev) => setShowingMapSettings(ev.target.checked)}
						label='Map Settings'
					/>
				)
			)}
		</div>
	);
}

export default MapInlineSettings;
