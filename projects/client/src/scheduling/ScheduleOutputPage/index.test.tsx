import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TestWrapper, getAxiosMockAdapter, mockPermissions } from '@/helpers/testing';

import ScheduleOutputPage from '.';
import { postWellOutputs } from './fixtures';

const mock = getAxiosMockAdapter();

const mockWellOutputs = vi.fn().mockResolvedValue([200, postWellOutputs]);
mock.onPost(/wellOutputs/).reply(mockWellOutputs);

const mockWellIds = postWellOutputs.wells.map((well) => well._id);

vi.mock('../hooks/useSchedule', async () => ({
	useSchedule: () => ({
		schedule: {
			wells: mockWellIds,
		},
	}),
}));

vi.mock('../hooks/useFilteredWells', async () => ({
	useFilteredWells: () => ({
		filters: {},
		setHeaderFilters: vi.fn(),
		filteredWellIds: [],
	}),
}));

vi.mock('./ScheduleOutputGraphs/WellDeliveryGraph', async () => ({
	WellDeliveryGraph: () => null,
}));
vi.mock('./ScheduleOutputGraphs/MapGraph', async () => ({
	MapGraph: () => null,
}));

mockPermissions();

vi.mock('@/helpers/xlsx', async () => ({
	exportXLSX: vi.fn(),
}));

const makeSut = () => {
	const scheduleId = '63f8e59d25e20e00122dcb07' as Inpt.ObjectId;

	return render(
		<TestWrapper>
			<ScheduleOutputPage
				scheduleId={scheduleId}
				scheduleQuery={{
					data: {
						wells: mockWellIds,
					},
					loading: false,
				}}
				constructionQuery={{}}
			/>
		</TestWrapper>
	);
};

describe('ScheduleOutputPage', () => {
	it('should load basic components', async () => {
		makeSut();

		await screen.findByRole('button', {
			name: /edit/i,
		});

		screen.getByLabelText(/download table button/i);
	});

	it('should call wellOutputs endpoint with the correct payload when download button is clicked', async () => {
		const user = userEvent.setup();

		makeSut();

		const downloadButton = await screen.findByLabelText(/download table button/i);

		await user.click(downloadButton);

		expect(mockWellOutputs).toHaveBeenCalledWith(
			expect.objectContaining({
				data: JSON.stringify({
					wellIds: mockWellIds,
				}),
				url: '/schedules/63f8e59d25e20e00122dcb07/wellOutputs',
			})
		);
	});
});
