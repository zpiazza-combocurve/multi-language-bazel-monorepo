import { LAYER_TYPES } from '@/helpers/map/helpers';
import Layer from '@/map/MapboxGL/Layer';
import Source from '@/map/MapboxGL/Source';
import { PresetLayer } from '@/map/types';

interface PresetLayerSourceProps {
	presetLayer: PresetLayer;
	visible: boolean;
}

function PresetLayerSource({ presetLayer, visible }: PresetLayerSourceProps) {
	if (!visible) {
		return null;
	}

	const { shSourceType, shapeType, name, urls } = presetLayer;
	const layerType = LAYER_TYPES[shapeType];

	const layers = urls.map((url, index) => {
		const sourceName = `${name}-source-${index}`;
		const layerName = `${name}-layer-${index}`;
		return {
			url,
			sourceName,
			layerName,
		};
	});

	return (
		<>
			{layers.map((layer) => {
				return (
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					<Source key={layer.sourceName} type={shSourceType as any} tiles={[layer.url]}>
						<Layer
							type={layerType}
							layout={{ visibility: 'visible' }}
							beforeLayer='wells-layer'
							id={layer.layerName}
						/>
					</Source>
				);
			})}
		</>
	);
}

export default PresetLayerSource;
