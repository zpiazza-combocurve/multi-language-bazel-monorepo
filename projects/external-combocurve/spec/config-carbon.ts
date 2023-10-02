import config from './config-endpoint';

export default {
	...config,
	outputFile: 'openapi-spec-carbon.yaml',
	specBaseFiles: [...config.specBaseFiles, 'base-carbon.yaml'],
};
