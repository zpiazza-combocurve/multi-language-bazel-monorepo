import { UseQueryOptions, useQuery } from 'react-query';

import { queryClient } from '@/helpers/query-cache';
import { getApi, postApi } from '@/helpers/routing';
import { PowerBIEmbedConfig, PowerBIRefresh, PowerBIReport, PowerBITemplate } from '@/inpt-shared/powerbi';

export function useReportAvailabilityQuery() {
	return useQuery(['reports'], () => getApi<PowerBIReport[] | undefined>('/reports/availability'));
}

export function generateReport(params: { template: PowerBITemplate; runId: string; socketName: string }) {
	return postApi<PowerBIRefresh>('/reports/generate', params);
}

export function getPowerBIRefresh(template: PowerBITemplate, userRequestId: string) {
	return getApi<PowerBIRefresh>('/reports/generation-details', { userRequestId, template });
}

export function getReportConfig(runId: string, template: PowerBITemplate) {
	return getApi<PowerBIEmbedConfig>('/reports/embed-config', { runId, template });
}

export const PowerBIRefreshQuery = {
	key: (template: PowerBITemplate, userRequestId: string) => ['report-status', { userRequestId, template }],
	useQuery: <T = PowerBIRefresh>(
		template: PowerBITemplate,
		userRequestId: string,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		options?: UseQueryOptions<PowerBIRefresh, any, T, any>
	) =>
		useQuery({
			...options,
			queryKey: PowerBIRefreshQuery.key(template, userRequestId),
			queryFn: () => getPowerBIRefresh(template, userRequestId),
		}),
	invalidate: (template: PowerBITemplate, userRequestId: string) =>
		queryClient.invalidateQueries(PowerBIRefreshQuery.key(template, userRequestId)),
};

export const ReportConfigQuery = {
	key: (runId: string, template: PowerBITemplate) => ['report-config', { runId, template }],
	useQuery: <T = PowerBIEmbedConfig>(
		runId: string,
		template: PowerBITemplate,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		options?: UseQueryOptions<PowerBIEmbedConfig, any, T, any>
	) =>
		useQuery({
			...options,
			queryKey: ReportConfigQuery.key(runId, template),
			queryFn: () => getReportConfig(runId, template),
		}),
	invalidate: (runId: string, template: PowerBITemplate) =>
		queryClient.invalidateQueries(ReportConfigQuery.key(runId, template)),
};
