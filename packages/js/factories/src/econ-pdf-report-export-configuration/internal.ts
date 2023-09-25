import { Factory } from 'fishery';

import { getObjectID } from '@/inpt-shared/economics/internal';
import { PDFExportTemplate, PDFExportTemplateDB } from '@/inpt-shared/economics/pdf-reports/types/internal';
import type * as shared from '@/inpt-shared/economics/pdf-reports/types/shared';

import { initializeProjectFactory, initializeUserFactory } from '..';
import { econPDFReportExportConfigurationFactory } from './build';

export function initializeEconPDFReportExportConfigurationFactory(context: Context) {
	const { EconPDFReportExportConfigurationModel } = context.models;
	const ProjectFactory = initializeProjectFactory(context);
	const UserFactory = initializeUserFactory(context);

	return Factory.define<PDFExportTemplate, never, Promise<PDFExportTemplateDB>>((props) => {
		const { onCreate, associations: { project, createdBy } = {} } = props;
		onCreate(async (template) => {
			return EconPDFReportExportConfigurationModel.create({
				...template,
				project: project ?? (await ProjectFactory.create())._id,
				createdBy: createdBy ?? (await UserFactory.create())._id,
			});
		});

		return {
			...econPDFReportExportConfigurationFactory(
				props as { associations: Partial<shared.UserDefaultPDFExportTemplateDB> }
			),
			createdBy: getObjectID(createdBy),
			project: getObjectID(project),
		};
	});
}
