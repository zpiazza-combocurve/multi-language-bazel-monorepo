// https://docs.launchdarkly.com/sdk/client-side/react/react-web
import { withLDProvider } from 'launchdarkly-react-client-sdk';
import { Fragment } from 'react';

import { getTenant } from '@/helpers/utilities';
import { DEFAULT_FLAG_SET } from '@/inpt-shared/feature-flags/shared';

export const withLaunchDarklyClient = (App) => {
	const tenant = getTenant();

	// https://docs.launchdarkly.com/sdk/client-side/react/react-web#initializing-the-react-sdk
	const LDProvider = withLDProvider({
		clientSideID: process.env.LAUNCH_DARKLY_CLIENT_ID || '',
		reactOptions: {
			// https://docs.launchdarkly.com/sdk/client-side/react/react-web#flag-keys
			useCamelCaseFlagKeys: false,
		},
		// https://docs.launchdarkly.com/sdk/client-side/react/react-web#configuring-the-react-sdk
		// Default flags, the React SDK will only subscribe to updates for these flags
		flags: DEFAULT_FLAG_SET,
		context: {
			kind: 'organization',
			key: tenant,
		},
	})(App);

	return LDProvider;
};

export const WithLaunchDarklyClient = withLaunchDarklyClient(Fragment);
