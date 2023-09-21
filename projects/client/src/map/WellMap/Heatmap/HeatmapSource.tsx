import { FeatureCollection } from 'geojson';

import { strictlyDifferent } from '@/helpers/arrays';
import Layer from '@/map/MapboxGL/Layer';
import Source from '@/map/MapboxGL/Source';

import { HEATMAP_COLOR_PALETTE } from './shared';

interface HeatmapSourceProps {
	header: string | undefined;
	heatmapData: FeatureCollection;
	steps: Array<{ value: number; label: string }>;
}

const HeatmapSource = ({ header, heatmapData, steps = [] }: HeatmapSourceProps) => {
	return (
		<Source
			type='geojson'
			data={heatmapData}
			tolerance={0.1} // prevents small squares from disappearing at high zoom levels
		>
			<Layer
				id='heatmap-layer'
				type='fill'
				paint={{
					'fill-color': steps.length
						? ([
								'interpolate',
								['linear'],
								['get', header],
								...strictlyDifferent(steps.map(({ value }) => value)).reduce(
									(prev, value, i) => [...prev, value, HEATMAP_COLOR_PALETTE[i]],
									[] as Array<string | number>
								),
						  ] as ['interpolate', ...unknown[]])
						: 'rgba(0,0,0,0)',
					'fill-outline-color': 'rgba(0,0,0,0)',
					'fill-opacity': 0.5,
				}}
			/>
		</Source>
	);
};

export default HeatmapSource;
