// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
type Module = Record<string, any | string | ((...args: any[]) => Module | string)>;

const symbols = ['/', '?'];
const joinPaths = (_path, _subPath) => {
	const path = symbols.includes(_path[0]) ? _path : `/${_path}`;

	if (!_subPath) {
		return path;
	}

	const subPath = symbols.includes(_subPath[0]) ? _subPath : `/${_subPath}`;
	// remove extra '/'
	if (subPath === '/') {
		return path;
	}
	return `${path}${subPath}`;
};

const getSubModules = <M extends Module>(path: string, modules: M): M =>
	Object.entries(modules).reduce(
		(acc, [key, mod]) => ({
			...acc,
			[key]: (() => {
				if (typeof mod === 'string') {
					return joinPaths(path, mod);
				}
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				return (...args: any[]) => {
					const subModule = mod(...args);
					if (typeof subModule === 'string') {
						return joinPaths(path, subModule);
					}
					return getSubModules(path, subModule);
				};
			})(),
		}),
		{} as M
	);

// examples: https://github.com/insidepetroleum/main-combocurve/pull/5011
export const moduleUrls =
	<T extends string, M extends Module>(path: string, modulesOrFunction: ((id: T) => M) | M): ((id: T) => M) =>
	(id) => {
		const isFunction = typeof modulesOrFunction === 'function';
		const modules = isFunction ? modulesOrFunction(id) : modulesOrFunction;
		return getSubModules(joinPaths(path, isFunction ? '' : id), modules);
	};

export const defaultPages = {
	root: '',
	settings: 'settings',
	manageWells: 'manage-wells',
};
