import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { ReactGA, setDimensions } from '@/google-analytics';
import { useAlfa } from '@/helpers/alfa';
import { getTenant } from '@/helpers/utilities';

export default function GoogleAnalytics() {
	const { user } = useAlfa();
	const location = useLocation();
	const tenant = getTenant();

	useEffect(() => {
		setDimensions(user, tenant);
	}, [user, tenant]);

	useEffect(() => {
		ReactGA.pageview(location.pathname + location.search);
	}, [location]);

	return null;
}
