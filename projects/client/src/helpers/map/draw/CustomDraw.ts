import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { FeatureCollection } from 'geojson';
import { Map } from 'mapbox-gl';
import { Dispatch, ReactNode, SetStateAction } from 'react';

import { CustomLineStringMode } from './LineStringMode';
import { PanningMode } from './PanningMode';
import { CustomPolygonMode } from './PolygonMode';
import { RadiusMode } from './RadiusMode';
import { patchSimpleSelectMode } from './SimpleSelectMode';
import { CustomDrawMode, ThemePropertyDefinition } from './helpers';
import { useMapStore } from './mapPortals';
import { getSaveButton } from './save';
import { getTransformButton } from './transform';

type CustomDrawProps = {
	theme: 'light' | 'dark';
	setMapPortals?: Dispatch<SetStateAction<ReactNode[]>>;
};

const customModes: CustomDrawMode[] = [PanningMode, CustomLineStringMode, CustomPolygonMode, RadiusMode];
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const simpleSelectMode = (MapboxDraw.modes as any).simple_select; // wrong type definition from MapboxDraw
const patchedSimpleSelectMode = patchSimpleSelectMode(simpleSelectMode, customModes);

const getDrawStyles = () => {
	const dummy = new MapboxDraw();
	return [
		// @ts-expect-error wrong type definition from MapboxDraw
		...dummy.options.styles.map((style) =>
			style.id.startsWith('gl-draw-polygon-stroke-inactive')
				? { ...style, paint: { ...style.paint, 'line-opacity': 0.2 } }
				: style
		),
		{
			id: 'bigger-midpoints',
			type: 'circle',
			filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
			paint: {
				'circle-radius': 5,
				'circle-color':
					// @ts-expect-error wrong type definition from MapboxDraw
					dummy.options.styles.find(({ id }) => id === 'gl-draw-polygon-midpoint.hot')?.paint?.[
						'circle-color'
					] ?? 'white',
			},
		},
	];
};

export class CustomDraw {
	private draw: MapboxDraw;
	themeProperties: ThemePropertyDefinition[];
	setMapPortals?: Dispatch<SetStateAction<ReactNode[]>>;
	modeButtons: Record<string, HTMLElement | undefined>;

	constructor({ theme, setMapPortals }: CustomDrawProps) {
		this.draw = new MapboxDraw({
			boxSelect: false,
			displayControlsDefault: false,
			controls: {
				trash: true,
			},
			modes: {
				simple_select: patchedSimpleSelectMode,
				direct_select: MapboxDraw.modes.direct_select,
				...Object.fromEntries(customModes.map((mode) => [mode.name, mode])),
			},
			styles: [...getDrawStyles(), ...customModes.map((mode) => mode.getStyles?.(theme) ?? []).flat()],
		});
		this.themeProperties = customModes.map((mode) => mode.themeProperties ?? []).flat();
		this.setMapPortals = setMapPortals;
		this.modeButtons = {};
	}

	onAdd(map: Map) {
		const draw = this.draw;
		const container = draw.onAdd(map);
		container.className = `mapboxgl-ctrl-group mapboxgl-ctrl custom-draw-controls`;
		const trashButton = container.children[container.children.length - 1];

		this.modeButtons = Object.fromEntries(customModes.map((mode) => [mode.name, mode.getButton(draw, map)]));

		Object.values(this.modeButtons).forEach((button) => {
			if (button) {
				trashButton.insertAdjacentElement('beforebegin', button);
			}
		});

		trashButton.insertAdjacentElement('beforebegin', getTransformButton(draw, map, this.setMapPortals));
		trashButton.insertAdjacentElement('beforebegin', getSaveButton(draw, map, this.setMapPortals));

		map.on('draw.modechange', ({ mode }) => {
			customModes.forEach(({ name, setSelected }) => {
				setSelected(name === mode, this.modeButtons[name]);
			});
		});

		map.on('draw.update', function ({ action, features }) {
			if (action === 'change_coordinates') {
				features.forEach(({ id }) => {
					draw.setFeatureProperty(id, 'modified', true);
				});
			}
		});

		return container;
	}

	deleteAll() {
		return this.draw.deleteAll();
	}

	onRemove(map: Map) {
		this.draw.onRemove(map);
		useMapStore.getState().clear();
	}

	setFeatures(features: FeatureCollection) {
		this.draw.set(features);
	}

	getAll() {
		return this.draw.getAll();
	}

	getSelectedIds() {
		return this.draw.getSelectedIds();
	}

	resetMode(featureIds?: string[]) {
		this.draw.changeMode('simple_select', featureIds && { featureIds });
	}

	setSelectPaused(paused: boolean) {
		patchedSimpleSelectMode.setPaused(paused);
	}
}
