const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const postcssNormalize = require('postcss-normalize');

const postcssFlexbugsFixes = require('postcss-flexbugs-fixes');
const postcssPresetEnv = require('postcss-preset-env');

const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;

const fileLoader = () => [
	{
		loader: import('file-loader'),
		exclude: [/\.(js|mjs|jsx|ts|tsx|ejs|mdx)$/, /\.html$/, /\.json$/],
		options: {
			name: 'static/media/[name].[hash:8].[ext]',
		},
	},
];

const imageLoader = () => [
	{
		test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
		loader: import('url-loader'),
		options: {
			limit: 10000,
			name: 'static/media/[name].[hash:8].[ext]',
		},
	},
];

const jsLoaders = (production) =>
	[
		// Process application JS with Babel.
		// The preset includes JSX, Flow, TypeScript, and some ESnext features.
		{
			test: /\.(js|mjs|jsx|ts|tsx)$/,
			exclude: [/mapbox-gl/, /bryntum/],
			loader: import('babel-loader'),
			options: {
				customize: import('babel-preset-react-app/webpack-overrides'),
				plugins: [
					[
						import('babel-plugin-named-asset-import'),
						{
							loaderMap: {
								svg: {
									ReactComponent: '@svgr/webpack?-svgo,+ref![path]',
								},
							},
						},
					],
				],
				// This is a feature of `babel-loader` for webpack (not Babel itself).
				// It enables caching results in ./node_modules/.cache/babel-loader/
				// directory for faster rebuilds.
				cacheDirectory: true,
				cacheCompression: production,
				compact: production,
			},
		},
		!production && {
			test: /\.(js|mjs|jsx|ts|tsx)$/,
			exclude: /node_modules/,
			loader: import('babel-loader'),
			options: {
				customize: import('babel-preset-react-app/webpack-overrides'),
				plugins: [import('react-refresh/babel')],
				cacheDirectory: true,
				cacheCompression: production,
				compact: production,
			},
		},
	]
		.filter(Boolean)
		.map(({ loader, options, ...rest }) => ({ ...rest, use: ['thread-loader', { loader, options }] }));

const styleLoaders = (production) => {
	const getStyleLoaders = (cssOptions, preProcessor, preProcessorOptions) => {
		const loaders = [
			!production && import('style-loader'),
			production && {
				loader: MiniCssExtractPlugin.loader,
				options: { publicPath: '../../' },
			},
			{
				loader: import('css-loader'),
				options: cssOptions,
			},
			{
				// Options for PostCSS as we reference these options twice
				// Adds vendor prefixing based on your specified browser support in
				// package.json
				loader: import('postcss-loader'),
				options: {
					// Necessary for external CSS imports to work
					// https://github.com/facebook/create-react-app/issues/2677
					ident: 'postcss',
					plugins: () => [
						postcssFlexbugsFixes,
						postcssPresetEnv({ autoprefixer: { flexbox: 'no-2009' }, stage: 3 }),
						// Adds PostCSS Normalize as the reset css with default options,
						// so that it honors browserslist config in package.json
						// which in turn let's users customize the target behavior as per their needs.
						postcssNormalize(),
					],
					// sourceMap: production,
				},
			},
		].filter(Boolean);
		if (preProcessor) {
			loaders.push({
				loader: import(preProcessor),
				options: {
					// sourceMap: production,
					...preProcessorOptions,
				},
			});
		}
		return loaders;
	};
	return [
		// "postcss" loader applies autoprefixer to our CSS.
		// "css" loader resolves paths in CSS and adds assets as dependencies.
		// "style" loader turns CSS into JS modules that inject <style> tags.
		// In production, we use MiniCSSExtractPlugin to extract that CSS
		// to a file, but in development "style" loader enables hot editing
		// of CSS.
		// By default we support CSS Modules with the extension .module.css
		{
			test: cssRegex,
			exclude: /\.module\.css$/,
			use: getStyleLoaders({
				importLoaders: 1,
				// sourceMap: production,
			}),
			// Don't consider CSS imports dead code even if the
			// containing package claims to have no side effects.
			// Remove this when webpack adds a warning or an error for this.
			// See https://github.com/webpack/webpack/issues/6571
			sideEffects: true,
		},
		// Adds support for CSS Modules (https://github.com/css-modules/css-modules)
		// using the extension .module.css
		{
			test: cssModuleRegex,
			use: getStyleLoaders({
				importLoaders: 1,
				// sourceMap: production,
				modules: {
					getLocalIdent: getCSSModuleLocalIdent,
				},
			}),
		},
		// Opt-in support for SASS (using .scss or .sass extensions).
		// By default we support SASS Modules with the
		// extensions .module.scss or .module.sass
		{
			test: sassRegex,
			exclude: sassModuleRegex,
			use: getStyleLoaders(
				{
					importLoaders: 2,
					sourceMap: !production,
				},
				'sass-loader',
				{
					sassOptions: {
						quietDeps: true,
					},
				}
			),
			// Don't consider CSS imports dead code even if the
			// containing package claims to have no side effects.
			// Remove this when webpack adds a warning or an error for this.
			// See https://github.com/webpack/webpack/issues/6571
			sideEffects: true,
		},
		// Adds support for CSS Modules, but using SASS
		// using the extension .module.scss or .module.sass
		{
			test: sassModuleRegex,
			use: getStyleLoaders(
				{
					importLoaders: 2,
					// sourceMap: production,
					modules: {
						getLocalIdent: getCSSModuleLocalIdent,
					},
				},
				'sass-loader'
			),
		},
	];
};

module.exports = {
	fileLoader,
	imageLoader,
	jsLoaders,
	styleLoaders,
};
