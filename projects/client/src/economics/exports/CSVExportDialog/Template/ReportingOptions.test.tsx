import { fireEvent, render } from '@testing-library/react';

import ReportingOptions from './ReportingOptions';

const defaultProps = {
	title: 'My Title',
	// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
	onChangeRadioButton: () => {},
	// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
	onChangeTimePeriod: () => {},
	radioOptions: { option1: 'Option 1', option2: 'Option 2' },
	radioValue: 'radio-btns',
	radioGroupName: 'radio-group',
	timeFieldValue: 1,
	timeFieldLabel: 'Time field label',
};

describe('ReportingOptions component', () => {
	it('renders the title correctly', () => {
		const { getByText } = render(<ReportingOptions {...defaultProps} />);
		expect(getByText('My Title')).toBeInTheDocument();
	});

	it('handles radio button change', () => {
		const onChangeRadioButton = vi.fn();
		const { getByLabelText } = render(
			<ReportingOptions {...defaultProps} onChangeRadioButton={onChangeRadioButton} />
		);
		fireEvent.click(getByLabelText('Option 1'));
		expect(onChangeRadioButton).toHaveBeenCalled();
	});

	it('handles text field change', () => {
		const onChangeTimePeriod = vi.fn();
		const { container } = render(
			<ReportingOptions {...defaultProps} timeFieldLabel='Time Period' onChangeTimePeriod={onChangeTimePeriod} />
		);
		const inputNumberField = container.querySelector('[type="number"]');
		if (!inputNumberField) throw new Error('Input number field not found');
		fireEvent.change(inputNumberField, { target: { value: '10' } });
		expect(onChangeTimePeriod).toHaveBeenCalled();
	});

	it('renders the checkbox field when showCheckboxForInput is true', () => {
		const { getByLabelText } = render(
			<ReportingOptions {...defaultProps} showCheckboxForInput checkboxLabel='My Checkbox' />
		);
		expect(getByLabelText('My Checkbox')).toBeInTheDocument();
	});

	it('does not render the checkbox field when showCheckboxForInput is false', () => {
		const { queryByLabelText } = render(<ReportingOptions {...defaultProps} checkboxLabel='My Checkbox' />);
		expect(queryByLabelText('My Checkbox')).not.toBeInTheDocument();
	});

	it('handles checkbox change', () => {
		const onChangeCheckbox = vi.fn();
		const { getByLabelText } = render(
			<ReportingOptions
				{...defaultProps}
				showCheckboxForInput
				checkboxLabel='My Checkbox'
				onChangeCheckbox={onChangeCheckbox}
			/>
		);
		fireEvent.click(getByLabelText('My Checkbox'));
		expect(onChangeCheckbox).toHaveBeenCalled();
	});

	it('the input field is not disabled when the checkbox is checked', () => {
		const onChangeCheckbox = vi.fn();
		const { container } = render(
			<ReportingOptions
				{...defaultProps}
				showCheckboxForInput
				checkboxLabel='My Checkbox'
				onChangeCheckbox={onChangeCheckbox}
				checkboxStatus
			/>
		);

		const inputNumberField = container.querySelector('[type="number"]');

		expect(inputNumberField).toBeEnabled();
	});

	it('disables the input field when the checkbox is unchecked', () => {
		const onChangeCheckbox = vi.fn();
		const { container } = render(
			<ReportingOptions
				{...defaultProps}
				showCheckboxForInput
				checkboxLabel='My Checkbox'
				onChangeCheckbox={onChangeCheckbox}
				checkboxStatus={false}
			/>
		);

		const inputNumberField = container.querySelector('[type="number"]');

		expect(inputNumberField).toBeDisabled();
	});
});
