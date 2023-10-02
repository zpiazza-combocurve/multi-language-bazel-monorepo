import { createChannel, createClient, Metadata } from 'nice-grpc';
import { CompatServiceDefinition } from 'nice-grpc/lib/service-definitions';

import { ExternalDailyProductionServiceDefinition } from './gen/combocurve/external/v1/daily_production';
import { ExternalMonthlyProductionServiceDefinition } from './gen/combocurve/external/v1/monthly_production';

export async function initDALClient(config: { dalAddress: string; tenantId: string }) {
	const channel = createChannel(config.dalAddress);
	const sharedConfig = { metadata: Metadata({ 'tenant-id': config.tenantId }) };

	const initService = <Service extends CompatServiceDefinition>(service: Service) =>
		createClient(service, channel, { '*': sharedConfig });

	return {
		dailyProduction: initService(ExternalDailyProductionServiceDefinition),
		monthlyProduction: initService(ExternalMonthlyProductionServiceDefinition),
	};
}
