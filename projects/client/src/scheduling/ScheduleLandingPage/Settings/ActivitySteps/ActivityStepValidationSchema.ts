import yup from '@/helpers/yup-helpers';

export const ActivityStepSchema = yup.object().shape({
	color: yup.string().matches(/^$|^#[\da-f]{6}$/i),
	name: yup.string().required('Name is required').max(30, 'Name must be at most 30 characters'),
	stepDuration: yup.object().shape({
		days: yup.number().positive().min(1),
		useLookup: yup.boolean(),
		scheduleLookupId: yup.string(),
	}),
	previousStepIdx: yup.array().of(yup.number()),
	requiresResources: yup.boolean(),
});
