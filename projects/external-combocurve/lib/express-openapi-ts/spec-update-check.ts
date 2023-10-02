import { initUpdater } from './spec-update';
import { DEFAULT_CONFIG_FILE } from './spec/loader';

export const checkUpdateSpec = (configFile: string = DEFAULT_CONFIG_FILE): void => {
	const updater = initUpdater(configFile);
	updater.check();
};

if (module == require.main) {
	checkUpdateSpec();
}
