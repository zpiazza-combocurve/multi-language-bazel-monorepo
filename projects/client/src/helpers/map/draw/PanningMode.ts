import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faArrows } from '@fortawesome/pro-solid-svg-icons';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Map } from 'mapbox-gl';

import { emptyDrawMode, getButtonClasses, getModeButton } from './helpers';

library.add(faArrows);

export const PanningMode = {
	...emptyDrawMode, // tricks TS to recognize future fields that will be added to `this`

	name: 'pan',

	toDisplayFeatures(state, geojson, display) {
		return display(geojson);
	},

	setSelected(selected: boolean, button: HTMLElement | undefined) {
		if (button) {
			button.className = getButtonClasses(selected);
		}
	},

	getButton(draw: MapboxDraw, map: Map) {
		const button = getModeButton(this.name, draw, map, 'Panning mode', 'arrows');
		this.setSelected(draw.getMode() === this.name, button);
		return button;
	},
};
