/**
 * Express router scan
 */
import { Router } from 'express';
import { IOpenApiOperation } from '@lib/express-openapi-ts/openapi-2';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options';

const DEFAULT_METHOD_CONFIG: Record<HttpMethod, Partial<IOpenApiOperation>> = {
	get: {
		produces: ['application/json'],
		'x-google-quota': { metricCosts: { 'read-request-rate': 1 } },
	},
	post: {
		consumes: ['application/json'],
		produces: ['application/json'],
		'x-google-quota': { metricCosts: { 'write-request-rate': 1 } },
	},
	put: {
		consumes: ['application/json'],
		produces: ['application/json'],
		'x-google-quota': { metricCosts: { 'write-request-rate': 1 } },
	},
	patch: {
		consumes: ['application/json'],
		produces: ['application/json'],
		'x-google-quota': { metricCosts: { 'write-request-rate': 1 } },
	},
	delete: {
		produces: ['application/json'],
		'x-google-quota': { metricCosts: { 'write-request-rate': 1 } },
	},
	head: {},
	options: {},
};

const getDefaultConfig = (method: HttpMethod) => JSON.parse(JSON.stringify(DEFAULT_METHOD_CONFIG[method]));

const expressPathToOpenApi = (expressPath: string): string => {
	const openApiPath = expressPath.replace(/\:([A-Za-z-_]+)/g, (match, p1) => `{${p1}}`);
	/*
    formatting for Cloud Endpoints:
        - add leading slash
        - remove trailing slash
    */
	return '/' + openApiPath.split('/').filter(Boolean).join('/');
};

const getOperationId = (method: string, openApiPath: string) => {
	const noParams = openApiPath.replace(/\{([A-Za-z-_]+)\}/g, (match, p1) => `/by/${p1}`);
	const parts = noParams.split(/\//g).filter(Boolean);
	return [method.toLowerCase(), ...parts].join('-');
};

const extractPathParams = (openApiPath: string) => {
	const paramRegex = /\{([A-Za-z-_]+)\}/g;
	let match;
	const params = [];

	while ((match = paramRegex.exec(openApiPath)) !== null) {
		const spec = {
			in: 'path',
			name: match[1],
			required: true,
			type: 'string',
			description: '',
		};
		params.push(spec);
	}
	return params;
};

const getResponses = (controllerMeta) => {
	return {};
};

const createOperation = ({
	method,
	openApiPath,
	controllerMeta,
}: {
	method: HttpMethod;
	openApiPath: string;
	controllerMeta: {} | null;
}) => {
	return {
		...getDefaultConfig(method),
		operationId: getOperationId(method, openApiPath),
		parameters: [...extractPathParams(openApiPath)],
		responses: getResponses(controllerMeta),
	};
};

const scanRoute = (route, openApiPath: string, controllers) => {
	const { methods, path, stack } = route;
	const operations = Object.keys(methods).reduce((accumulator, httpMethod: HttpMethod) => {
		const handle = stack[stack.length - 1];

		const operation = createOperation({
			openApiPath,
			method: httpMethod,
			controllerMeta: controllers[handle.name] ?? null,
		});
		return {
			...accumulator,
			[httpMethod]: operation,
		};
	}, {});
	return operations;
};

export const scanRouter = (router: Router, basePath: string, controllers) => {
	const routes = router.stack.map((layer) => layer.route).filter(Boolean);

	const resourcePaths = routes.reduce((accumulator, route) => {
		const { path } = route;
		const openApiPath = expressPathToOpenApi(basePath + path);
		return {
			...accumulator,
			[openApiPath]: {
				...accumulator[openApiPath],
				...scanRoute(route, openApiPath, controllers),
			},
		};
	}, {});
	return resourcePaths;
};
