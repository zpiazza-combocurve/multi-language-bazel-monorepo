import { Grid, TextareaAutosize, TextareaAutosizeProps } from '@material-ui/core';
import { omit } from 'lodash';
import { memo, useCallback, useMemo } from 'react';
import { useField } from 'react-final-form';

import { useFieldUpdate } from './PipelineForm.hooks';

type FTextAreaProps = TextareaAutosizeProps & {
	name: string;
	label: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	defaultValue?: any;
};

export const FTextArea: React.FC<FTextAreaProps> = memo((props) => {
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
			<TextareaAutosize
				placeholder={props.name}
				minRows={3}
				{...mergedProps}
				onChange={onChange}
				onBlur={onBlur}
				style={{ width: '100%' }}
			/>
		</Grid>
	);
});
