import { convertIdxToDate } from '@combocurve/forecast/helpers';
import { yupResolver } from '@hookform/resolvers/yup';
import _ from 'lodash';
import { useContext, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import yup from '@/helpers/yup-helpers';
import { ActivityStep, RunScheduleForm, Setting } from '@/inpt-shared/scheduling/shared';
import CacheContext from '@/scheduling/ScheduleCacheContext';

import { ActivityStepSchema } from '../Settings/ActivitySteps/ActivityStepValidationSchema';
import { ResourceSchema } from '../Settings/Resources/ResourceValidationSchema';
import { createActivityStep, createResource } from '../Settings/shared/helpers';

export const MAX_ACTIVITY_STEPS = 10;
export const MAX_RESOURCES = 100;

export type ScheduleSettingsForm = {
	settingName: string;
	settingData: Setting | undefined;
	startProgram: number | undefined;
	overwriteManual: boolean;
};

export const useScheduleSettingsForm = ({
	settingName,
	settingData,
	startProgram,
}: Omit<ScheduleSettingsForm, 'overwriteManual'>) => {
	const { cache, hasUnsavedWork, setPersistedData } = useContext(CacheContext);

	const initialValues = useMemo(() => {
		const startProgramDate = startProgram ? convertIdxToDate(startProgram) : new Date();

		const applyCache = (settings) => {
			return { ...settings, ...cache };
		};

		if (settingData)
			return applyCache({
				..._.pick(settingData, ['name', 'activitySteps', 'resources']),
				startProgram: startProgramDate,
				overwriteManual: true,
			});

		const activityStep = createActivityStep();
		return applyCache({
			name: settingName,
			startProgram: startProgramDate,
			activitySteps: [activityStep],
			resources: [createResource(0, activityStep.stepIdx)],
			overwriteManual: true,
		}) as RunScheduleForm;
	}, [settingData, settingName, startProgram, cache]);

	const SettingSchema = yup.object().shape({
		name: yup
			.string()
			.required('Please enter a schedule config name')
			.hasNonWhitespace()
			.max(30, 'Name must be at most 30 characters'),
		resources: yup.array().of(ResourceSchema).max(MAX_RESOURCES, `Maximum of ${MAX_RESOURCES} resources allowed`),
		activitySteps: yup
			.array()
			.of(ActivityStepSchema)
			.max(MAX_ACTIVITY_STEPS, `Maximum of ${MAX_ACTIVITY_STEPS} steps allowed`),
	});

	const methods = useForm<RunScheduleForm>({
		defaultValues: initialValues,
		resolver: yupResolver(SettingSchema),
		mode: 'all',
	});

	const { getValues, reset } = methods;
	const { activitySteps, resources } = getValues();

	useEffect(() => {
		reset(initialValues);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [settingData, startProgram, cache]);

	useEffect(() => {
		setPersistedData(settingData || {});
	}, [setPersistedData, settingData]);

	const hasCyclicSteps = useMemo(() => {
		/**
		 * Detects cycles in steps graph using depth-first search. Removes some book-keeping from the referenced
		 * algorithm since we don't need a full topological order.
		 *
		 * @see https://en.wikipedia.org/wiki/Topological_sorting#Depth-first_search
		 */
		const permanentMark = new Set();
		const temporaryMark = new Set();
		let cycleFound = false;

		const visit = (step: ActivityStep) => {
			if (!permanentMark.has(step.stepIdx)) {
				if (temporaryMark.has(step.stepIdx)) {
					cycleFound = true;
				} else {
					temporaryMark.add(step.stepIdx);
					step.previousStepIdx.forEach((stepIdx: number) => {
						const thisStep = activitySteps.find((step) => step.stepIdx === stepIdx);
						if (thisStep !== undefined) {
							visit(thisStep);
						} else {
							throw new Error('Previous step is not a valid index.');
						}
					});
					temporaryMark.delete(step.stepIdx);
					permanentMark.add(step.stepIdx);
				}
			}
		};

		activitySteps.forEach((step) => {
			if (!permanentMark.has(step.stepIdx) && !cycleFound) {
				visit(step);
			}
		});

		return cycleFound;
	}, [activitySteps]);

	const unassignedSteps = activitySteps.filter(
		(step) => step.requiresResources && !resources.some((resource) => resource.stepIdx.includes(step.stepIdx))
	);

	const stepsWithResourceInactive = useMemo(() => {
		const stepsWithoutResourceActive: ActivityStep[] = [];

		const stepsRequiresResources = activitySteps.filter((step) => step.requiresResources);
		stepsRequiresResources.forEach((step) => {
			const isThereAnyResourceHandlingThisStep = resources.some(
				(resource) => resource.stepIdx.includes(step.stepIdx) && resource.active
			);
			if (!isThereAnyResourceHandlingThisStep) {
				stepsWithoutResourceActive.push(step);
			}
		});

		return stepsWithoutResourceActive;
	}, [activitySteps, resources]);

	return {
		methods,
		hasCyclicSteps,
		unassignedSteps,
		stepsWithResourceInactive,
		isDraft: hasUnsavedWork,
	};
};
