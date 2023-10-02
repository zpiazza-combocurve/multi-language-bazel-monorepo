import path from 'path';
import fs from 'fs';
import { dump } from 'js-yaml';

import { IOpenApi2 } from '../openapi-2';
import { ISpecConfig } from './config';
import { ILoadedResource } from './resource';

export interface ISpecDumper {
	dumpResource(resource: ILoadedResource): void;
	dumpSpec(spec: IOpenApi2): void;
}

export class SpecDumper implements ISpecDumper {
	constructor(protected config: ISpecConfig) {}

	protected dumpDefinitions(resource: ILoadedResource): void {
		const { specDir } = this.config;
		const { definitions, relativeDir } = resource;
		const yaml = dump(definitions);
		fs.writeFileSync(path.resolve(specDir, path.join(...relativeDir.split('/'), 'definitions.yaml')), yaml);
	}

	protected dumpPaths(resource: ILoadedResource): void {
		const { specDir } = this.config;
		const { paths, relativeDir } = resource;
		const yaml = dump(paths);
		fs.writeFileSync(path.resolve(specDir, path.join(...relativeDir.split('/'), 'paths.yaml')), yaml);
	}

	dumpResource(resource: ILoadedResource): void {
		this.dumpDefinitions(resource);
		this.dumpPaths(resource);
	}

	dumpSpec(spec: IOpenApi2): void {
		const { outputFile } = this.config;

		const yaml = dump(spec, { noRefs: true });

		if (outputFile) {
			const outputFileAbsolute = path.resolve(outputFile);
			fs.writeFileSync(outputFileAbsolute, yaml);
		} else {
			process.stdout.write(yaml);
		}
	}
}
