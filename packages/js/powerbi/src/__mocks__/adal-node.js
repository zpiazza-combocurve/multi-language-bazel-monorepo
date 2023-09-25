const createFakeToken = () => '_token_';

class AuthenticationContext {
	acquireTokenWithClientCredentials(uri, clientId, clientSecret, callback) {
		callback(null, {
			accessToken: createFakeToken(),
		});
	}
}

// eslint-disable-next-line no-undef -- TODO eslint fix later
module.exports = { AuthenticationContext };
