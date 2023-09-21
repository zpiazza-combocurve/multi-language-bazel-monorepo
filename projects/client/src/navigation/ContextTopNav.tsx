import produce from 'immer';
import _ from 'lodash';
import { useEffect } from 'react';

import { useId } from '@/components/hooks/useId';
import { TabsState, useTabsStore } from '@/navigation/Tabs';

export interface MenuItem {
	primaryText: string;
	disabled?: boolean;
	onClick(): void;
}

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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	isActive?: any; // TODO type it

	/** Only used in forecast grid and diagnostics */
	onClick?(): void;
}

export function useTabs(tabs: Link[]) {
	const id = useId();

	const tabsLevel = useTabsStore((store) => store.tabsLevel);
	const setTabsState = useTabsStore((store) => store.set);

	useEffect(() => {
		setTabsState(
			produce((draft: TabsState) => {
				draft.tabsLevel.push(id);
			})
		);
		return () => {
			setTabsState(
				produce((draft: TabsState) => {
					draft.tabsLevel = _.filter(draft.tabsLevel, (v) => v !== id);
				})
			);
		};
	}, [id, setTabsState]);

	useEffect(() => {
		if (_.last(tabsLevel) === id) {
			useTabsStore.setState({ tabs });
		}
	}, [tabs, id, tabsLevel]);
}

export function ClearNav() {
	useTabs([]);
	return null;
}
