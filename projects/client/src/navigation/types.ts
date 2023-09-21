import type { useMatches } from 'react-router-dom';

import type { LDFeatureFlagKey } from '../feature-flags/shared';

export type UseMatchesMatch = ReturnType<typeof useMatches>[number] & { handle?: RouteHandle };

export type RouteTab = {
	path: string;
	label: string;
	icon?;
	/**
	 * @example
	 * 	behindFeatureFlag: 'isCarbonEnabled';
	 */
	behindFeatureFlag?: keyof typeof LDFeatureFlagKey;
};

export type RouteHandle = {
	breadcrumb?: (match: UseMatchesMatch) => JSX.Element;
	tabs?: RouteTab[];
};
