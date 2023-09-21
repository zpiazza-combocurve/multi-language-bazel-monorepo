import { debounce } from 'lodash';
import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useAlfa } from '@/helpers/alfa';
import { getTenant } from '@/helpers/utilities';

import { updateGainsightPXGlobalContext } from './analytics';
import { useAnalytics } from './useAnalytics';

const supportEmails = [
	'support@insidepetroleum.com',
	'support2@insidepetroleum.com',
	'support@combocurve.com',
	'support2@combocurve.com',
];

const browserTabOpenedTimestamp = new Date();

export function Segment() {
	const { user, theme, themeMode } = useAlfa();
	const analytics = useAnalytics();
	const tenant = getTenant();
	const location = useLocation();

	useEffect(() => {
		// Do not track support accounts in client environments
		if (supportEmails.includes(user.email)) {
			return;
		}
		analytics.identify(user._id, {
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
			company: { id: tenant },
		});
	}, [analytics, user, tenant]);

	useEffect(() => {
		analytics.group(tenant);
	}, [analytics, tenant]);

	useEffect(() => {
		analytics.page();
	}, [analytics, location]);

	useEffect(() => {
		const handleTabOrWindowClose = () => {
			const secondsSpent = Math.round((new Date().getTime() - browserTabOpenedTimestamp.getTime()) / 1000);
			analytics.track('Browser Tab/Window Closed', { secondsSpent });
		};

		window.addEventListener('beforeunload', handleTabOrWindowClose);

		return () => {
			window.removeEventListener('beforeunload', handleTabOrWindowClose);
		};
	}, [analytics]);

	useLayoutEffect(() => {
		updateGainsightPXGlobalContext({ theme, themeMode });

		const onResize = debounce(() => {
			updateGainsightPXGlobalContext({ theme, themeMode });
		}, 300);

		window.addEventListener('resize', onResize);

		return () => {
			window.removeEventListener('resize', onResize);
		};
	}, [theme, themeMode]);

	return null;
}

export default Segment;
