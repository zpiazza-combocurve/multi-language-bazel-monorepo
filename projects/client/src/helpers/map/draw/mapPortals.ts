import { ReactNode } from 'react';
import { create } from 'zustand';

interface MapStoreState {
	mapPortals: ReactNode[];
	addComponent: (component: ReactNode) => void;
	clear: () => void;
}

export const useMapStore = create<MapStoreState>((set) => ({
	mapPortals: [],
	addComponent: (component) => {
		set((p) => ({ ...p, mapPortals: p.mapPortals.concat([component]) }));
	},
	clear: () => {
		set((p) => ({ ...p, mapPortals: [] }));
	},
}));
