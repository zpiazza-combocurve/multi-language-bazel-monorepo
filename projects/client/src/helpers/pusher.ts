import Pusher from 'pusher-js';

import { postApi } from '@/helpers/routing';
import { getTenant } from '@/helpers/utilities';

import errorHandler from '../error-handler';

const handleSubscriptionError = (error) => {
	// TODO decide what should happen when pusher fails
	errorHandler.report(`Pusher subscription error: ${error.status}, ${error.message}`);
};

const authorizer = (channel) => {
	return {
		authorize: async (socketId, callback) => {
			try {
				const response = await postApi('/user/authenticatePusher', {
					channel_name: channel.name,
					socket_id: socketId,
				});
				callback(null, response);
			} catch (error) {
				errorHandler.report(error);
			}
		},
	};
};

let pusherClient: Pusher | null = null;

const initPusherClient = (pusherKey: string, pusherCluster: string) => {
	if (!pusherClient) {
		pusherClient = new Pusher(pusherKey, {
			cluster: pusherCluster,
			forceTLS: true,
			authorizer,
		});
	}

	return pusherClient;
};

export const connectPusher = async (boot) => {
	const pusher = initPusherClient(boot.pusherKey, boot.pusherCluster);

	// Check if initial connection succeeded
	pusher.connection.bind('error', (err) => {
		// Passed connection quota limit in pusher API.
		if (err?.error?.data?.code === 4004) {
			errorHandler.report(new Error('Over limit!'));
		}

		errorHandler.report(new Error(`Failed to connect to pusher service ${err}`));
	});

	// Each subscribe will try to authenticate. If we add more in the future look into batching them
	// https://pusher.com/docs/channels/server_api/authenticating-users#batching-auth-requests-aka-multi-auth-
	const pusherChannel = pusher.subscribe(`private-${getTenant()}-${boot.user._id}`);

	pusherChannel.bind('pusher:subscription_error', handleSubscriptionError);

	const companyPusherChannel = pusher.subscribe(`private-${boot.subdomain}`);

	companyPusherChannel.bind('pusher:subscription_error', handleSubscriptionError);

	return { pusherChannel, companyPusherChannel };
};
