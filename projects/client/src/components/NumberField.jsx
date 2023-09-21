import { useCallback } from 'react';
import { TextField as MaterialTextField } from 'react-md';

import { useFormikField } from './hooks';

/**
 * <NumberField />
 * See react-md TextField component: https://react-md.mlaursen.com/components/text-fields
 *
 * This wrapper aims to define in one place the default settings we use for select fields across the app to avoid
 * repetition and to keep consistency:
 *
 * - Set some default props
 * - Add `setFieldValue` for convenience using Formik
 *
 * We need to make sure we don't change the behavior or meaning of any prop described in the original documentation.
 *
 * NOTE: This component doesn't exist in react-md. It justs customizes TextField to work better with numbers.
 *
 * @deprecated Use material-ui components
 */
export function NumberField(props) {
	const overrideProps = useFormikField(props);
	const { onChange } = overrideProps;
	const handleChange = useCallback(
		(value, ...args) => onChange(value ? parseFloat(value, 10) : value, ...args),
		[onChange]
	);

	return (
		<MaterialTextField
			lineDirection='center'
			max={2147483647}
			min={0}
			type='number'
			{...props}
			{...overrideProps}
			onChange={handleChange}
		/>
	);
}
