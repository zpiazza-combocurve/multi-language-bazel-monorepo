import { Factory } from 'fishery';

import { getObjectID } from '@/inpt-shared/economics/internal';
import {
	UserDefaultPDFExportTemplate,
	UserDefaultPDFExportTemplateDB,
} from '@/inpt-shared/economics/pdf-reports/types/internal';
import type * as shared from '@/inpt-shared/economics/pdf-reports/types/shared';

import { initializeEconPDFReportExportConfigurationFactory } from '../econ-pdf-report-export-configuration';
import { initializeProjectFactory } from '../project';
import { initializeUserFactory } from '../user';
import { econPDFReportExportDefaultUserConfigurationFactory } from './build';

export function initializeEconPDFReportExportDefaultUserConfigurationFactory(context: Context) {
	const { EconPDFReportExportDefaultUserConfigurationModel } = context.models;
	const ProjectFactory = initializeProjectFactory(context);
	const UserFactory = initializeUserFactory(context);
	const PDFExportTemplateFactory = initializeEconPDFReportExportConfigurationFactory(context);

	return Factory.define<UserDefaultPDFExportTemplate, never, Promise<UserDefaultPDFExportTemplateDB>>((props) => {
		const {
			onCreate,
			associations: { project, user, econPDFReportExportConfiguration, suggestedConfiguration } = {},
		} = props;
		onCreate(async (template) => {
			return EconPDFReportExportDefaultUserConfigurationModel.create({
				...template,
				project: project ?? (await ProjectFactory.create())._id,
				user: user ?? (await UserFactory.create())._id,
				suggestedConfiguration,
				econPDFReportExportConfiguration:
					econPDFReportExportConfiguration ??
					(template.suggestedConfiguration ? null : (await PDFExportTemplateFactory.create())._id),
			});
		});

		return {
			...econPDFReportExportDefaultUserConfigurationFactory(
				props as { associations: Partial<shared.UserDefaultPDFExportTemplate> }
			),
			project: getObjectID(project),
			user: getObjectID(user),
			econPDFReportExportConfiguration:
				!econPDFReportExportConfiguration && suggestedConfiguration
					? null
					: getObjectID(econPDFReportExportConfiguration),
		};
	});
}
