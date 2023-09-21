import { useTheme } from '@material-ui/core';
import { Expression } from 'mapbox-gl';
import { ComponentProps, ReactNode, useMemo, useState } from 'react';

import { InfoIcon } from '@/components/v2/misc';
import { Y_ITEM_COLORS } from '@/forecasts/charts/components/graphProperties';
import { PROXIMITY_TARGET_WELL_COLOR, PURPLE_1, RED_1 } from '@/helpers/zing';
import MapControl from '@/map/MapboxGL/MapControl';
import WellMap from '@/map/StaticWellMapWithSettings';
import { WELL_COLOR, WellLayersOptions } from '@/map/WellMap/WellsSource';
import { StyledSwitchField } from '@/map/components/MapShapefileListItem';
import { Item, Padding, Shape } from '@/type-curves/shared/WellLEgendControl';

export const SELECTED_COLOR = PURPLE_1;
export const INVALID_COLOR = RED_1;

const getWellColorExpression = (selectedWellColor: string): Expression => [
	'case',
	['==', ['get', 'invalid'], true],
	INVALID_COLOR,
	['==', ['get', 'target'], true],
	PROXIMITY_TARGET_WELL_COLOR,
	['==', ['get', 'selected'], true],
	selectedWellColor,
	['==', ['get', 'gas'], true],
	Y_ITEM_COLORS.proximityWells.gas,
	['==', ['get', 'oil'], true],
	Y_ITEM_COLORS.proximityWells.oil,
	['==', ['get', 'water'], true],
	Y_ITEM_COLORS.proximityWells.water,
	WELL_COLOR,
];

const MAP_LAYERS = [
	{
		key: 'oil',
		label: 'Oil Background Wells',
		color: Y_ITEM_COLORS.proximityWells.oil,
		tooltip: 'Proximity Oil Wells',
	},
	{
		key: 'gas',
		label: 'Gas Background Wells',
		color: Y_ITEM_COLORS.proximityWells.gas,
		tooltip: 'Proximity Gas Wells',
	},
	{
		key: 'water',
		label: 'Water Background Wells',
		color: Y_ITEM_COLORS.proximityWells.water,
		tooltip: 'Proximity Water Wells ',
	},
	{ key: 'target', label: 'Target', color: PROXIMITY_TARGET_WELL_COLOR, tooltip: 'Proximity Target Well' },
];

interface ProximityWellMapProps extends Omit<ComponentProps<typeof WellMap>, 'wells'> {
	wells: { [id: string]: { [layer: string]: boolean } };
	mapLayers?: Array<{ key: string; label: string; color: string; tooltip: string }>;
	legend?: ReactNode;
}

/**
 * Proximity wells map for showing (not selecting) proximity wells. On addition to all the functionality of the
 * StaticWellMap with inline map settings, supports:
 *
 * - Set wells style based on proximity relevant information.
 * - Adds togglable layers on the layers menu. They can be customized, and by default are oil, gas, water, and target.
 * - Adds legend control to the map. A default one is added based on the mapLayers, but it can be customized.
 */
function ProximityWellMap({
	wells: allWells,
	mapLayers = MAP_LAYERS,
	legend,
	children,
	...mapProps
}: ProximityWellMapProps) {
	const {
		palette: { charts },
	} = useTheme();

	const wellColor = getWellColorExpression(charts.selected);

	const sourceLayerOptions: Partial<WellLayersOptions> = {
		surfacePaint: { 'circle-color': wellColor },
		horizontalPaint: { 'line-color': wellColor },
	};

	const [layersActiveStatus, setLayersActiveStatus] = useState(
		Object.fromEntries(mapLayers.map(({ key }) => [key, true]))
	);

	const activeLayers = useMemo(
		() =>
			Object.entries(layersActiveStatus)
				.filter(([_, active]) => active)
				.map(([key]) => key),
		[layersActiveStatus]
	);

	const wells = useMemo(
		() =>
			Object.entries(allWells).map(([id, w]) => ({ id, ...w, hidden: !activeLayers.some((layer) => w[layer]) })),
		[allWells, activeLayers]
	);

	return (
		<WellMap
			wells={wells}
			sourceLayerOptions={sourceLayerOptions}
			mapMenuItems={mapLayers.map(({ key, label }) => (
				<StyledSwitchField
					key={key}
					label={label}
					checked={!!layersActiveStatus[key]}
					onChange={(event) => setLayersActiveStatus((p) => ({ ...p, [key]: event.target.checked }))}
				/>
			))}
			mapLayers={mapLayers}
			{...mapProps}
		>
			{legend || (
				<MapControl css='padding: 0.5rem' position='bottom-right'>
					{mapLayers.map(({ key, label, color, tooltip }) => (
						<Item key={key}>
							<InfoIcon tooltipTitle={tooltip} />
							<span>{label}</span>
							<Padding />
							<Shape color={color} borderColor={color} />
						</Item>
					))}
				</MapControl>
			)}
			{children}
		</WellMap>
	);
}

export default ProximityWellMap;
