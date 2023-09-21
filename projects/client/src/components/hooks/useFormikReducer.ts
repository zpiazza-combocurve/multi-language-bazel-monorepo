import { FormikProps, FormikState } from 'formik';

/** Value preprocessing close to how formik works, tries to detect numbers, array, etc */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
function cleanValue(value: any) {
	if (value?.trim?.() === '') {
		return value;
	}
	const asNumber = Number(value);
	if (Number.isFinite(asNumber)) {
		return asNumber;
	}
	return value;
}

/**
 * Formik onChange helper
 *
 * @example
 * 	const formik = useFormikReducer(
 * 		useFormik({ initialValues: { a: '3' }, onSubmit: () => {} }),
 * 		(values, field, value) =>
 * 			produce((draft) => {
 * 				set(draft, field, value);
 * 				if (field === 'model') {
 * 					draft.qFinal = value === 'exp' ? 1 : 100;
 * 				}
 * 			})
 * 	);
 *
 * @see https://github.com/formium/formik/issues/1347
 */
export function useFormikReducer<T>(
	formik: FormikProps<T>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	reducer: (values: FormikState<T>['values'], name: string, value: any) => FormikProps<T>['values'] | undefined | void
) {
	return {
		...formik,
		getFieldHelpers: (name) => {
			const props = formik.getFieldHelpers(name);
			return {
				...props,
				setValue: (value, shouldValidate) => {
					const result = reducer(formik.values, name, cleanValue(value));
					if (result === undefined) {
						props.setValue(value, shouldValidate);
						return;
					}
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					formik.setValues(result as any, true);
				},
			};
		},
		getFieldProps: (data) => {
			const props = formik.getFieldProps(data);
			return {
				...props,
				onChange: (ev) => {
					const name = ev?.target?.name ?? ev?.target?.id;
					const result = reducer(formik.values, name, cleanValue(ev?.target?.value));
					if (result === undefined) {
						props.onChange(ev);
						return;
					}
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					formik.setValues(result as any, true);
				},
			};
		},
	};
}
