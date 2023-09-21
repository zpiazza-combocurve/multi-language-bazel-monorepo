import { useFormContext } from 'react-hook-form';

import { FieldHeader } from '@/components/v2/misc';
import { MenuItem } from '@/components/v2/misc/SelectField';

import ForecastFormControl, { FormControlRangeField, getFormControlRules } from '../ForecastFormControl';
import { FormPhase } from '../automatic-form/types';
import { FormCollapse, SectionContainer } from './layout';

const modeItems: Array<MenuItem> = [
	{
		label: 'First',
		value: 'first',
	},
	{
		label: 'Last',
		value: 'last',
	},
	{
		label: 'Absolute Range',
		value: 'absolute_range',
	},
	{
		label: 'No Weighting Applied',
		value: 'all',
	},
];

const WeightedDataFields = ({
	open,
	phase,
	toggleOpen,
}: {
	open?: boolean;
	phase: FormPhase;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	toggleOpen?: () => any;
}) => {
	const { watch } = useFormContext();
	const basePath = `${phase}.weight_dict`;
	const [mode, unit] = watch([`${basePath}.mode`, `${basePath}.unit`]);
	return (
		<>
			<FieldHeader
				label='Weighting Data'
				open={open}
				toggleOpen={toggleOpen}
				tooltip='Uses weighted regression to fit the forecast model to production data. Useful for forecasting wells with multiple production regimes. Place a high weight on a production regime to cause the forecast to honor those data. Or, place a low weight on noisy data to cause the forecast to honor the remaining data.'
			/>

			<FormCollapse in={open}>
				<SectionContainer>
					<ForecastFormControl
						fullWidth
						label='Weighting Date Range'
						menuItems={modeItems}
						name={`${basePath}.mode`}
						required
						tooltip='Choose the range of data to weight.'
						type='select'
					/>

					{(mode === 'first' || mode === 'last') && (
						<FormControlRangeField
							dif={0}
							label={mode === 'last' ? 'Last Duration (Months)' : 'First Duration (Months)'}
							max={unit === 'percent' ? 100 : Infinity}
							min={1}
							name={`${basePath}.num_range`}
							required
							type='number'
						/>
					)}

					{mode === 'absolute_range' && (
						<FormControlRangeField name={`${basePath}.absolute_range`} required type='date' />
					)}

					{mode !== 'all' && (
						<ForecastFormControl
							label='Value'
							name={`${basePath}.value`}
							rules={getFormControlRules({ min: 0.01, max: 100, required: true })}
							tooltip='Choose a value for weighting the regression. Use a value of 10 to honor the selected range more than the remaining data. Use a value of 0.1 to honor the remaining data more than the selected range. A value equal to 1 will have no affect on the regression.'
							type='number'
						/>
					)}
				</SectionContainer>
			</FormCollapse>
		</>
	);
};

export default WeightedDataFields;
