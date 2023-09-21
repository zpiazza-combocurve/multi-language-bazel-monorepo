import { useState } from 'react';

import { useHotkey } from '@/components/hooks/useHotkey';
import { useAlfaStore } from '@/helpers/alfa';
import { postApi } from '@/helpers/routing';

/**
 * @example
 * 	function MyComponent() {
 * 		window.debug.useRerender(); // pressing ctrl+shift+k will cause a rerender in the component
 * 		return <></>;
 * 	}
 */
function useRerender(hotkey = 'ctrl+shift+k') {
	const [, setState] = useState({});

	useHotkey(hotkey, () => {
		setState({});
		return false;
	});
}

function unlinkProject() {
	useAlfaStore.setState({ project: undefined });
	postApi('/user/updateBootstrap', { key: 'project', value: null });
}

const debug = {
	useRerender,
	unlinkProject,
};

declare global {
	interface Window {
		debug: typeof debug;
	}
}

Object.assign(window, { debug });

export {};
