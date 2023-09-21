//TODO: consider moving some of these to some other shared files, might be useful in other places other than groups
import { ComponentProps, createContext, useContext } from 'react';
import { Control } from 'react-hook-form';

import { RHFCheckboxField, RHFRadioGroupField, RHFSelectField } from '@/components/v2';
import { assert } from '@/helpers/utilities';

import { GROUP_PROPERTIES } from './constants';
import { GroupPropertiesCheckbox, GroupPropertiesMenus } from './types';

export const textFieldProps = {
	variant: 'outlined' as const,
	size: 'small' as const,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const ControlContext = createContext<Control<any> | null>(null);

export function SelectField(
	props: { name: GroupPropertiesMenus } & Omit<
		ComponentProps<typeof RHFSelectField>,
		'control' | 'menuItems' | 'label'
	>
) {
	const { name } = props;
	const control = useContext(ControlContext);
	assert(control);
	return (
		<RHFSelectField
			{...textFieldProps}
			label={GROUP_PROPERTIES[name].label}
			menuItems={GROUP_PROPERTIES[name].menuItems}
			control={control}
			{...props}
		/>
	);
}

export function RadioGroupField(
	props: { name: GroupPropertiesMenus } & Omit<
		ComponentProps<typeof RHFRadioGroupField>,
		'control' | 'options' | 'label'
	>
) {
	const { name } = props;
	const control = useContext(ControlContext);
	assert(control);

	const groupProperties = GROUP_PROPERTIES[name];

	return (
		<RHFRadioGroupField
			label={groupProperties.label}
			options={groupProperties.menuItems}
			control={control}
			{...props}
		/>
	);
}

export function CheckboxField(
	props: { name: GroupPropertiesCheckbox } & Omit<ComponentProps<typeof RHFCheckboxField>, 'control' | 'label'>
) {
	const { name } = props;
	const control = useContext(ControlContext);
	assert(control);
	return <RHFCheckboxField label={GROUP_PROPERTIES[name]} control={control} {...props} />;
}
