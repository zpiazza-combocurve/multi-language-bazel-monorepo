// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { MD5, enc } = require('crypto-js');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { SecretManagerClient } = require('../google/secret-manager');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const RoutingModule = require('../routing').default;

function ZohoModule(props) {
	const { project } = props;
	let { url = 'https://support.combocurve.com' } = props;

	// eslint-disable-next-line new-cap -- TODO eslint fix later
	const api = RoutingModule(url);
	const secretsClient = new SecretManagerClient(project);
	let cachedAuthKey = null;

	// may be used in the future for multiple helpdesks split by tenant
	const setUrl = (val) => {
		url = val;
		api.setBaseUrl(url);
	};

	// return MD5 hash encoded as Hex String
	// eslint-disable-next-line new-cap -- TODO eslint fix later
	const _getHash = (str) => MD5(str).toString(enc.Hex);

	const _getAuthKey = async () => {
		cachedAuthKey = cachedAuthKey || (await secretsClient.accessSecret('zoho-auth-key'));
		return cachedAuthKey;
	};

	const _getTimestamp = () => Date.now() - 1000 * 5; // if we grab the exact current time, remoteAuth bugs out

	const signUp = async ({ email, fullName, loginName }) => {
		const authKey = await _getAuthKey();
		const operation = 'signup';
		const ts = _getTimestamp();
		const utype = 'portal';

		// order is important, refer to https://help.zoho.com/portal/en/kb/articles/setting-up-remote-authentication
		const str = operation + email + loginName + fullName + utype + authKey + ts;

		const digest = _getHash(str);
		const query = {
			operation,
			email,
			loginname: loginName,
			fullname: fullName,
			utype,
			ts,
			apikey: digest,
			redirect: 0,
		};

		const { result, cause } = await api.getApi('/support/RemoteAuth', query);

		if (result === 'success') {
			return result;
		}

		throw new Error(cause);
	};

	const getSignInUrl = async (email, redirectUrl) => {
		const authKey = await _getAuthKey();
		const ts = _getTimestamp();
		const operation = 'signin';

		// order is important, refer to https://help.zoho.com/portal/en/kb/articles/setting-up-remote-authentication
		const str = operation + email + authKey + ts;

		const digest = _getHash(str);
		const query = {
			operation,
			email,
			ts,
			apikey: digest,
			...(redirectUrl ? { redirectUrl } : {}),
		};

		return api.getUrl('/support/RemoteAuth', query);
	};

	return {
		getSignInUrl,
		setUrl,
		signUp,
	};
}

module.exports = ZohoModule;
