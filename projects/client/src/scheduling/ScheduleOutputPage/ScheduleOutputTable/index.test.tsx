import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TestWrapper, getAxiosMockAdapter } from '@/helpers/testing';
import { ConstructionSettings, Resource } from '@/inpt-shared/scheduling/shared';

import ScheduleOutputTable from '.';
import { getConstructionLast, postWellOutputs } from '../fixtures';

const mock = getAxiosMockAdapter();

mock.onGet(/constructions\/last/).reply(200, getConstructionLast);

const mockWellOutputs = vi.fn().mockResolvedValue([200, postWellOutputs]);
mock.onPost(/wellOutputs/).reply(mockWellOutputs);

const wellIds = postWellOutputs.wells.map((well) => well._id);

const makeSut = () => {
	const scheduleId = '63f8e59d25e20e00122dcb07' as Inpt.ObjectId;

	return render(
		<TestWrapper>
			<ScheduleOutputTable
				scheduleId={scheduleId}
				editing={false}
				agGridRef={{ current: null }}
				modifiedRowsRef={{ current: null }}
				filters={{}}
				setHeaderFilters={() => ({})}
				wellIds={wellIds}
				hasModifiedData={false}
				setHasModifiedData={() => ({})}
				scheduleSettings={{ resources: [] as Resource[] } as ConstructionSettings}
			/>
		</TestWrapper>
	);
};

describe('ScheduleOutputTable', () => {
	it('should load basic components', async () => {
		makeSut();

		expect(
			screen.queryByRole('row', {
				name: /loading/i,
			})
		).not.toBeInTheDocument();

		// first well
		await screen.findByText('RIVERS, A');
		screen.getByText('19 F');

		// last well
		screen.getByText('KING RANCH STRATTON');
		screen.getByText('T 41 F');

		expect(mockWellOutputs).toHaveBeenCalledWith(
			expect.objectContaining({
				data: JSON.stringify({
					request: {
						startRow: 0,
						endRow: 5000,
						rowGroupCols: [],
						valueCols: [],
						pivotCols: [],
						pivotMode: false,
						groupKeys: [],
						filterModel: {},
						sortModel: [],
					},
					wellIds,
				}),
			})
		);
	});

	it('should send correct payload when sorting by well name, completion resource and FPD', async () => {
		makeSut();

		const firstWellName = await screen.findByText('RIVERS, A');
		const wellName = await screen.findByText('Well Name');

		await act(async () => {
			await userEvent.click(wellName);
		});
		expect(mockWellOutputs).toHaveBeenCalledWith(
			expect.objectContaining({
				data: JSON.stringify({
					request: {
						startRow: 0,
						endRow: 5000,
						rowGroupCols: [],
						valueCols: [],
						pivotCols: [],
						pivotMode: false,
						groupKeys: [],
						filterModel: {},
						sortModel: [
							{
								sort: 'asc',
								colId: 'well_name',
							},
						],
					},
					wellIds,
				}),
			})
		);

		await act(async () => {
			await userEvent.click(firstWellName);

			// go to the right side of the table
			await userEvent.keyboard('{ControlLeft>}{ArrowRight}{/ControlLeft}');

			await userEvent.click(screen.getByText('Completion Resource'));
		});

		expect(mockWellOutputs).toHaveBeenCalledWith(
			expect.objectContaining({
				data: JSON.stringify({
					request: {
						startRow: 0,
						endRow: 5000,
						rowGroupCols: [],
						valueCols: [],
						pivotCols: [],
						pivotMode: false,
						groupKeys: [],
						filterModel: {},
						sortModel: [
							{
								sort: 'asc',
								colId: 'resourceName',
								stepIdx: 3,
							},
						],
					},
					wellIds,
				}),
			})
		);

		await act(async () => {
			await userEvent.click(screen.getByText('First Production Date'));
		});

		expect(mockWellOutputs).toHaveBeenCalledWith(
			expect.objectContaining({
				data: JSON.stringify({
					request: {
						startRow: 0,
						endRow: 5000,
						rowGroupCols: [],
						valueCols: [],
						pivotCols: [],
						pivotMode: false,
						groupKeys: [],
						filterModel: {},
						sortModel: [
							{
								sort: 'asc',
								colId: 'FPD',
							},
						],
					},
					wellIds,
				}),
			})
		);
	});
});
