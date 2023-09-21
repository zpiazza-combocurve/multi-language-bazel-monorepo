const { resolve } = require('path');

const webpack = require('webpack');

const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const { imageLoader, jsLoaders, styleLoaders, fileLoader } = require('./webpack-loaders');
const ChecksumPlugin = require('./webpack-checksum-plugin');

module.exports = (mode) => {
	const production = mode === 'production';
	process.env.BABEL_ENV = mode;
	process.env.NODE_ENV = mode;
	const port = parseInt(process.env.PORT, 10) || 3000;
	const host = process.env.HOST || 'localhost';
	return {
		entry: [!production && resolve(__dirname, 'src/debug/index.tsx'), resolve(__dirname, 'src/index.tsx')].filter(
			Boolean
		),
		mode,
		bail: production,
		devtool: production ? 'none' : 'cheap-module-source-map',
		output: {
			path: resolve(__dirname, 'build'),
			filename: production ? 'static/js/[name].[contenthash:8].js' : 'static/js/bundle.js',
			chunkFilename: production ? 'static/js/[name].[contenthash:8].chunk.js' : 'static/js/[name].chunk.js',
			publicPath: '/',
		},
		optimization: {
			splitChunks: {
				chunks: 'all',
				cacheGroups: {
					vendors: {
						test: /[\\/]node_modules[\\/]|zc-inside-petroleum/,
						priority: -10,
					},
					default: {
						minChunks: 2,
						priority: -20,
						reuseExistingChunk: true,
					},
				},
			},
			minimizer: [
				new TerserPlugin({
					parallel: 4,
					terserOptions: {
						mangle: {
							// Required for ResourceAllocationInfoOverride to work properly.
							// Ticket: https://combocurve.atlassian.net/browse/CC-18188
							// Relevant slack thread: https://insidepetroleum.slack.com/archives/CQ34663CJ/p1673305357910379
							keep_fnames: true,
						},
					},
				}),
			],
		},
		module: {
			rules: [
				// Disable require.ensure as it's not a standard language feature.
				{
					test: /\.worker\.js$/,
					use: { loader: 'worker-loader' },
				},
				{ parser: { requireEnsure: false } },
				{
					test: /\.mjs$/,
					include: /node_modules/,
					type: 'javascript/auto',
				},
				{
					oneOf: [
						...imageLoader(production),
						...jsLoaders(production),
						...styleLoaders(production),
						...fileLoader(production),
					],
				},
			],
		},
		node: {
			module: 'empty',
			dgram: 'empty',
			dns: 'mock',
			fs: 'empty',
			http2: 'empty',
			net: 'empty',
			tls: 'empty',
			child_process: 'empty',
		},
		plugins: [
			new webpack.DefinePlugin({
				'process.env.LOCAL_ENV': JSON.stringify(process.env.LOCAL_ENV || 'test'),
				'process.env.AUTH0_ENV': JSON.stringify(process.env.AUTH0_ENV || ''),
				'process.env.GOOGLE_ANALYTICS_ID': JSON.stringify(process.env.GOOGLE_ANALYTICS_ID || 'UA-189309272-1'),
				'process.env.LAUNCH_DARKLY_CLIENT_ID': JSON.stringify(
					process.env.LAUNCH_DARKLY_CLIENT_ID || '634ea99e87e7fb10f19cb4b6'
				),
			}),
			new HtmlWebpackPlugin({
				inject: true,
				template: resolve(__dirname, 'public/index.html'),
				...(production && {
					minify: {
						removeComments: true,
						collapseWhitespace: true,
						removeRedundantAttributes: true,
						useShortDoctype: true,
						removeEmptyAttributes: true,
						removeStyleLinkTypeAttributes: true,
						keepClosingSlash: true,
						minifyJS: true,
						minifyCSS: true,
						minifyURLs: true,
					},
				}),
			}),
			production &&
				new MiniCssExtractPlugin({
					// Options similar to the same options in webpackOptions.output
					// both options are optional
					filename: 'static/css/[name].[contenthash:8].css',
					chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
				}),
			// Generate a manifest file which contains a mapping of all asset filenames
			// to their corresponding output file so that tools can pick it up without
			// having to parse `index.html`.
			new ManifestPlugin({
				fileName: 'asset-manifest.json',
				publicPath: '/',
				generate: (seed, files) => {
					const manifestFiles = files.reduce((manifest, file) => {
						manifest[file.name] = file.path;
						return manifest;
					}, seed);

					return {
						files: manifestFiles,
					};
				},
			}),
			// Generate a service worker script that will precache, and keep up to date,
			// the HTML & assets that are part of the Webpack build.
			production &&
				new WorkboxWebpackPlugin.GenerateSW({
					clientsClaim: true,
					exclude: [/\.map$/, /asset-manifest\.json$/],
					importWorkboxFrom: 'cdn',
					navigateFallback: '/index.html',
					navigateFallbackBlacklist: [
						// Exclude URLs starting with /_, as they're likely an API call
						new RegExp('^/_'),
						// Exclude URLs containing a dot, as they're likely a resource in
						// public/ and not a SPA route
						new RegExp('/[^/]+\\.[^/]+$'),
					],
				}),
			new CopyWebpackPlugin([resolve(__dirname, 'public')]),
			new ChecksumPlugin({
				assetPath: '/',
				checksumPattern: 'hash',
				distPath: 'build',
				include: '**/*.js',
				resetChecksumFile: true,
			}),
			!production && new ReactRefreshWebpackPlugin({ overlay: false }),
			!production && new BundleAnalyzerPlugin(),
		].filter(Boolean),
		devServer: {
			port,
			https: false,
			compress: true,
			clientLogLevel: 'none',
			contentBase: resolve(__dirname, 'public'),
			watchContentBase: true,
			hot: true,
			publicPath: '/',
			// quiet: true,
			// Reportedly, this avoids CPU overload on some systems.
			// https://github.com/facebook/create-react-app/issues/293
			// src/node_modules is not ignored to support absolute imports
			// https://github.com/facebook/create-react-app/issues/1065
			watchOptions: { ignored: resolve(__dirname, 'node_modules') },
			host,
			overlay: false,
			historyApiFallback: {
				// Paths with dots should still use the history fallback.
				// See https://github.com/facebook/create-react-app/issues/387.
				disableDotRule: true,
			},
			proxy: {
				'/api': {
					target: 'http://127.0.0.1:8080/',
					logLevel: 'silent',
					secure: false,
					changeOrigin: true,
					ws: true,
					xfwd: true,
				},
			},
		},
		resolve: {
			alias: {
				// Patch for this issue: https://github.com/mapbox/concaveman/issues/18
				// Adapted from https://github.com/mapbox/concaveman/issues/18#issuecomment-644416555
				tinyqueue: import('tinyqueue/tinyqueue.js'),
				'react-query': import('@tanstack/react-query'),
			},
			extensions: ['.ts', '.tsx', '.js', '.jsx', '.d.ts', '.json', '.scss', '.sass'],
			plugins: [
				new TsconfigPathsPlugin({
					configFile: resolve(__dirname, 'tsconfig.json'),
					extensions: ['.ts', '.tsx', '.js', '.jsx', '.d.ts', '.json', '.scss', '.sass'],
				}),
			],
		},
	};
};
