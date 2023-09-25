// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { AuthenticationContext } = require('adal-node');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { AUTHORITY_URL, AUTH_RESOURCE_URI } = require('./config');

const requestAuthToken = (clientId, clientSecret) => {
	const authContext = new AuthenticationContext(AUTHORITY_URL);

	return new Promise((resolve, reject) => {
		const callback = (error, response) => {
			if (error) {
				reject(error);
				return;
			}
			resolve(response.accessToken);
		};

		authContext.acquireTokenWithClientCredentials(AUTH_RESOURCE_URI, clientId, clientSecret, callback);
	});
};

const getAuthHeaders = async (clientId, clientSecret) => {
	const token = await requestAuthToken(clientId, clientSecret);

	return {
		Authorization: `Bearer ${token}`,
	};
};

module.exports = { getAuthHeaders };
