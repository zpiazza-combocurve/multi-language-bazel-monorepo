import { useFlags } from 'launchdarkly-react-client-sdk';
import { pick } from 'lodash';

import { addHOCName } from '@/components/shared';
import { FeatureFlags, LDFeatureFlagKey, LDFlagSet } from '@/inpt-shared/feature-flags/shared';

export type { FeatureFlags } from '@/inpt-shared/feature-flags/shared';

export const useLDFeatureFlags = (): FeatureFlags => {
	const flags = useFlags<LDFlagSet>();

	const featureFlags = {} as FeatureFlags;

	for (const key in LDFeatureFlagKey) {
		featureFlags[key] = flags[LDFeatureFlagKey[key]];
	}

	return featureFlags;
};

export const withLDFeatureFlags = <T extends object>(
	Component: React.ComponentType<T>,
	flags: (keyof FeatureFlags)[] = []
) => {
	const ComponentWithFlags = (props: Omit<T, keyof T>) => {
		const all = useLDFeatureFlags();
		const toUse = !flags.length ? all : pick(all, flags);

		return <Component {...toUse} {...(props as T)} />;
	};

	return addHOCName(ComponentWithFlags, 'withLDFeatureFlags', Component);
};

export default useLDFeatureFlags;
