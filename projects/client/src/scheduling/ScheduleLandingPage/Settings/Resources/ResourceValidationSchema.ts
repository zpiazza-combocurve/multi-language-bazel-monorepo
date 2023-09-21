import yup from '@/helpers/yup-helpers';

export const ResourceSchema = yup.object().shape({
	name: yup.string().required('Resource Name is required'),
	stepIdx: yup.array().of(yup.number()),
	mobilizationDays: yup.number().positive().min(0),
	demobilizationDays: yup.number().positive().min(0),
	workOnHolidays: yup.boolean(),
	availability: yup.object().shape({
		start: yup.number().positive().min(0),
		end: yup.number().moreThan(yup.ref('start')),
	}),
	active: yup.boolean(),
});
