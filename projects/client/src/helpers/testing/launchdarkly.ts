import * as launchdarkly from 'launchdarkly-react-client-sdk';

import { FeatureFlags, LDFeatureFlagKey } from '@/inpt-shared/feature-flags/shared';

let flags = {};
export function setupLaunchdarkly() {
	beforeEach(() => (flags = {}));
}

export function mockFlags(newFlags: { [k in LDFeatureFlagKey]?: FeatureFlags[keyof FeatureFlags] }) {
	flags = {
		...flags,
		...newFlags,
	};
	vi.spyOn(launchdarkly, 'useFlags').mockImplementation(() => flags);
}
