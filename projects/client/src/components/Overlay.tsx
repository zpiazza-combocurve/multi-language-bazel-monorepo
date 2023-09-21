import { useEffect } from 'react';
import { create } from 'zustand';

import Doggo from './Doggo';

// TODO this needs to consider the currently open overlays, see useLoadingBarStore
export const useOverlayStore = create<{ showingOverlay: boolean; text?: string }>(() => ({
	showingOverlay: false,
	text: undefined,
}));

/**
 * @example
 * 	useOverlay(true, 'Loading Data');
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function useOverlay(showingOverlay: any, text?: string) {
	const showing = !!showingOverlay;
	useEffect(() => {
		useOverlayStore.setState({ showingOverlay: showing, text });
		return () => useOverlayStore.setState({ showingOverlay: false, text: undefined });
	}, [showing, text]);
}

/** Doggo overlay to prevent user interaction */
export default function Overlay() {
	const { showingOverlay, text } = useOverlayStore();
	if (!showingOverlay) {
		return null;
	}
	return <Doggo overlay underDog={text || 'Loading...'} />;
}
