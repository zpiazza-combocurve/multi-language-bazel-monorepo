import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

import { getObjectID } from '@/inpt-shared/economics/client';
import {
	UserDefaultCSVExportTemplate,
	UserDefaultCSVExportTemplateDB,
} from '@/inpt-shared/economics/reports/types/client';
import type * as shared from '@/inpt-shared/economics/reports/types/shared';

import { econReportExportDefaultUserConfigurationFactory } from './build';

export const templatesKey = 'default-templates';

export const ClientFactory = Factory.define<
	UserDefaultCSVExportTemplate,
	unknown,
	Promise<UserDefaultCSVExportTemplateDB>
>((props) => {
	const { onCreate, associations: { project, user, econReportExportConfiguration, suggestedConfiguration } = {} } =
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
