import { convertDateToIdx } from '@combocurve/forecast/helpers';
import { renderHook } from '@testing-library/react-hooks';
import _ from 'lodash-es';

import { yearsToIndex } from '@/helpers/date';
import { TestWrapper } from '@/helpers/testing';
import { getColorFromIndex } from '@/helpers/utilities';
import { PadOperation, Setting } from '@/inpt-shared/scheduling/shared';
import { CacheProvider } from '@/scheduling/ScheduleCacheContext';

import { anyUser } from '../Settings/shared/helpers';
import { useScheduleSettingsForm } from './useScheduleSettingsForm';

const settingDataDefault: Setting = {
	_id: '63b48a8d24b35e4017ee0dae',
	activitySteps: [
		{
			stepDuration: {
				useLookup: false,
				days: 5,
			},
			previousStepIdx: [],
			padOperation: PadOperation.sequence,
			stepIdx: 1,
			color: '#4a90e2',
			name: 'Step 1',
			requiresResources: false,
		},
		{
			stepDuration: {
				useLookup: false,
				days: 5,
			},
			previousStepIdx: [1],
			padOperation: PadOperation.sequence,
			stepIdx: 2,
			color: '',
			name: 'Step 2',
			requiresResources: false,
		},
		{
			stepDuration: {
				useLookup: false,
				days: 5,
			},
			previousStepIdx: [2],
			padOperation: PadOperation.sequence,
			stepIdx: 3,
			name: 'Step 3',
			requiresResources: false,
		},
	],
	createdBy: anyUser,
	name: 'John Config',
	project: {
		_id: '63aee24599d74928fb41d6f6' as Inpt.ObjectId,
		name: 'John Test',
	},
	resources: [
		{
			active: false,
			stepIdx: [],
			workOnHolidays: true,
			availability: {
				start: 44923,
				end: 117973,
			},
			demobilizationDays: 1,
			mobilizationDays: 1,
			name: 'Resource 2',
		},
	],
};

const wrapper = ({ children }) => {
	return (
		<TestWrapper>
			<CacheProvider>{children}</CacheProvider>
		</TestWrapper>
	);
};

const makeSut = (settingData: Setting | undefined = undefined, startProgram: number | undefined = undefined) => {
	return renderHook(
		() =>
			useScheduleSettingsForm({
				settingName: 'Default',
				settingData,
				startProgram,
			}),
		{ wrapper }
	);
};

describe('useScheduleSettingsForm', () => {
	it('should initialize form with settingData values if provided and current date as start program', () => {
		const { result } = makeSut(settingDataDefault);

		expect(result.current.methods.getValues().name).toEqual('John Config');
		expect(result.current.methods.getValues().activitySteps).toEqual(settingDataDefault.activitySteps);
		expect(result.current.methods.getValues().resources).toEqual(settingDataDefault.resources);
		expect(convertDateToIdx(result.current.methods.getValues().startProgram)).toEqual(convertDateToIdx(new Date()));
	});

	it('should initialize form with default values if settingData and start program is undefined', () => {
		const { result } = makeSut();

		expect(result.current.methods.getValues().name).toEqual('Default');
		expect(result.current.methods.getValues().activitySteps).toEqual([
			{
				color: getColorFromIndex(1),
				stepIdx: 1,
				previousStepIdx: [],
				name: 'Step Name 1',
				padOperation: PadOperation.disabled,
				stepDuration: { days: 1, useLookup: false },
				requiresResources: true,
			},
		]);
		expect(result.current.methods.getValues().resources).toEqual([
			{
				active: true,
				availability: {
					start: convertDateToIdx(new Date().setHours(0)),
					end: convertDateToIdx(new Date().setHours(0)) + yearsToIndex(200),
				},
				demobilizationDays: 1,
				mobilizationDays: 1,
				name: 'Resource 1',
				stepIdx: [1],
				workOnHolidays: true,
			},
		]);
		expect(convertDateToIdx(result.current.methods.getValues().startProgram)).toEqual(convertDateToIdx(new Date()));
	});

	it('should initialize form correctly if settingData is undefined but start program is defined', () => {
		const { result } = makeSut(undefined, 44920);

		expect(result.current.methods.getValues().name).toEqual('Default');
		expect(result.current.methods.getValues().activitySteps).toEqual([
			{
				color: getColorFromIndex(1),
				stepIdx: 1,
				previousStepIdx: [],
				name: 'Step Name 1',
				padOperation: PadOperation.disabled,
				stepDuration: { days: 1, useLookup: false },
				requiresResources: true,
			},
		]);
		expect(result.current.methods.getValues().resources).toEqual([
			{
				active: true,
				availability: {
					start: convertDateToIdx(new Date().setHours(0)),
					end: convertDateToIdx(new Date().setHours(0)) + yearsToIndex(200),
				},
				demobilizationDays: 1,
				mobilizationDays: 1,
				name: 'Resource 1',
				stepIdx: [1],
				workOnHolidays: true,
			},
		]);
		expect(convertDateToIdx(result.current.methods.getValues().startProgram)).toEqual(44920);
	});

	describe('hasCyclicSteps', () => {
		it('should not have cyclic steps', () => {
			const { result } = makeSut(settingDataDefault);

			expect(result.current.hasCyclicSteps).toBe(false);
		});

		it('should have cyclic steps', () => {
			const cyclicSteps = _.cloneDeep(settingDataDefault);
			cyclicSteps.activitySteps[0].previousStepIdx = [1];

			const { result } = makeSut(cyclicSteps);

			expect(result.current.hasCyclicSteps).toBe(true);
		});
	});

	describe('unassignedSteps', () => {
		it('should not have unassigned steps', () => {
			const { result } = makeSut(settingDataDefault);

			expect(result.current.unassignedSteps).toEqual([]);
		});

		it('should have unassigned steps', () => {
			const unassignedSteps = _.cloneDeep(settingDataDefault);
			unassignedSteps.activitySteps[0].requiresResources = true;

			const { result } = makeSut(unassignedSteps);

			expect(result.current.unassignedSteps).toEqual([unassignedSteps.activitySteps[0]]);
		});
	});

	describe('stepsWithResourceInactive', () => {
		it('should not have steps with inactive resources', () => {
			const { result } = makeSut(settingDataDefault);

			expect(result.current.stepsWithResourceInactive).toEqual([]);
		});

		it('should have steps with inactive resources', () => {
			const stepsWithResourceInactive = _.cloneDeep(settingDataDefault);
			stepsWithResourceInactive.activitySteps[0].requiresResources = true;
			stepsWithResourceInactive.resources[0].stepIdx = [0] as [number];

			const { result } = makeSut(stepsWithResourceInactive);

			expect(result.current.stepsWithResourceInactive).toEqual([stepsWithResourceInactive.activitySteps[0]]);
		});
	});
});
