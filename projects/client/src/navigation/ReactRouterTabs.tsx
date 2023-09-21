import { Link as ReactRouterLink, matchPath, useLocation, useMatches } from 'react-router-dom';

import { Tabs as MuiTabs, Tab } from '@/components/v2';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';

import type { RouteHandle, UseMatchesMatch } from './types';

export function useHasTabs() {
	const matches = useMatches() as (ReturnType<typeof useMatches>[number] & { handle?: RouteHandle })[];
	return matches.some((item) => !!item.handle?.tabs);
}

/** Reads the tabs from the react router match handle */
export default function ReactRouterTabs() {
	const { pathname } = useLocation();
	const matches = useMatches() as UseMatchesMatch[];
	const flags = useLDFeatureFlags();

	const lastMatch = matches.findLast((item) => !!item.handle?.tabs);

	const tabs = lastMatch?.handle?.tabs
		?.filter((tab) => {
			if (tab.behindFeatureFlag) {
				return flags[tab.behindFeatureFlag];
			}
			return true;
		})
		?.map((tab) => ({
			...tab,
			path: lastMatch.pathname.endsWith('/')
				? lastMatch.pathname + tab.path
				: lastMatch.pathname + '/' + tab.path,
		}));

	if (!tabs) return null;

	const value = tabs.find((tab) => matchPath(pathname, tab.path))?.path;

	return (
		<MuiTabs
			css={`
				min-height: 2rem;
			`}
			value={value}
			indicatorColor='secondary'
			textColor='secondary'
		>
			{tabs.map((tab, i) => (
				<Tab
					key={i.toString()}
					css={`
						padding: 0.25rem 0.5rem;
						min-height: 2rem;
						min-width: 0rem;
						font-size: 0.875rem;
						.MuiTab-wrapper {
							text-transform: initial;
							flex-direction: row;
						}
					`}
					value={tab.path}
					label={tab.label}
					disableRipple
					// @ts-expect-error Tab component should be generic
					component={ReactRouterLink}
					to={tab.path}
				/>
			))}
		</MuiTabs>
	);
}
