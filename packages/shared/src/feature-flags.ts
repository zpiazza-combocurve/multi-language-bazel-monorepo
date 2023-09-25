export interface FeatureFlags {
	isDALEnabled: boolean;
}

export enum LDFeatureFlagKey {
	isDALEnabled = 'roll-out-data-access-layer',
}

export interface LDFlagSet {
	[LDFeatureFlagKey.isDALEnabled]: boolean;
}

export const DEFAULT_FLAG_SET: LDFlagSet = {
	[LDFeatureFlagKey.isDALEnabled]: false,
};

export const FEATURE_DISABLED_GENERIC_MESSAGE =
	'Feature is disabled. Please, contact ComboCurve support to enable this feature.';
