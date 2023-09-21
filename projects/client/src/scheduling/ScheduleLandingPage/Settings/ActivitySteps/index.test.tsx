import { yupResolver } from '@hookform/resolvers/yup';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';

import { DEFAULT_TESTING_RESPONSE_HEADERS, TestWrapper, getAxiosMockAdapter } from '@/helpers/testing';
import yup from '@/helpers/yup-helpers';
import { CacheProvider } from '@/scheduling/ScheduleCacheContext';

import { ScheduleSettingActivitySteps } from '.';
import {
	assertColumnValue,
	getAllRows,
	getColumn,
	getPinnedRows,
	getRowByIndex,
} from '../../components/AgGrid/testUtils';
import { ActivityStepSchema } from '../ActivitySteps/ActivityStepValidationSchema';
import { ResourceSchema } from '../Resources/ResourceValidationSchema';
import { anyUser, createActivityStep, createResource } from '../shared/helpers';

vi.mock('./ScheduleSettingTabs/ScheduleSettingActivitySteps/Diagram/background.svg');

const mock = getAxiosMockAdapter();
mock.onGet(/\/schedules\/lookup-tables/).reply(
	200,
	[
		{
			totalItems: 1,
			items: [
				{
					_id: '64f247cb0329546e8de84636',
					name: 'lookup table 1',
				},
			],
			ids: ['64f247cb0329546e8de84636'],
		},
	],
	DEFAULT_TESTING_RESPONSE_HEADERS
);

const timeoutLimit = 10000;

const makeSut = () => {
	const ActivitySteps = () => {
		const activityStep = createActivityStep();
		delete activityStep['color'];

		const methods = useForm({
			defaultValues: {
				createdBy: anyUser,
				startProgram: new Date(),
				name: 'Setting 1',
				project: {
					_id: uuidv4(),
					name: '',
					___type: '',
				},
				resources: [createResource()],
				activitySteps: [activityStep],
			},
			resolver: yupResolver(
				yup.object().shape({
					name: yup.string().required('Please enter a schedule config name').hasNonWhitespace(),
					startProgram: yup.date().required(),
					resources: yup.array().of(ResourceSchema),
					activitySteps: yup.array().of(ActivityStepSchema),
				})
			),
			mode: 'all',
		});
		return (
			<TestWrapper>
				<CacheProvider>
					<FormProvider {...methods}>
						<ScheduleSettingActivitySteps hasCyclicSteps={false} enableDiagram />
					</FormProvider>
				</CacheProvider>
			</TestWrapper>
		);
	};

	return render(<ActivitySteps />);
};

describe('ScheduleSettingActivitySteps', () => {
	it('should render default step with default state', () => {
		const { container } = makeSut();

		expect(screen.getByRole('button', { name: 'Step' })).not.toHaveClass('Mui-disabled');
		expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('Mui-disabled');

		const rows = getAllRows(container);
		const firstRow = getRowByIndex(rows, 0);

		assertColumnValue(firstRow, 'name', 'Step Name 1');
		assertColumnValue(firstRow, 'previousStepIdx', '');
		assertColumnValue(firstRow, 'padOperation', 'No');
		assertColumnValue(firstRow, 'stepDuration.days', '1 day');
		assertColumnValue(firstRow, 'requiresResources', 'Yes');
	});

	it(
		'should be able to add and delete steps',
		async () => {
			const user = userEvent.setup();

			const { container } = makeSut();

			const rows = getPinnedRows(container, 'left');
			const allRows = getAllRows(container);

			expect(await screen.findByText('Step Name 1')).toBeInTheDocument();
			expect(screen.queryByText('Step Name 2')).not.toBeInTheDocument();

			screen.getByRole('button', { name: 'Step' }).click();
			expect(await screen.findByText('Step Name 2')).toBeInTheDocument();

			screen.getByRole('button', { name: 'Step' }).click();
			expect(await screen.findByText('Step Name 3')).toBeInTheDocument();

			const secondRow = getRowByIndex(allRows, 1);
			const thirdRow = getRowByIndex(allRows, 2);
			assertColumnValue(secondRow, 'previousStepIdx', 'Step Name 1');
			assertColumnValue(thirdRow, 'previousStepIdx', 'Step Name 2');

			await act(async () => {
				await user.click(within(getRowByIndex(rows, 0)).getByRole('checkbox'));
				await user.click(within(getRowByIndex(rows, 1)).getByRole('checkbox'));
				await user.click(within(getRowByIndex(rows, 2)).getByRole('checkbox'));
			});

			screen.getByRole('button', { name: 'Delete' }).click();
			expect(await screen.findByText('No Rows To Show')).toBeInTheDocument();
		},
		timeoutLimit
	);

	it(
		'should display 4 default options and a custom one for step name',
		async () => {
			const user = userEvent.setup();

			const { container } = makeSut();

			const rows = getAllRows(container);
			const firstRow = getRowByIndex(rows, 0);

			await act(async () => {
				await user.dblClick(getColumn(firstRow, 'name'));
			});

			expect(screen.getByText('Pad Preparation')).toBeInTheDocument();
			expect(screen.getByText('Spud')).toBeInTheDocument();
			expect(screen.getByText('Drill')).toBeInTheDocument();
			expect(screen.getByText('Completion')).toBeInTheDocument();
			expect(screen.getByText('Custom')).toBeInTheDocument();
		},
		timeoutLimit
	);

	it(
		'should allow the user to type only if the option is custom',
		async () => {
			const user = userEvent.setup();

			const { container } = makeSut();

			const rows = getAllRows(container);
			const firstRow = getRowByIndex(rows, 0);

			const nameColumn = getColumn(firstRow, 'name');

			await act(async () => {
				await user.dblClick(nameColumn);
			});

			expect(within(getColumn(firstRow, 'name')).getByRole('textbox')).not.toHaveClass('Mui-disabled');

			screen.getByText('Pad Preparation').click();

			assertColumnValue(firstRow, 'name', 'Pad Preparation');

			await act(async () => {
				await user.dblClick(nameColumn);
			});

			expect(within(getColumn(firstRow, 'name')).getByRole('textbox')).toHaveClass('Mui-disabled');
		},
		timeoutLimit
	);
});
