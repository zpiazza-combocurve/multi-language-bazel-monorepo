import { useContext } from 'react';

import { AnalyticsContext } from './SegmentProvider';

/**
 * Analytics hook that we can use with other components
 *
 * @example
 * 	const analytics = useAnalytics();
 *
 * 	analytics.track("Project Created", {
 * 	name: "2022 Q3 Project",
 * 	field: "Value",
 * 	...
 * 	});
 */
export const useAnalytics = () => {
	const result = useContext(AnalyticsContext);
	if (!result) {
		throw new Error('Context used outside of its Provider!');
	}
	return result;
};
