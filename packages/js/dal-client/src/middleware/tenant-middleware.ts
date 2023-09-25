import { CallOptions, ClientMiddlewareCall, Metadata } from 'nice-grpc';

export const createTenantMiddleware = (tenantId: string) =>
	async function* tenantMiddleware<Request, Response>(
		call: ClientMiddlewareCall<Request, Response>,
		options: CallOptions
	) {
		options.metadata = options.metadata ?? new Metadata();
		options.metadata.set('tenant-id', tenantId);

		return yield* call.next(call.request, options);
	};
