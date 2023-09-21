import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

import { IconName, icon } from '@fortawesome/fontawesome-svg-core';
import MapboxDraw, { DrawFeature } from '@mapbox/mapbox-gl-draw';
import classNames from 'classnames';
import { Feature, Geometry } from 'geojson';
import { Map } from 'mapbox-gl';

export interface ThemePropertyDefinition {
	layerId: string;
	property: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	func: (theme: 'light' | 'dark') => any;
}

export interface DrawFeatureWithId extends DrawFeature {
	id?: string;
}

interface BaseDrawMode {
	// these fields will be added by MapboxDraw to the mode object
	newFeature: (feature: Feature) => DrawFeatureWithId;
	addFeature: (feature: DrawFeature) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	changeMode: (mode: string, options: any) => void;
	map: Map;
}

export interface DrawMode extends BaseDrawMode {
	toDisplayFeatures: (
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		state: any,
		geojson: Feature<
			Geometry,
			{
				id?: string;
				active?: 'true' | 'false';
				originalMode?: string;
			}
		>,
		display: (feature: Feature) => void
	) => void;
}

export interface SelectMode extends DrawMode {
	onClick: (...args: unknown[]) => void;
	getFeature: (id: string) => Feature;
	isSelected: (id: string) => boolean;
	setPaused: (paused: boolean) => void; // custom function added
}

export interface CustomDrawMode extends DrawMode {
	name: string;
	getButton: (draw: MapboxDraw, map: Map) => HTMLElement;
	getStyles?: (theme: string) => unknown[];
	themeProperties?: ThemePropertyDefinition[];
	displayOnSelection?: (
		selectionMode: SelectMode,
		state: Record<string, unknown>,
		geojson: Feature<Geometry, { id?: string; active?: 'true' | 'false' }>,
		display: (feature: Feature) => void,
		originalToDisplayFeatures: (
			state: Record<string, unknown>,
			geojson: Feature<Geometry, { id?: string; active?: 'true' | 'false' }>,
			display: (feature: Feature) => void
		) => void
	) => void;
	setSelected: (selected: boolean, button: HTMLElement | undefined) => void;
}

const FEET_IN_A_MILE = 5280;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const emptyDrawMode: BaseDrawMode = {} as any;

export const getButton = (title: string, iconName: IconName, onClick: () => void) => {
	const button = document.createElement('button');
	button.title = title;
	button.className = 'mapbox-gl-draw_ctrl-draw-btn custom-mapbox-control';
	button.addEventListener('click', onClick);
	const faIcon = icon({ prefix: 'fas', iconName });
	button.appendChild(faIcon.node[0]);
	return button;
};

export const getModeButton = (modeName: string, draw: MapboxDraw, map: Map, title: string, iconName: IconName) =>
	getButton(title, iconName, () => {
		const newMode = draw.getMode() === modeName ? 'simple_select' : modeName;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		draw.changeMode(newMode as any);
		map.fire('draw.modechange', { mode: newMode });
	});

export const getButtonClasses = (selected: boolean) =>
	classNames(['mapbox-gl-draw_ctrl-draw-btn', 'custom-mapbox-control', { selected }]);

export const getLabel = (miles: number) => {
	if (miles >= 5) {
		return { label: `${Math.round(miles * 100) / 100} mi` };
	} else if (miles >= 1) {
		return {
			label: `${Math.round(miles * 100) / 100} mi`,
			labelSecondary: `(${Math.round(miles * FEET_IN_A_MILE * 100) / 100} ft)`,
		};
	} else {
		return { label: `${Math.round(miles * FEET_IN_A_MILE * 100) / 100} ft` };
	}
};
