import { ComponentProps } from 'react';

import MapInlineSettings from './MapInlineSettings';
import StaticWellMap from './WellMap/StaticWellMap';

function StaticWellMapWithSettings({
	wells,
	className,
	mapMenuItems,
	shouldShowWellsColorHeader,
	...props
}: ComponentProps<typeof StaticWellMap>) {
	return (
		<MapInlineSettings className={className} wells={wells} shouldShowWellsColorHeader={shouldShowWellsColorHeader}>
			{(mapMenuSwitch) => (
				<StaticWellMap
					wells={wells}
					mapSettingsMenuItem={mapMenuSwitch}
					mapMenuItems={mapMenuItems}
					{...props}
				/>
			)}
		</MapInlineSettings>
	);
}

export default StaticWellMapWithSettings;
