import { faArrowAltCircleRight } from '@fortawesome/pro-regular-svg-icons';

import { useHotkey } from '@/components/hooks/useHotkey';
import { navigate } from '@/helpers/history';

import { ModulesSearchCommands, RoutesCommands, ThemeCommands, getGlobalCommands } from './CommandLauncher/commands';
import { showLauncher } from './CommandLauncher/shared';

export { useGlobalCommands } from './CommandLauncher/global-commands-store';

export function getNavigationCommand(label: string, route: string) {
	return {
		icon: faArrowAltCircleRight,
		label: `Go to: ${label}`,
		action: () => {
			navigate(route);
		},
	};
}

function showGlobalCommandLauncher() {
	showLauncher({ commands: [...ThemeCommands, ...getGlobalCommands(), ...RoutesCommands, ...ModulesSearchCommands] });
}

function CommandLauncher() {
	useHotkey('ctrl+p', () => {
		showGlobalCommandLauncher();
		return false;
	});

	return null;
}

export default CommandLauncher;
