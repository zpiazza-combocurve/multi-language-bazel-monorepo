import { useFormContext } from 'react-hook-form';

import { FieldHeader } from '@/components/v2/misc';

import ForecastFormControl, { getFormControlRules } from '../ForecastFormControl';
import { FormPhase } from '../automatic-form/types';
import { FormCollapse, SectionContainer } from './layout';

const LowDataFields = ({
	open,
	phase,
	showMatchEur,
	toggleOpen,
}: {
	open?: boolean;
	phase: FormPhase;
	showMatchEur: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	toggleOpen?: () => any;
}) => {
	const { watch } = useFormContext();
	const [useMinData, useLowData] = watch([`${phase}.use_minimum_data`, `${phase}.use_low_data_forecast`]);
	return (
		<>
			<FieldHeader
				label='Low Data Forecast Settings'
				open={open}
				toggleOpen={toggleOpen}
				tooltip='Modify thresholds for forecasting low amounts of production data.'
			/>

			<FormCollapse in={open}>
				<SectionContainer>
					<ForecastFormControl
						fullWidth
						inForm={false}
						label='Require Minimum Amount of Data To Forecast'
						name={`${phase}.use_minimum_data`}
						tooltip='If checked, forecast generation requires the indicated number of data points within the entire production history. Lower amounts of production data will generate a warning, and no forecast will be given.'
						type='boolean'
					/>

					<ForecastFormControl
						disabled={!useMinData}
						fullWidth
						label='Min Production Data (# of Data Points)'
						name={`${phase}.short_prod_threshold`}
						rules={getFormControlRules({ required: true, isInteger: true, min: 0 })}
						type='number'
					/>

					{showMatchEur && (
						<>
							<ForecastFormControl
								fullWidth
								inForm={false}
								label='Enable Historically Informed Forecast'
								name={`${phase}.use_low_data_forecast`}
								tooltip='If checked, forecasts with low amounts of production data after the identified peak will be matched to the historical trend. The identified range and up to 5 years of history will be used to inform the forecast. If unchecked, forecasts will not be generated from fewer than two data points.'
								type='boolean'
							/>

							<ForecastFormControl
								disabled={!useLowData}
								fullWidth
								label='Threshold (# of Data Points)'
								name={`${phase}.low_data_threshold`}
								rules={getFormControlRules({ required: false, isInteger: true })}
								tooltip='If the number of data points from the identified peak to the end of production data is equal to or smaller than the Low Data Threshold, then the Historically Informed Forecast is used. E.g., at a Low Data Threshold of 4, the Historically Informed Forecast will be used for 4 data points, but not 5. If no value is given, defaults to a threshold of 3 data points for monthly data and 32 data points for daily data.'
								type='number'
							/>
						</>
					)}
				</SectionContainer>
			</FormCollapse>
		</>
	);
};

export default LowDataFields;
