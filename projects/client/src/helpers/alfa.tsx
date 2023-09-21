/**
 * # Alfa Mock
 *
 * Originally extended package https://github.com/lsm/alfa. with hooks, now only a placeholder for zustand
 */
import _ from 'lodash';
import { useEffect, useState } from 'react';
import * as React from 'react';
import { create } from 'zustand';
import { shallow } from 'zustand/shallow';

import { withZustandStore } from '@/components/shared';
import { UserConfiguration } from '@/forecasts/configurations/configurations';

import type { Theme } from './theme';

export interface AlfaStore {
	set(store: Partial<AlfaStore>): void;
	set<K extends keyof AlfaStore>(key: K, value: AlfaStore[K]): void;
	theme: Theme;
	themeMode?: string;
	authenticated?: boolean;
	project?: Assign<Inpt.Project, { createdBy: Inpt.User }>;
	user: Inpt.User;
	Pusher;
	CompanyPusher;
	wellHeaders: Record<string, string>;
	subdomain: string;
	bootstrapFn?;
	configurations?: Record<string, UserConfiguration>;
}

export const useAlfaStore = create<AlfaStore>(
	(set) =>
		({
			set: (valueOrKey, value) => {
				if (typeof valueOrKey === 'string') {
					set((p) => ({ ...p, [valueOrKey]: value }));
				} else {
					set((p) => ({ ...p, ...valueOrKey }));
				}
			},
			project: false,
			projects: false,
			scenario: false,
			scenarios: false,
			theme: 'dark',
			themeMode: 'classic',
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		} as any)
);

export function useAlfa<K extends keyof AlfaStore = keyof AlfaStore>(keys?: K[]): Pick<AlfaStore, K | 'set'> {
	return useAlfaStore((state) => (keys ? _.pick(state, [...keys, 'set']) : state), shallow);
}

export function Provider({ data, children }) {
	const [canRender, setCanRender] = useState(false);

	useEffect(() => {
		setCanRender(true);
		useAlfaStore.setState((p) => ({ ...p, ...data }));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	if (!canRender) return null;
	return children ?? null;
}

export function subscribe<P, K extends keyof AlfaStore>(OriginalComponent: React.ComponentType<P>, keys: K[]) {
	return withZustandStore(OriginalComponent, useAlfaStore, (state) => _.pick(state, [...(keys ?? []), 'set']));
}
