import { DALEnvironmentConfig } from '@combocurve/dal-auth';
import { Channel, ChannelCredentials, Client, ClientFactory, createChannel, createClientFactory } from 'nice-grpc';

import { DailyProductionServiceDefinition } from './gen/combocurve/dal/v1/daily_production';
import { MonthlyProductionServiceDefinition } from './gen/combocurve/dal/v1/monthly_production';
import { createAuthMiddleware } from './middleware/auth-middleware';
import { createTenantMiddleware } from './middleware/tenant-middleware';

export { buildFieldMask, inferFieldMask } from './utils/field-mask';

/**
 * This should determine when pointing to a TLS-enabled DAL server vs. a testing/local one. We want to use a secure
 * channel wherever the server supports it.
 */
const useSecureChannel = (config: DALEnvironmentConfig) => config.dalUrl.startsWith('https://');

let environmentClientFactory: ClientFactory;

const createTenantClientFactory = (config: DALEnvironmentConfig, tenantId: string) => {
	// share client factory with middleware that can be initialized once per environment
	environmentClientFactory = environmentClientFactory ?? createClientFactory().use(createAuthMiddleware(config));

	// create a new client factory with tenant-specific middleware
	return environmentClientFactory.use(createTenantMiddleware(tenantId));
};

export interface IDAL {
	/** Use this interface to type attributes and parameters where the DAL is a dependency, including in tests. */
	dailyProduction: Client<DailyProductionServiceDefinition>;
	monthlyProduction: Client<MonthlyProductionServiceDefinition>;
}

export class DAL implements IDAL {
	/** Use this class to create concrete DAL instances. For type declarations use the IDAL interface where possible. */
	dailyProduction: Client<DailyProductionServiceDefinition>;
	monthlyProduction: Client<MonthlyProductionServiceDefinition>;

	constructor(channel: Channel, clientFactory: ClientFactory) {
		this.dailyProduction = clientFactory.create(DailyProductionServiceDefinition, channel);
		this.monthlyProduction = clientFactory.create(MonthlyProductionServiceDefinition, channel);
	}

	static connect(tenantId: string, config: DALEnvironmentConfig) {
		const channel = createChannel(
			config.dalUrl,
			useSecureChannel(config) ? ChannelCredentials.createSsl() : undefined
		);
		const tenantClientFactory = createTenantClientFactory(config, tenantId);

		return new DAL(channel, tenantClientFactory);
	}
}
