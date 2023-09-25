import { UserDefaultCSVExportTemplate } from '@/inpt-shared/economics/reports/types/shared';
import { getObjectID } from '@/inpt-shared/economics/shared';

export function econReportExportDefaultUserConfigurationFactory({
	associations: { project, user, econReportExportConfiguration, suggestedConfiguration },
}: {
	associations: Partial<UserDefaultCSVExportTemplate>;
}): UserDefaultCSVExportTemplate {
	return {
		project: getObjectID(project),
		user: getObjectID(user),
		type: 'oneLiner',
		suggestedConfiguration,
		econReportExportConfiguration:
			!econReportExportConfiguration && suggestedConfiguration
				? null
				: getObjectID(econReportExportConfiguration),
	};
}
