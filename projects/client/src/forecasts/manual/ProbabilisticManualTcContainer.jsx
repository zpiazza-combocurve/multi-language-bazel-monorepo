import produce from 'immer';
import { set } from 'lodash-es';
import { forwardRef, useContext, useImperativeHandle } from 'react';
import { useMutation } from 'react-query';

import { SHORT_PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/access-policies/Can';
import usePermissions from '@/access-policies/usePermissions';
import { Button, Divider } from '@/components';
import { updateSinglePhaseForecast } from '@/forecasts/api';
import { ForecastDescriptionPanel } from '@/forecasts/deterministic/manual/ForecastDescriptionPanel';
import { ManualActionsContainer } from '@/forecasts/deterministic/manual/layout';
import ManualApplyTypeCurve from '@/forecasts/manual/ManualApplyTypeCurve';
import { ManualEditingTypeCurveContext } from '@/forecasts/manual/ManualEditingTypeCurveContext';
import ResolutionToggle from '@/forecasts/manual/shared/ResolutionToggle';
import { warningAlert } from '@/helpers/alerts';

import { PhaseSelectField } from './EditingLayout';

const ProbabilisticManualTcContainer = forwardRef((props, ref) => {
	const { curData, changePhase, curPhase, curWell, forecastId, forecast, resolution, setResolution, setParentState } =
		props;

	const { pSeries, segIdx, setPSeries, setSegIdx, typeCurveDict, generateSaveTCInfo } =
		useContext(ManualEditingTypeCurveContext);

	const { isLoading: savingForecast, mutateAsync: saveForecast } = useMutation(async () => {
		try {
			const newData = produce(curData, (data) => {
				const newPDict = Object.entries(typeCurveDict).reduce((obj, [key, value]) => {
					const series = { diagnostics: {}, segments: value };
					return { ...obj, [key]: series };
				}, {});

				const basePath = `data.${curPhase}`;
				set(data, `${basePath}.P_dict`, newPDict);
				set(data, `${basePath}.forecastType`, 'typecurve');
				set(data, `${basePath}.forecasted`, true);
				const { saveTCId, saveTCSetting } = generateSaveTCInfo();
				if (saveTCId && saveTCSetting) {
					set(data, `${basePath}.typeCurve`, saveTCId);
					set(data, `${basePath}.typeCurveApplySetting`, saveTCSetting);
				}
			});

			const body = {
				phase: curPhase,
				data: newData.data[curPhase],
			};

			await updateSinglePhaseForecast(forecastId, curWell, body);
			setParentState({ curData: newData });
		} catch (error) {
			warningAlert(error.message);
		}
	});

	useImperativeHandle(ref, () => ({ saveForecast }));

	const { canUpdate: canUpdateForecast } = usePermissions(SUBJECTS.Forecasts, forecast.project._id);

	const validRiskFactor = generateSaveTCInfo?.()?.saveTCSetting?.riskFactor > 0;

	return (
		<>
			<ManualActionsContainer>
				<Button
					disabled={!canUpdateForecast || savingForecast || !typeCurveDict || !validRiskFactor}
					tooltipLabel={!canUpdateForecast && SHORT_PERMISSIONS_TOOLTIP_MESSAGE}
					primary
					onClick={saveForecast}
				>
					Save
				</Button>
			</ManualActionsContainer>

			<Divider />

			<PhaseSelectField onChange={changePhase} value={curPhase} />

			<ResolutionToggle resolution={resolution} setResolution={setResolution} />

			<Divider />

			<ManualApplyTypeCurve
				forecastId={forecastId}
				forecastType='probabilistic'
				phase={curPhase}
				wellId={curWell}
			/>

			<Divider />

			<ForecastDescriptionPanel
				dailyProduction={resolution === 'daily' && curData.production}
				dataFreq={resolution}
				forecastType='rate'
				monthlyProduction={resolution === 'monthly' && curData.production}
				onChangePhase={changePhase}
				onChangeSegIdx={setSegIdx}
				onChangeSeries={setPSeries}
				phase={curPhase}
				segIdx={segIdx}
				segments={typeCurveDict?.[pSeries]}
				series={pSeries}
				wellId={curWell}
			/>
		</>
	);
});

export default ProbabilisticManualTcContainer;
