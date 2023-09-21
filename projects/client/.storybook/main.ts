const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const { resolve } = require('path');

const custom = require('../webpack.config.js');
const customWebpack = custom('development');

module.exports = {
	stories: ['../src/**/*.stories.@(tsx|mdx)'],
	addons: ['@storybook/addon-links', '@storybook/addon-essentials', '@storybook/addon-interactions'],
	framework: '@storybook/react',
	typescript: {
		reactDocgen: 'react-docgen-typescript-plugin',
	},
	core: {
		disableTelemetry: true,
	},
	webpackFinal: async (config) => {
		config.resolve.plugins = [
			new TsconfigPathsPlugin({
				configFile: resolve(__dirname, '../tsconfig.json'),
				extensions: ['.ts', '.tsx', '.js', '.jsx', '.d.ts', '.json', '.scss', '.sass'],
			}),
		];

		customWebpack.module.rules[3].oneOf.forEach((rule) => {
			if (rule.use && rule.use[0] === 'thread-loader') {
				const { loader, options } = rule.use[1];
				rule.loader = loader;
				rule.options = options;
				rule.use = undefined;
			}
		});

		customWebpack.module.rules.push({
			test: /\.mdx?$/,
			use: [{ loader: 'babel-loader' }, { loader: '@mdx-js/loader' }],
		});

		return { ...config, module: { ...config.module, rules: [...customWebpack.module.rules] } };
	},
};
