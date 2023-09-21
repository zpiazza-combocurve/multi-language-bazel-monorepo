import NotFound from '@/not-found/not-found';

import type { FeatureFlags } from './shared';
import useLDFeatureFlags from './useLDFeatureFlags';

/**
 * @example
 * 	<FeatureFlagGuard flag='isCarbonEnabled'>Feature Flagged Content</FeatureFlagGuard>,
 */
export default function FeatureFlagGuard(props: { children: React.ReactNode; flag: keyof FeatureFlags }) {
	const { flag } = props;
	const { [flag]: isFeatureFlagEnabled } = useLDFeatureFlags();

	if (!isFeatureFlagEnabled) return <NotFound />;

	// eslint-disable-next-line react/jsx-no-useless-fragment
	return <>{props.children}</>;
}
