import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

import { getObjectID } from '@/inpt-shared/economics/client';
import {
	UserDefaultPDFExportTemplate,
	UserDefaultPDFExportTemplateDB,
} from '@/inpt-shared/economics/pdf-reports/types/client';
import type * as shared from '@/inpt-shared/economics/pdf-reports/types/shared';

import { econPDFReportExportDefaultUserConfigurationFactory } from './build';

export const templatesKey = 'pdf-default-templates';

export const ClientFactory = Factory.define<
	UserDefaultPDFExportTemplate,
	unknown,
	Promise<UserDefaultPDFExportTemplateDB>
>((props) => {
	const { onCreate, associations: { project, user, econPDFReportExportConfiguration, suggestedConfiguration } = {} } =
		props;

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
		...econPDFReportExportDefaultUserConfigurationFactory(
			props as { associations: Partial<shared.UserDefaultPDFExportTemplateDB> }
		),
		project: getObjectID(project),
		user: getObjectID(user),
		econPDFReportExportConfiguration:
			!econPDFReportExportConfiguration && suggestedConfiguration
				? null
				: getObjectID(econPDFReportExportConfiguration),
	};
});
