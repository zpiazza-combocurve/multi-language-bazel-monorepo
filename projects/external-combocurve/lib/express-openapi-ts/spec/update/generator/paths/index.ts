import path from 'path';

import { ILoadedResource, ResourcePaths } from '@lib/express-openapi-ts/spec/resource';
import * as controllerAst from './controller-ast';
import * as routerScan from './router-scan';

export type GeneratePathsFn = (existing: ILoadedResource) => { paths: ResourcePaths; hasWrite: boolean };

export const generatePaths: GeneratePathsFn = (existing) => {
	const { dir, uri } = existing;

	const controllersFile = path.join(dir, 'controllers.ts');
	const routesFile = path.join(dir, 'routes.ts');

	const controllersInfo = controllerAst.getControllerInfo(controllersFile);
	const router = require(routesFile).default;

	const paths = routerScan.scanRouter(router, uri, controllersInfo);

	const writeMethod = ['post', 'put', 'patch'];
	const set = Object.values(paths).reduce(
		(accumulator, path) => new Set([...accumulator, ...Object.keys(path)]),
		new Set<string>(),
	);
	const hasWrite = writeMethod.some((m) => set.has(m));

	return { paths, hasWrite };
};
