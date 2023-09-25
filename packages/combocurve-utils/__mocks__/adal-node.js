const createFakeToken = () => '_token_';

class AuthenticationContext {
	/* eslint-disable class-methods-use-this */
	acquireTokenWithClientCredentials(uri, clientId, clientSecret, callback) {
		callback(null, {
			accessToken: createFakeToken(),
		});
	}
}

module.exports = { AuthenticationContext };
