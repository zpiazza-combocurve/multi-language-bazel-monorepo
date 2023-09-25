import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

import { getObjectID } from '@/inpt-shared/economics/client';
import { CSVExportTemplate, CSVExportTemplateDB } from '@/inpt-shared/economics/reports/types/client';
import type * as shared from '@/inpt-shared/economics/reports/types/shared';

import { econReportExportConfigurationFactory } from './build';

export const suggestedTemplatesKey = 'suggested';
export const templatesKey = 'templates';

export const ClientFactory = Factory.define<CSVExportTemplate, never, Promise<CSVExportTemplateDB>>((props) => {
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
		...econReportExportConfigurationFactory(
			props as { associations: Partial<shared.UserDefaultCSVExportTemplate> }
		),
		createdBy: getObjectID(createdBy),
		project: getObjectID(project),
	};
});
