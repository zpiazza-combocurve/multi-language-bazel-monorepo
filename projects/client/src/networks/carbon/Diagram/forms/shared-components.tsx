import { ComponentProps } from 'react';

import { RHFNumberField, RHFSelectField, RHFTextField } from '@/components/v2';
import { SelectFieldProps } from '@/components/v2/misc/SelectField';

export const FormTextField = (props: ComponentProps<typeof RHFTextField>) => (
	<RHFTextField variant='outlined' fullWidth {...props} />
);

export const FormNumberField = (props: ComponentProps<typeof RHFTextField>) => (
	<RHFNumberField variant='outlined' fullWidth {...props} />
);

export const FormSelectField = (
	props: SelectFieldProps & {
		name: string;
	}
) => <RHFSelectField variant='outlined' fullWidth {...props} />;
