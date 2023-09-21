import { Checkbox, FormControlLabelProps } from '@material-ui/core';
import * as React from 'react';

import { FormControlLabel } from './FormControlLabel';

// TODO correct label type to react node or jsx.Element
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export type CheckboxFieldProps = { label: any } & Pick<FormControlLabelProps, 'labelPlacement'> &
	React.ComponentProps<typeof Checkbox>;

/**
 * Demos:
 *
 * - [Checkboxes](https://material-ui.com/components/checkboxes/)
 *
 * API:
 *
 * - [FormControlLabel API](https://material-ui.com/api/form-control-label/)
 */
function CheckboxField(
	{ label, labelPlacement = 'end', className, ...rest }: CheckboxFieldProps,
	ref: React.ForwardedRef<unknown>
) {
	return (
		<FormControlLabel
			ref={ref}
			className={className}
			control={<Checkbox {...rest} />}
			label={label}
			labelPlacement={labelPlacement}
		/>
	);
}

export default React.forwardRef(CheckboxField);
