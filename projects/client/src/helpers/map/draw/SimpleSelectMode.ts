import { CustomDrawMode, SelectMode } from './helpers';

export const patchSimpleSelectMode = (simpleSelectMode: SelectMode, customModes: CustomDrawMode[]) => {
	const state = { paused: false };

	const originalToDisplayFeatures = simpleSelectMode.toDisplayFeatures;
	simpleSelectMode.toDisplayFeatures = function (state, geojson, display) {
		let properties = geojson.properties ?? {};
		const extraProperties = this.getFeature(properties.id ?? '')?.properties ?? {};
		properties = { ...properties, ...extraProperties };

		const mode = customModes.find((mode) => mode.name === properties.originalMode);
		if (mode?.displayOnSelection) {
			mode.displayOnSelection(this, state, { ...geojson, properties }, display, originalToDisplayFeatures);
			return;
		}

		originalToDisplayFeatures.apply(this, [state, geojson, display]);
	};

	const originalOnClick = simpleSelectMode.onClick;
	simpleSelectMode.onClick = function (...args) {
		if (state.paused) {
			return;
		}
		originalOnClick.apply(this, args);
	};

	simpleSelectMode.setPaused = function (paused: boolean) {
		state.paused = paused;
	};

	return simpleSelectMode;
};
