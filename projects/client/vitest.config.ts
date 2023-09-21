/// <reference types="vitest" />
/// <reference types="vitest/globals" />

import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		// @ts-expect-error TODO figure out error later
		react(),
		// @ts-expect-error TODO figure out error later
		tsconfigPaths({ root: '.', projects: ['.', '../internal-api/', '../packages/factories/'] }),
	],
	test: {
		alias: {
			crypto: import('crypto-js'),
			uuid: import('uuid'), // https://github.com/uuidjs/uuid/issues/558
			mermaid: import('mermaid'),
		},
		exclude: [...configDefaults.exclude, '**/*.fixtures.test.ts', '**/*.fixtures.test.tsx'],
		globals: true,
		threads: false,
		// useAtomics: true, // use with `threads`
		environment: 'jsdom',
		setupFiles: ['./vitest.setup.ts'],
		include: ['**/*.{test,spec,steps}.?(c|m)[jt]s?(x)'],
	},
});
