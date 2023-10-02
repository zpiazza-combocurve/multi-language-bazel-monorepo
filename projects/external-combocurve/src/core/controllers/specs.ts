import { Request, Response } from 'express';

import { DefinitionsGenHandler } from '../spec-generator/definitions/handler';
import { PathsGenHandler } from '../spec-generator/paths/handler';

import { Controller, RouteContext } from './base';

export async function specGenerator(
	controller: Controller,
	ctx: RouteContext,
	req: Request,
	res: Response,
): Promise<void> {
	let definitions = '# Definitions:';
	let path = '# Paths:';

	if (req.query.definitions !== 'false') {
		const definitionsGenerator = new DefinitionsGenHandler(controller);
		definitions += definitionsGenerator.getDefinitionSpec();
	}

	if (req.query.path !== 'false') {
		const urlPath = removeParamsFromRoute(req.originalUrl.replace('/spec', ''), req.params);
		const pathGenerator = new PathsGenHandler(urlPath, controller);

		path += pathGenerator.getPathSpec();
	}

	res.setHeader('content-type', 'application/yaml');
	res.send(definitions + '\n' + path).end();
}

function removeParamsFromRoute(route: string, params: Record<string, string>): string {
	let output = route;
	Object.entries(params).forEach(([key, value]) => {
		output = output.replace(value, `{${key}}`);
	});

	return output;
}
