import { faker } from '@faker-js/faker';
import { act, configure, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StepDefinitions, autoBindSteps, loadFeature } from 'jest-cucumber';

import { pdfSchema } from '@/inpt-shared/economics/pdf-reports/shared';

import { AGG_CASHFLOW_PDF_EXPORT_TYPE, WELL_CASHFLOW_PDF_EXPORT_TYPE } from '../../../Economics/shared/constants';
import {
	changeReportType,
	changeTemplateName,
	getDialogContainer,
	getHybridOptions,
	getTemplateNameInput,
	renderDialog,
	setCashflowType,
} from '../shared/__tests__/helpers';
import { setupMocks } from '../shared/__tests__/mocks';
import * as api from '../shared/api';
import { PDFExportDialogProps, PDFExportTemplateBase } from '../shared/types';

configure({ testIdAttribute: 'id' });

type ResolveParameters = Parameters<PDFExportDialogProps['resolve']>[0];

const project = faker.database.mongodbObjectId();
const scenario = faker.database.mongodbObjectId();

const stepDefinitions: StepDefinitions = ({ when, then, given }) => {
	const cb = vi.fn();
	setupMocks();

	given('pdf dialog is open', async () => {
		await renderDialog({ cb, project, scenario });
	});

	when(/^cashflow report is set to (.*)$/, (type) => setCashflowType(type));

	then(/^hybrid options are (.*)$/, (status) => {
		const { input, calendarButton } = getHybridOptions();
		if (status === 'enabled') {
			expect(input).toBeEnabled();
			expect(calendarButton).toBeEnabled();
			return;
		}
		expect(input).toBeDisabled();
		expect(calendarButton).toBeDisabled();
	});

	when('cancel button is clicked', async () => {
		await act(() => userEvent.click(screen.getByText('Cancel')));
	});

	when('export button is clicked', async () => {
		await act(() => userEvent.click(screen.getByText('Export')));
	});

	then('PDF Editor is closed', async () => {
		expect(getDialogContainer).toThrow();
		expect(cb).toHaveBeenCalled();
	});

	when(/^template name is set to "(.*)"$/, async (templateName) => {
		await changeTemplateName(templateName);
	});

	when('save button is clicked', async () => {
		await act(() => userEvent.click(screen.getByText('Save')));
	});

	then(/^there should be a template named "(.*)"$/, async (templateName) => {
		await screen.findByText(templateName);
	});

	then(/^there should not be a template named "(.*)"$/, async (templateName) => {
		expect(() => screen.getByText(templateName)).toThrow();
	});

	given('there are templates with configuration:', async (templates) => {
		const templatesToCreate = templates.map(({ name, 'cashflow type': cashflowType, type }) =>
			pdfSchema.validateSync({
				name,
				type,
				project,
				cashflowOptions: { type: cashflowType },
			})
		);

		for (const templateToCreate of templatesToCreate) {
			await api.createTemplate(templateToCreate);
		}
	});

	then(/^template name input should contain "(.*)"$/, (templateName) => {
		expect(getTemplateNameInput()).toHaveValue(templateName);
	});

	when(/report type is changed to (.*)/, async (reportType) => {
		if (reportType === 'cashflow') await changeReportType('Well Cash Flow');
		else await changeReportType('Aggregate Cash Flow');
	});

	then(/A pdf matching default (.*) should be exported/, (reportType) => {
		const expectedTemplate: Omit<PDFExportTemplateBase, 'type'> = {
			name: expect.any(String),
			cashflowOptions: {
				hybridOptions: { months: 1, yearType: 'fiscal' },
				type: 'monthly',
			} as const,
			discCashflowOptions: 'bfit',
			discCashflow: expect.any(Array),
			headerData: expect.any(Array),
			onelineMetrics: expect.any(Array),
			reportDetails: expect.any(Array),
			timeSeriesMetrics: expect.any(Array),
		};
		const expectedCashflow: ResolveParameters = expect.objectContaining<PDFExportTemplateBase>({
			type: WELL_CASHFLOW_PDF_EXPORT_TYPE,
			...expectedTemplate,
		});
		const expectedAggCashflow: ResolveParameters = expect.objectContaining<PDFExportTemplateBase>({
			type: AGG_CASHFLOW_PDF_EXPORT_TYPE,
			...expectedTemplate,
		});
		if (reportType === 'cashflow') expect(cb).toHaveBeenLastCalledWith(expectedCashflow);
		else expect(cb).toHaveBeenLastCalledWith(expectedAggCashflow);
	});
};

const feature = loadFeature('./PDFExportDialog.feature', { loadRelativePath: true });
autoBindSteps([feature], [stepDefinitions]);
