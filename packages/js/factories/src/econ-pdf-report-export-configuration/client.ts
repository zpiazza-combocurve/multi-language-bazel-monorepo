import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

import { getObjectID } from '@/inpt-shared/economics/client';
import { PDFExportTemplate, PDFExportTemplateDB } from '@/inpt-shared/economics/pdf-reports/types/client';
import type * as shared from '@/inpt-shared/economics/pdf-reports/types/shared';

import { econPDFReportExportConfigurationFactory } from './build';

export const suggestedTemplatesKey = 'suggested';
export const templatesKey = 'templates';

export const ClientFactory = Factory.define<PDFExportTemplate, never, Promise<PDFExportTemplateDB>>((props) => {
	const { onCreate, associations: { project, createdBy } = {} } = props;

	onCreate((t) => {
		const newTemplate = {
			...t,
			_id: faker.database.mongodbObjectId(),
			createdAt: new Date().toString() as unknown as Date,
			updatedAt: new Date().toString() as unknown as Date,
		};
		const templates = JSON.parse(window.localStorage.getItem(templatesKey) as unknown as string) ?? [];
		templates.push(newTemplate);
		window.localStorage.setItem(templatesKey, JSON.stringify(templates));
		return Promise.resolve(newTemplate);
	});
	return {
		...econPDFReportExportConfigurationFactory(
			props as { associations: Partial<shared.UserDefaultPDFExportTemplate> }
		),
		project: getObjectID(project),
		createdBy: getObjectID(createdBy),
	};
});
