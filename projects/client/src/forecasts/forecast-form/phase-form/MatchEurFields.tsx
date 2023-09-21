import _ from 'lodash-es';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useQuery } from 'react-query';

import { FieldHeader } from '@/components/v2/misc';
import { MenuItem } from '@/components/v2/misc/SelectField';
import { fetchProjectForecasts } from '@/forecasts/api';
import { useAlfa } from '@/helpers/alfa';
import { assert } from '@/helpers/utilities';

import ForecastFormControl, { getFormControlRules } from '../ForecastFormControl';
import { FormPhase } from '../automatic-form/types';
import { FormCollapse, SectionContainer } from './layout';

const matchTypeItems: Array<MenuItem> = [
	{ label: 'No Match', value: 'no_match' },
	{ label: 'Match Forecast', value: 'forecast' },
	{ label: 'Fixed Value', value: 'number' },
];

const MatchEurFields = ({
	forecastId,
	phase,
	open,
	toggleOpen,
}: {
	forecastId: string;
	phase: FormPhase;
	open?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	toggleOpen?: () => any;
}) => {
	const { project } = useAlfa();
	assert(project?._id, 'Expected project ID to be in scope');

	const { setValue, watch } = useFormContext();
	const basePath = `${phase}.match_eur`;
	const [matchType, matchForecastId] = watch([`${basePath}.match_type`, `${basePath}.match_forecast_id`]);

	const { data: sameProjectForecasts, isLoading: loadingForecasts } = useQuery(
		['forecast', 'all-forecast-in-project', project._id],
		() => fetchProjectForecasts(project._id)
	);

	const forecastsByKey = _.keyBy(sameProjectForecasts, '_id');
	const forecastOptions = _.map(sameProjectForecasts, '_id');
	const getForecastLabel = (value) => forecastsByKey?.[value]?.name ?? value;

	// enforce matchForecastId
	useEffect(() => {
		if (!(matchForecastId || loadingForecasts)) {
			setValue(`${basePath}.match_forecast_id`, forecastId);
		}
	}, [basePath, forecastId, loadingForecasts, matchForecastId, setValue]);

	return (
		<>
			<FieldHeader
				label='EUR Restrictions'
				open={open}
				toggleOpen={toggleOpen}
				tooltip='Forecast will be made to match the production data, while also fitting the supplied EUR.'
			/>

			<FormCollapse in={open}>
				<SectionContainer>
					<ForecastFormControl
						label='Match EUR'
						menuItems={matchTypeItems}
						name={`${basePath}.match_type`}
						required
						tooltip={matchType === 'forecast' ? 'Match a previously forecasted EUR.' : undefined}
						type='select'
					/>

					{matchType === 'number' && (
						<ForecastFormControl
							label='Match EUR Value'
							name={`${basePath}.match_eur_num`}
							required
							type='number'
						/>
					)}

					{matchType === 'forecast' && !loadingForecasts && (
						<>
							<ForecastFormControl
								getOptionLabel={getForecastLabel}
								label='Forecast'
								name={`${basePath}.match_forecast_id`}
								options={forecastOptions}
								required
								type='autocomplete'
							/>

							<ForecastFormControl
								label='Increase/Decrease EUR by Delta %'
								name={`${basePath}.match_percent_change`}
								required
								tooltip='Specify preferred increase or decrease (eg: -5% reduces EUR by 5 percent).'
								type='number'
							/>
						</>
					)}

					{(matchType === 'forecast' || matchType === 'number') && (
						<ForecastFormControl
							fullWidth
							label='Match EUR Tolerance Window (+/- % EUR)'
							name={`${basePath}.error_percentage`}
							rules={getFormControlRules({ min: 1, max: 100, required: true })}
							tooltip='Forecast will be within [Window]% of the matched EUR. Lower values will result in a closer EUR match at the expense of a weaker match to production data.'
							type='number'
						/>
					)}
				</SectionContainer>
			</FormCollapse>
		</>
	);
};

export default MatchEurFields;
