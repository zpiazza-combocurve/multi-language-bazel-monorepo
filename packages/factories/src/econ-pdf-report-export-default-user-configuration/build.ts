import { UserDefaultPDFExportTemplate } from '@/inpt-shared/economics/pdf-reports/types/shared';
import { getObjectID } from '@/inpt-shared/economics/shared';

export function econPDFReportExportDefaultUserConfigurationFactory({
	associations: { project, user, econPDFReportExportConfiguration, suggestedConfiguration },
}: {
	associations: Partial<UserDefaultPDFExportTemplate>;
}): UserDefaultPDFExportTemplate {
	return {
		project: getObjectID(project),
		user: getObjectID(user),
		type: 'cashflow-pdf',
		suggestedConfiguration,
		econPDFReportExportConfiguration:
			!econPDFReportExportConfiguration && suggestedConfiguration
				? null
				: getObjectID(econPDFReportExportConfiguration),
	};
}
