import { library } from '@fortawesome/fontawesome-svg-core';
import { faWaveTriangle } from '@fortawesome/pro-solid-svg-icons';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import length from '@turf/length';
import { Feature, Geometry } from 'geojson';
import { Map } from 'mapbox-gl';

import { getTextColor, getTextOutlineColor } from '../colors';
import { DrawMode, SelectMode, getButtonClasses, getLabel, getModeButton } from './helpers';

library.add(faWaveTriangle);

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const lineStringMode = (MapboxDraw.modes as any).draw_line_string; // wrong type definition from MapboxDraw

export const CustomLineStringMode = {
	...(lineStringMode as DrawMode),

	name: 'draw_line_string',

	getButton(draw: MapboxDraw, map: Map) {
		const button = getModeButton(this.name, draw, map, 'Line String tool', 'wave-triangle');
		this.setSelected(draw.getMode() === this.name, button);
		return button;
	},

	setSelected(selected: boolean, button: HTMLElement | undefined) {
		if (button) {
			button.className = getButtonClasses(selected);
		}
	},

	onClick(state, e) {
		state.line?.setProperty('originalMode', this.name);
		lineStringMode.onClick.apply(this, [state, e]);
	},

	toDisplayFeatures(state, geojson, display) {
		const isActive = geojson.properties?.id === state.line?.id;
		if (isActive) {
			geojson.properties.originalMode = this.name;
			const { label, labelSecondary } = getLabel(length(geojson, { units: 'miles' }));
			geojson.properties.label = label;
			geojson.properties.labelSecondary = labelSecondary;
		}

		lineStringMode.toDisplayFeatures.apply(this, [state, geojson, display]);
	},

	getStyles(theme: string) {
		return [
			{
				id: 'line-string-label',
				type: 'symbol',
				filter: ['all', ['==', '$type', 'LineString'], ['==', 'originalMode', this.name]],
				paint: {
					'text-color': getTextColor(theme),
					'text-halo-width': 1,
					'text-halo-color': getTextOutlineColor(theme),
					'text-halo-blur': 1,
					'text-opacity': 0.9,
				},
				layout: {
					'symbol-placement': 'line-center',
					'text-field': [
						'format',
						['get', 'label'],
						{ 'font-scale': 1 },
						'\n',
						{},
						['get', 'labelSecondary'],
						{
							'text-font': ['literal', ['DIN Offc Pro Italic', 'Arial Unicode MS Regular']],
						},
					],
					'text-allow-overlap': true,
					'text-anchor': 'top',
					'text-size': 12,
					'text-padding': 0,
				},
			},
		];
	},

	themeProperties: [
		{ layerId: 'line-string-label', property: 'text-color', func: getTextColor },
		{ layerId: 'line-string-label', property: 'text-halo-color', func: getTextOutlineColor },
	],

	displayOnSelection(
		selectionMode: SelectMode,
		state: Record<string, unknown>,
		geojson: Feature<Geometry, { id?: string; label?: string; labelSecondary?: string; originalMode?: string }>,
		display: (feature: Feature) => void,
		originalToDisplayFeatures: (
			state: Record<string, unknown>,
			geojson: Feature,
			display: (feature: Feature) => void
		) => void
	) {
		const isActive = selectionMode.isSelected(geojson.properties?.id ?? '');
		if (isActive) {
			geojson.properties.originalMode = this.name;
			const { label, labelSecondary } = getLabel(length(geojson, { units: 'miles' }));
			geojson.properties.label = label;
			geojson.properties.labelSecondary = labelSecondary;
		}

		originalToDisplayFeatures.apply(selectionMode, [state, geojson, display]);
	},
};
