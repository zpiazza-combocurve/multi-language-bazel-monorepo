import config from './config-endpoint';

export default {
	...config,
	outputFile: 'openapi-spec-test.yaml',
	specBaseFiles: [...config.specBaseFiles, 'base-test.yaml'],
};
