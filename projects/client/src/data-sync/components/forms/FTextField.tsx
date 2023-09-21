import { Grid } from '@material-ui/core';
import TextField, { TextFieldProps } from '@material-ui/core/TextField';
import { omit } from 'lodash';
import { memo, useCallback, useMemo } from 'react';
import { useField } from 'react-final-form';

import { useFieldUpdate } from './PipelineForm.hooks';

type FTextFieldProps = TextFieldProps & {
	name: string;
};

export const FTextField: React.FC<FTextFieldProps> = memo((props) => {
	const { input, meta } = useField(props.name);
	useFieldUpdate({ name: props.name, defaultValue: input.initial || props.defaultValue });

	const mergedProps = useMemo(
		() => ({
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			...omit(['value'], props as any),
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
			<TextField
				{...mergedProps}
				onChange={onChange}
				onBlur={onBlur}
				label={props.label}
				style={{ display: 'flex' }}
			/>
		</Grid>
	);
});
