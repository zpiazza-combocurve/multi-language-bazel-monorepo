// inspiration: https://github.com/matthewkastor/atropa-replAutoload/blob/gh-pages/src/atropa-replAutoload.js
const repl = require('repl');

const replWithGlobals = ({ globalsObject = {}, globalsModule = undefined, replStartArgs = undefined }) => {
	let inject = globalsObject;
	if (globalsModule) {
		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require, import/no-dynamic-require
			inject = require(globalsModule);
		} catch (error) {
			console.error(`Failed to load ${globalsModule}`);
			throw error;
		}
	}
	if (typeof inject !== 'object') {
		throw new Error('Globals module must export an object');
	}
	Object.assign(global, inject);
	repl.start(replStartArgs);
};

module.exports = { replWithGlobals };
