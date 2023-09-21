import { faker } from '@faker-js/faker';
import { omit, pick } from 'lodash';

import { ClientFactory as CSVExportTemplateFactory } from '@/factories/econ-report-export-configuration/client';
import { ClientFactory as DefaultUserCSVExportTemplateFactory } from '@/factories/econ-report-export-default-user-configuration/client';
import { local } from '@/helpers/storage';
import { mswServer, setupMSW } from '@/helpers/testing/msw';
import { ALL_CSV_EXPORT_KEYS } from '@/inpt-shared/economics/reports/shared';

import * as api from './api';
import handlers from './api.mock';
import { SUGGESTED_TEMPLATES } from './suggested-templates';
import { CSVExportTemplate, ScenarioTableColumn, SuggestedTemplates } from './types';

afterEach(() => local.clear());

/** Duplicate of file://./../../../../../internal-api/src/economics/reports/service.test.ts */

setupMSW();
beforeEach(() => mswServer.resetHandlers(...handlers));
function templateMatching(template: Partial<CSVExportTemplate>) {
	return expect.objectContaining({
		...omit(pick(template, ALL_CSV_EXPORT_KEYS), 'updatedAt'),
		columns: expect.arrayContaining(template?.columns ?? []),
	});
}
describe('CSV Export', () => {
	describe('api', () => {
		describe('templates', () => {
			describe('fetch templates', () => {
				it('fetched template match created template', async () => {
					const template = await CSVExportTemplateFactory.create();

					const results = await api.getTemplates();

					expect(results).toContainEqual(templateMatching(template));

					expect(results).toHaveLength(1);
				});

				it('should fetch all templates', async () => {
					await CSVExportTemplateFactory.create(); // 1
					await CSVExportTemplateFactory.create(); // 2
					await CSVExportTemplateFactory.create(); // 3

					const results = await api.getTemplates();

					expect(results).toHaveLength(3); // 3
				});

				it('should fetch templates for a specific project', async () => {
					const { project } = await CSVExportTemplateFactory.create(); // 1
					await CSVExportTemplateFactory.create({}, { associations: { project } }); // 2
					await CSVExportTemplateFactory.create();

					const templates = await api.getTemplates({ project });

					expect(templates).toHaveLength(2); // 2
				});

				it('should fetch templates for a specific report type', async () => {
					await CSVExportTemplateFactory.create({ type: 'oneLiner' }); // 1
					await CSVExportTemplateFactory.create({ type: 'oneLiner' }); // 2
					await CSVExportTemplateFactory.create({ type: 'cashflow-csv' });

					const templates = await api.getTemplates({ type: 'oneLiner' });

					expect(templates).toHaveLength(2); // 2
				});

				it('should fetch templates for a specific project and report type', async () => {
					const { project } = await CSVExportTemplateFactory.create({ type: 'oneLiner' }); // 1
					await CSVExportTemplateFactory.create({ type: 'oneLiner' }, { associations: { project } }); // 2
					await CSVExportTemplateFactory.create({ type: 'oneLiner' }, { associations: { project } }); // 3
					await CSVExportTemplateFactory.create({ type: 'oneLiner' });
					await CSVExportTemplateFactory.create({ type: 'oneLiner' });
					await CSVExportTemplateFactory.create({ type: 'cashflow-csv' });
					await CSVExportTemplateFactory.create({ type: 'cashflow-agg-csv' }, { associations: { project } });

					const templates = await api.getTemplates({ project, type: 'oneLiner' });

					expect(templates).toHaveLength(3); // 3
				});

				// test disabled cause it outputs errors to the console, expected but anoying
				// eslint-disable-next-line jest/no-disabled-tests
				it.skip('should throw error nothing if query is invalid', async () => {
					await expect(() =>
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						api.getTemplates({ project: 'asdf' as any, type: 'oneLiner' })
					).rejects.toThrow();
				});
			});

			describe('create templates', () => {
				it('configuration created should match', async () => {
					const templateToCreate = CSVExportTemplateFactory.build({
						project: faker.database.mongodbObjectId(),
						createdBy: faker.database.mongodbObjectId(),
					});

					const createdConfiguration = await api.createTemplate(templateToCreate);

					// getting some werid issues with circular objects
					expect(JSON.parse(JSON.stringify(createdConfiguration))).toEqual(
						templateMatching(templateToCreate)
					);
				});

				it('should create multiple configurations', async () => {
					await api.createTemplate(CSVExportTemplateFactory.build());
					await api.createTemplate(CSVExportTemplateFactory.build());

					const templates = await api.getTemplates();

					expect(templates).toHaveLength(2);
				});
			});

			describe('delete templates', () => {
				it('should delete template', async () => {
					const template = await CSVExportTemplateFactory.create();
					await CSVExportTemplateFactory.create();

					expect(await api.getTemplates()).toHaveLength(2);

					await api.deleteTemplate(template);

					const templates = await api.getTemplates();

					expect(templates).toHaveLength(1);
					expect(templates).not.toContainEqual(templateMatching(template));
				});
			});

			describe('update templates', () => {
				it('should update template', async () => {
					const template = await CSVExportTemplateFactory.create();

					template.name = 'updated name';

					await api.updateTemplate(template);

					const updatedTemplate = await api.getTemplate(template._id);

					expect(updatedTemplate).toEqual(templateMatching(template));
				});
			});
		});
		describe('default templates', () => {
			it('fetches default template', async () => {
				const template = await CSVExportTemplateFactory.create();
				await CSVExportTemplateFactory.create(
					{ type: template.type },
					{ associations: { project: template.project } }
				);

				const defaultUserConfig = await DefaultUserCSVExportTemplateFactory.create(
					{},
					{ associations: { econReportExportConfiguration: template._id } }
				);

				const result = await api.getDefaultTemplate({
					user: defaultUserConfig.user,
					project: defaultUserConfig.project,
					type: defaultUserConfig.type,
				});

				expect(result).toEqual(templateMatching(template));
			});

			describe('update default', () => {
				it('sets default template', async () => {
					const template = await CSVExportTemplateFactory.create();

					await api.setDefaultTemplate({
						user: template.createdBy,
						_id: template._id,
						project: template.project,
						type: template.type,
					});

					const result = await api.getDefaultTemplate({
						user: template.createdBy,
						project: template.project,
						type: template.type,
					});

					expect(result).toEqual(templateMatching(template));
				});

				it('removes default template', async () => {
					const initialDefaultTemplate = await CSVExportTemplateFactory.create({ type: 'oneLiner' });
					const { project, createdBy, type } = initialDefaultTemplate;
					await DefaultUserCSVExportTemplateFactory.create(
						{ type },
						{
							associations: {
								econReportExportConfiguration: initialDefaultTemplate._id,
								project,
								user: createdBy,
							},
						}
					);

					const fetchedInitialDefaultTemplate = await api.getDefaultTemplate({
						user: createdBy,
						project,
						type,
					});

					expect(fetchedInitialDefaultTemplate).toEqual(templateMatching(initialDefaultTemplate));

					await api.setDefaultTemplate({
						user: createdBy,
						_id: null,
						project,
						type,
					});

					const fetchedDefaultTemplate = await api.getDefaultTemplate({
						user: createdBy,
						project,
						type,
					});

					expect(fetchedDefaultTemplate).not.toEqual(templateMatching(initialDefaultTemplate));
				});

				it('updates default template', async () => {
					const initialDefaultTemplate = await CSVExportTemplateFactory.create({ type: 'oneLiner' });

					const { project, type, createdBy } = initialDefaultTemplate;

					await DefaultUserCSVExportTemplateFactory.create(
						{ type },
						{
							associations: {
								econReportExportConfiguration: initialDefaultTemplate._id,
								project,
								user: createdBy,
							},
						}
					);

					const fetchedInitialDefaultTemplate = await api.getDefaultTemplate({
						user: createdBy,
						project,
						type,
					});

					expect(fetchedInitialDefaultTemplate).toEqual(templateMatching(initialDefaultTemplate));

					const otherTemplate = await CSVExportTemplateFactory.create(
						{ type },
						{
							associations: {
								createdBy,
								project,
							},
						}
					);
					await api.setDefaultTemplate({
						user: createdBy,
						_id: otherTemplate._id,
						project,
						type,
					});

					const fetchedDefaultTemplate = await api.getDefaultTemplate({
						user: createdBy,
						project,
						type,
					});

					expect(fetchedDefaultTemplate).toEqual(templateMatching(otherTemplate));
				});
			});
		});

		describe('suggested templates', () => {
			it('should fetch suggested templates', async () => {
				const runId = 'runId';
				const wellHeaders: ScenarioTableColumn[] = [{ key: 'well_name', direction: 'ASC' }];
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const suggestedTemplates = await api.getSuggestedTemplates(runId as any, wellHeaders);

				expect(suggestedTemplates).toEqual(expect.objectContaining<SuggestedTemplates>(SUGGESTED_TEMPLATES));
			});
		});
	});
});
