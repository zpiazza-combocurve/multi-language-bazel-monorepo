import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faDrawCircle } from '@fortawesome/pro-solid-svg-icons';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import circle from '@turf/circle';
import distance from '@turf/distance';
import { Feature, Polygon, Position } from 'geojson';
import { Map } from 'mapbox-gl';

import { getTextColor, getTextOutlineColor } from '../colors';
import { DrawFeatureWithId, SelectMode, emptyDrawMode, getButtonClasses, getLabel, getModeButton } from './helpers';

const CIRCLE_STEPS = 64;

library.add(faDrawCircle);

interface RadiusModeState {
	status: 'center' | 'radius' | 'done';
	center?: Position;
	radiusEnd?: Position;
	circleFeature?: DrawFeatureWithId;
}

export const RadiusMode = {
	...emptyDrawMode, // tricks TS to recognize future fields that will be added to `this`

	name: 'draw_radius',

	onSetup() {
		return {
			status: 'center',
		};
	},

	onClick(state: RadiusModeState, e) {
		const { status } = state;

		const currentPos = [e.lngLat.lng, e.lngLat.lat] as [number, number];

		if (status === 'center') {
			state.center = currentPos;
			// turf's geojson type definitions are a little different than ours (ours are more strict)
			state.circleFeature = this.newFeature(circle(currentPos, 0, { units: 'miles' }));
			state.circleFeature.setProperty('radius', 0);
			state.circleFeature.setProperty('originalMode', this.name);
			this.addFeature(state.circleFeature);
			state.status = 'radius';
			return;
		}

		if (status === 'radius') {
			state.radiusEnd = currentPos;
			this._updateCircle(state);
			state.status = 'done';
			return this.changeMode('simple_select', { featureIds: [state.circleFeature?.id] });
		}
	},

	onMouseMove(state: RadiusModeState, e) {
		if (state.status === 'radius') {
			state.radiusEnd = [e.lngLat.lng, e.lngLat.lat] as [number, number];
			this._updateCircle(state);
		}
	},

	onStop(state: RadiusModeState) {
		if (!state.circleFeature) {
			return;
		}
		this.map.fire('draw.create', {
			features: [state.circleFeature.toGeoJSON()],
		});
	},

	toDisplayFeatures(state: RadiusModeState, geojson, display) {
		const { status, center, radiusEnd, circleFeature } = state;

		const isActive = geojson.properties.id === circleFeature?.id;
		geojson.properties.active = isActive ? 'true' : 'false';
		if (!isActive) {
			return display(geojson);
		}

		if (status === 'center' || !center) {
			return;
		}

		if (status === 'radius') {
			geojson.properties.active = 'true';
		}
		display(geojson);

		const centerFeature = {
			type: 'Feature',
			properties: { ...geojson.properties, parent: circleFeature?.id, meta: 'center' },
			geometry: { type: 'Point', coordinates: center },
		};
		display(centerFeature);

		if (radiusEnd) {
			const radius = geojson.properties?.radius ?? distance(center, radiusEnd, { units: 'miles' });
			const { label, labelSecondary } = getLabel(radius);
			const radiusFeature = {
				type: 'Feature',
				properties: {
					...geojson.properties,
					parent: circleFeature?.id,
					meta: 'radius',
					radius,
					label,
					labelSecondary,
				},
				geometry: {
					type: 'LineString',
					coordinates: [center, radiusEnd],
				},
			};
			display(radiusFeature);
		}
	},

	_updateCircle(state: RadiusModeState) {
		const { center, radiusEnd, circleFeature } = state;

		if (!center || !radiusEnd) {
			return;
		}

		const radius = distance(center, radiusEnd, { units: 'miles' });
		const updatedCircle = circle(center, radius, { steps: CIRCLE_STEPS, units: 'miles' });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		circleFeature?.setCoordinates(updatedCircle.geometry.coordinates as any); // wrong type definition in MapboxDraw
		circleFeature?.setProperty('radius', radius);
	},

	setSelected(selected: boolean, button: HTMLElement | undefined) {
		if (button) {
			button.className = getButtonClasses(selected);
		}
	},

	getButton(draw: MapboxDraw, map: Map) {
		const button = getModeButton(this.name, draw, map, 'Radius tool', 'draw-circle');
		this.setSelected(draw.getMode() === this.name, button);
		return button;
	},

	getStyles(theme: string) {
		return [
			{
				id: 'radius-label',
				type: 'symbol',
				filter: ['all', ['==', '$type', 'LineString'], ['==', 'meta', 'radius']],
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
		{ layerId: 'radius-label', property: 'text-color', func: getTextColor },
		{ layerId: 'radius-label', property: 'text-halo-color', func: getTextOutlineColor },
	],

	displayOnSelection: (
		selectionMode: SelectMode,
		state: Record<string, unknown>,
		geojson: Feature<Polygon, { id?: string; active?: 'true' | 'false'; radius?: number; modified?: boolean }>,
		display: (feature: Feature) => void,
		originalToDisplayFeatures: (
			state: Record<string, unknown>,
			geojson: Feature,
			display: (feature: Feature) => void
		) => void
	) => {
		const { id, radius, modified } = geojson.properties ?? {};

		if (modified) {
			originalToDisplayFeatures.apply(selectionMode, [state, geojson, display]);
			return;
		}

		const isActive = selectionMode.isSelected(id ?? '');
		geojson.properties.active = isActive ? 'true' : 'false';

		display(geojson);

		if (!isActive) {
			return;
		}

		const circumferencePoints = geojson.geometry.coordinates[0];

		const northPoint = circumferencePoints[0];
		const southPoint = circumferencePoints[Math.round(CIRCLE_STEPS / 2)];
		const center = [(northPoint[0] + southPoint[0]) / 2, (northPoint[1] + southPoint[1]) / 2] as [number, number];

		const centerFeature = {
			type: 'Feature' as const,
			properties: { ...geojson.properties, parent: id, meta: 'center' },
			geometry: { type: 'Point' as const, coordinates: center },
		};
		display(centerFeature);

		const eastPoint = circumferencePoints[Math.round((CIRCLE_STEPS * 3) / 4)];

		const finalRadius = radius ?? distance(center, eastPoint, { units: 'miles' });
		const { label, labelSecondary } = getLabel(finalRadius);
		const radiusFeature = {
			type: 'Feature' as const,
			properties: {
				...geojson.properties,
				parent: id,
				meta: 'radius',
				radius: finalRadius,
				label,
				labelSecondary,
			},
			geometry: {
				type: 'LineString' as const,
				coordinates: [center, eastPoint],
			},
		};
		display(radiusFeature);
	},
};
