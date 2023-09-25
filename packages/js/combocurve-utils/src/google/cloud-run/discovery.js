// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ServicesClient } = require('@google-cloud/run').v2;
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { memoizeAsync } = require('../../utilities/caching');

const runClient = new ServicesClient();

const getService = async (serviceId) => {
	const [service] = await runClient.getService({ name: serviceId });
	const { uri } = service;
	return { url: uri };
};

const memoizedGetService = memoizeAsync(getService);

/**
 * Facilitates resolving the Cloud Run service URL given the service name.
 *
 * @example
 * 	const discovery = new CloudRunDiscovery(GCP_PROJECT_ID, REGION);
 * 	const { url: myServiceUrl } = await discovery.getService('my-service-name');
 */
class CloudRunDiscovery {
	/**
	 * @param {string} project - GCP project ID
	 * @param {string} location - GCP location ID
	 */
	constructor(project, location) {
		this.project = project;
		this.location = location;
	}

	/** @param {string} name - Name of the Cloud Run service */
	async getService(name) {
		return memoizedGetService(`projects/${this.project}/locations/${this.location}/services/${name}`);
	}
}

module.exports = CloudRunDiscovery;
