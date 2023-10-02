import path from 'path';
import fs from 'fs';
import { load } from 'js-yaml';
import merge from 'deepmerge';

import { IOpenApi2 } from '../openapi-2';
import { ILoadedResource, ResourceDefinitions, ResourcePaths } from './resource';
import { ISpecConfig } from './config';

export const DEFAULT_CONFIG_FILE = 'spec/config';

export interface ISpecLoader {
	loadResourceDefinitions(relativeDir: string): ResourceDefinitions;
	loadResourcePaths(relativeDir: string): ResourcePaths;
	loadResource(uri: string): ILoadedResource;

	loadBaseSpec(): IOpenApi2;
}

const inResourcePath = (specDir: string, resourcePath: string, file: string) =>
	path.join(specDir, ...resourcePath.split('/'), file);

const loadYaml = (filePath: string) => {
	const yaml = fs.readFileSync(filePath, { encoding: 'utf-8' });
	return load(yaml);
};

export const isValidBaseObject = <T extends Record<string, unknown>>(
	value: unknown,
): value is { [P in keyof T]?: unknown } => typeof !!value && typeof value === 'object' && !Array.isArray(value);

export class SpecLoader implements ISpecLoader {
	constructor(protected config: ISpecConfig) {}

	loadResourceDefinitions(relativeDir: string): ResourceDefinitions {
		const { specDir } = this.config;
		const yamlPath = inResourcePath(specDir, relativeDir, 'definitions.yaml');
		return loadYaml(yamlPath) as ResourceDefinitions;
	}

	loadResourcePaths(relativeDir: string): ResourcePaths {
		const { specDir } = this.config;
		const yamlPath = inResourcePath(specDir, relativeDir, 'paths.yaml');
		return loadYaml(yamlPath) as ResourcePaths;
	}

	loadResource(uri: string): ILoadedResource {
		const { modulesBaseDir, resources } = this.config;
		const {
			definitionName,
			generateDefinitions,
			relativeDir: rDir,
			schema,
			writeOptions,
			readOptions,
		} = resources[uri];

		const relativeDir = rDir || uri;

		const definitions = this.loadResourceDefinitions(relativeDir);
		const paths = this.loadResourcePaths(relativeDir);
		const dir = path.resolve(modulesBaseDir, relativeDir);

		return {
			definitionName,
			definitions,
			dir,
			generateDefinitions,
			paths,
			relativeDir,
			schema,
			uri,
			writeOptions,
			readOptions,
		};
	}

	loadBaseSpec(): IOpenApi2 {
		const { specBaseFiles, specDir } = this.config;

		const base = specBaseFiles.reduce((accumulator, baseFile) => {
			const yamlPath = path.join(specDir, baseFile);
			const yaml = loadYaml(yamlPath);

			if (!isValidBaseObject(yaml)) {
				throw new Error(`Invalid spec base value in ${baseFile}, expected object.`);
			}
			return merge(accumulator, yaml);
		}, {});

		// TODO: check OpenAPI validity of loaded `base`
		return base as IOpenApi2;
	}
}

export const loadConfig = (filePath: string): ISpecConfig => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const module = require(filePath);
	return module.default;
};
