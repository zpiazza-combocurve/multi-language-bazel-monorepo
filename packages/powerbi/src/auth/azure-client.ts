/**
 * Server-to-server auth via client credentials
 *
 * NOTE: adal-node is deprecated in favor of https://github.com/AzureAD/microsoft-authentication-library-for-js
 *
 * One of the benefits seems to be that, MSAL handles token caching and refreshing on expiration only:
 *
 * - https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/6220d0b1b2c9731b7d1e60b5950ffe43b2965f6b/lib/msal-common/src/client/ClientCredentialClient.ts#L49
 * - https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/6220d0b1b2c9731b7d1e60b5950ffe43b2965f6b/lib/msal-common/src/client/ClientCredentialClient.ts#L69
 * - https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/60af87b80448592767a4ff61a521db31a4255c35/lib/msal-common/src/utils/TimeUtils.ts#L23
 */
import { AcquireTokenCallback, AuthenticationContext, ErrorResponse, TokenResponse } from 'adal-node';

import { IPowerBIAuth } from '../client/utils/auth';

const AUTHORITY_HOST_URL = 'https://login.microsoftonline.com';
const AUTH_RESOURCE_URI = 'https://analysis.windows.net/powerbi/api';

const isTokenAcquired = (response: TokenResponse | ErrorResponse | null): response is TokenResponse =>
	!!response && 'accessToken' in response;

const TOKEN_RENEWAL_OFFSET_MS = 300 * 1000; // 300s = 5m

const isTokenExpired = (token: TokenResponse): boolean =>
	Number(new Date(token.expiresOn)) < Date.now() + TOKEN_RENEWAL_OFFSET_MS;

export class AzureClientAuth implements IPowerBIAuth {
	private readonly clientId: string;
	private readonly clientSecret: string;
	private readonly authContext: AuthenticationContext;

	private token: TokenResponse | null;

	/**
	 * @param azureTenantId - ADD tenant ID
	 * @param clientId - Application Id of app registered under AAD.
	 * @param clientSecret - Secret generated for app. Read this environment variable.
	 */
	constructor(azureTenantId: string, clientId: string, clientSecret: string) {
		this.clientId = clientId;
		this.clientSecret = clientSecret;

		const authorityUrl = `${AUTHORITY_HOST_URL}/${azureTenantId}`;

		this.authContext = new AuthenticationContext(authorityUrl);
		this.token = null;
	}

	async getToken(): Promise<string> {
		if (!this.token || isTokenExpired(this.token)) {
			await this.authenticate();
		}
		return (this.token as TokenResponse).accessToken;
	}

	private authenticate(): Promise<void> {
		return new Promise((resolve, reject) => {
			const callback: AcquireTokenCallback = (error, response) => {
				if (isTokenAcquired(response)) {
					this.token = response;
					resolve(undefined);
					return;
				}
				reject(error);
			};

			this.authContext.acquireTokenWithClientCredentials(
				AUTH_RESOURCE_URI,
				this.clientId,
				this.clientSecret,
				callback
			);
		});
	}
}
