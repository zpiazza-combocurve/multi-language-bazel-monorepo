import { Compute, GoogleAuth } from 'google-auth-library';
import { JSONClient } from 'google-auth-library/build/src/auth/googleauth';

import { DALEnvironmentConfig } from './config';

export { type DALEnvironmentConfig };

const scopedAuth = new GoogleAuth({
	scopes: 'https://www.googleapis.com/auth/cloud-platform',
});

let client: JSONClient | Compute | undefined;

export const generateIdToken = async (serviceAccountEmail: string, audience: string): Promise<string> => {
	/**
	 * Generate an ID token on behalf of the specified service account. This function will automatically choose the
	 * right auth client based on the environment. This token generation method works regardless of the environment,
	 * i.e., it does not require a GCE based environment, or GOOGLE_APPLICATION_CREDENTIALS env var to be set.
	 *
	 * Reference:
	 *
	 * - https://cloud.google.com/nodejs/docs/reference/google-auth-library/latest#choosing-the-correct-credential-type-automatically
	 * - https://cloud.google.com/iam/docs/create-short-lived-credentials-direct#sa-credentials-oidc
	 */
	if (!client) {
		client = await scopedAuth.getClient();
	}
	const url = `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccountEmail}:generateIdToken`;
	const body = {
		audience,
		includeEmail: 'true',
	};
	const headers = { 'Content-Type': 'application/json; charset=utf-8' };

	const { data } = await client.request<{ token: string }>({
		url,
		method: 'POST',
		headers,
		body: JSON.stringify(body),
	});
	return data.token;
};

// can not set `scopes` for this auth instance, because `IDTokenClient` doesn't allow it along with `audience`.
const auth = new GoogleAuth();

export const getAuthToken = async (audience: string): Promise<string> => {
	/**
	 * This token generation method works when running on a GCE based environment, or when
	 * GOOGLE_APPLICATION_CREDENTIALS env var is set to a service account key.
	 */
	const client = await auth.getIdTokenClient(audience);

	// the useful public methods are `getRequestHeaders` and `request`, so we have to use `getRequestHeaders` to get
	// the token for more custom use cases like when using gRPC.
	const headers = await client.getRequestHeaders();
	return headers.Authorization.split(' ')[1];
};

export const getDalAuthToken = async ({ dalUrl, dalServiceAccount }: DALEnvironmentConfig) => {
	return dalServiceAccount ? generateIdToken(dalServiceAccount, dalUrl) : await getAuthToken(dalUrl);
};
