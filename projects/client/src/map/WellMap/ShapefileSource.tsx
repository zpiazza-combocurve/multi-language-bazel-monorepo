import { MutableRefObject } from 'react';

import { LAYER_TYPES } from '@/helpers/map/helpers';
import Layer from '@/map/MapboxGL/Layer';
import Source from '@/map/MapboxGL/Source';

import { Shapefile } from '../types';
import { useFilterLayer } from './useFilterLayer';

export interface ShapefileFiltering extends Shapefile {
	filtering: boolean;
}
interface ShapefileSourceProps {
	shapefile: ShapefileFiltering;
	customDrawRef: MutableRefObject<MapboxDraw | undefined>;
}

function ShapefileSource({ shapefile, customDrawRef }: ShapefileSourceProps) {
	const { FilterLayer } = useFilterLayer(shapefile, customDrawRef);

	const { idShapefile, shSourceType, shapeType, name, color, opacity, filtering, tooltipFields } = shapefile;
	const layerType = LAYER_TYPES[shapeType];

	const url = `mapbox://${idShapefile}`;

	return (
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		<Source type={shSourceType as any} url={url}>
			<Layer
				type={layerType}
				source-layer={name}
				layout={{ visibility: 'visible' }}
				paint={{
					[`${layerType}-opacity`]: opacity / 100,
					[`${layerType}-color`]: color,
				}}
				beforeLayer='wells-layer'
			/>
			{filtering && <FilterLayer shapeType={shapeType} name={name} color={color} tooltipFields={tooltipFields} />}
		</Source>
	);
}

export default ShapefileSource;
