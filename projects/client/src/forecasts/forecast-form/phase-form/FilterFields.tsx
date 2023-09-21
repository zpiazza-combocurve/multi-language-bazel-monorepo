import { useFormContext } from 'react-hook-form';

import { FieldHeader } from '@/components/v2/misc';
import { MenuItem } from '@/components/v2/misc/SelectField';
import { useWellColumns } from '@/well-sort/WellSort';

import ForecastFormControl, { FormControlRangeField, getFormControlRules } from '../ForecastFormControl';
import { FormPhase } from '../automatic-form/types';
import { FormCollapse, SectionContainer } from './layout';

const internalFilterItems: Array<MenuItem> = [
	{
		label: 'None',
		value: 'none',
	},
	{
		label: 'Low',
		value: 'low',
	},
	{
		label: 'Medium',
		value: 'mid',
	},
	{
		label: 'High',
		value: 'high',
	},
	{
		label: 'Very High',
		value: 'very_high',
	},
];

const modeDateItems: Array<MenuItem> = [
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
		label: 'All',
		value: 'all',
	},
	{
		label: 'Range from Header',
		value: 'header_range',
	},
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const FilterFields = ({ phase, open, toggleOpen }: { phase: FormPhase; open?: boolean; toggleOpen?: () => any }) => {
	const { watch } = useFormContext();
	const [timeDictMode, timeDictUnit] = watch([`${phase}.time_dict.mode`, `${phase}.time_dict.unit`]);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const columns = useWellColumns() as Record<string, any>;
	const availableColumnsKey = Object.entries(columns)
		.filter(([, v]) => v.type === 'date')
		.map(([k]) => k);

	return (
		<>
			<FieldHeader
				label='Filter Options'
				open={open}
				toggleOpen={toggleOpen}
				tooltip='Filtering data is done prior to finding peak and determines what data is used for curve fitting.'
			/>

			<FormCollapse in={open}>
				<SectionContainer>
					<ForecastFormControl
						label='Data Density'
						menuItems={internalFilterItems}
						name={`${phase}.internal_filter`}
						required
						tooltip='Filter to remove outliers. Use higher filter levels for noisier data, and lower levels for cleaner data.'
						type='select'
					/>

					<ForecastFormControl
						label='Remove Zero Values'
						name={`${phase}.remove_0`}
						tooltip='If checked, zero production values are removed prior to generating forecast.'
						type='boolean'
					/>

					<ForecastFormControl
						label='Date'
						menuItems={modeDateItems}
						name={`${phase}.time_dict.mode`}
						required
						tooltip='Date range considered in forecast.'
						type='select'
					/>

					{(timeDictMode === 'first' || timeDictMode === 'last') && (
						<FormControlRangeField
							dif={0}
							label={timeDictMode === 'last' ? 'Last Duration (Months)' : 'First Duration (Months)'}
							max={timeDictUnit === 'percent' ? 100 : Infinity}
							min={1}
							name={`${phase}.time_dict.num_range`}
							required
							type='number'
						/>
					)}

					{timeDictMode === 'absolute_range' && (
						<FormControlRangeField name={`${phase}.time_dict.absolute_range`} required type='date' />
					)}

					{timeDictMode === 'header_range' && (
						<FormControlRangeField
							getOptionLabel={(columnKey) => columns?.[columnKey]?.label}
							label='Date Headers'
							name={`${phase}.time_dict.header_range`}
							options={availableColumnsKey}
							required
							tooltip='Choose 2 date headers and use data between the two dates.'
							type='autocomplete'
						/>
					)}

					<FormControlRangeField
						dif={0.01}
						label='Value'
						min={0}
						name={`${phase}.value_range`}
						required
						tooltip='Data outside the specified range are ignored.'
						type='number'
					/>

					<FormControlRangeField
						dif={0.01}
						label='Percentile (%)'
						max={100}
						min={0}
						name={`${phase}.percentile_range`}
						required
						tooltip='Retains data within the specified percentile range.'
						type='number'
					/>

					<ForecastFormControl
						label='Moving Average (Days)'
						name={`${phase}.moving_average_days`}
						rules={getFormControlRules({ min: 0, isInteger: true, required: true })}
						tooltip='Used to improve fit for infrequent sales data or erratic production. Prior to fit, this function averages each production value landing in the preceding number of days to smooth the data. For monthly data, use a conversion factor of 30 days to 1 month. E.g., use 90 days to smooth three months of monthly data, or 10 days to smooth daily data. A setting of 0 days preserves the original data.'
						type='number'
					/>
				</SectionContainer>
			</FormCollapse>
		</>
	);
};

export default FilterFields;
