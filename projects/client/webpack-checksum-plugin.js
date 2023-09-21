/**
 * ChecksumPlugin for Webpack
 *
 * Forked from: https://github.com/iceoss/webpack-checksum-plugin
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const minimatch = require('minimatch');

function ChecksumPlugin(options) {
	this.options = options;
}

ChecksumPlugin.prototype.apply = function (compiler) {
	const options = this.options;

	const checksumFilepath = `${options.distPath}/${options.outputFilename || 'version.json'}`;
	const checksumPattern = options.checksumPattern || 'hash:filepath';
	const resetChecksumFile = options.resetChecksumFile || false;
	const include = options.include;

	const writeOutput = (checksums) => {
		const finalHash = crypto.createHash('md5').update(checksums.join('\n')).digest('hex');
		const dirOnly = path.dirname(checksumFilepath);
		if (!fs.existsSync(dirOnly)) {
			fs.mkdirSync(dirOnly, { recursive: true });
		}
		const json = `"${finalHash}"`;
		fs.writeFileSync(checksumFilepath, json, {
			encoding: 'utf8',
		});
	};

	let checksums = [];

	// Setup callback for accessing a compilation:
	compiler.plugin('after-emit', function (compilation, callback) {
		if (resetChecksumFile) {
			// reset checksums
			writeOutput([]);
		} else {
			if (fs.existsSync(checksumFilepath)) {
				checksums = fs.readFileSync(checksumFilepath, 'utf8').split('\n');
			}
		}

		Object.keys(compilation.assets).forEach(function (filename) {
			if (include && !minimatch(filename, include)) {
				return;
			}
			const asset = compilation.assets[filename];
			const absolutePath = asset.existsAt;
			const publicPath = absolutePath.substr(absolutePath.indexOf(options.assetPath) + options.assetPath.length);
			// const file = fs.readFileSync(absolutePath);
			const file = asset.source();
			const hash = crypto.createHash('md5').update(file).digest('hex');
			const checksumEntry = checksumPattern
				.replace('hash', hash)
				.replace('filepath', options.assetPath + publicPath);

			checksums.push(checksumEntry);
		});

		writeOutput(checksums);

		callback();
	});
};

module.exports = ChecksumPlugin;
