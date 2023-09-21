import { addHOCName } from '@/components/shared';
import NotFound from '@/not-found/not-found';

import type { FeatureFlags } from './shared';
import useLDFeatureFlags from './useLDFeatureFlags';

/**
 * Only allows access to the page if the feature flag is enabled
 *
 * @example
 * 	const CarbonPage = () => {
 * 		// ...
 * 	};
 *
 * 	export default withFeatureFlagEnabled(CarbonPage, 'isCarbonEnabled');
 */
export function withFeatureFlagEnabled<C extends React.ComponentType<P>, P>(
	Component: C,
	featureFlag: keyof FeatureFlags
): C {
	const ComponentWithFlags = (props: P) => {
		const { [featureFlag]: isFeatureFlagEnabled } = useLDFeatureFlags();

		if (!isFeatureFlagEnabled) return <NotFound />;

		// @ts-expect-error TODO figure out later, probably missing ref
		return <Component {...props} />;
	};

	return addHOCName(ComponentWithFlags, 'withLDFeatureFlags', Component) as C;
}
