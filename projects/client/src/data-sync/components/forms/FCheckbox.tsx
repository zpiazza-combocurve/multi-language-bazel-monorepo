import { Grid } from '@material-ui/core';
import { omit } from 'lodash';
import { memo, useCallback, useMemo, useState } from 'react';
import { useField } from 'react-final-form';

import { CheckboxField } from '@/components/v2';
import { CheckboxFieldProps } from '@/components/v2/CheckboxField';

import { useFieldUpdate } from './PipelineForm.hooks';

type FCheckboxProps = CheckboxFieldProps & {
	name: string;
};

export const FCheckbox: React.FC<FCheckboxProps> = memo((props) => {
	const { input, meta } = useField(props.name, { type: 'checkbox' });
	const [checked, setChecked] = useState<boolean | undefined>(input ? input.checked : props.defaultChecked);
	useFieldUpdate({ name: props.name, defaultValue: checked });

	const mergedProps = useMemo(
		() => ({
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			...omit(['value'], props as any),
			...meta,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			...omit(['onChange'], input as any),
		}),
		[props, meta, input]
	);

	const onChange = useCallback(
		(val) => {
			setChecked(val.target.checked);
			return input.onChange(val);
		},
		[input]
	);

	return (
		<Grid item xs={6}>
			<CheckboxField {...mergedProps} label={props.label} onChange={onChange} checked={checked} />
		</Grid>
	);
});
