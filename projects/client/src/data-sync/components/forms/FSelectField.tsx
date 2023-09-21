import { Grid } from '@material-ui/core';
import { omit } from 'lodash';
import { memo, useCallback, useMemo } from 'react';
import { useField } from 'react-final-form';

import SelectField, { MenuItem, SelectFieldProps } from '@/components/v2/misc/SelectField';

import { useFieldUpdate } from './PipelineForm.hooks';

type FSelectFieldProps = SelectFieldProps & {
	name: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	options: MenuItem<any>[];
};

export const FSelectField: React.FC<FSelectFieldProps> = memo((props) => {
	const { input, meta } = useField(props.name);

	useFieldUpdate({ name: props.name, defaultValue: input.initial || props.defaultValue });

	const mergedProps = useMemo(
		() => ({
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			...omit(['component', 'options', 'value'], props as any),
			...meta,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			...omit(['onChange', 'onBlur'], input as any),
			defaultValue: input.initial || input.value || props.defaultValue,
		}),
		[props, meta, input]
	);

	const onChange = useCallback((val) => input.onChange(val), [input]);
	const onBlur = useCallback((val) => input.onBlur(val), [input]);

	return (
		<Grid item xs={6}>
			<SelectField
				{...mergedProps}
				menuItems={props.options}
				size='medium'
				onChange={onChange}
				onBlur={onBlur}
				label={props.label}
				style={{ display: 'flex' }}
			/>
		</Grid>
	);
});
