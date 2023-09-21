import { Grid } from '@material-ui/core';
import { useField } from 'react-final-form';

import { DatePickerMD } from '@/components/ReactDatePicker';

import { useFieldUpdate } from './PipelineForm.hooks';

export const FDatePicker = (props) => {
	const { input, meta } = useField(props.name);

	useFieldUpdate({ name: props.name, defaultValue: input.initial || props.defaultValue });

	const mergedProps = {
		...props,
		...meta,
		...input,
		defaultValue: input.initial || input.value || props.defaultValue,
	};
	return (
		<Grid item xs={6}>
			<DatePickerMD alternativeOnChange {...mergedProps} />
		</Grid>
	);
};
