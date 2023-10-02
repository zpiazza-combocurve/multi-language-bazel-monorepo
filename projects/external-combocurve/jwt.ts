import jwt from 'jsonwebtoken';

const TOKEN_DURATION_IN_SECONDS = 3600;

/**
 * Used to create an access token to authenticate for the devs test external api.
 * @param issuedAt
 * @param serviceAccount Path to devs service account
 */
const issueJWT = (
	serviceAccount = require('./external-api-test-account-key.json'),
	audience = 'https://test-api.combocurve.com',
	issuedAt = Math.floor(Date.now() / 1000),
): string =>
	jwt.sign(
		{
			iss: serviceAccount.client_email,
			sub: serviceAccount.client_email,
			aud: audience,
			iat: issuedAt,
			exp: issuedAt + TOKEN_DURATION_IN_SECONDS,
		},
		serviceAccount.private_key,
		{
			algorithm: 'RS256',
			header: {
				kid: serviceAccount.private_key_id,
				typ: 'JWT',
				alg: 'RS256',
			},
		},
	);

export { issueJWT };
