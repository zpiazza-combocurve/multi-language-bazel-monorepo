import 'dotenv/config';
import { createContext } from './dev-context';
import { issueJWT } from './jwt';
import { replWithGlobals } from './lib/repl-with-globals';

const startRepl = async () => {
	const context = await createContext();
	const { exit } = process;
	replWithGlobals({ globalsObject: { context, exit, issueJWT } });
};

startRepl();
