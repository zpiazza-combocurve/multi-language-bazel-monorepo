import { convertIdxToDate } from '@combocurve/forecast/helpers';
import { yupResolver } from '@hookform/resolvers/yup';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';

import { TestWrapper } from '@/helpers/testing';
import yup from '@/helpers/yup-helpers';
import { CacheProvider } from '@/scheduling/ScheduleCacheContext';

import { ScheduleSettingResources } from '.';
import {
	assertColumnValue,
	createAvailability,
	dateTimeToDateStr,
	getAllRows,
	getColumn,
	getPinnedRows,
	getRowByIndex,
} from '../../components/AgGrid/testUtils';
import { ActivityStepSchema } from '../ActivitySteps/ActivityStepValidationSchema';
import { anyUser, createActivityStep, createResource } from '../shared/helpers';
import { ResourceSchema } from './ResourceValidationSchema';

const timeoutLimit = 10000;

const makeSut = () => {
	const Resources = () => {
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

				resources: [createResource(0, 1)],
				activitySteps: [createActivityStep(), { ...createActivityStep(1), requiresResources: false }],
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
						<ScheduleSettingResources />
					</FormProvider>
				</CacheProvider>
			</TestWrapper>
		);
	};

	return render(<Resources />);
};

describe('ScheduleSettingResources', () => {
	it(
		'should render default resources with default state',
		async () => {
			const { container } = makeSut();

			expect(screen.getByRole('button', { name: 'Resource' })).not.toHaveClass('Mui-disabled');
			expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('Mui-disabled');
			expect(screen.getByRole('button', { name: 'Duplicate' })).toHaveClass('Mui-disabled');

			const rows = getAllRows(container);
			const firstRow = getRowByIndex(rows, 0);

			const { start, end } = createAvailability();

			assertColumnValue(firstRow, 'name', 'Resource 1');
			assertColumnValue(firstRow, 'mobilizationDays', '1 day');
			assertColumnValue(firstRow, 'demobilizationDays', '1 day');
			assertColumnValue(firstRow, 'data.availability.start', dateTimeToDateStr(convertIdxToDate(start)));
			assertColumnValue(firstRow, 'data.availability.end', dateTimeToDateStr(convertIdxToDate(end)));
			assertColumnValue(firstRow, 'active', 'Yes');

			await act(async () => {
				await userEvent.dblClick(getColumn(firstRow, 'stepIdx'));
			});
			expect(screen.queryByText('Step Name 2')).not.toBeInTheDocument();
		},
		timeoutLimit
	);

	it(
		'should be able to add, duplicate and delete resources',
		async () => {
			const user = userEvent.setup();

			const { container } = makeSut();

			const rows = getPinnedRows(container, 'left');

			expect(screen.getByText('Resource 1')).toBeInTheDocument();
			expect(screen.queryByText('Resource 2')).not.toBeInTheDocument();

			screen.getByRole('button', { name: 'Resource' }).click();
			expect(await screen.findByText('Resource 2')).toBeInTheDocument();

			await act(async () => {
				await user.click(within(getRowByIndex(rows, 0)).getByRole('checkbox'));
			});

			screen.getByRole('button', { name: 'Duplicate' }).click();
			expect(await screen.findByText('Resource 1 - Copy')).toBeInTheDocument();

			await act(async () => {
				await user.click(within(getRowByIndex(rows, 0)).getByRole('checkbox'));
				await user.click(within(getRowByIndex(rows, 1)).getByRole('checkbox'));
				await user.click(within(getRowByIndex(rows, 2)).getByRole('checkbox'));
			});

			screen.getByRole('button', { name: 'Delete' }).click();

			await waitFor(() => {
				expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('Mui-disabled');
				expect(screen.getByText('No Rows To Show')).toBeInTheDocument();
			});
		},
		timeoutLimit
	);

	it(
		'should automatically change Active value when a step is selected or removed',
		async () => {
			const user = userEvent.setup();

			const { container } = makeSut();

			const rows = getAllRows(container);
			let firstRow = getRowByIndex(rows, 0);

			await act(async () => {
				expect(within(getColumn(firstRow, 'active')).getByText('Yes')).toBeInTheDocument();

				await user.dblClick(getColumn(firstRow, 'stepIdx'));
				await user.click(screen.getByText('Step Name 1'));
				await user.keyboard('{enter}');

				expect(within(getColumn(firstRow, 'active')).getByText('No')).toBeInTheDocument();

				await user.dblClick(getColumn(firstRow, 'stepIdx'));
				await user.click(screen.getByText('Step Name 1'));
				await user.keyboard('{enter}');
			});

			firstRow = getRowByIndex(rows, 0);
			expect(within(getColumn(firstRow, 'active')).getByText('Yes')).toBeInTheDocument();
		},
		timeoutLimit
	);

	it(
		'should not allow the user to change to active if there is no step selected',
		async () => {
			const user = userEvent.setup();

			const { container } = makeSut();

			const rows = getAllRows(container);
			const firstRow = getRowByIndex(rows, 0);

			await act(async () => {
				await user.dblClick(getColumn(firstRow, 'stepIdx'));
				await user.click(screen.getByText('Step Name 1'));
				await user.keyboard('{enter}');

				await user.dblClick(getColumn(firstRow, 'active'));
				await user.click(screen.getByText('Yes'));
				await user.keyboard('{enter}');
			});

			expect(within(getColumn(firstRow, 'active')).getByText('No')).toBeInTheDocument();
		},
		timeoutLimit
	);

	it(
		'should allow manual changes in the Active column when a step is selected',
		async () => {
			const user = userEvent.setup();

			const { container } = makeSut();

			const rows = getAllRows(container);
			const firstRow = getRowByIndex(rows, 0);
			const activeColumn = getColumn(firstRow, 'active');

			expect(await within(activeColumn).findByText('Yes')).toBeInTheDocument();

			await act(async () => {
				await user.dblClick(activeColumn);
				await user.click(screen.getByText('No'));
				await user.keyboard('{enter}');
			});

			expect(await within(activeColumn).findByText('No')).toBeInTheDocument();
		},
		timeoutLimit
	);
});
