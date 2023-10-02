import config from './config-endpoint';

export default {
	...config,
	outputFile: 'openapi-spec-stage.yaml',
	specBaseFiles: [...config.specBaseFiles, 'base-stage.yaml'],
};
