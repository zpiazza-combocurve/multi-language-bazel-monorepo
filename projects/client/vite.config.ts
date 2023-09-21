import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
	plugins: [
		react({
			include: /\.(jsx|tsx)$/,
			babel: {
				plugins: ['styled-components'],
				babelrc: false,
				configFile: false,
			},
		}),
		tsconfigPaths({ root: '.', projects: ['.', '../internal-api/', '../packages/factories/'], loose: true }),
		svgr(),
	],
	root: '.',
	build: {
		outDir: 'build',
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					if (id.includes('node_modules')) {
						// chunk out some big dependencies
						if (id.includes('@mui')) return 'vendor-mui';
						if (id.includes('@material-ui')) return 'vendor-material-ui';
						if (id.includes('react-md')) return 'vendor-react-md';
						if (id.includes('@ag-grid')) return 'vendor-ag-grid-modules';
						if (id.includes('ag-grid')) return 'vendor-ag-grid-packages';
						if (id.includes('@bryntum')) return 'vendor-bryntum';
						if (id.includes('mermaid') || id.includes('cytoscape') || id.includes('elkjs'))
							return 'vendor-mermaid';
						if (id.includes('dagre-d3-es') || id.includes('/d3')) return 'vendor-d3'; // d3 included by mermaid
						if (id.includes('pdfmake')) return 'vendor-pdfmake';
						if (id.includes('xlsx')) return 'vendor-xlsx';
						if (id.includes('@clientio') || id.includes('jointjs') || id.includes('jquery'))
							return 'vendor-jointjs';
						if (id.includes('mapbox') || id.includes('@turf') || id.includes('turf-jsts'))
							return 'vendor-mapbox';
						if (id.includes('powerbi')) return 'vendor-powerbi';
						if (id.includes('lodash')) return 'vendor-lodash';
						if (id.includes('docx')) return 'vendor-docx';
					}
				},
			},
			onwarn(warning, warn) {
				// https://github.com/rollup/rollup/issues/2082#issuecomment-614387927
				// suppress eval warnings
				if (warning.code === 'EVAL') return;
				warn(warning);
			},
		},
	},
	resolve: {
		alias: [
			// help vite find some dependencies
			...[
				'@mapbox/mapbox-gl-draw/src/modes/draw_polygon',
				'@mapbox/mapbox-gl-draw/src/constants',
				'sweetalert2',
			].map((p) => ({
				find: p,
				replacement: import(p),
			})),
			{ find: 'lodash', replacement: 'lodash-es' },
			// https://vitejs.dev/config/shared-options.html#resolve-alias
			{ find: /^~/, replacement: '' }, // for sass modules imports
			{
				find: /^@\/inpt-shared\//,
				replacement: path.resolve(__dirname, '../internal-api/src/inpt-shared') + '/',
			},
			{
				find: /^@\/factories\//,
				replacement: path.resolve(__dirname, '../packages/factories/src') + '/',
			},
			{ find: /^@\/tests\//, replacement: path.resolve(__dirname, 'tests') + '/' },
			{ find: /^@\//, replacement: path.resolve(__dirname, 'src') + '/' }, // for @/ imports in sass
		],
	},
	css: {
		preprocessorOptions: {
			scss: {
				quietDeps: true, // silence https://sass-lang.com/documentation/breaking-changes/slash-div/
			},
		},
	},
	define: {
		'process.env': {
			LOCAL_ENV: 'test',
			AUTH0_ENV: process.env.AUTH0_ENV ?? '',
			GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID ?? 'UA-189309272-1',
			LAUNCH_DARKLY_CLIENT_ID: process.env.LAUNCH_DARKLY_CLIENT_ID ?? '634ea99e87e7fb10f19cb4b6',
		},
	},
	server: {
		port: 3000,
		proxy: {
			'/api': 'http://127.0.0.1:8080',
		},
	},
});
