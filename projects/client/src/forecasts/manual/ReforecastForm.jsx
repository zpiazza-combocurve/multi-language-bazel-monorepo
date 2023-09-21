import { faUserCog } from '@fortawesome/pro-regular-svg-icons';
import { FormikContext } from 'formik';
import { forwardRef, useEffect, useImperativeHandle } from 'react';

import { SHORT_PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/access-policies/Can';
import usePermissions from '@/access-policies/usePermissions';
import { Button, Divider } from '@/components';
import { useHotkey } from '@/components/hooks/useHotkey';
import { ForecastDescriptionPanel } from '@/forecasts/deterministic/manual/ForecastDescriptionPanel';
import { PhaseForm } from '@/forecasts/forecast-form/PhaseForm';
import { EditingForm, PhaseSelectField } from '@/forecasts/manual/EditingLayout';

import { getReforecastResolution, useAutoReforecast } from './AutoReforecast';
import ResolutionToggle from './shared/ResolutionToggle';

// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
const noop = () => {};

const ReforecastForm = forwardRef(
	(
		{
			auto,
			changePhase,
			curData,
			curWell,
			forecast,
			forecastDataFreq,
			forecasted,
			onChangeSegIdx = noop,
			onChangeSeries = noop,
			onForecast = noop,
			onSave = noop,
			phase,
			remove,
			resolution,
			segments = null,
			setResolution: setParentResolution = noop,
		},
		ref
	) => {
		const wellId = curData?.headers?._id;
		const forecastType = 'probabilistic';

		const {
			run,
			save,
			forecastedDict,
			formikBundle,
			setDateSelection,
			showConfigDialog,
			validIdx,
			dialogs,
			setResolution: setSharedFormResolution,
		} = useAutoReforecast({ forecastId: forecast?._id, wellId, phase, forecastType, resolution });

		const runForecast = () => run();
		const saveForecast = () => save().then(onSave);

		const { autoRef, saveRef } = ref;
		useImperativeHandle(autoRef, () => ({ setDateSelection }));
		useImperativeHandle(saveRef, () => ({ saveForecast }));

		const isMac = navigator.userAgent.includes('Mac');
		const saveKeys = isMac ? 'command+s' : 'ctrl+s';

		useHotkey(saveKeys, () => {
			if (!forecastedDict) {
				return false;
			}
			saveForecast();
			return false;
		});

		useEffect(() => {
			if (forecastedDict) {
				onForecast(forecastedDict);
			}
		}, [forecastedDict, onForecast]);

		const { canUpdate: canUpdateForecast } = usePermissions(SUBJECTS.Forecasts, forecast.project._id);

		const setResolution = (resolution) => {
			setParentResolution(resolution);
			setSharedFormResolution(resolution);
		};

		return (
			<EditingForm
				actions={
					<>
						<Button
							onClick={saveForecast}
							primary
							tooltipLabel={!canUpdateForecast && SHORT_PERMISSIONS_TOOLTIP_MESSAGE}
							tooltipPosition='right'
							disabled={!canUpdateForecast || !forecasted}
						>
							Save
						</Button>

						<Button
							onClick={runForecast}
							secondary
							tooltipLabel={!canUpdateForecast && SHORT_PERMISSIONS_TOOLTIP_MESSAGE}
							tooltipPosition='right'
							disabled={!canUpdateForecast || !formikBundle.isValid}
						>
							Forecast
						</Button>

						<Button onClick={remove} warning tooltipLabel='Remove From Editing' tooltipPosition='left'>
							Remove
						</Button>

						<Button
							small
							primary
							faIcon={faUserCog}
							onClick={() => showConfigDialog(getReforecastResolution(resolution))}
							disabled={!canUpdateForecast}
							tooltipLabel={
								!canUpdateForecast ? SHORT_PERMISSIONS_TOOLTIP_MESSAGE : 'Settings Configurations'
							}
							tooltipPosition='left'
						/>
					</>
				}
			>
				<PhaseSelectField onChange={changePhase} value={phase} />

				<Divider />

				<FormikContext.Provider value={formikBundle}>
					<ResolutionToggle resolution={resolution} setResolution={setResolution} />
					<PhaseForm
						phase={phase}
						forecastType={forecastType}
						disableFilter={validIdx?.length}
						rateOnly
						showType
						showModel
						showAdvanced
					/>
				</FormikContext.Provider>

				<ForecastDescriptionPanel
					dataFreq={forecastDataFreq}
					forecastType='rate'
					monthlyProduction={forecastDataFreq === 'monthly' ? curData.production : null}
					dailyProduction={forecastDataFreq === 'daily' ? curData.production : null}
					onChangePhase={changePhase}
					onChangeSegIdx={onChangeSegIdx}
					onChangeSeries={onChangeSeries}
					phase={phase}
					segIdx={auto.segIdx}
					segments={segments}
					series={auto.series}
					wellId={curWell}
				/>

				{dialogs}
			</EditingForm>
		);
	}
);

export default ReforecastForm;
