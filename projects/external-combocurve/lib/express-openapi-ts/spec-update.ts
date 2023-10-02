import path from 'path';

import {
	ISpecUpdater,
	SpecGenerator,
	SpecMerger,
	SpecUpdater,
	generateDefinitions,
	generatePaths,
} from './spec/update';
import { DEFAULT_CONFIG_FILE, SpecLoader, loadConfig } from './spec/loader';
import { SpecDumper } from './spec/dumper';

export const initUpdater = (configFile: string): ISpecUpdater => {
	const config = loadConfig(path.resolve(configFile));

	return new SpecUpdater({
		config,
		dumper: new SpecDumper(config),
		generator: new SpecGenerator(generateDefinitions, generatePaths),
		loader: new SpecLoader(config),
		merger: new SpecMerger(),
	});
};

export const updateSpec = (configFile: string = DEFAULT_CONFIG_FILE): void => {
	const updater = initUpdater(configFile);
	updater.update();
};

if (module == require.main) {
	updateSpec();
}
