import { FieldAttributes, FieldHookConfig, Field as FormikField, useField as useFormikField } from 'formik';

import { useFieldName } from './Prefix';

/** @deprecated Use react-hook-form */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function useField({ name, ...rest }: FieldHookConfig<any>) {
	return useFormikField({ name: useFieldName(name), ...rest });
}

/** @deprecated Use react-hook-form */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function Field({ name, ...rest }: FieldAttributes<any>) {
	return <FormikField name={useFieldName(name)} {...rest} />;
}
