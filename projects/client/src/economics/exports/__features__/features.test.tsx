import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StepDefinitions, autoBindSteps, loadFeature } from 'jest-cucumber';

import csvHandlers from '@/economics/exports/CSVExportDialog/api.mock';
import exportHandlers from '@/economics/exports/ExportButton/api.msw';
import pdfHandlers from '@/economics/exports/PDFExportDialog/shared/__tests__/mocks';
import * as routing from '@/helpers/routing';
import { getSpies } from '@/helpers/testing/getSpies';
import { mockFlags, setupLaunchdarkly } from '@/helpers/testing/launchdarkly';
import { mswServer, setupMSW } from '@/helpers/testing/msw';

import * as api from '../ExportButton/api';
import * as expectedExportParamsMap from './constants';
import { renderApp } from './helpers';

const fns = getSpies(api);

vi.spyOn(routing, 'downloadFromUrl').mockImplementation(() => null);
vi.spyOn(routing, 'downloadFileApi').mockImplementation(() => Promise.resolve());
vi.spyOn(routing, 'downloadExport').mockImplementation(() => Promise.resolve());

const stepDefinitions: StepDefinitions = ({ when, then, given }) => {
	setupMSW();
	setupLaunchdarkly();
	beforeEach(() => mswServer.use(...pdfHandlers, ...csvHandlers, ...exportHandlers));

	// background:
	given(/^Launchdarkly Feature Flag "(.*)" is set to "(.*)"$/, (key, value) => {
		if (['false', 'true'].includes(value)) {
			mockFlags({ [key]: value === 'true' });
			return;
		}
		mockFlags({ [key]: value });
	});
	let results: ReturnType<typeof renderApp> | null = null;
	given('Economics page is open', () => {
		results = renderApp({ hasReservesGroups: true });
	});

	when(/(.*) button is clicked/, async (buttonText) => {
		await act(async () => userEvent.click(await screen.findByText(buttonText)));
	});
	when(/(.*) option is clicked/, async (option) => {
		await act(async () => userEvent.click(await screen.findByText(option)));
	});
	then(/^A file matching cc suggested template for (.*) should be exported/, async (suggestedTemplateName) => {
		/**
		 * Implementation details are being tested here, the purpose is to check if the exports parameters change by
		 * accident, if its on purpose adjust file://./constants.ts
		 */
		const [spiedFn, expectedExportParams] = (() => {
			for (const fnKey in fns) {
				const fn = fns[fnKey];
				const expectExportParams = (() => {
					const expectExportParams = expectedExportParamsMap[fnKey]?.[suggestedTemplateName];
					if (expectExportParams) {
						if (['loadMultipleExport', 'buildByWellEconReport', 'buildEconReport'].includes(fnKey))
							return { ...expectExportParams, econRun: results?.runId };
						if (fnKey === 'buildGhgReport') return { ...expectExportParams, ghgRun: results?.ghgRunId };
						return expectExportParams;
					}
				})();
				if (expectExportParams) return [fn, expectExportParams];
			}
			throw Error(`Missing excpected export params; suggestedTemplateName: ${suggestedTemplateName}`);
		})();
		if (spiedFn)
			expect(spiedFn).toHaveBeenCalledWith(
				expect.objectContaining({
					...expectedExportParams,
					fileName: expect.stringContaining(expectedExportParams.fileName),
				})
			);
	});
};

const feature = loadFeature('./export.feature', { loadRelativePath: true });
autoBindSteps([feature], [stepDefinitions]);
