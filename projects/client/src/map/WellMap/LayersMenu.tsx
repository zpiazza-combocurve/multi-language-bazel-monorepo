import { useContext, useState } from 'react';

import { FeatureIcons } from '@/helpers/features';

import { MapboxGLContext } from '../MapboxGL/context';
import { MapControlMenuIconButton } from '../MapboxGL/controls';

interface LayersMenuProps {
	children: React.ReactNode;
}

function LayersMenu({ children }: LayersMenuProps) {
	const { map } = useContext(MapboxGLContext);

	const [mapHeight, setMapHeight] = useState(map?.getContainer().clientHeight);

	map?.on('resize', () => setMapHeight(map?.getContainer().clientHeight));

	return (
		<MapControlMenuIconButton
			tooltipTitle='Customize Layers'
			icon={FeatureIcons.layers}
			mapControlPosition='top-left'
			customMaxHeight={`${(mapHeight ?? 200) - 20}px`}
			customPadding='0.25rem 1rem 0.25rem 0.25rem'
			customMaxWidth='325px'
		>
			{children}
		</MapControlMenuIconButton>
	);
}

export default LayersMenu;
