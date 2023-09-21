import { useEffect } from 'react';
import swal from 'sweetalert2';

import { genericErrorAlert } from '@/helpers/alerts';
import { session } from '@/helpers/storage';

import InitialLoading from './InitialLoading';

import './login.scss';

type AuthError = {
	silent?: boolean;
	locked?: boolean;
	userNotFound?: boolean;
	error401?: string;
	error?: Error;
	permission?: boolean;
};

const displayError = (err: AuthError | undefined) => {
	if (err && err.silent) {
		return Promise.resolve(true);
	}
	if (err && err.locked) {
		return swal({
			type: 'error',
			allowEscapeKey: false,
			showConfirmButton: false,
			allowOutsideClick: false,
			titleText: 'Your Account Is Locked',
			text: 'Contact your administrator for help',
			customContainerClass: 'overlay-alert',
		});
	}
	if (err && err.userNotFound) {
		return swal({
			type: 'error',
			showConfirmButton: false,
			titleText: 'User Not Found',
			text: 'Contact your administrator for help',
			timer: 10000,
			customContainerClass: 'overlay-alert',
		});
	}
	if (err && err.error401) {
		if (err.error) {
			return genericErrorAlert(err.error);
		}
		return swal({
			type: 'error',
			showConfirmButton: false,
			titleText: 'Authorization Error',
			text: 'Redirecting to login...',
			timer: 4000,
			customContainerClass: 'overlay-alert',
		});
	}
	if (err && err.permission) {
		return swal({
			type: 'error',
			showConfirmButton: false,
			titleText: 'Permission Error',
			text: 'You do not have permission to view that resource. Contact your administrator for help',
			timer: 4000,
			customContainerClass: 'overlay-alert',
		});
	}
	return swal({
		type: 'error',
		showConfirmButton: false,
		titleText: 'Login Error',
		text: 'Redirecting to home page',
		timer: 4000,
		customContainerClass: 'overlay-alert',
	});
};

/** Landing page after auth0 signout in case of failure */
const LoginError = () => {
	useEffect(() => {
		const err = session.getItem('loginError');
		session.clear();
		displayError(err).then(() => {
			if (err && err.error401) {
				const returnTo =
					err.returnUrl && !err.returnUrl.startsWith(`${window.location.origin}/callback`)
						? err.returnUrl
						: `${window.location.origin}/`;
				window.location = returnTo;
				return;
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			window.location = window.location.origin as any; // TODO investigate type issue later
		});
	}, []);

	return <InitialLoading />;
};

export default LoginError;
