import path from 'path';

import { SpecBuilder } from './spec/build';
import { DEFAULT_CONFIG_FILE, SpecLoader, loadConfig } from './spec/loader';
import { SpecDumper } from './spec/dumper';

export const buildSpec = (configFile: string = DEFAULT_CONFIG_FILE): void => {
	const config = loadConfig(path.resolve(configFile));

	const builder = new SpecBuilder({
		config,
		dumper: new SpecDumper(config),
		loader: new SpecLoader(config),
	});
	builder.build();
};

if (module == require.main) {
	buildSpec();
}
