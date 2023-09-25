// /*
//     This is migration is commented so it won't run when applying migrations to new tenants
// */
// /*
// const RoutingModule = require('combocurve-utils/routing');
// const { Limiter, asyncSeries } = require('../services/helpers/utilities');

// const config = {
// 	auth0BackendClientId: 'r70wqMwjJzuOIn86R0JLIAWBWMYlT93O',
// 	auth0BackendClientSecret: '<secret>',
// 	auth0ManagementDomain: 'combocurve.auth0.com',
// };

// const getAuth0Route = async () => {
// 	// The auth0 management API has to use the default domain and not the custom auth0 domain
// 	const auth0Routing = new RoutingModule(
// 		`https://${config.auth0ManagementDomain}`,
// 		{ 'content-type': 'application/x-www-form-urlencoded' },
// 		1
// 	);

// 	// get token for management api
// 	const { access_token } = await auth0Routing.postApi('/oauth/token', undefined, undefined, {
// 		grant_type: 'client_credentials',
// 		client_id: config.auth0BackendClientId,
// 		client_secret: config.auth0BackendClientSecret,
// 		audience: `https://${config.auth0ManagementDomain}/api/v2/`,
// 	});
// 	auth0Routing.setHeaders({ authorization: `Bearer ${access_token}` });
// 	return auth0Routing;
// };

// const updateNameInAuth0 = async (auth0Routing, auth0Id, firstName, lastName) => {
// 	try {
// 		await auth0Routing.patchApi(`/api/v2/users/${auth0Id}`, {
// 			given_name: firstName,
// 			family_name: lastName,
// 			name: `${firstName} ${lastName}`,
// 		});
// 	} catch (error) {
// 		// Don't send user an error message for this.
// 		console.error(error, `Failed to update name in auth0 ${auth0Id} ${firstName} ${lastName}`);
// 	}
// };
// */

// async function up() {
// 	/*
// 	const auth0Routing = await getAuth0Route();

// 	const dbUsers = db.collection('users');

// 	const projection = { auth0Id: 1, firstName: 1, lastName: 1 };

// 	const users = await dbUsers
// 		.find(
// 			{ $and: [{ firstName: { $ne: null } }, { lastName: { $ne: null } }, { auth0Id: { $exists: true } }] },
// 			{ projection }
// 		)
// 		.toArray();

// 	const limiter = new Limiter({ bucketSize: 1, dispatchesPerSecond: 10 });

// 	await asyncSeries(users, user => {
// 		const { firstName, lastName, auth0Id } = user;
// 		return limiter.next(() => updateNameInAuth0(auth0Routing, auth0Id, firstName, lastName));
// 	});
//     */
// }

// module.exports = { up, uses: ['mongodb'] };

// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
module.exports = { up: async () => {}, uses: ['mongodb'] };
