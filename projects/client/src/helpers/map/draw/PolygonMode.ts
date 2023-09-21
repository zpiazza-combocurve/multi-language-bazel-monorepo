import { library } from '@fortawesome/fontawesome-svg-core';
import { faDrawSquare } from '@fortawesome/pro-solid-svg-icons';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Map } from 'mapbox-gl';
import FreehandMode from 'mapbox-gl-draw-freehand-mode';

import { DrawMode, getButtonClasses, getModeButton } from './helpers';

library.add(faDrawSquare);

export const CustomPolygonMode = {
	...(FreehandMode as DrawMode),

	name: 'draw_polygon',

	getButton(draw: MapboxDraw, map: Map) {
		const button = getModeButton(this.name, draw, map, 'Polygon tool', 'draw-square');
		this.setSelected(draw.getMode() === this.name, button);
		return button;
	},

	setSelected(selected: boolean, button: HTMLElement | undefined) {
		if (button) {
			button.className = getButtonClasses(selected);
		}
	},

	onStop(state) {
		FreehandMode.onStop.bind(this)(state);
		// hack because even though FreehandMode.onStop should be doing this, it doesn't work for some reason
		this.map?.dragPan?.enable();
	},
};
