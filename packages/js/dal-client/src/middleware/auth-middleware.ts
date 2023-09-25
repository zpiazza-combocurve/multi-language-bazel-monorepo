import { DALEnvironmentConfig, getDalAuthToken } from '@combocurve/dal-auth';
import { CallOptions, ClientMiddlewareCall, Metadata } from 'nice-grpc';

/**
 * This should determine when pointing to a deployed DAL server vs. a local one. The server deployed to GCP is IAM
 * protected and requires an ID token to be passed in the `Authorization` header. The local server does not require any
 * credentials.
 */
const requiresAuth = (dalUrl: string) => dalUrl.startsWith('https://');

export const createAuthMiddleware = ({ dalUrl, dalServiceAccount }: DALEnvironmentConfig) =>
	async function* authMiddleware<Request, Response>(
		call: ClientMiddlewareCall<Request, Response>,
		options: CallOptions
	) {
		if (requiresAuth(dalUrl)) {
			const token = getDalAuthToken({ dalUrl, dalServiceAccount });

			options.metadata = options.metadata ?? new Metadata();
			options.metadata.set('authorization', `Bearer ${token}`);
		}

		return yield* call.next(call.request, options);
	};
