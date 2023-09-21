import { faker } from '@faker-js/faker';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';

import usePDFExportDialog from '@/economics/exports/PDFExportDialog';
import { TestWrapper } from '@/helpers/testing';
import { useCurrentProject } from '@/projects/api';
import { projectRoutes } from '@/projects/routes';

import { ids } from '../constants';

export function getReportTypeSelectInput() {
	return screen.queryByLabelText('Report Type');
}

export async function changeReportType(reportType: 'Well Cash Flow' | 'Aggregate Cash Flow') {
	expect(screen.queryByText(reportType)).not.toBeInTheDocument();
	if (!getReportTypeSelectInput()) return null;
	await openReportTypeSelect();

	await act(async () => {
		await userEvent.click(await screen.findByText(reportType));
	});

	await waitFor(() => expect(getCurrentReportType()).toEqual(reportType));
}

export function getCurrentReportType() {
	return getReportTypeSelectInput()?.textContent;
}

export async function openReportTypeSelect() {
	const select = getReportTypeSelectInput();

	if (select == null) return null;
	await userEvent.click(select);
	return select;
}

const reportTypes = ['Well Cash Flow', 'Aggregate Cash Flow'] as const;

const fakeProjectId = faker.database.mongodbObjectId();
const fakeScenarioId = faker.database.mongodbObjectId();

function DialogRenderer({ cb, ...props }: Parameters<typeof usePDFExportDialog>[0] & { cb? } = {}) {
	const [dialog, showDialog] = usePDFExportDialog({ ...props });
	const { isFetched } = useCurrentProject();
	useEffect(() => {
		if (!isFetched) return;
		(async function () {
			const result = await showDialog();
			cb?.(result);
		})();
	}, [showDialog, cb, isFetched]);
	return dialog;
}

export function App(props: Parameters<typeof DialogRenderer>[0] & { project?; scenario? }) {
	const { project, scenario } = props;
	return (
		<TestWrapper
			initialEntries={[projectRoutes.project(project ?? fakeProjectId).scenario(scenario ?? fakeScenarioId).view]}
			path={projectRoutes.project(':projectId').scenario(':scenarioId').view}
		>
			<DialogRenderer {...props} />
		</TestWrapper>
	);
}

export async function renderDialog(
	props: Parameters<typeof usePDFExportDialog>[0] & { cb?; project?; scenario? } = {}
) {
	const renderResult = render(<App {...props} />);
	await waitFor(getDialogContainer);
	return renderResult;
}

export function getDialogContainer() {
	return screen.getByTestId(ids.dialog);
}

export function queryDialogContainer() {
	return screen.queryByTestId(ids.dialog);
}

export function getTemplateNameInput() {
	return screen.getByLabelText('Name');
}

export async function changeTemplateName(newName: string) {
	await act(async () => {
		await fireEvent.change(getTemplateNameInput(), { target: { value: newName } });
	});
}

export const getHybridOptions = () => ({
	input: screen.getByLabelText('# of Months'),
	calendarButton: screen.getByDisplayValue('calendar'),
});

export async function setCashflowType(cashflowType) {
	const cashflowButton = screen.getByDisplayValue(cashflowType);

	await act(async () => {
		await userEvent.click(cashflowButton);
	});

	expect(cashflowButton).toBeChecked();
}

export function selectAggCashflow() {
	return changeReportType(reportTypes[1]);
}
