import deepEqual from 'deep-equal';
import { ISpecConfig } from '../config';
import { ISpecDumper } from '../dumper';
import { ISpecLoader } from '../loader';
import { ILoadedResource } from '../resource';
import { ISpecGenerator } from './generator';
import { ISpecMerger } from './merger';

export interface ISpecUpdater {
	check(): void;
	checkResource(uri: string): void;
	update(): void;
	updateResource(uri: string): void;
}

interface ISpecUpdaterParams {
	config: ISpecConfig;
	dumper: ISpecDumper;
	generator: ISpecGenerator;
	loader: ISpecLoader;
	merger: ISpecMerger;
}

export class SpecUpdater implements ISpecUpdater {
	protected config: ISpecConfig;
	protected dumper: ISpecDumper;
	protected generator: ISpecGenerator;
	protected loader: ISpecLoader;
	protected merger: ISpecMerger;

	constructor(params: ISpecUpdaterParams) {
		const { config, dumper, generator, loader, merger } = params;
		this.config = config;
		this.dumper = dumper;
		this.generator = generator;
		this.loader = loader;
		this.merger = merger;
	}

	updateResource(uri: string): void {
		const { dumper, generator, loader, merger } = this;

		const existing = loader.loadResource(uri);
		const generated = generator.generateResource(existing);
		const merged = merger.mergeResource(existing, generated);

		dumper.dumpResource(merged);
	}

	update(): void {
		const { resources } = this.config;

		Object.keys(resources).forEach((uri) => this.updateResource(uri));
	}

	protected checkResourceDefinitions(merged: ILoadedResource, existing: ILoadedResource): void {
		const definitionsEqual = deepEqual(existing.definitions, merged.definitions);
		if (!definitionsEqual) {
			throw new Error(`update.check('${merged.uri}'): Definitions not up to date`);
		}
	}

	protected checkResourcePaths(merged: ILoadedResource, existing: ILoadedResource): void {
		const pathsEqual = deepEqual(existing.paths, merged.paths);
		if (!pathsEqual) {
			throw new Error(`update.check('${merged.uri}'): Paths not up to date`);
		}
	}

	checkResource(uri: string): void {
		const { generator, loader, merger } = this;

		const existing = loader.loadResource(uri);
		const generated = generator.generateResource(existing);
		const merged = merger.mergeResource(existing, generated);

		this.checkResourceDefinitions(merged, existing);
		this.checkResourcePaths(merged, existing);
		// if we want to get fancy later, we can make it also print a yaml diff, using https://www.npmjs.com/package/diff
		// although it will probably be better to use jest snapshots tests
	}

	check(): void {
		const { resources } = this.config;

		Object.keys(resources).every((uri) => this.checkResource(uri));
	}
}

export { SpecGenerator, generateDefinitions, generatePaths } from './generator';
export { SpecMerger } from './merger';
