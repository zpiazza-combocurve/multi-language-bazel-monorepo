// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const spawnSync = require('cross-spawn');

// This would build the app when installing utils-js from main-cc but not when packing utils-js for GCP
if (!fs.existsSync('./dist')) {
	spawnSync('npm', ['run', 'build'], {
		stdio: 'inherit',
	});
} else {
	// eslint-disable-next-line no-console -- TODO eslint fix later
	console.log('dist already exists');
}

// https://docs.npmjs.com/cli/v9/configuring-npm/package-json#git-urls-as-dependencies
// https://stackoverflow.com/questions/48287776/automatically-build-npm-module-on-install-from-github/54413872#54413872
// https://stackoverflow.com/a/54413872
