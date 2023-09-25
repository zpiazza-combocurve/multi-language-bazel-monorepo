import { FeatureFlags, LDFeatureFlagKey } from '../feature-flags';
import { LDMultiKindContext, initializeLaunchDarklyClient } from '../helpers/initialize-launch-darkly-client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export type EvaluateFeatureFlag = (key: LDFeatureFlagKey, defaultValue?: any) => Promise<any>;

export const launchDarklyMiddleware = async (req, res, next) => {
	const { cachedTenant } = res.locals;

	const info = await cachedTenant.get('info');
	if (!info) {
		// mostly to comply with type checks but in practice this should not happen
		throw new Error('Tenant information not set');
	}
	const { name } = info;

	const client = await initializeLaunchDarklyClient();

	const context: LDMultiKindContext = {
		kind: 'multi',
		organization: {
			key: name,
		},
	};

	// Evaluate a feature flag in the context of the current request
	const evaluateFeatureFlag: EvaluateFeatureFlag = (key: LDFeatureFlagKey, defaultValue = false) => {
		return client.variation(key, context, defaultValue);
	};

	const allFlags = await client.allFlagsState(context);

	// This should be enough for most use cases, similar to what we have in the frontend
	const featureFlags: FeatureFlags = {
		isDALEnabled: allFlags.getFlagValue(LDFeatureFlagKey.isDALEnabled),
	};

	res.locals.featureFlags = featureFlags;

	// Storing these in res.locals in case we need to access the LaunchDarkly client and context
	res.locals.evaluateFeatureFlag = evaluateFeatureFlag;
	res.locals.launchDarklyClient = client;
	res.locals.launchDarklyContext = context;

	next();
};
