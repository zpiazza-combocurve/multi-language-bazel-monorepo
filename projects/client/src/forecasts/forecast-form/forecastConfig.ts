import produce from 'immer';

// this file is temporal, once a migration is ran we should get rid of all mappings
function mapFromOldConfig(config) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const draft: Record<string, any> = {
		applyAll: config.applyAll,
		phases: {
			oil: config.settings.general.phases.includes('oil'),
			gas: config.settings.general.phases.includes('gas'),
			water: config.settings.general.phases.includes('water'),
		},
	};
	if (config.applyAll) {
		const shared = {
			...config.settings.shared,
			axis_combo: config.axis_combo ?? config.axisCombo,
			model_name: config.settings.general.model_name ?? config.settings.general.model,
		};
		draft.shared = shared;
		draft.oil = shared;
		draft.gas = shared;
		draft.water = shared;
	} else {
		['shared', 'oil', 'gas', 'water'].forEach((phase) => {
			draft[phase] = {
				...config.settings[phase],
				axis_combo: config.axis_combo ?? config.axisCombo,
				model_name: config.settings.general.model_name ?? config.settings.general.model,
			};
		});
	}
	draft.shared.resolution = config.settings.general.resolution;
	return draft;
}

// more recent but has model instead of model_name, and somtimes both but model takes precedence
function mapSemiOldConfig(config) {
	return produce(config, (draft) => {
		draft.settings ??= {};
		if (draft.settings.applyAll) {
			const { model, model_name, ...rest } = draft.settings.shared ?? {};
			const shared = { ...rest, model_name: model ?? model_name };
			['shared', 'oil', 'gas', 'water'].forEach((phase) => {
				draft.settings[phase] = shared;
			});
		} else {
			['shared', 'oil', 'gas', 'water'].forEach((phase) => {
				const { model, model_name, ...rest } = draft.settings[phase] ?? {};
				draft.settings[phase] = { ...rest, model_name: model ?? model_name };
			});
		}
	});
}

// just validate and make sure when applyAll is true use shared for all phases values
function mapLatestConfig(config) {
	return produce(config, (draft) => {
		draft.settings ??= {};
		if (draft.settings.applyAll) {
			const shared = draft.settings.shared ?? {};
			['shared', 'oil', 'gas', 'water'].forEach((phase) => {
				draft.settings[phase] = shared;
			});
		}
	});
}

// adjust for resolution being scoped outside of the automatic portion of the form
function mapGlobalResolution(config) {
	return produce(config, (draft) => {
		if (draft.shared.resolution) {
			delete draft.shared.resolution;
		}
	});
}

export function mapConfig(config) {
	if (config?.shared) {
		return mapGlobalResolution(config);
	}
	if (!config?.settings) {
		return config;
	}
	if (config?.settings?.general) {
		return { settings: mapFromOldConfig(config) };
	}
	if (config?.settings?._counter) {
		return mapLatestConfig(config);
	}
	return mapSemiOldConfig(config);
}

// clean config for saving
export function cleanConfig(config) {
	// TODO no longer needed, remove
	return config;
}
