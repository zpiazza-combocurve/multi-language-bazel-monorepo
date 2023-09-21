import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { AgGridSSRMRef } from '@/components/AgGrid.ssrm';
import * as useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { DEFAULT_TESTING_RESPONSE_HEADERS, TestWrapper, featureFlags, getAxiosMockAdapter } from '@/helpers/testing';
import { generateDefaultName } from '@/qualifiers';
import { CacheProvider } from '@/scheduling/ScheduleCacheContext';
import { WELL_HEADER_COLUMNS_WITH_ORDER } from '@/scheduling/shared/columns';

import { MemoizedWellTableGrid } from '.';
import { assertColumnValue, getColumn, getPinnedRows, getRowByIndex } from '../components/AgGrid/testUtils';
import mockSchedule from '../fixtures/scheduleFixture';
import mockUmbrellas from '../fixtures/umbrellasFixture';
import wellAssignmentsFixture from '../fixtures/wellAssignmentsFixture';
import { SelectionProvider } from './hooks/useWellTableSelection';

vi.mock('../../hooks/useSchedule', async () => ({
	useSchedule: () => mockSchedule,
}));

vi.mock('@/scenarios/Scenario/ScenarioPage/exports', async () => ({
	withCurrentProject: vi.fn(),
}));
vi.mock('@/cost-model/detail-components/fluid_models/FluidModelTable', () => ({})); // temporally mocking the fluid model table to avoid ag grid v30 react 18 incompatibility (importing react-dom/server)

const mockCreateQualifier = vi.fn();
const mockUpdateQualifier = vi.fn((id) => Promise.resolve(id));
vi.mock('../hooks/useScheduleQualifiers', async () => ({
	useScheduleQualifiers: () => ({
		qualifiers: mockUmbrellas,
		activeQualifiers: mockSchedule.schedule.qualifiers,
		createQualifier: mockCreateQualifier,
		updateQualifier: mockUpdateQualifier,
	}),
}));

const mockUpdateAssignment = vi.fn().mockResolvedValue({});
const mockUpdateManyAssignment = vi.fn().mockResolvedValue({});
const mockGetWellAssignments = vi.fn().mockResolvedValue(wellAssignmentsFixture);
vi.mock('./api/AssignmentsApi', async () => ({
	AssignmentsApi: vi.fn().mockImplementation(() => {
		return {
			get: mockGetWellAssignments,
			getIds: () => mockSchedule.schedule.wells,
			update: mockUpdateAssignment,
			updateMany: mockUpdateManyAssignment,
		};
	}),
}));

vi.mock('@/projects/routes', async () => ({
	projectRoutes: {},
	useCurrentProjectId: () => mockSchedule.schedule.project._id,
	useCurrentProjectRoutes: () => mockSchedule.schedule.project._id,
}));

vi.mock('@/projects/api', async () => ({
	useCurrentProject: () => mockSchedule.schedule.project,
}));

const mock = getAxiosMockAdapter();
mock.onGet(/\/lookup-tables/).reply(200, [], DEFAULT_TESTING_RESPONSE_HEADERS);
mock.onGet(/\/forecast-lookup-tables/).reply(200, [], DEFAULT_TESTING_RESPONSE_HEADERS);
mock.onGet(/\/qualifier\/create/).reply(200, [], { _id: 'new-id' });

const awaitDataToBeLoaded = async () => {
	await screen.findByText(/tree frog/i, undefined, { timeout: 10000 });
};

const makeSut = async () => {
	const {
		schedule: {
			_id: scheduleId,
			project: { _id: projectId },
		},
	} = mockSchedule;

	const wellIds = mockSchedule.schedule.wells;
	const agGridRef = React.createRef<AgGridSSRMRef>();

	const renderedTable = render(
		<TestWrapper>
			<CacheProvider>
				<SelectionProvider ids={wellIds}>
					<MemoizedWellTableGrid
						agGridRef={agGridRef}
						updateAssignments={() => ({})}
						reloadSchedule={() => ({})}
						projectId={projectId as Inpt.ObjectId}
						scheduleId={scheduleId as Inpt.ObjectId}
						columns={WELL_HEADER_COLUMNS_WITH_ORDER}
						canUpdateSchedule
						filters={{}}
						setHeaderFilters={() => ({})}
						wellIds={wellIds}
						assumptions={['ownership_reversion', 'forecast', 'capex']}
						currentSort={{ field: 'priority', direction: 'asc' }}
						setCurrentSort={() => ({})}
						sideBar={{
							toolPanels: [
								{
									id: 'columns',
									labelDefault: 'Columns',
									labelKey: 'columns',
									iconKey: 'columns',
									toolPanel: 'agColumnsToolPanel',
									toolPanelParams: {
										suppressValues: true,
										suppressPivots: true,
										suppressPivotMode: true,
									},
								},
							],
						}}
					/>
				</SelectionProvider>
			</CacheProvider>
		</TestWrapper>
	);

	await awaitDataToBeLoaded();

	return renderedTable;
};

const timeoutLimit = 10000;

describe('WellTable', () => {
	it(
		'should be able to edit priority and status',
		async () => {
			const user = userEvent.setup();

			const { container } = await makeSut();

			const rowsLeft = getPinnedRows(container, 'left');
			const rowsRight = getPinnedRows(container, 'right');
			const firstRowLeft = getRowByIndex(rowsLeft, 0);
			const firstRowRight = getRowByIndex(rowsRight, 0);

			assertColumnValue(firstRowLeft, 'priority', '1');
			assertColumnValue(firstRowRight, 'scheduling_status', 'Not Started');
			await act(async () => {
				await user.dblClick(getColumn(firstRowLeft, 'priority'));
			});
			const priorityInput = getColumn(firstRowLeft, 'priority').querySelector('input') as HTMLInputElement;

			await act(async () => {
				await user.type(priorityInput, '2');
				await user.keyboard('{enter}');
			});
			assertColumnValue(firstRowLeft, 'priority', '12');
			expect(mockUpdateAssignment).toHaveBeenCalledWith({
				wellIds: ['5e272d3bb78910dd2a1be8c0'],
				column: 'priority',
				value: '12',
			});

			await act(async () => {
				await user.type(priorityInput, 'invalid value');
				await user.keyboard('{enter}');
			});
			assertColumnValue(firstRowLeft, 'priority', '12');

			await act(async () => {
				await user.dblClick(getColumn(firstRowRight, 'scheduling_status'));
				await user.click(
					screen.getByRole('option', {
						name: /permitted/i,
					})
				);
			});
			assertColumnValue(firstRowRight, 'scheduling_status', 'Permitted');
			expect(mockUpdateAssignment).toHaveBeenCalledWith({
				wellIds: ['5e272d3bb78910dd2a1be8c0'],
				column: 'status',
				value: 'permitted',
			});
		},
		timeoutLimit
	);

	it(
		'should be able to change the status for the entire column',
		async () => {
			const user = userEvent.setup();

			await makeSut();

			const columnHeader = screen.getByText(/scheduling status/i).parentElement?.parentElement as HTMLDivElement;

			const statusMenuButton = columnHeader.querySelector('button') as HTMLButtonElement;
			await act(() => user.click(statusMenuButton));

			const chooseStatusMenuItem = screen.getByText(/choose status/i);
			await act(() => user.click(chooseStatusMenuItem));

			const statusCompleted = within(screen.getByRole('list')).getByText(/completed/i);
			await act(() => user.click(statusCompleted));

			expect(mockUpdateAssignment).toHaveBeenCalledWith({
				wellIds: [
					'5e272d3bb78910dd2a1be8c0',
					'5e272d72b78910dd2a1d6186',
					'5e272d3bb78910dd2a1be8c6',
					'5e272d72b78910dd2a1d61b8',
					'5e272d3bb78910dd2a1be77d',
					'5e272d39b78910dd2a1bd8e3',
					'5e272d52b78910dd2a1c71c0',
					'5e272d3bb78910dd2a1be8f2',
					'5e272d39b78910dd2a1bd914',
					'5e272d52b78910dd2a1c719f',
				],
				column: 'status',
				value: 'completed',
			});
		},
		timeoutLimit
	);

	it(
		'should be able to change qualifier',
		async () => {
			const user = userEvent.setup();

			await makeSut();

			const qualifierHeader = screen.getByText(/stat_2023_q2_5/i).parentElement?.parentElement as HTMLDivElement;
			const contextMenuButton = qualifierHeader.querySelector('button') as HTMLButtonElement;

			await act(async () => {
				await user.click(contextMenuButton);
				await user.click(screen.getByText(/stat_2023_q2_4/i));
			});
			expect(mockUpdateQualifier).toHaveBeenCalledWith('644fd276c7430b48b4c9b991');
		},
		timeoutLimit
	);

	it(
		'should be able to create a qualifier',
		async () => {
			const user = userEvent.setup();

			await makeSut();

			const qualifierHeader = screen.getByText(/stat_2023_q2_5/i).parentElement?.parentElement as HTMLDivElement;

			const contextMenuButton = qualifierHeader.querySelector('button') as HTMLButtonElement;

			await act(async () => {
				await user.click(contextMenuButton);

				await user.click(screen.getByText(/new qualifier/i));
				await user.click(screen.getByRole('button', { name: /create/i }));
			});

			expect(mockCreateQualifier).toHaveBeenCalledWith({
				column: 'status',
				name: generateDefaultName('status', mockUmbrellas),
			});
		},
		timeoutLimit
	);

	it(
		'should not render assumptions columns when feature flag is disabled',
		async () => {
			await makeSut();

			expect(screen.queryByText(/ownership and reversion/i)).not.toBeInTheDocument();
		},
		timeoutLimit
	);

	it(
		'should render assumptions columns when feature flag is enabled',
		async () => {
			vi.spyOn(useLDFeatureFlags, 'default').mockReturnValue({ ...featureFlags, isSchedulingNPVEnabled: true });

			await makeSut();

			screen.getByText(/ownership and reversion/i);
		},
		timeoutLimit
	);

	it(
		'should call the assignments endpoint when sorting',
		async () => {
			const user = userEvent.setup();

			await makeSut();

			const priorityHeader = screen.getByText(/priority/i);

			await act(() => user.click(priorityHeader));

			expect(mockGetWellAssignments).toHaveBeenCalledWith({
				wellIds: [
					'5e272d3bb78910dd2a1be8c0',
					'5e272d72b78910dd2a1d6186',
					'5e272d3bb78910dd2a1be8c6',
					'5e272d72b78910dd2a1d61b8',
					'5e272d3bb78910dd2a1be77d',
					'5e272d39b78910dd2a1bd8e3',
					'5e272d52b78910dd2a1c71c0',
					'5e272d3bb78910dd2a1be8f2',
					'5e272d39b78910dd2a1bd914',
					'5e272d52b78910dd2a1c719f',
				],
			});
		},
		timeoutLimit
	);

	describe('Keyboard shortcuts', () => {
		it(
			'should be able undo and redo',
			async () => {
				const user = userEvent.setup();
				const { container } = await makeSut();

				const rows = getPinnedRows(container, 'right');
				const firstRow = getRowByIndex(rows, 0);

				await act(async () => {
					await userEvent.dblClick(getColumn(firstRow, 'scheduling_status'));
					await user.click(
						screen.getByRole('option', {
							name: /permitted/i,
						})
					);
				});

				expect(mockUpdateAssignment).toHaveBeenCalledWith({
					column: 'status',
					value: 'permitted',
					wellIds: ['5e272d3bb78910dd2a1be8c0'],
				});

				await act(() => user.keyboard('{Control>}Z{/Control>}'));
				expect(mockUpdateAssignment).toHaveBeenCalledWith({
					column: 'status',
					value: 'not_started',
					wellIds: ['5e272d3bb78910dd2a1be8c0'],
				});

				await act(() => user.keyboard('{Control>}Y{/Control>}'));
				expect(mockUpdateAssignment).toHaveBeenCalledWith({
					column: 'status',
					value: 'permitted',
					wellIds: ['5e272d3bb78910dd2a1be8c0'],
				});
			},
			timeoutLimit
		);

		it.skip(
			'should be able to copy and paste values from priority and status column',
			async () => {
				const user = userEvent.setup();
				const { container } = await makeSut();

				const rowsLeft = getPinnedRows(container, 'left');
				const firstRowLeft = getRowByIndex(rowsLeft, 0);

				// Select and copy the first 3 rows
				await act(async () => {
					await user.click(getColumn(firstRowLeft, 'priority'));
					await user.keyboard('{Shift>}{ArrowDown}{ArrowDown}{/Shift>}');
					await user.keyboard('{Control>}C{/Control>}');
				});

				// Paste copied value into next 3 rows
				const fourthRowLeft = getRowByIndex(rowsLeft, 3);
				await act(async () => {
					await user.click(getColumn(fourthRowLeft, 'priority'));
					await user.keyboard('{Control>}V{/Control>}');
				});

				expect(mockUpdateManyAssignment).toHaveBeenCalledWith({
					column: 'priority',
					values: [
						{
							value: 1,
							well: '5e272d72b78910dd2a1d61b8',
						},
						{
							value: 2,
							well: '5e272d3bb78910dd2a1be77d',
						},
						{
							value: 3,
							well: '5e272d39b78910dd2a1bd8e3',
						},
					],
				});

				assertColumnValue(firstRowLeft, 'priority', '1');
				assertColumnValue(fourthRowLeft, 'priority', '1');

				const rowsRight = getPinnedRows(container, 'right');
				const firstRowRight = getRowByIndex(rowsRight, 0);

				// Select and copy the first 3 rows
				await act(async () => {
					await user.click(getColumn(firstRowRight, 'scheduling_status'));

					await user.keyboard('{Shift>}{ArrowDown}{ArrowDown}{/Shift>}');
					await user.keyboard('{Control>}C{/Control>}');
				});

				// Paste copied value into next 3 rows
				const fourthRowRight = getRowByIndex(rowsRight, 3);
				await act(async () => {
					await user.click(getColumn(fourthRowRight, 'scheduling_status'));
					await user.keyboard('{Control>}V{/Control>}');
				});

				expect(mockUpdateManyAssignment).toHaveBeenCalledWith({
					column: 'status',
					values: [
						{
							value: 'not_started',
							well: '5e272d72b78910dd2a1d61b8',
						},
						{
							value: 'permitted',
							well: '5e272d3bb78910dd2a1be77d',
						},
						{
							value: 'not_started',
							well: '5e272d39b78910dd2a1bd8e3',
						},
					],
				});
			},
			timeoutLimit
		);
	});
});
