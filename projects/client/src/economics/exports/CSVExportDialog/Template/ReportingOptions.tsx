import { styled } from '@material-ui/core';
import { memo } from 'react';

import { FormControlLabel, Radio, RadioGroup, TextField, TooltipedCheckboxField, Typography } from '@/components/v2';

export interface ReportingOptionsProps {
	id?: string;
	onChangeRadioButton;
	onChangeTimePeriod;
	disabled?: boolean;
	radioOptions: Record<string, string>;
	radioValue: string | null | undefined;
	radioGroupName: string;
	timeFieldValue: number | null | undefined;
	timeFieldLabel: string;
	title: string;
	isValid?: boolean;
	errorMessage?: string;
	showCheckboxForInput?: boolean;
	checkboxLabel?: string;
	checkboxTooltip?: string;
	checkboxStatus?: boolean;
	onChangeCheckbox?;
	variant?: 'vertical-radio-btns';
}

const ErrorWrapper = styled('div')(({ theme }) => ({
	color: theme.palette.error.main,
	height: '1ch',
}));

export const ReportingOptions = memo((props: ReportingOptionsProps) => {
	const {
		id,
		onChangeRadioButton,
		onChangeTimePeriod,
		disabled = false,
		radioOptions,
		radioValue,
		radioGroupName,
		timeFieldValue,
		timeFieldLabel,
		title,
		showCheckboxForInput = false,
		checkboxLabel,
		checkboxTooltip,
		onChangeCheckbox,
		checkboxStatus,
		isValid = true,
		errorMessage = '',
		variant,
	} = props;

	const isVerticalRadioBtns = variant === 'vertical-radio-btns';

	return (
		<div id={id}>
			<Typography variant='subtitle1'>{title}</Typography>
			<div
				css={`
					display: flex;
					flex-direction: ${isVerticalRadioBtns ? 'row' : 'column'};
				`}
			>
				<RadioGroup
					row
					name={radioGroupName}
					value={radioValue}
					onChange={onChangeRadioButton}
					css={`
						display: flex;
						flex-direction: ${isVerticalRadioBtns ? 'column' : 'row'};
						order: ${isVerticalRadioBtns ? 0 : 1};
					`}
				>
					{Object.keys(radioOptions).map((name) => (
						<FormControlLabel
							control={<Radio checked={radioValue === name} />}
							label={radioOptions[name]}
							value={name}
							key={name}
							disabled={disabled}
						/>
					))}
				</RadioGroup>
				<div>
					<TextField
						fullWidth
						type='number'
						value={timeFieldValue ?? ''}
						label={timeFieldLabel}
						variant='outlined'
						disabled={disabled || (showCheckboxForInput && !checkboxStatus)}
						onChange={onChangeTimePeriod}
						name='time-period'
					/>
					<ErrorWrapper>{!isValid ? errorMessage : ''}</ErrorWrapper>
					{showCheckboxForInput && (
						<TooltipedCheckboxField
							label={checkboxLabel}
							tooltip={checkboxTooltip}
							checked={checkboxStatus}
							onChange={onChangeCheckbox}
							disabled={disabled}
						/>
					)}
				</div>
			</div>
		</div>
	);
});

export default ReportingOptions;
