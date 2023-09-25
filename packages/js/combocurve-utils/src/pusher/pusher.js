// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const Pusher = require('pusher');

class PusherError extends Error {
	constructor(message, details) {
		super(message);
		this.name = PusherError.name;
		this.details = details;
	}
}
const triggerWrapper = async ({ client, channelName, socketName, data }) => {
	try {
		await client.trigger(channelName, socketName, data);
	} catch (error) {
		if (error.status) {
			throw new PusherError(`Pusher API returned status code ${error.status}`, error);
		}
		throw error;
	}
};

class PusherWrapper {
	constructor(tenant) {
		const { pusherKey, pusherAppId, pusherSecret, pusherCluster } = tenant;
		this.client = new Pusher({
			key: pusherKey,
			appId: pusherAppId,
			secret: pusherSecret,
			cluster: pusherCluster,
			useTLS: true,
		});
	}

	triggerUserChannel(tenantName, userId, socketName, data) {
		return triggerWrapper({
			client: this.client,
			channelName: `private-${tenantName}-${userId}`,
			socketName,
			data,
		});
	}

	triggerCompanyChannel(tenantName, socketName, data) {
		return triggerWrapper({ client: this.client, channelName: `private-${tenantName}`, socketName, data });
	}

	authenticate(...params) {
		return this.client.authenticate(...params);
	}
}

const initPusherClient = (tenant) => new PusherWrapper(tenant);

module.exports = { initPusherClient };
