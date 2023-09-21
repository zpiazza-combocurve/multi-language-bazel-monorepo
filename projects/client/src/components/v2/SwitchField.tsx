import { FormControlLabel, FormControlLabelProps, Switch, SwitchProps } from '@material-ui/core';
import { ReactElement } from 'react';

export type SwitchFieldProps = Pick<FormControlLabelProps, 'labelPlacement'> &
	SwitchProps & { label?: string | ReactElement };

/**
 * FormControlLabel + Switch
 *
 * @see https://v4.mui.com/components/switches/#switch
 */
function SwitchField({ className, label, labelPlacement = 'end', ...rest }: SwitchFieldProps) {
	return (
		<FormControlLabel
			className={className}
			control={<Switch {...rest} />}
			label={label}
			labelPlacement={labelPlacement}
		/>
	);
}

export default SwitchField;
