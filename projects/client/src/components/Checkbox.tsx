import { faCheckSquare, faSquare } from '@fortawesome/pro-regular-svg-icons';
import classNames from 'classnames';
import * as React from 'react';
import { CheckboxProps, Checkbox as MaterialCheckbox } from 'react-md';

import { FontIcon } from './FontIcon';
import { useFormikField, useId } from './hooks';
import { tooltipped } from './tooltipped';

/** @deprecated Use material-ui */
export type InptCheckboxProps = CheckboxProps & { primary?: boolean; secondary?: boolean; plain?: boolean };

/**
 * Checkbox with only fontawesome applied, no forms logic
 *
 * @deprecated Use material-ui
 */
export function InptCheckbox({ primary, secondary, plain, ...props }: InptCheckboxProps) {
	const iconProps = {
		plain,
		primary,
		secondary,
	};

	return (
		<MaterialCheckbox
			{...props}
			uncheckedIcon={<FontIcon {...iconProps}>{faSquare}</FontIcon>}
			checkedIcon={<FontIcon {...iconProps}>{faCheckSquare}</FontIcon>}
		/>
	);
}

type CustomCheckboxProps = Omit<React.ComponentProps<typeof MaterialCheckbox>, 'id' | 'name'> & {
	id?: string;
	className?: string;
	name?: string;
	primary?: boolean;
	secondary?: boolean;
	plain?: boolean;
	fontIconProps?;
	size?;
};

/**
 * <Checkbox />
 *
 * See react-md Checkbox component: https://react-md.mlaursen.com/components/selection-controls
 *
 * This wrapper aims to define in one place the default settings we use for checkboxes across the app to avoid
 * repetition and to keep consistency: - Set some default props - Add `setFieldValue` for convenience using Formik
 *
 * We need to make sure we don't change the behavior or meaning of any prop described in the original documentation.
 *
 * @deprecated Use material-ui
 */
function UntooltippedCheckbox({
	className,
	size,
	fontIconProps,
	plain,
	primary,
	secondary,
	...rest
}: CustomCheckboxProps) {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	const overrideProps = useFormikField(rest);
	const id = useId();

	const iconProps = {
		plain,
		primary,
		secondary,
		forceSize: size,
		...fontIconProps,
	};

	return (
		<MaterialCheckbox
			id={id}
			aria-label={id}
			name={id}
			className={classNames(className, 'inpt-checkbox')}
			uncheckedIcon={<FontIcon {...iconProps}>{faSquare}</FontIcon>}
			checkedIcon={<FontIcon {...iconProps}>{faCheckSquare}</FontIcon>}
			checked={overrideProps.value}
			{...rest}
			{...overrideProps}
			value={undefined}
		/>
	);
}

/** @deprecated Use material-ui */
export const Checkbox = tooltipped(UntooltippedCheckbox);
