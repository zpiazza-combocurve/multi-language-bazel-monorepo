import config from './config-endpoint';

// TODO: introduce a convention for these, to avoid repeating boilerplate
// for new environments
export default {
	...config,
	outputFile: 'openapi-spec-dev1.yaml',
	specBaseFiles: [...config.specBaseFiles, 'base-dev1.yaml'],
};
