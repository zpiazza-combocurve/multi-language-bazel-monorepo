import { analytics, resetGainsightPXSession } from '@/analytics/analytics';
import axiosUnsecure from '@/helpers/routing/axiosUnsecure';

import auth0Client from './auth0/auth0Client';
import passwordlessClient from './passwordless/passwordlessClient';
import { AuthInfo } from './types';

class AuthClient {
	isInitialized: boolean;

	internalClient: typeof passwordlessClient | typeof auth0Client;

	authMode: string;

	constructor() {
		this.init = this.init.bind(this);
		this.getProfile = this.getProfile.bind(this);
		this.handleAuthentication = this.handleAuthentication.bind(this);
		this.isAuthenticated = this.isAuthenticated.bind(this);
		this.signIn = this.signIn.bind(this);
		this.signOut = this.signOut.bind(this);
		this.getTargetUrl = this.getTargetUrl.bind(this);
		this.isInitialized = false;
		this.internalClient = auth0Client;
		this.authMode = '';
	}

	async init() {
		if (this.isInitialized) {
			return;
		}

		const authInfo = (await axiosUnsecure.get('/user/getPublicAuthConfig')) as AuthInfo;

		this.authMode = authInfo.authMode;
		// check for emergency mode
		if (this.authMode === 'passwordless') {
			this.internalClient = passwordlessClient;
		}
		await this.internalClient.init(authInfo);
		this.isInitialized = true;
	}

	getAuthMode() {
		return this.authMode;
	}

	getProfile() {
		return this.internalClient.getProfile();
	}

	getAccessToken() {
		return this.internalClient.getAccessToken();
	}

	isAuthenticated() {
		return this.internalClient.isAuthenticated(this);
	}

	signIn(navigate) {
		resetGainsightPXSession();
		return this.internalClient.signIn(this, navigate);
	}

	handleAuthentication() {
		return this.internalClient.handleAuthentication();
	}

	getTargetUrl() {
		return this.internalClient.getTargetUrl();
	}

	async signOut(returnUrl, doClearStorage = true) {
		await analytics.reset();
		resetGainsightPXSession();
		return this.internalClient.signOut(returnUrl, doClearStorage);
	}
}

const authClient =
	process.env.LOCAL_ENV !== 'playground'
		? new AuthClient()
		: ({ getAccessToken: () => Promise.resolve('access-token') } as AuthClient);

export default authClient;
