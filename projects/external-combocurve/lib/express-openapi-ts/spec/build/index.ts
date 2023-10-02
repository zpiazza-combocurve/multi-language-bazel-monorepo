import { partition } from 'lodash';
import fs from 'fs';

import { ISpecConfig, IResourceConfig } from '../config';
import { ISpecDumper } from '../dumper';
import { ISpecLoader } from '../loader';
import { IOpenApi2, IOpenApiParameter, IOpenApiPath, IOpenApiSchema } from '../../openapi-2';
import { sortKeys } from '../helpers/keys-order';
import { DefinitionsGenHandler } from '../../../../src/core/spec-generator/definitions/handler';
import { Controller } from '../../../../src/core/controllers/base';
import { PathsGenHandler } from '../../../../src/core/spec-generator/paths/handler';

interface ISpecBuilder {
	build(): void;
}

interface ISpecBuilderParams {
	config: ISpecConfig;
	dumper: ISpecDumper;
	loader: ISpecLoader;
}

export class SpecBuilder implements ISpecBuilder {
	config: ISpecConfig;
	dumper: ISpecDumper;
	loader: ISpecLoader;

	constructor(params: ISpecBuilderParams) {
		const { config, dumper, loader } = params;
		this.config = config;
		this.dumper = dumper;
		this.loader = loader;
	}

	build(): void {
		const { config, dumper, loader } = this;
		const { resources } = config;

		this.generateControllerSpecs(resources, config.specDir);

		const relativeDirs = Object.entries(resources).map(([uri, resource]) => resource.relativeDir || uri);

		let baseSpec = loader.loadBaseSpec();
		let definitions = relativeDirs.reduce<Record<string, IOpenApiSchema>>(
			(accumulator, relativeDir) => ({ ...accumulator, ...loader.loadResourceDefinitions(relativeDir) }),
			{},
		);
		definitions = sortKeys({ ...baseSpec.definitions, ...definitions });
		if (config.definitionMap) {
			definitions = Object.entries(definitions).reduce<Record<string, IOpenApiSchema>>(
				(accumulator, [key, val]) => ({ ...accumulator, [key]: config.definitionMap(val) }),
				{},
			);
		}
		let paths = relativeDirs.reduce<Record<string, IOpenApiPath>>(
			(accumulator, relativeDir) => ({ ...accumulator, ...loader.loadResourcePaths(relativeDir) }),
			{},
		);
		if (config.pathMap) {
			paths = Object.entries(paths).reduce<Record<string, IOpenApiPath>>(
				(accumulator, [key, val]) => ({ ...accumulator, [key]: config.pathMap(val, definitions) }),
				{},
			);
		}
		if (config.extensionMap) {
			const [extensions, noExtensions] = partition(Object.entries(baseSpec), ([key]) => key.startsWith('x-'));
			const extensionsMapped = extensions.reduce(
				(accumulator, [key, val]) => ({
					...accumulator,
					[key]: config.extensionMap(val, key),
				}),
				{},
			);
			baseSpec = {
				...noExtensions.reduce((accumulator, [key, val]) => ({ ...accumulator, [key]: val }), {}),
				...extensionsMapped,
			} as unknown as IOpenApi2;
		}
		if (config.parameterMap) {
			baseSpec.parameters = Object.entries(baseSpec.parameters).reduce<Record<string, IOpenApiParameter>>(
				(accumulator, [key, val]) => ({ ...accumulator, [key]: config.parameterMap(val) }),
				{},
			);
		}
		const spec = { ...baseSpec, paths, definitions };

		dumper.dumpSpec(spec);
	}

	private generateControllerSpecs(resources: { [uri: string]: IResourceConfig }, specDir: string) {
		for (const [uri, config] of Object.entries(resources)) {
			if (config.generated && config.controller && config.controller instanceof Controller) {
				const fileFolder = (config.relativeDir = this.getFilePath(uri));

				const definitionsGenerator = new DefinitionsGenHandler(config.controller);
				const definitions = definitionsGenerator.getDefinitionSpec();

				fs.writeFileSync(`${specDir}/${fileFolder}/definitions.yaml`, definitions);

				const pathGenerator = new PathsGenHandler(`/${uri}`, config.controller);
				const path = pathGenerator.getPathSpec();

				fs.writeFileSync(`${specDir}/${fileFolder}/paths.yaml`, path);
			}
		}
	}

	private getFilePath(uri: string): string {
		const urlPaths = uri.split('/');
		const notParams = urlPaths.filter((path) => !path.startsWith('{'));

		return notParams.join('/');
	}
}
