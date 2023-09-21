import { phrases, polyglot } from './index';

const PREFIX = 'operations';

type CONFIRMATION_MODULES = keyof typeof phrases.operations;
type STATUS = 'pending' | 'complete' | 'queued' | 'failed';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const getKey = (...values: any[]) => values.join('.');

/** @note see `localize` function for better type safety */
export const getConfirmationMessage = <T extends CONFIRMATION_MODULES>(
	module: T,
	action: keyof (typeof phrases.operations)[T],
	status: STATUS,
	interpolationObject: Record<string, unknown> = {}
): string => polyglot.t(getKey(PREFIX, module, action as string, status), interpolationObject);
