import axiosUnsecure from '@/helpers/routing/axiosUnsecure';
import { AuthorizationError } from '@/helpers/routing/routing-shared';
import { session } from '@/helpers/storage';

let profile: null | { email: string } = null;

function isPasswordless(authClient) {
	return authClient.getAuthMode() === 'passwordless';
}

function init() {
	// no-op
}

function getProfile() {
	return profile;
}

function getAccessToken() {
	return 'unusedToken';
}

async function isAuthenticated(authClient) {
	// We can only find out we are not authed by the backend sending us a 401
	try {
		const { email } = await axiosUnsecure.get('/user/checkPasswordlessSession');
		profile = { email };
		return true;
	} catch (error) {
		if (error instanceof AuthorizationError) {
			if (!isPasswordless(authClient)) {
				throw error;
			}
			return false;
		}
		throw error;
	}
}

async function signIn(authClient, navigate) {
	try {
		const { email } = await axiosUnsecure.get('/user/checkPasswordlessSession');
		profile = { email };
		return true;
	} catch (error) {
		if (error instanceof AuthorizationError) {
			if (!isPasswordless(authClient)) {
				throw error;
			}
			// Remember target page before redirecting
			const targetUrl = `${window.location.pathname}${window.location.search}`;
			session.setItem('targetUrl', { targetUrl });
			navigate('/passwordless-login');
			return false;
		}
		throw error;
	}
}

async function handleAuthentication() {
	const params = new URLSearchParams(window.location.search);
	const token = params.get('token');
	const uid = params.get('uid');
	if (token && uid) {
		const { email } = await axiosUnsecure.post('/user/acceptPasswordlessToken', { token, uid });
		profile = { email };
	}
}

async function signOut(returnUrl?: string, doClearStorage = true) {
	await axiosUnsecure.get('/user/passwordlessLogout').catch((e) => e);
	profile = null;
	if (doClearStorage) {
		session.clear();
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	window.location = returnUrl ?? (`${window.location.origin}/` as any);
}

function getTargetUrl(): string {
	const { targetUrl } = session.getItem('targetUrl') ?? { targetUrl: '/' };
	return targetUrl as string;
}

export default {
	getAccessToken,
	getProfile,
	getTargetUrl,
	handleAuthentication,
	init,
	isAuthenticated,
	signIn,
	signOut,
};
