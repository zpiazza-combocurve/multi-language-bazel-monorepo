import produce from 'immer';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from 'react-query';

import { useDerivedState } from '@/components/hooks';
import { alerts } from '@/components/v2';
import { updateSinglePhaseForecast } from '@/forecasts/api';
import { useForecastForm } from '@/forecasts/forecast-form/shared';
import { genericErrorAlert, withLoadingBar } from '@/helpers/alerts';
import { postApi } from '@/helpers/routing';
import { local } from '@/helpers/storage';

// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
const noop = () => {};

const alertMessage = (title, text = '') =>
	alerts.confirm({
		confirmText: 'Close',
		hideCancelButton: true,
		helperText: text,
		title,
	});

const normalizeResolution = (resolution) => {
	if (!resolution) {
		return resolution;
	}
	return resolution?.includes('daily') ? 'daily' : 'monthly';
};

export const getReforecastResolution = (resolution) => {
	if (!resolution) {
		return resolution;
	}
	return resolution?.includes('daily') ? 'daily_only' : 'monthly_only';
};

export const useAutoReforecast = ({
	forecastId,
	wellId,
	phase,
	forecastType = 'probabilistic',
	resolution: _parentResolution = null,
	setEdited = noop,
	setAutoData,
}) => {
	/** Temporal unsaved, well forecast value, will be cleared when changing wellId or phase */
	const [forecastedDict, setForecastedDict] = useDerivedState(null, [wellId, phase]);
	/** Valid indexes to forecast, this value is set from the parent. null means there's no valid index */
	const [validIdx, _setValidIdx] = useState(null);

	const tempDateRef = useRef(null);

	const parentResolution = useMemo(() => getReforecastResolution(_parentResolution), [_parentResolution]);

	const runForecast = useCallback(
		async (adjSettings) => {
			let adjustedSettings = adjSettings;
			if (tempDateRef.current) {
				adjustedSettings = produce(adjSettings, (draft) => {
					draft[phase] ??= { time_dict: {} };
					draft[phase].time_dict.mode = 'absolute_range';
					draft[phase].time_dict.absolute_range = tempDateRef.current;
				});
			}

			const body = { settings: { ...adjustedSettings, valid_idx: validIdx }, resolution: parentResolution };

			try {
				const dict = await withLoadingBar(postApi(`/forecast/${forecastId}/auto-reforecast/${wellId}`, body));
				const { forecastType: dictForecastType, warning: { message, status } = {} } = dict;

				if (dictForecastType === 'not_forecasted') {
					alertMessage(
						'No Forecast Returned',
						'Forecast returned no segments. Please adjust the forecasting parameters and try again.'
					);
				} else {
					if (status) {
						alertMessage('Warning Forecasting Well', message);
					}
					_setValidIdx(null);

					// HACK: separate functions to keep backwards-compatibility with probabilistic forecast
					// deterministic - setAutoData; probabilistic - setForecastedDict
					if (setAutoData) {
						setAutoData(dict);
					} else {
						setForecastedDict(dict);
					}
				}
			} catch (error) {
				genericErrorAlert(error);
			} finally {
				tempDateRef.current = null;
			}
		},
		[forecastId, parentResolution, phase, setAutoData, setForecastedDict, validIdx, wellId]
	);

	const { formikBundle, formTemplates, showConfigDialog, configDialog, loading } = useForecastForm({
		currentPhase: phase,
		forecastId,
		forecastType,
		// initialResolution: getReforecastResolution(local.getItem('manualEditingResolution') ?? 'monthly'),
		onSubmit: runForecast,
	});
	const { values, setFieldValue } = formikBundle;

	const { resolution } = values.shared ?? {};
	const { axis_combo, basePhase } = values[phase] ?? {};

	const { isLoading: saving, mutateAsync: save } = useMutation(async () => {
		try {
			const body = { phase, data: forecastedDict };
			await updateSinglePhaseForecast(forecastId, wellId, body);
			setForecastedDict(null);
		} catch (error) {
			genericErrorAlert(error);
		}
	});

	const setDateSelection = useCallback(
		async (startDate, endDate) => {
			tempDateRef.current = [startDate, endDate];
			formikBundle.submitForm();
			setEdited(true);
		},
		[formikBundle, setEdited]
	);

	const setValidIdx = useCallback(
		(input) => {
			_setValidIdx(input);
			formikBundle.submitForm();
			setEdited(true);
		},
		[formikBundle, setEdited]
	);

	// eslint-disable-next-line react/jsx-no-useless-fragment -- TODO eslint fix later
	const dialogs = <>{configDialog}</>; // More dialogs will come here, like warnings and such

	const setResolution = (newResolution) => {
		local.setItem('manualEditingResolution', newResolution);
		setFieldValue('shared.resolution', getReforecastResolution(newResolution));
	};

	// clear setValidIdx when changing phase, axis combo, etc
	useEffect(() => {
		_setValidIdx(null);
	}, [axis_combo, basePhase, phase, resolution, wellId]);

	return {
		run: formikBundle.submitForm,
		save,
		setValidIdx,
		saving,
		formTemplates,
		showConfigDialog,
		dialogs,
		loading,
		forecastedDict,
		formikBundle,
		setDateSelection,
		validIdx,
		resolution: normalizeResolution(resolution),
		setResolution,
	};
};
