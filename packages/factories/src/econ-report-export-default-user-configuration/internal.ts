import { Factory } from 'fishery';

import { getObjectID } from '@/inpt-shared/economics/internal';
import {
	UserDefaultCSVExportTemplate,
	UserDefaultCSVExportTemplateDB,
} from '@/inpt-shared/economics/reports/types/internal';
import type * as shared from '@/inpt-shared/economics/reports/types/shared';

import { initializeEconReportExportConfigurationFactory } from '../econ-report-export-configuration';
import { initializeProjectFactory } from '../project';
import { initializeUserFactory } from '../user';
import { econReportExportDefaultUserConfigurationFactory } from './build';

export function initializeEconReportExportDefaultUserConfigurationFactory(context: Context) {
	const { EconReportExportDefaultUserConfigurationModel } = context.models;
	const ProjectFactory = initializeProjectFactory(context);
	const UserFactory = initializeUserFactory(context);
	const CSVExportTemplateFactory = initializeEconReportExportConfigurationFactory(context);

	return Factory.define<UserDefaultCSVExportTemplate, never, Promise<UserDefaultCSVExportTemplateDB>>((props) => {
		const {
			onCreate,
			associations: { project, user, econReportExportConfiguration, suggestedConfiguration } = {},
		} = props;
		onCreate(async (template) => {
			return EconReportExportDefaultUserConfigurationModel.create({
				...template,
				project: project ?? (await ProjectFactory.create())._id,
				user: user ?? (await UserFactory.create())._id,
				suggestedConfiguration,
				econReportExportConfiguration:
					econReportExportConfiguration ??
					(template.suggestedConfiguration ? null : (await CSVExportTemplateFactory.create())._id),
			});
		});

		return {
			...econReportExportDefaultUserConfigurationFactory(
				props as { associations: Partial<shared.UserDefaultCSVExportTemplate> }
			),
			project: getObjectID(project),
			user: getObjectID(user),
			econReportExportConfiguration:
				!econReportExportConfiguration && suggestedConfiguration
					? null
					: getObjectID(econReportExportConfiguration),
		};
	});
}
