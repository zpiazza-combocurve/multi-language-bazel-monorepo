import { useFormik } from 'formik';
import produce from 'immer';
import _, { cloneDeep, get, set } from 'lodash-es';
import { useCallback, useEffect, useMemo } from 'react';
import { useQuery } from 'react-query';

import { useFormikReducer, useGetter } from '@/components/hooks';
import GenericDialog from '@/components/v2/alerts/GenericDialog';
import { VALID_PHASES } from '@/forecasts/charts/components/graphProperties';
import { useConfigurationDialog } from '@/forecasts/configurations/ConfigurationDialog';
import { parseAutomaticForecastValues } from '@/forecasts/forecast-form/automatic-form/useAutomaticForecast';
import { getUnitTemplates } from '@/forecasts/shared';
import { counter } from '@/helpers/Counter';
import { useAlfa } from '@/helpers/alfa';
import { makeUtc } from '@/helpers/date';
import { useDialog } from '@/helpers/dialog';
import { getApi } from '@/helpers/routing';
import { getConvertFunc } from '@/helpers/units';
import { clone, deepMerge, multiGet, multiSet } from '@/helpers/utilities';
import { convertDateToIdx, phases } from '@/helpers/zing';
import { fields as formTemplates } from '@/inpt-shared/display-templates/forecast/forecast_forms.json';

import { cleanConfig, mapConfig } from './forecastConfig';

const DEFAULT_RESOLUTION = 'monthly';

const DEFAULT_AXIS_COMBO = 'rate';

const DEFAULT_MODEL = { rate: 'arps_modified_wp', ratio: 'flat' };

export const PhaseFormFields = {
	rate: [
		'dispersion',
		'flat_forecast_thres',
		'internal_filter',
		'internal_filter_all',
		'peak_preference',
		'peak_sensitivity',
		'percentile_range',
		'q_final',
		'remove_0',
		'time_dict',
		'moving_average_days',
		'valid_idx',
		'value_range',
		'well_life_dict',
		'match_eur',
		'weight_dict',
		'use_low_data_forecast',
		'low_data_threshold',
		'use_minimum_data',
		'short_prod_threshold',
	],
	ratio: [
		'base_phase',
		'flat_forecast_thres',
		'internal_filter',
		'internal_filter_all',
		'peak_sensitivity',
		'percentile_range',
		'remove_0',
		'moving_average_days',
		'time_dict',
		'valid_idx',
		'value_range',
		'well_life_dict',
		'match_eur',
		'weight_dict',
	],
};

const defaultGenSettings = (model_name, templates, resolution = 'monthly') => {
	if (!templates) {
		return {};
	}

	return {
		overwrite_manual: false,
		model_name,
		percentile: [10, 50, 90],
		phases: phases.map(({ value }) => value),
		prob_para: templates[model_name].prob_para,
		resolution: resolution === 'monthly' ? 'monthly_only' : 'daily_only',
	};
};

const defaultWellLifeDict = {
	well_life_method: 'duration_from_first_data',
	num: 60,
	unit: 'year',
	fixed_date: new Date(),
};

const defaultTimePeriod = {
	absolute_range: [new Date(), new Date()],
	mode: 'last',
	num_range: [1, 24],
	unit: 'month',
};

const defaultWeightDict = {
	absolute_range: [new Date(), new Date()],
	mode: 'all',
	num_range: [1, 24],
	unit: 'month',
	value: 1,
};

// these are fields that must be forced to default when changing models/axiscombo
const FORCE_DEFAULT_PHASE_FIELDS = ['percentile_range', 'value_range'];

const createPhaseSettings = ({ model_name, templates, resolution = 'monthly', axis_combo = 'rate', phase = 'oil' }) => {
	if (phase === 'shared') {
		phase = 'oil'; // eslint-disable-line no-param-reassign
	}

	const isMonthly = resolution?.includes?.('monthly');

	let output = {
		dispersion: 1,
		flat_forecast_thres: 2000,
		internal_filter_all: false,
		internal_filter: isMonthly ? 'low' : 'mid',
		peak_sensitivity: 'low',
		percentile_range: isMonthly ? [0, 100] : [2, 98],
		remove_0: true,
		time_dict: clone(defaultTimePeriod),
		moving_average_days: 0,
		well_life_dict: clone(defaultWellLifeDict),
		valid_idx: null,
		value_range: axis_combo === 'rate' ? [0.1, 30000] : [0.001, 30000],
		match_eur: {
			match_type: 'no_match',
			match_forecast_id: null,
			match_percent_change: 0,
			match_eur_num: 100,
			error_percentage: 5,
		},
		weight_dict: clone(defaultWeightDict),
		use_low_data_forecast: true,
		low_data_threshold: null,
		use_minimum_data: false,
		short_prod_threshold: 0,
	};

	if (templates) {
		const { params } = templates[model_name];
		const defaults = {};
		Object.keys(params).forEach((param) => {
			const value = get(params, `${param}.defaults.${phase}`);
			defaults[param] = cloneDeep(value);
		});

		output = { ...output, ...defaults };
	}
	if (axis_combo === 'rate') {
		output = { ...output, dispersion: 1, peak_preference: 'max', q_final: model_name !== 'arps_inc' ? 0.1 : 50000 };
	}
	if (axis_combo === 'ratio' && phase === 'gas') {
		output.value_range[1] = 200000;
	}
	if (axis_combo === 'ratio' && phase === 'oil') {
		output.base_phase = 'gas';
	} else if (axis_combo === 'ratio') {
		output.base_phase = 'oil';
	}

	return output;
};

const getAdjPhaseSettings = ({ phase, settings, unitTemplates }) => {
	const { defaultUnitTemplate, dailyUnitTemplate } = unitTemplates;

	const adjusted = produce(settings, (draft) => {
		const { base_phase, value_range } = draft;

		if (draft.time_dict.mode === 'absolute_range') {
			draft.time_dict.absolute_range = draft.time_dict.absolute_range.map(convertDateToIdx);
		} else {
			draft.time_dict.unit = 'month';
		}

		if (draft.weight_dict.mode === 'absolute_range') {
			draft.weight_dict.absolute_range = draft.weight_dict.absolute_range.map(convertDateToIdx);
		} else {
			draft.weight_dict.unit = 'month';
		}

		if (draft.well_life_dict.well_life_method === 'fixed_date') {
			const parsedDate = convertDateToIdx(makeUtc(new Date(get(draft, 'well_life_dict.fixed_date'))));
			set(draft, 'well_life_dict.fixed_date', parsedDate);
		} else {
			draft.well_life_dict.unit = 'year';
		}

		if (draft.match_eur.match_type === 'number') {
			const eurUnitKey = `${phase}_eur`;
			const eurConvertFunc = getConvertFunc(defaultUnitTemplate[eurUnitKey], dailyUnitTemplate[eurUnitKey]);
			draft.match_eur.match_eur_num = eurConvertFunc(draft.match_eur.match_eur_num);
		}

		if (draft.axis_combo === 'ratio') {
			if (!base_phase) {
				return;
			}

			const unitKey = `${phase}/${base_phase}`;
			const convertFunc = getConvertFunc(defaultUnitTemplate[unitKey], dailyUnitTemplate[unitKey]);
			draft.value_range = value_range.map((value) => convertFunc(value));

			// TODO: Simplifiy logic in the function possibly (maybe reduce instead of forEach)
			Object.entries(formTemplates[draft.axis_combo][draft.model_name].params).forEach(
				([templateKey, templateValue]) => {
					if (templateValue.requiresUnitTransform) {
						if (templateValue.type === 'range') {
							draft[templateKey] = draft[templateKey].map((value) => convertFunc(value));
						}
						if (templateValue.type === 'number') {
							draft[templateKey] = convertFunc(draft[templateKey]);
						}
					}
				}
			);
		}
		// conversion not necessary in v1
		// draft.percentile_range = draft.percentile_range.map((value) => value / 100);
	});

	// remove unnecessary fields from phases (model-related)
	const toKeep = [
		...PhaseFormFields[adjusted.axis_combo],
		...Object.keys(formTemplates[adjusted.axis_combo][adjusted.model_name].params),
		'axis_combo',
		'model_name',
	];
	return Object.entries(adjusted).reduce((curObj, [key, value]) => {
		if (toKeep.includes(key)) {
			return { ...curObj, [key]: value };
		}
		return curObj;
	}, {});
};

export const getAdjSettings = async (settings, applyAll = false, axis_combo = 'rate') => {
	const unitTemplates = await getUnitTemplates();
	const { resolution, overwrite_manual, percentile, prob_para } = settings.shared;
	const adjustedSettings = {
		shared: { resolution, overwrite_manual: Boolean(overwrite_manual), percentile, prob_para },
		phases: settings.phases,
	};

	VALID_PHASES.forEach((phase) => {
		if (applyAll) {
			const { shared } = settings;
			adjustedSettings[phase] = clone(shared);
		} else {
			adjustedSettings[phase] = clone(settings[phase]);
		}

		adjustedSettings[phase].axis_combo ??= axis_combo;
		adjustedSettings[phase] = getAdjPhaseSettings({
			phase,
			settings: adjustedSettings[phase],
			unitTemplates,
		});
	});

	return adjustedSettings;
};

export function useEnforcedSettings(projectId) {
	const enforceCompanySettingsConfiguration = useQuery(['company-configuration-enforce-project', projectId], () =>
		getApi(`/company-forecast-settings/enforce/${projectId}`)
	);

	const enforcedSettingsQuery = useQuery(
		['company-configuration', 'forecast'],
		() => getApi('/company-forecast-settings'),
		{
			select: (config) => config.settings,
			enabled:
				enforceCompanySettingsConfiguration.isSuccess &&
				!!enforceCompanySettingsConfiguration.data.companyForecastSetting,
		}
	);

	return enforcedSettingsQuery;
}

export function handlePhaseChange({ prev, draft, phase, forecastId }) {
	if (prev[phase]?.axis_combo !== draft[phase]?.axis_combo) {
		draft[phase].model_name = DEFAULT_MODEL[draft[phase]?.axis_combo];
	}

	if (prev[phase]?.model_name !== draft[phase]?.model_name) {
		const { axis_combo, resolution, model_name } = draft[phase];

		if (!formTemplates[axis_combo][model_name]) {
			// invalid state: this shouldn't happen, but it's better it doesn't throw an error for now
			return;
		}

		const settings = {
			...createPhaseSettings({
				phase,
				model_name,
				resolution,
				axis_combo,
				templates: formTemplates[axis_combo],
			}),
			axis_combo,
			resolution,
			model_name,
		};

		const toChangePhaseFields = multiGet(settings, [
			...Object.keys(formTemplates[axis_combo][model_name].params),
			...FORCE_DEFAULT_PHASE_FIELDS,
			'base_phase',
			'q_final',
		]);

		draft[phase] = multiSet(draft[phase], toChangePhaseFields);
	}

	// defaults the forecastId when matching forecast if there is none selected
	if (draft[phase]?.match_eur?.match_type === 'forecast' && !draft[phase]?.match_eur?.match_forecast_id) {
		draft[phase].match_eur.match_forecast_id = forecastId;
	}
}

export function getInitialValues({ applyAll = true }) {
	const resolution_ = DEFAULT_RESOLUTION;
	const axis_combo = DEFAULT_AXIS_COMBO;
	const resolution = resolution_ === 'monthly' ? 'monthly_only' : 'daily_only';
	const model_name = DEFAULT_MODEL[axis_combo];

	const getPhaseSettings = (phase) => ({
		...createPhaseSettings({
			model_name,
			resolution,
			axis_combo,
			templates: formTemplates[axis_combo],
			phase,
		}),
		axis_combo,
		resolution,
		model_name,
	});

	return {
		shared: {
			...defaultGenSettings(model_name, formTemplates[axis_combo], resolution),
			...getPhaseSettings('shared'),
		},
		oil: getPhaseSettings('oil'),
		gas: getPhaseSettings('gas'),
		water: getPhaseSettings('water'),
		phases: { oil: true, gas: true, water: true },
		applyAll,
	};
}

export function useForecastForm({
	currentPhase = null,
	enforceRatioCheck = false,
	forecastId,
	forecastType = 'probabilistic',
	initialResolution = undefined,
	onSubmit,
}) {
	const { project } = useAlfa();
	const isProbabilistic = forecastType === 'probabilistic';

	const configurationDialog = useConfigurationDialog({
		key: isProbabilistic ? 'probabilisticForecastSettings' : 'deterministicForecastSettings',
		title: `${isProbabilistic ? 'Probabilistic' : 'Deterministic'} Forecast Configurations`,
		enableSharedConfigs: true,
	});

	const {
		activeConfig,
		activeConfigKey,
		configs,
		dialog: configDialog,
		selectConfig,
		setActiveConfigKey,
		showConfigDialog,
	} = configurationDialog;

	const getInitialResolution = useGetter(initialResolution);

	const enforcedSettingsQuery = useEnforcedSettings(project._id);

	const initialValues = useMemo(() => {
		const defaultValues = getInitialValues({ applyAll: currentPhase ? false : undefined });
		const mappedConfig = mapConfig(activeConfig)?.settings ?? {};
		const values = produce(defaultValues, (draft) => {
			deepMerge(draft, mappedConfig); // deepMerge mutates the first argument // is that an issue?
			if (enforcedSettingsQuery.isSuccess) {
				deepMerge(draft, enforcedSettingsQuery.data);
			}
			draft._counter = counter.next(); // HACK make sure the values are different so formik reloads each time the configuration is reset, this should be more imperative
			const initialResolution = getInitialResolution(); // eslint-disable-line no-shadow
			if (initialResolution) {
				const mappedResolution = initialResolution?.includes('daily') ? 'daily_only' : 'monthly_only';
				draft.shared.resolution = mappedResolution;
			}
			if (currentPhase) {
				draft.applyAll = false;
				Object.entries(draft.phases).forEach(([k, _]) => {
					if (k === currentPhase) {
						draft.phases[k] = true;
					} else {
						draft.phases[k] = false;
					}
				});
			}
		});
		return values;
	}, [currentPhase, activeConfig, getInitialResolution, enforcedSettingsQuery.isSuccess, enforcedSettingsQuery.data]);

	const [confirmDialog, dispatchDialog] = useDialog(GenericDialog);

	const handleAutoForecast = async (values) => {
		const adjustedSettings = parseAutomaticForecastValues(values);
		adjustedSettings.shared = { ...adjustedSettings.shared, resolution: values.shared.resolution };
		const allPhasesAreRatio = !VALID_PHASES.find(
			(phase) => adjustedSettings[phase].axis_combo !== 'ratio' || !adjustedSettings.phases[phase]
		);
		if (
			enforceRatioCheck &&
			allPhasesAreRatio &&
			!(await dispatchDialog({
				title: 'All Selected Phases as Ratio Forecasts',
				children: (
					<ul>
						<li>Recommend to have at least 1 base stream</li>
						<li>
							Proceeding with current settings will calculate the ratios but leave the rates as 0 streams
						</li>
					</ul>
				),
				actions: [
					{ children: 'Cancel', color: 'secondary', value: null },
					{ children: 'Continue', color: 'primary', value: true },
				],
			}))
		) {
			return;
		}

		onSubmit?.(adjustedSettings, { values, activeConfigKey });
	};

	const formikBundle = useFormikReducer(
		useFormik({
			initialValues,
			enableReinitialize: true,
			onSubmit: handleAutoForecast,
		}),
		(prev, field, value) =>
			produce(prev, (draft) => {
				set(draft, field, value);

				const processPhase = (phase) => {
					handlePhaseChange({ phase, prev, draft, forecastId });
				};

				if (currentPhase) {
					processPhase(currentPhase);
					return;
				}

				// if applyAll was toggled true, force all phases to be rate
				if (prev.applyAll !== draft.applyAll && draft.applyAll) {
					['shared', 'oil', 'gas', 'water'].forEach((p) => {
						draft[p].axis_combo = 'rate';
					});
				}

				processPhase('shared');

				// if axis combo changed and it's now ratio, toggle applyAll
				if (draft.shared?.axis_combo !== prev.shared?.axis_combo && draft.shared?.axis_combo === 'ratio') {
					draft.applyAll = false;
				}

				// keep axis_combo in sync if applyAll is true
				if (draft.shared?.axis_combo !== prev.shared?.axis_combo && draft.applyAll) {
					draft.oil.axis_combo = draft.shared.axis_combo;
					draft.gas.axis_combo = draft.shared.axis_combo;
					draft.water.axis_combo = draft.shared.axis_combo;
				}

				// keep model_name in sync if applyAll is true
				if (draft.shared?.model_name !== prev.shared?.model_name && draft.applyAll) {
					draft.oil.model_name = draft.shared.model_name;
					draft.gas.model_name = draft.shared.model_name;
					draft.water.model_name = draft.shared.model_name;
				}

				// if applyAll was toggled off, derive each phase form from the shared one
				if (!draft.applyAll && draft.applyAll !== prev.applyAll) {
					draft.gas = clone(draft.shared);
					draft.water = clone(draft.shared);

					// if applyAll was changed due to switching shared to ratio, then clone oil with the previous shared instead (should be rate)
					if (draft?.shared?.axis_combo === 'ratio') {
						draft.oil = clone(prev.shared);
					} else {
						draft.oil = clone(draft.shared);
					}
				}

				VALID_PHASES.forEach((phase) => {
					processPhase(phase);
				});

				// make sure the enforced company form values are always used
				if (enforcedSettingsQuery.isSuccess) {
					deepMerge(draft, enforcedSettingsQuery.data);
				}
			})
	);

	const { validateForm, values } = formikBundle;

	useEffect(() => {
		validateForm();
	}, [values, validateForm]);

	const getValues = useGetter(formikBundle.values);

	const wrappedConfigDialog = useCallback(
		(resolution = null) => {
			// HACK: setValue from formik formats dates in MS. We convert the saved configuration to datetime for date fields
			const curValues = getValues();
			const dateFields = [
				'well_life_dict.fixed_date',
				'time_dict.absolute_range.0',
				'time_dict.aboslute_range.1',
				'weight_dict.absolute_range.0',
				'weight_dict.absolute_range.1',
			];

			const parsedValues = produce(curValues, (draft) => {
				_.forEach(['shared', 'oil', 'gas', 'water'], (phase) => {
					_.forEach(dateFields, (fieldName) => {
						const path = `${phase}.${fieldName}`;
						_.set(draft, path, new Date(_.get(draft, path)));
					});
				});
			});

			showConfigDialog(
				cleanConfig({
					forecastFormType: 'auto',
					forecastScope: { auto: true, proximity: false },
					resolution,
					settings: parsedValues,
					applyAll: currentPhase ? false : undefined,
				}),
				formikBundle.isValid
			);
		},
		[showConfigDialog, getValues, currentPhase, formikBundle.isValid]
	);

	return {
		activeConfig,
		activeConfigKey,
		configDialog,
		configs,
		confirmDialog,
		formikBundle,
		formTemplates,
		getValues,
		selectConfig,
		setActiveConfigKey,
		showConfigDialog: wrappedConfigDialog,
	};
}
