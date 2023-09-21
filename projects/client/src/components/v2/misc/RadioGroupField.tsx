import {
	FormControl,
	FormControlLabel,
	FormControlProps,
	FormHelperText,
	FormLabel,
	Grid,
	Radio,
	RadioGroup,
	RadioGroupProps,
	TextFieldProps,
} from '@material-ui/core';
import { ForwardedRef, forwardRef } from 'react';

import { InfoTooltipWrapper } from '@/components/v2/misc';
import { InfoTooltipWrapperProps } from '@/components/v2/misc/InfoIcon';

import InfoIcon from './InfoIcon';

export type RadioGroupFieldProps = {
	name?: string;
	label?: string;
	options: { value: string; label: string; disabled?: boolean; tooltipInfo?: InfoTooltipWrapperProps }[];
	tooltipTitle?: string | React.ReactNode;
	// TODO: Check why Partial<BreakpointValues> doesn't work.
	/** Passing the `gridOptions` prop will make it rendered with `Grid` and `GridItem`s */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	gridOptions?: any;
} & FormControlProps &
	Pick<RadioGroupProps, 'onChange' | 'value' | 'row'> &
	Pick<TextFieldProps, 'error' | 'helperText'>;

/**
 * @example
 * 	enum Option {
 * 		Option1 = 'option1',
 * 		Option2 = 'option2',
 * 		Option3 = 'option3',
 * 	}
 *
 * 	const [value, setValue] = useState<Option>(Option.Option1);
 *
 * 	<RadioGroupField
 * 		name='radioGroup'
 * 		label='Radio Group'
 * 		value={value}
 * 		onChange={(ev) => setValue(ev.target.value)}
 * 		options={[
 * 			{ value: Option.Option1, label: 'Option 1' },
 * 			{
 * 				value: Option.Option2,
 * 				label: 'Option 2',
 * 				tooltipInfo: { tooltipTitle: 'Tooltip Title' },
 * 			},
 * 			{ value: Option.Option3, label: 'Option 3', disabled: true },
 * 		]}
 * 		tooltipTitle='Tooltip Title'
 * 		error={Boolean(error)}
 * 		helperText={error}
 * 		row
 * 	/>;
 */
function RadioGroupField(
	{
		value,
		onChange,
		name,
		label,
		options,
		error,
		helperText,
		row,
		tooltipTitle,
		gridOptions,
		...rest
	}: RadioGroupFieldProps,
	ref: ForwardedRef<HTMLDivElement>
) {
	return (
		<FormControl {...rest} error={error} ref={ref}>
			{label && (
				<FormLabel component='legend'>
					{label} {tooltipTitle && <InfoIcon tooltipTitle={tooltipTitle} withLeftMargin />}
				</FormLabel>
			)}
			<RadioGroup {...{ row, name, onChange, value }}>
				{gridOptions ? (
					<Grid container>
						{options.map(
							({ label: optionLabel, value: optionValue, disabled: optionDisabled, tooltipInfo }) => (
								<Grid item key={optionValue} {...gridOptions}>
									<InfoTooltipWrapper {...tooltipInfo}>
										{' '}
										<FormControlLabel
											value={optionValue}
											control={<Radio />}
											label={optionLabel}
											disabled={optionDisabled}
										/>{' '}
									</InfoTooltipWrapper>
								</Grid>
							)
						)}
					</Grid>
				) : (
					options.map(({ label: optionLabel, value: optionValue, disabled: optionDisabled, tooltipInfo }) => (
						<InfoTooltipWrapper key={optionValue} {...tooltipInfo}>
							<FormControlLabel
								value={optionValue}
								control={<Radio />}
								label={optionLabel}
								disabled={optionDisabled}
							/>
						</InfoTooltipWrapper>
					))
				)}
			</RadioGroup>
			{helperText && <FormHelperText error={error}>{helperText}</FormHelperText>}
		</FormControl>
	);
}

export default forwardRef(RadioGroupField);
