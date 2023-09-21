import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAlfa } from '@/helpers/alfa';

import InitialLoading from './InitialLoading';
import authClient from './authClient';
import { establishSession } from './callback';

function isPasswordlessPath() {
	return window.location.pathname.toLowerCase() === '/passwordless-login';
}

function isLoginPath() {
	return (
		window.location.pathname.toLowerCase() === '/callback' ||
		window.location.pathname.toLowerCase() === '/login-error' ||
		isPasswordlessPath()
	);
}

const WithAuthentication = ({ children }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const { set } = useAlfa();
	const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>();

	const handleSilentLogin = useCallback(async () => {
		const handleBootstrap = async () => {
			setIsAuthenticated(await authClient.isAuthenticated());
		};

		const silentLogin = await authClient.signIn(navigate);
		if (!silentLogin) {
			return;
		}

		// If this did not redirect then we did silent sign in. Call session functions.
		await establishSession(handleBootstrap);
	}, [navigate]);

	useEffect(() => {
		const { hostname, protocol, href } = window.location;
		set({ bootstrapFn: () => Promise.resolve() });

		if (hostname !== 'localhost' && protocol === 'http:') {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			window.location = href.replace('http', 'https') as any; // TODO findout if this is fine, without the any typescript complains
		}

		authClient.init().then(() => {
			if (isPasswordlessPath() && authClient.getAuthMode() !== 'passwordless') {
				// TODO this will cause the passwordless login page to flash for a moment. Make it nicer
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				window.location = `${window.location.origin}/` as any; // TODO check why typescript is complaining
				return;
			}
			if (!isAuthenticated && !isLoginPath()) {
				handleSilentLogin();
			}
		});
		// `handleSilentLogin` used to be triggered multiple times, had to exclude it from dependency array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [set, isAuthenticated, location]);

	if (!isAuthenticated && !isLoginPath()) {
		return <InitialLoading />;
	}
	return children;
};

export const WithUserCheck = ({ children }) => {
	const { user } = useAlfa();

	if (!user) {
		return <InitialLoading />;
	}
	return children;
};

export default WithAuthentication;
