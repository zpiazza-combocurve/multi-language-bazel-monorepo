import Polyglot from 'node-polyglot';

export type Message<Props = never> = { __message: Props };

export function message<Props>(value: string): Message<Props> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return value as any; // will return the message, the return type is wrong but it is used for type safety so it's fine to leave it as it is
}

type SchemaToLocalize<T> = T extends object
	? {
			[key in keyof T]: T[key] extends Message<never>
				? () => string
				: T[key] extends string
				? () => string
				: T[key] extends Message<infer P>
				? (interpolationObject: P) => string
				: T[key] extends object
				? SchemaToLocalize<T[key]>
				: never;
	  }
	: never;

/**
 * @example
 * 	const { localize } = schema({
 * 		operations: {
 * 			project: {
 * 				create: {
 * 					complete: message<{ projectName: string }>('Project "%{projectName}" created'),
 * 				},
 * 			},
 * 		},
 * 	});
 *
 * 	localize.operations.project.create({ projectName: 'hello world' });
 */
export function schema<T>(schema: T): {
	localize: SchemaToLocalize<T>;
	polyglot;
	phrases: T; // TODO phrases should be string, not message
} {
	const polyglot = new Polyglot({ phrases: schema });

	// const localize = (key, interpolationObject = {}) => ;
	const toFunc = (obj, path: string | undefined) => {
		const result = {};
		// converts keys in the object to a function
		for (const key in obj) {
			const subpath = path === undefined ? key : `${path}.${key}`;
			if (typeof obj[key] === 'string') {
				result[key] = (interpolationObject) => polyglot.t(subpath, interpolationObject);
			} else {
				result[key] = toFunc(obj[key], subpath);
			}
		}
		return result;
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const localize: any = toFunc(schema, undefined);

	return { localize, polyglot, phrases: schema };
}
