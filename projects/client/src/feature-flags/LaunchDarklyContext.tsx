import type { LDMultiKindContext } from 'launchdarkly-js-client-sdk';
import { useLDClient } from 'launchdarkly-react-client-sdk';
import { useEffect } from 'react';

import { useAlfa } from '@/helpers/alfa';
import { getFullName } from '@/helpers/user';
import { getTenant } from '@/helpers/utilities';

// Identify the user and organization after the user has logged in
// https://docs.launchdarkly.com/sdk/features/identify
export const LaunchDarklyContext = () => {
	const { user } = useAlfa();
	const tenant = getTenant();

	const ldClient = useLDClient();

	useEffect(() => {
		const context: LDMultiKindContext = {
			kind: 'multi',
			user: {
				// Prefixing with tenant name to avoid collisions between users with the same email in different tenants
				key: `${tenant}-${user.email}`,
				email: user.email,
				name: getFullName(user),
			},
			organization: {
				key: tenant,
			},
		};

		ldClient?.identify(context);
	}, [ldClient, user, tenant]);

	return null;
};
