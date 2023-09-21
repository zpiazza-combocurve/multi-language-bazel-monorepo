import { create } from 'zustand';

export type SidebarVisibleStore = {
	navVisible: boolean;
	setNavVisible(visible: boolean): void;
	toggleNav(): void;
};

export const useSidebarVisibleStore = create<SidebarVisibleStore>((set) => ({
	navVisible: false,
	setNavVisible: (visible: boolean) => set({ navVisible: visible }),
	toggleNav: () => set((p) => ({ navVisible: !p.navVisible })),
}));
