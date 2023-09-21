import { Grid, TextareaAutosize, TextareaAutosizeProps } from '@material-ui/core';
import { omit } from 'lodash';
import { memo, useCallback, useMemo } from 'react';
import { useField } from 'react-final-form';

import { dumpJsonAsYaml, loadYaml } from '../../data-flows/pipelines/DataPipeline.hooks';
import { useFieldUpdate } from './PipelineForm.hooks';

type FJsonTextAreaProps = TextareaAutosizeProps & {
	name: string;
	label: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	defaultValue?: any;
};

export const FJsonTextArea: React.FC<FJsonTextAreaProps> = memo((props) => {
	const { input, meta } = useField(props.name);
	useFieldUpdate({ name: props.name, defaultValue: input.initial || props.defaultValue });

	const mergedProps = useMemo(
		() => ({
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			...omit(['value'], props as any),
			...meta,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			...omit(['onChange', 'onBlur'], input as any),
			defaultValue: dumpJsonAsYaml(input.initial || input.value || props.defaultValue || {}),
		}),
		[props, meta, input]
	);

	const onChange = useCallback(
		(val) => {
			try {
				const value = loadYaml(val.target.value);
				return input.onChange(value);
			} catch {
				return input.onChange(val);
			}
		},
		[input]
	);
	const onBlur = useCallback((val) => input.onBlur(val), [input]);

	return (
		<Grid item xs={6}>
			<div>{props.name}</div>
			<TextareaAutosize
				minRows={3}
				{...mergedProps}
				onChange={onChange}
				onBlur={onBlur}
				style={{ width: '100%', resize: 'vertical' }}
			/>
		</Grid>
	);
});
