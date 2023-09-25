#!/usr/bin/env node
import { spawn } from 'node:child_process';

import { config } from './index';

const [, , cmd, ...args] = process.argv;

config()
	.then(() => {
		const cmdProcess = spawn(cmd, args);

		cmdProcess.stdout.pipe(process.stdout);
		cmdProcess.stderr.pipe(process.stderr);
	})
	// eslint-disable-next-line no-console
	.catch((error) => console.error(error));
