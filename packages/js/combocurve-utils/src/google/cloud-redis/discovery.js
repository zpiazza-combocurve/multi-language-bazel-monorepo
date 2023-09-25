// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { CloudRedisClient } = require('@google-cloud/redis');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { memoizeAsync } = require('../../utilities/caching');

const client = new CloudRedisClient();

const getInstance = async (path) => {
	const [instance] = await client.getInstance({ name: path });
	const { host } = instance;

	if (!host) {
		throw new Error("Instance exists but it's not ready");
	}

	return { host };
};

const memoizedGetInstance = memoizeAsync(getInstance);

/**
 * Facilitates resolving the Redis address given the instance name in Memorystore.
 *
 * @example
 * 	const discovery = new CloudRedisDiscovery(GCP_PROJECT_ID, REGION);
 * 	const { host } = await discovery.getInstance('my-redis-instance-name');
 */
class CloudRedisDiscovery {
	/**
	 * @param {string} project - GCP project ID
	 * @param {string} location - GCP location ID
	 */
	constructor(project, location) {
		this.project = project;
		this.location = location;
	}

	/** @param {string} name - Name of the Memorystore Redis instance */
	async getInstance(name) {
		const path = client.instancePath(this.project, this.location, name);
		return memoizedGetInstance(path);
	}
}

module.exports = CloudRedisDiscovery;
