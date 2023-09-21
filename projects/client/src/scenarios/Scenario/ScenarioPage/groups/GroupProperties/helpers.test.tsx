import { render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import userEvent from '@testing-library/user-event';
import { UseFormReturn, useForm } from 'react-hook-form';

import { GROUP_PROPERTIES } from './constants';
import { CheckboxField, ControlContext, RadioGroupField, SelectField } from './helpers';
import { GroupProperties } from './types';

// HACK: using classnames to get radio and checkbox states
const MUI_CHECKBOX_CLASSNAME = 'MuiCheckbox-root';
const MUI_RADIO_CLASSNAME = 'MuiRadio-root';
const MUI_SELECT_CLASSNAME = 'MuiSelect-root';

const MUI_CHECKED_CLASSNAME = 'Mui-checked';

const VOLUMN_EXCLUSION = GROUP_PROPERTIES[GroupProperties.volumnExclusion];

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
function renderRHFComponent<P extends Record<any, any> | undefined>(element, defaultValues?: P) {
	const { result } = renderHook(() => useForm({ defaultValues }));
	const { control } = result.current;

	const renderResults = render(<ControlContext.Provider value={control}>{element}</ControlContext.Provider>);
	return { rhfRef: result, ...renderResults };
}

const EXCLUDE_GROUP_LABEL = 'Exclude Group';

describe('Econ Group Properties', () => {
	describe('helpers', () => {
		describe('CheckboxField', () => {
			function getCheckbox(container: HTMLElement) {
				return container.getElementsByClassName(MUI_CHECKBOX_CLASSNAME)[0];
			}
			function isCheckboxChecked(container: HTMLElement) {
				const checkbox = getCheckbox(container);
				return checkbox.classList.contains(MUI_CHECKED_CLASSNAME);
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			function getExcludeGroup({ getValues }: UseFormReturn<any>) {
				return getValues().properties.exclusion.group;
			}
			it('should render', () => {
				renderRHFComponent(<CheckboxField name={GroupProperties.excludeGroup} />);
			});

			it('should display the correct label', () => {
				const { queryByText } = renderRHFComponent(<CheckboxField name={GroupProperties.excludeGroup} />);
				expect(queryByText(EXCLUDE_GROUP_LABEL)).toBeInTheDocument();
			});

			it('should be undefined by default', async () => {
				const { rhfRef, container } = renderRHFComponent(<CheckboxField name={GroupProperties.excludeGroup} />);

				expect(getExcludeGroup(rhfRef.current)).toBe(undefined);
				expect(isCheckboxChecked(container)).toBe(false);
			});

			it('should have the same default value as the one provided to useForm hook', async () => {
				const { rhfRef, container } = renderRHFComponent(
					<CheckboxField name={GroupProperties.excludeGroup} />,
					{ properties: { exclusion: { group: true } } }
				);

				expect(getExcludeGroup(rhfRef.current)).toBe(true);
				expect(isCheckboxChecked(container)).toBe(true);
			});

			it('should change state when clicked', async () => {
				const user = userEvent.setup();

				const { rhfRef, container } = renderRHFComponent(
					<CheckboxField name={GroupProperties.excludeGroup} />,
					{ properties: { exclusion: { group: false } } }
				);

				expect(getExcludeGroup(rhfRef.current)).toBe(false);
				expect(isCheckboxChecked(container)).toBe(false);

				await user.click(getCheckbox(container));

				expect(getExcludeGroup(rhfRef.current)).toBe(true);
				expect(isCheckboxChecked(container)).toBe(true);
			});
		});
		describe('RadioGroupField', () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			function getVolumnExclusionFromRHF({ getValues }: UseFormReturn<any>) {
				return getValues().properties.exclusion.volumnOptions;
			}
			function getRadioButtons(container: HTMLElement) {
				return container.getElementsByClassName(MUI_RADIO_CLASSNAME);
			}
			function getCheckedRadioButton(container: HTMLElement) {
				const radioButtons = getRadioButtons(container);
				for (let i = 0; i < radioButtons.length; i++) {
					const radio = radioButtons[i];
					if (radio.classList.contains(MUI_CHECKED_CLASSNAME)) return i;
				}
				return undefined;
			}

			it('should render', () => {
				renderRHFComponent(<RadioGroupField name={GroupProperties.volumnExclusion} />);
			});
			it('should display the correct label', () => {
				const { queryByText } = renderRHFComponent(<RadioGroupField name={GroupProperties.volumnExclusion} />);

				expect(queryByText(VOLUMN_EXCLUSION.label)).toBeInTheDocument();
				for (const { label } of VOLUMN_EXCLUSION.menuItems) {
					expect(queryByText(label)).toBeInTheDocument();
				}
			});

			it('should be undefined by default', async () => {
				const { rhfRef, container } = renderRHFComponent(
					<RadioGroupField name={GroupProperties.volumnExclusion} />
				);

				expect(getVolumnExclusionFromRHF(rhfRef.current)).toBe(undefined);
				expect(getCheckedRadioButton(container)).toBe(undefined);
			});

			it('should have the same default value as the one provided to useForm hook', async () => {
				const { rhfRef, container } = renderRHFComponent(
					<RadioGroupField name={GroupProperties.volumnExclusion} />,
					{ properties: { exclusion: { volumnOptions: VOLUMN_EXCLUSION.menuItems[1].value } } }
				);

				expect(getVolumnExclusionFromRHF(rhfRef.current)).toBe(VOLUMN_EXCLUSION.menuItems[1].value);
				expect(getCheckedRadioButton(container)).toBe(1);
			});

			it('should change state when clicked', async () => {
				const user = userEvent.setup();
				const { rhfRef, container } = renderRHFComponent(
					<RadioGroupField name={GroupProperties.volumnExclusion} />,
					{ properties: { exclusion: { volumnOptions: VOLUMN_EXCLUSION.menuItems[0].value } } }
				);

				expect(getVolumnExclusionFromRHF(rhfRef.current)).toBe(VOLUMN_EXCLUSION.menuItems[0].value);
				expect(getCheckedRadioButton(container)).toBe(0);

				await user.click(getRadioButtons(container)[1]);

				expect(getVolumnExclusionFromRHF(rhfRef.current)).toBe(VOLUMN_EXCLUSION.menuItems[1].value);
				expect(getCheckedRadioButton(container)).toBe(1);
			});
		});

		describe('SelectField', () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			function getVolumnExclusionFromRHF({ getValues }: UseFormReturn<any>) {
				return getValues().properties.exclusion.volumnOptions;
			}
			function getSelectField(container: HTMLElement) {
				return container.getElementsByClassName(MUI_SELECT_CLASSNAME)[0];
			}
			function getSelectFieldLabel(container: HTMLElement) {
				return container.getElementsByClassName(MUI_SELECT_CLASSNAME)[0]?.textContent;
			}
			it('should render', () => {
				renderRHFComponent(<SelectField name={GroupProperties.volumnExclusion} />);
			});
			it('should display the correct label', async () => {
				const user = userEvent.setup();
				const { container, getByText } = renderRHFComponent(
					<SelectField name={GroupProperties.volumnExclusion} />
				);
				expect(getByText(VOLUMN_EXCLUSION.label, { selector: 'label' })).toBeInTheDocument();

				await user.click(getSelectField(container));

				for (const { label } of VOLUMN_EXCLUSION.menuItems) {
					expect(getByText(label)).toBeInTheDocument();
				}
			});
			it('should be undefined by default', async () => {
				const { rhfRef } = renderRHFComponent(<SelectField name={GroupProperties.volumnExclusion} />);

				expect(getVolumnExclusionFromRHF(rhfRef.current)).toBe(undefined);
			});

			it('should have the same default value as the one provided to useForm hook', async () => {
				const item = VOLUMN_EXCLUSION.menuItems[1];

				const { rhfRef, container } = renderRHFComponent(
					<SelectField name={GroupProperties.volumnExclusion} />,
					{ properties: { exclusion: { volumnOptions: item.value } } }
				);

				expect(getVolumnExclusionFromRHF(rhfRef.current)).toBe(item.value);
				expect(getSelectFieldLabel(container)).toBe(item.label);
			});

			it('should change state when clicked', async () => {
				const user = userEvent.setup();
				const firstItem = VOLUMN_EXCLUSION.menuItems[0];
				const secondItem = VOLUMN_EXCLUSION.menuItems[1];

				const { rhfRef, container, getByText } = renderRHFComponent(
					<SelectField name={GroupProperties.volumnExclusion} />,
					{ properties: { exclusion: { volumnOptions: firstItem.value } } }
				);

				expect(getVolumnExclusionFromRHF(rhfRef.current)).toBe(firstItem.value);
				expect(getSelectFieldLabel(container)).toBe(firstItem.label);

				await user.click(getSelectField(container));
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
				await user.click(getByText(secondItem.label)!);

				expect(getVolumnExclusionFromRHF(rhfRef.current)).toBe(secondItem.value);
				expect(getSelectFieldLabel(container)).toBe(secondItem.label);
			});
		});
	});
});
