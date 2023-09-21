import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { infoAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { isGenericLoginPage, isIpRoute, isNotProductionRoute } from '@/helpers/env';
import { postApi } from '@/helpers/routing';
import { session } from '@/helpers/storage';

import InitialLoading from './InitialLoading';
import authClient from './authClient';

import './login.scss';

const handleAuthentication = async () => {
	try {
		await authClient.handleAuthentication();
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('handleAuthentication failed', err);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		window.location = `${window.location.origin}/login-error` as any; // TODO figure out why this sometimes happens during session errors
	}
};

const validateUser = async (profile) => {
	try {
		const user = await postApi('/user/validateUser', profile);
		if (user === 'LOCKED') {
			session.setItem('loginError', { locked: true });
			await authClient.signOut(`${window.location.origin}/login-error`, false);
			return false;
		}

		return true;
	} catch (err) {
		if (err.name === 'UserNotFoundError') {
			session.setItem('loginError', { userNotFound: true });
		}
		await authClient.signOut(`${window.location.origin}/login-error`, false);
		return false;
	}
};

const signIn = async (email, bootstrap) => {
	try {
		const response = await postApi('/user/signIn', { email });
		await bootstrap(false);
		if (response.updatedStaleSessions) {
			infoAlert('Logged out of a different device', 6000);
		}
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error('signIn failed', e);
		await authClient.signOut(`${window.location.origin}/login-error`, false);
	}
};

export const establishSession = async (bootstrap) => {
	const profile = (await authClient.getProfile()) || { email: '' };
	// before signin check that the user exists and is not locked
	const isValid = await validateUser(profile);
	if (isValid) {
		await signIn(profile.email, bootstrap);
	}
};

// Landing page after auth0 login redirect
const Callback = () => {
	const { bootstrapFn: bootstrap } = useAlfa();
	const navigate = useNavigate();
	useEffect(() => {
		try {
			// We can get here without an init. Calling it twice is harmless
			authClient.init().then(async () => {
				if (!(await authClient.isAuthenticated())) {
					// If we get here from silentAuth we may already be authenticated. Otherwise parse our sign in
					await handleAuthentication();
				}

				if (!(await authClient.isAuthenticated())) {
					// eslint-disable-next-line no-console
					console.error('passed handle auth without authenticating');
					// If we aren't authed at this point then handleAuthentication failed silently. Should never happen...
					await authClient.signOut(`${window.location.origin}/login-error`, false);
					return;
				}
				const targetUrl = authClient.getTargetUrl();
				// If the user signed in with the generic login page, redirect them to their tenant
				if (isGenericLoginPage()) {
					// get tenant from token
					const AUTH0_TOKEN_ORG_NAME_KEY = 'https://combocurve.com/org_name';
					const profile = (await authClient.getProfile()) ?? {};
					const org_name = profile[AUTH0_TOKEN_ORG_NAME_KEY];
					if (!org_name) {
						// If we signed in through generic we have to have an org name so this is an error
						await authClient.signOut(`${window.location.origin}/login-error`, false);
						return;
					}
					window.location.replace(`https://${org_name}.combocurve.com${targetUrl}`);
					return;
				}
				await establishSession(bootstrap).then(() => {
					navigate(targetUrl, { replace: true });
				});
			});
		} catch (error) {
			if (isIpRoute() || isNotProductionRoute()) {
				// eslint-disable-next-line no-console
				console.error('Callback useEffect error', error);
			}
			authClient.signOut(`${window.location.origin}/login-error`, false);
		}
	}, [bootstrap, navigate]);

	return <InitialLoading />;
};

export default Callback;
