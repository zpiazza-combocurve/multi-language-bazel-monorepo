import config from './config-endpoint';

export default {
	...config,
	outputFile: 'openapi-spec-beta.yaml',
	specBaseFiles: [...config.specBaseFiles, 'base-beta.yaml'],
};
