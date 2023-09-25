// https://docs.launchdarkly.com/sdk/server-side/node-js
import * as ld from 'launchdarkly-node-server-sdk';

import { secretsClient } from './secrets';

export type LDClient = ld.LDClient;
export type LDMultiKindContext = ld.LDMultiKindContext;

export type LDFlagsState = ld.LDFlagsState;

const SDK_KEY_SECRET = 'launchDarklySDKKey';

let client: LDClient;

export const EMPTY_CONTEXT: ld.LDContext = {
	kind: 'multi',
};

async function getLaunchDarklySDKKey() {
	const launchDarklySDKKey = await secretsClient.accessSecret(SDK_KEY_SECRET);

	if (!launchDarklySDKKey) {
		throw Error('Missing launch darkly sdk key');
	}

	return launchDarklySDKKey;
}

export const initializeLaunchDarklyClient = async () => {
	if (!client) {
		const key = await getLaunchDarklySDKKey();
		client = await ld.init(key).waitForInitialization();
	}

	return client;
};
