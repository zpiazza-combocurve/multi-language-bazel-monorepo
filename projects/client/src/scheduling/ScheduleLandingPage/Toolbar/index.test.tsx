import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import {
	DEFAULT_TESTING_RESPONSE_HEADERS,
	TestWrapper,
	featureFlags,
	getAxiosMockAdapter,
	mockFlags,
} from '@/helpers/testing';

import { SelectionProvider } from '../WellTable/hooks/useWellTableSelection';
import { Toolbar } from './index';

vi.mock('@/components/hooks', async () => ({
	...(await vi.importActual<typeof import('@/components/hooks')>('@/components/hooks')),

	useSelection: () => ({
		selectedSet: new Set(Array.from({ length: 5 }, (_, i) => i.toString())),
	}),
}));

beforeEach(() => mockFlags({}));

const mock = getAxiosMockAdapter();
mock.onGet(/\/notifications/).reply(200, [], DEFAULT_TESTING_RESPONSE_HEADERS);
const mockUpdateAssignments = vi.fn().mockResolvedValue([200, []]);
mock.onPost(/\/assignments\/update/).reply(mockUpdateAssignments);

const defaultWellIds = Array.from({ length: 10 }, (_, i) => i.toString());

const makeSut = (disabledMessage = '') => {
	return render(
		<TestWrapper>
			<SelectionProvider ids={defaultWellIds}>
				<Toolbar
					schedule={{ _id: 'id', name: 'name' }}
					updateAssignments={vi.fn()}
					wellIds={defaultWellIds}
					disabledMessage={disabledMessage}
					methods={vi.fn()}
					canUpdateSchedule
					setCurrentSort={() => ({})}
				/>
			</SelectionProvider>
		</TestWrapper>
	);
};

describe('Toolbar', () => {
	it('should render default state', async () => {
		const user = userEvent.setup();

		makeSut();

		await act(async () => {
			await user.click(
				screen.getByRole('button', {
					name: /prioritization/i,
				})
			);
		});
		screen.getByRole('menuitem', {
			name: /import/i,
		});
		screen.getByRole('menuitem', {
			name: /export/i,
		});
		expect(
			screen.queryByRole('menuitem', {
				name: /Single Well NPV/i,
			})
		).not.toBeInTheDocument();

		screen.getByRole('button', {
			name: /run schedule/i,
		});
		screen.getByRole('button', {
			name: /keyboard shortcuts/i,
		});
		screen.getByText(/5/i);
		screen.getByText(/\/ 10/i);
		screen.getByText(/wells selected/i);
	});

	it('should render disabled Run Schedule button when there is a disabled message', () => {
		makeSut('Disabled message');

		const runSchedule = screen.getByRole('button', {
			name: /run schedule/i,
		});

		expect(runSchedule).toHaveClass('Mui-disabled');
		expect(runSchedule).toHaveProperty('title', 'Disabled message');
	});

	it('should render Prioritization NPV menu when feature flag is enabled', async () => {
		const user = userEvent.setup();

		vi.spyOn(useLDFeatureFlags, 'default').mockReturnValue({
			...featureFlags,
			isSchedulingNPVEnabled: true,
		});

		makeSut();

		await act(async () => {
			await user.click(
				screen.getByRole('button', {
					name: /prioritization/i,
				})
			);
		});
		screen.getByRole('menuitem', {
			name: /Single Well NPV/i,
		});
	});

	it('should call the endpoint with the correct payload when clear priority', async () => {
		const user = userEvent.setup();

		makeSut();

		await act(async () => {
			await user.click(
				screen.getByRole('button', {
					name: /prioritization/i,
				})
			);

			await user.click(
				screen.getByRole('menuitem', {
					name: /clear priority/i,
				})
			);
		});

		expect(mockUpdateAssignments).toHaveBeenCalledWith(
			expect.objectContaining({
				data: JSON.stringify({
					wellIds: defaultWellIds,
					column: 'priority',
					value: null,
				}),
			})
		);
	});
});
