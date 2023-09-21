import { Link as ReactRouterLink, useLocation } from 'react-router-dom';
import { StoreApi, create } from 'zustand';

import { Tabs as MuiTabs, Tab } from '@/components/v2';
import { useGetColor } from '@/components/v2/helpers';

import ReactRouterTabs, { useHasTabs } from './ReactRouterTabs';

/** @deprecated Use react-router handle */
export interface MenuItem {
	primaryText: string;
	disabled?: boolean;
	onClick(): void;
}

/** @deprecated Use react-router handle */
export interface Link {
	label: string;
	path: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	to?: any;
	exact?: boolean;
	disabled?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	icon?: any;
	tooltipTitle?: string;
	/** Only used in forecast grid and diagnostics */
	menuItems?: MenuItem[];
	/** This is the isActive from react-router */
	isActive?: () => boolean;

	/** Only used in forecast grid and diagnostics */
	onClick?(): void;
}

/** @deprecated Use react-router handle */
export interface TabsState {
	tabs: (Link & { isDefault?: boolean })[];
	tabsLevel: string[];
	set: StoreApi<TabsState>['setState'];
}

/** @deprecated Use react-router handle */
export const useTabsStore = create<TabsState>((set) => ({ tabs: [], tabsLevel: [], set }));

export function Tabs() {
	const { pathname } = useLocation();
	const tabs = useTabsStore((store) => store.tabs);
	const defaultValue = tabs.findIndex(({ isDefault }) => isDefault);
	const getColor = useGetColor();
	const customColor = getColor('secondary');

	const value = (() => {
		const tabIndex = tabs.findIndex(({ path, isActive }) => isActive?.() ?? pathname.match(path));
		if (tabIndex === -1) return defaultValue;
		return tabIndex;
	})();

	const hasTabs = useHasTabs();

	if (hasTabs) return <ReactRouterTabs />;

	return (
		<MuiTabs
			css={`
				min-height: 2rem;
			`}
			value={value}
			indicatorColor='secondary'
			textColor='secondary'
		>
			{tabs.map(({ label, disabled, path, to, tooltipTitle }, i) => (
				<Tab
					key={path}
					css={`
						padding: 0.25rem 0.5rem;
						min-height: 2rem;
						min-width: 0rem;
						font-size: 0.875rem;
						${i === value && `color: ${customColor};`}
						.MuiTab-wrapper {
							text-transform: initial;
							flex-direction: row;
						}
					`}
					tooltipTitle={tooltipTitle}
					disabled={disabled}
					label={label}
					disableRipple
					// @ts-expect-error Tab component should be generic
					component={ReactRouterLink}
					to={to ?? path}
				/>
			))}
		</MuiTabs>
	);
}

export default Tabs;
