import { Auth0Client } from '@auth0/auth0-spa-js';

import { isGenericLoginPage, isNotProductionRoute } from '@/helpers/env';
import axiosUnsecure from '@/helpers/routing/axiosUnsecure';
import { local } from '@/helpers/storage';

import { AuthInfo } from '../types';

const AUTH0_DEV_DOMAIN = process.env.AUTH0_ENV === 'dev' ? 'login-dev.combocurve.com' : 'login-test.combocurve.com';
const AUTH0_PRODUCTION_DOMAIN = 'login.combocurve.com';

const config = {
	domain: isNotProductionRoute() ? AUTH0_DEV_DOMAIN : AUTH0_PRODUCTION_DOMAIN,
};

const AUTH0_AUDIENCE = 'https://app.combocurve.com/api';

interface CIAuthCredentials {
	accessToken: string;
	email: string;
	expiresIn: number;
	idTokenPayload: {
		given_name: string;
		family_name: string;
		nickname: string;
		name: string;
		picture: string;
		updated_at: string;
		email: string;
		email_verified: boolean;
		iss: string;
		aud: string;
		iat: number;
		exp: number;
		sub: string;
	};
	tokenType: string;
	scope: string;
}

const getCIAuthCredentials = (): CIAuthCredentials | null => local.getItem('ciAuthCredentials');

// Wrapper for auth0 client.
// docs: https://auth0.github.io/auth0-spa-js/
class Auth0ClientWrapper {
	isInitialized: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	organizationId?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	auth0AppClientId?: any;
	auth0?: Auth0Client;
	targetUrl?: string;

	constructor() {
		this.init = this.init.bind(this);
		this.getProfile = this.getProfile.bind(this);
		this.handleAuthentication = this.handleAuthentication.bind(this);
		this.isAuthenticated = this.isAuthenticated.bind(this);
		this.signIn = this.signIn.bind(this);
		this.signOut = this.signOut.bind(this);
		this.getTargetUrl = this.getTargetUrl.bind(this);
		this.isInitialized = false;
	}

	async init(authInfo: AuthInfo) {
		if (this.isInitialized) {
			return;
		}

		this.organizationId = authInfo.organizationId;

		this.auth0AppClientId = authInfo.auth0AppClientId;
		this.auth0 = new Auth0Client({
			domain: config.domain,
			clientId: authInfo.auth0AppClientId,
			useRefreshTokens: true,
			authorizationParams: {
				redirect_uri: `${window.location.origin}/callback`,
				organization: isGenericLoginPage() ? undefined : this.organizationId,
			},
		});
		this.isInitialized = true;
	}

	getProfile() {
		const ciAuthCredentials = getCIAuthCredentials();
		if (ciAuthCredentials) {
			return ciAuthCredentials.idTokenPayload;
		}
		return this.auth0?.getUser();
	}

	getAccessToken() {
		const ciAuthCredentials = getCIAuthCredentials();
		if (ciAuthCredentials) {
			return ciAuthCredentials.accessToken;
		}
		return this.auth0?.getTokenSilently({
			authorizationParams: {
				audience: AUTH0_AUDIENCE,
			},
		});
	}

	isAuthenticated() {
		const ciAuthCredentials = getCIAuthCredentials();
		if (ciAuthCredentials) {
			return true;
		}
		return this.auth0?.isAuthenticated();
	}

	async signIn() {
		if (await this.isAuthenticated()) {
			return true;
		}
		// signIn will redirect to callback page so we save the target url and load it after signing in
		const targetUrl = `${window.location.pathname}${window.location.search}`;
		await this.auth0?.loginWithRedirect({
			authorizationParams: {
				audience: AUTH0_AUDIENCE,
			},
			appState: { targetUrl },
		});
		return false;
	}

	async handleAuthentication() {
		const authResult = await this.auth0?.handleRedirectCallback();
		this.targetUrl = authResult?.appState.targetUrl ?? '/';
	}

	async signOut(returnUrl, doClearStorage = true) {
		try {
			const accessToken: string = (await this.getAccessToken()) || '';
			await axiosUnsecure.get('/user/signOut', { headers: { Authorization: `Bearer ${accessToken}` } });
		} catch (error) {
			// If this fails we weren't signed in so eat the exception
		}
		if (doClearStorage) {
			this.targetUrl = undefined;
		}
		const returnTo =
			returnUrl && !returnUrl.startsWith(`${window.location.origin}/callback`)
				? returnUrl
				: `${window.location.origin}/`;

		await this.auth0?.logout({
			clientId: this.auth0AppClientId,
			logoutParams: {
				returnTo,
				federated: true,
			},
		});
		// Hack to wait for the logout redirect. Can't find a way to do it directly - TODO determine if this is needed
		await new Promise((res) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			setTimeout(() => (res as any)(), 5000);
		});
	}

	getTargetUrl() {
		return this.targetUrl ?? '/';
	}
}

const auth0Client = new Auth0ClientWrapper();

export default auth0Client;
