import { ILoadedResource } from '../../resource';
import { GenerateDefinitionsFn } from './definitions';
import { GeneratePathsFn } from './paths';

export interface ISpecGenerator {
	generateResource(existing: ILoadedResource): ILoadedResource;
}

export class SpecGenerator implements ISpecGenerator {
	constructor(
		protected generateDefinitions: GenerateDefinitionsFn,
		protected generatePaths: GeneratePathsFn,
	) {}

	generateResource(existing: ILoadedResource) {
		const { paths: newPaths, hasWrite } = this.generatePaths(existing);

		const newDefinitions = existing.generateDefinitions ? this.generateDefinitions(existing, hasWrite) : undefined;
		return { ...existing, definitions: newDefinitions, paths: newPaths };
	}
}

export { generateDefinitions } from './definitions';
export { generatePaths } from './paths';
