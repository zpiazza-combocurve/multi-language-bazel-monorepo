import { Factory } from 'fishery';

import { getObjectID } from '@/inpt-shared/economics/internal';
import { CSVExportTemplate, CSVExportTemplateDB } from '@/inpt-shared/economics/reports/types/internal';
import type * as shared from '@/inpt-shared/economics/reports/types/shared';

import { initializeProjectFactory, initializeUserFactory } from '..';
import { econReportExportConfigurationFactory } from './build';

export function initializeEconReportExportConfigurationFactory(context: Context) {
	const { EconReportExportConfigurationModel } = context.models;
	const ProjectFactory = initializeProjectFactory(context);
	const UserFactory = initializeUserFactory(context);

	return Factory.define<CSVExportTemplate, never, Promise<CSVExportTemplateDB>>((props) => {
		const { onCreate, associations: { project, createdBy } = {} } = props;

		onCreate(async (template) => {
			return EconReportExportConfigurationModel.create({
				...template,
				project: project ?? (await ProjectFactory.create())._id,
				createdBy: createdBy ?? (await UserFactory.create())._id,
			});
		});

		return {
			...econReportExportConfigurationFactory(
				props as { associations: Partial<shared.UserDefaultCSVExportTemplate> }
			),
			createdBy: getObjectID(createdBy),
			project: getObjectID(project),
		};
	});
}
