import produce from 'immer';
import _, { clone, cloneDeep, forEach, mapValues } from 'lodash-es';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { useCallbackRef, useGetter } from '@/components/hooks';
import { getErrorPaths } from '@/components/react-hook-form-helpers';
import { MenuItem } from '@/components/v2/misc/SelectField';
import { makeUtc } from '@/helpers/date';
import { getConvertFunc } from '@/helpers/units';
import { deepMerge } from '@/helpers/utilities';
import { convertDateToIdx, phases } from '@/helpers/zing';
import { fields as formTemplates } from '@/inpt-shared/display-templates/forecast/forecast_forms.json';

import { unitTemplates } from '../../shared';
import { EnforcedForecastConfiguration } from '../EnforcedForecastSettings';
import { mapConfig } from '../forecastConfig';
import {
	AxisCombo,
	ForecastFormResolution,
	ForecastType,
	FormDraft,
	FormPhase,
	FormSettings,
	GeneralSettings,
	Phase,
	TimePeriod,
	WeightDict,
	WellLifeDict,
} from './types';

export const matchEurModels = [
	'arps_modified_wp',
	'arps_modified_free_peak',
	'arps_modified_fulford',
	'arps_modified_fp_fulford',
];

export const getShowMatchEur = ({
	axisCombo,
	forecastType = 'deterministic',
	modelName,
}: {
	axisCombo: AxisCombo;
	forecastType?: ForecastType;
	modelName: string;
}) => forecastType === 'deterministic' && axisCombo === 'rate' && matchEurModels.includes(modelName);

const PhaseFormFields = {
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

const sameFieldMapping: Record<string, string> = {
	b: 'b2',
	b2: 'b',
	D_eff: 'D1_eff',
	D1_eff: 'D_eff',
};

export const axisComboItems = [
	{ label: 'Rate', value: 'rate' },
	{ label: 'Ratio', value: 'ratio' },
];

export const resolutionItems: Array<MenuItem> = [
	{ label: 'Daily Only', value: 'daily_only' },
	{ label: 'Monthly Only', value: 'monthly_only' },
	{ label: 'Daily Preference', value: 'daily_preference' },
	{ label: 'Monthly Preference', value: 'monthly_preference' },
];

const DEFAULT_AXIS_COMBO: AxisCombo = 'rate';
const DEFAULT_MODEL = { rate: 'arps_modified_wp', ratio: 'flat' };
export const DEFAULT_FORM_RESOLUTION: ForecastFormResolution = 'monthly_only';

export const DEFAULT_WELL_LIFE_DICT: WellLifeDict = {
	fixed_date: new Date(),
	num: 60,
	unit: 'year',
	well_life_method: 'duration_from_first_data',
};
const DEFAULT_TIME_PERIOD: TimePeriod = {
	absolute_range: [new Date(), new Date()],
	mode: 'last',
	num_range: [1, 24],
	unit: 'month',
};
const DEFAULT_WEIGHT_DICT: WeightDict = {
	absolute_range: [new Date(), new Date()],
	mode: 'all',
	num_range: [1, 24],
	unit: 'month',
	value: 1,
};

const generateGeneralSettings = ({
	axis_combo,
	model_name,
	resolution = 'monthly_only',
}: {
	axis_combo: AxisCombo;
	model_name: string;
	resolution: ForecastFormResolution;
}): GeneralSettings => ({
	model_name,
	overwrite_manual: false,
	percentile: [10, 50, 90],
	phases: phases.map(({ value }) => value),
	prob_para: _.cloneDeep(formTemplates[axis_combo][model_name].prob_para),
	resolution,
});
const excludedParams = ['div'];
// @todo: finalize output and add strict typing
const generatePhaseSettings = ({
	axis_combo = 'rate',
	dLimDict,
	forecastId,
	model_name,
	phase: inputPhase = 'oil',
	resolution = 'monthly_only',
}: {
	axis_combo: AxisCombo;
	dLimDict?: {
		type: 'number' | 'range';
		value: number | Array<number>;
	};
	forecastId?: string;
	model_name: string;
	phase: FormPhase;
	resolution: ForecastFormResolution;
}) => {
	const { params } = formTemplates[axis_combo][model_name];

	const phase = inputPhase === 'shared' ? 'oil' : inputPhase;
	const isMonthly = resolution?.includes?.('monthly');

	function getDLim() {
		if (dLimDict && params?.D_lim_eff) {
			const { value, type: curType } = dLimDict;
			const { type: newType } = params.D_lim_eff;

			if (newType === curType) {
				return { D_lim_eff: value };
			}
			if (newType === 'number' && _.isArray(value)) {
				return { D_lim_eff: _.mean(value) };
			}
			if (newType === 'range') {
				return { D_lim_eff: [value, value] };
			}
		}

		return {};
	}

	const validParams = _.pickBy(_.cloneDeep(params), (_, key) => !excludedParams.includes(key));
	return {
		base_phase: phase === 'oil' ? 'gas' : 'oil',
		dispersion: 1,
		flat_forecast_thres: 2000,
		internal_filter_all: false,
		internal_filter: isMonthly ? 'low' : 'mid',
		moving_average_days: 0,
		peak_preference: 'max',
		peak_sensitivity: 'low',
		percentile_range: isMonthly ? [0, 100] : [2, 98],
		q_final: 0.1,
		remove_0: true,
		short_prod_threshold: 0,
		time_dict: clone(DEFAULT_TIME_PERIOD),
		use_low_data_forecast: true,
		use_minimum_data: false,
		valid_idx: null,
		value_range: axis_combo === 'rate' ? [0.1, 30000] : [0.001, phase === 'gas' ? 200_000 : 30_000],
		weight_dict: clone(DEFAULT_WEIGHT_DICT),
		well_life_dict: clone(DEFAULT_WELL_LIFE_DICT),

		// default values for the current model type
		...mapValues(validParams, (param) => param.defaults[phase]),
		...getDLim(),

		// include match eur fields based on model type
		...(getShowMatchEur({ axisCombo: axis_combo, modelName: model_name }) && {
			low_data_threshold: null,
			match_eur: {
				error_percentage: 5,
				match_eur_num: 100,
				match_forecast_id: forecastId ?? null,
				match_percent_change: 0,
				match_type: 'no_match',
			},
		}),

		// default values for rate
		...(axis_combo === 'rate' && {
			dispersion: 1,
			peak_preference: 'max',
			q_final: model_name !== 'arps_inc' ? 0.1 : 50000,
		}),
	};
};

export function getInitialValues({ applyAll = true, forecastId, resolution = DEFAULT_FORM_RESOLUTION }): FormSettings {
	const axis_combo = DEFAULT_AXIS_COMBO;
	const model_name = DEFAULT_MODEL[axis_combo];

	const getPhaseSettings = (phase) => ({
		...generatePhaseSettings({
			axis_combo,
			forecastId,
			model_name,
			phase,
			resolution,
		}),
		axis_combo,
		model_name,
		resolution,
	});

	return {
		shared: {
			...generateGeneralSettings({ axis_combo, model_name, resolution }),
			...getPhaseSettings('shared'),
		},
		oil: getPhaseSettings('oil'),
		gas: getPhaseSettings('gas'),
		water: getPhaseSettings('water'),
		phases: { oil: true, gas: true, water: true },
		applyAll,
	};
}

function _handleModelChange({
	draft,
	enforcedPaths = {},
	newAxisCombo,
	newModel,
	phase,
}: {
	draft: FormDraft;
	enforcedPaths?: Record<string, Array<string>>;
	newAxisCombo: AxisCombo;
	newModel: string;
	phase: FormPhase;
}) {
	const { axis_combo: curAxisCombo, resolution, model_name: curModel } = draft[phase];

	const enforceModelDefaults = newModel === 'arps_inc' || curModel === 'arps_inc';
	const currentModelParams = _.keys(formTemplates[curAxisCombo][curModel].params);
	const newModelParams = _.keys(formTemplates[newAxisCombo][newModel].params);

	// new settings; fields that aren't used on a model are ommitted from the object
	const settings = generatePhaseSettings({
		axis_combo: newAxisCombo,
		dLimDict: currentModelParams.includes('D_lim_eff')
			? { type: formTemplates[curAxisCombo][curModel].params.D_lim_eff.type, value: draft[phase].D_lim_eff }
			: undefined,
		model_name: newModel,
		phase,
		resolution,
	});

	// fields to carry over from the current form
	const alwaysOmitFields = ['base_phase', 'D_lim_eff'];
	const toSaveFields = _.pick(
		draft[phase],
		_.keys(_.omit(settings, enforceModelDefaults ? [...newModelParams, ...alwaysOmitFields] : alwaysOmitFields))
	);

	// map fields that are externally the same, but internally different; ex. b and b2
	const toMapFields = _.reduce(
		currentModelParams,
		(acc, value) => {
			const mappedParam = sameFieldMapping[value];
			if (mappedParam && newModelParams.includes(mappedParam)) {
				acc[mappedParam] = _.cloneDeep(draft[phase][value]);
			}
			return acc;
		},
		{}
	);

	// start from the new settings, merge the carry over fields, merge the mapped fields
	draft[phase] = _.omit(_.merge(_.merge(settings, toSaveFields), toMapFields), enforcedPaths?.[phase] ?? []);

	// apply new axis combo and new model
	draft[phase].axis_combo = newAxisCombo;
	draft[phase].model_name = newModel;
}

function _handleApplyAllChange({
	applyAll,
	draft,
	enforcedPaths = {},
}: {
	applyAll: boolean;
	draft: FormDraft;
	enforcedPaths?: Record<string, Array<string>>;
}) {
	const _phases = phases.map((val) => val.value);

	// if applyAll is true, force shared to be 'rate'
	if (applyAll) {
		// keep oil state when applying all
		draft.shared = deepMerge(draft.shared, _.omit(draft.oil, enforcedPaths.shared));
		if (draft.shared.axis_combo === 'ratio') {
			_handleModelChange({
				draft,
				enforcedPaths,
				newAxisCombo: 'rate',
				newModel: DEFAULT_MODEL.rate,
				phase: 'shared',
			});
		}
	} else {
		forEach(_phases, (phase) => {
			if (draft.shared.axis_combo === 'ratio' && phase === 'oil') {
				return;
			}

			const modelHasChanged = draft[phase].model_name !== draft.shared.model_name;
			if (applyAll) {
				draft[phase].axis_combo = draft.shared.axis_combo;
			} else {
				draft[phase] = deepMerge(draft[phase], _.omit(draft.shared, enforcedPaths[phase]));
			}

			if (modelHasChanged) {
				_handleModelChange({
					draft,
					enforcedPaths,
					newAxisCombo: draft.shared.axis_combo,
					newModel: draft.shared.model_name,
					phase,
				});
			}
		});
	}

	draft.applyAll = applyAll;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
function parsePhaseSettings({ phase, settings }: { phase: Phase; settings: Record<string, any> }) {
	const { defaultUnitTemplate, dailyUnitTemplate } = unitTemplates;
	const sharedNumberFields = [
		'dispersion',
		'flat_forecast_thres',
		'match_eur.error_percentage',
		'match_eur.match_eur_num',
		'match_eur.match_percent_change',
		'moving_average_days',
		'percentile_range.0',
		'percentile_range.1',
		'short_prod_threshold',
		'time_dict.num_range.0',
		'time_dict.num_range.1',
		'value_range.0',
		'value_range.1',
		'weight_dict.num_range.0',
		'weight_dict.num_range.1',
		'weight_dict.value',
		'well_life_dict.num',
		'q_final',
	];

	const adjusted = produce(settings, (draft) => {
		const { axis_combo, model_name, base_phase, value_range } = draft;
		const { params } = formTemplates[axis_combo][model_name];

		// coerce Number on model parameters
		_.forEach(params, (value, key) => {
			if (value.type === 'range') {
				draft[key][0] = Number(settings[key][0]);
				draft[key][1] = Number(settings[key][1]);
			}
			if (value.type === 'number') {
				draft[key] = Number(settings[key]);
			}
		});

		// coerce Number on shared number fields
		_.forEach(sharedNumberFields, (path) => {
			_.set(draft, path, Number(_.get(draft, path)));
		});

		if (draft.time_dict.mode === 'absolute_range') {
			draft.time_dict.absolute_range = _.map(draft.time_dict.absolute_range, convertDateToIdx);
		} else {
			draft.time_dict.unit = 'month';
		}

		if (draft.weight_dict.mode === 'absolute_range') {
			draft.weight_dict.absolute_range = _.map(draft.weight_dict.absolute_range, convertDateToIdx);
		} else {
			draft.weight_dict.unit = 'month';
		}

		if (draft.well_life_dict.well_life_method === 'fixed_date') {
			_.set(
				draft,
				'well_life_dict.fixed_date',
				convertDateToIdx(makeUtc(new Date(_.get(draft, 'well_life_dict.fixed_date'))))
			);
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

			_.forEach(formTemplates[draft.axis_combo][draft.model_name].params, (templateValue, templateKey) => {
				if (templateValue.requiresUnitTransform) {
					if (templateValue.type === 'range') {
						draft[templateKey] = draft[templateKey].map((value) => convertFunc(value));
					}
					if (templateValue.type === 'number') {
						draft[templateKey] = convertFunc(draft[templateKey]);
					}
				}
			});
		}
	});

	// remove unnecessary fields from phases (model-related)
	const toKeep = [
		...PhaseFormFields[adjusted.axis_combo],
		...Object.keys(formTemplates[adjusted.axis_combo][adjusted.model_name].params),
		'axis_combo',
		'model_name',
	];

	return _.pick(adjusted, toKeep);
}

export function parseAutomaticForecastValues(values: FormSettings) {
	return produce(
		{
			shared: _.pick(values.shared, ['axis_combo', 'overwrite_manual', 'percentile', 'prob_para']),
			phases: values.phases,
		},
		(draft) => {
			_.forEach(phases, ({ value: phase }) => {
				if (values.applyAll) {
					draft[phase] = _.cloneDeep(values.shared);
				} else {
					draft[phase] = _.cloneDeep(values[phase]);
				}

				draft[phase].axis_combo ??= values.shared.axis_combo;
				const parsedPhase = parsePhaseSettings({ phase, settings: draft[phase] });
				draft[phase] = parsedPhase;
			});
		}
	);
}

const useAutomaticForecast = ({
	activeConfig,
	currentPhase,
	enforcedData,
	enforcedPaths = {},
	forecastId,
	initialResolution = DEFAULT_FORM_RESOLUTION,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	activeConfig?: any;
	currentPhase?: Phase;
	enforcedData?: EnforcedForecastConfiguration['settings'];
	enforcedPaths?: Record<string, Array<string>>;
	forecastId: string;
	initialResolution?: ForecastFormResolution;
}) => {
	// used to default initialValues based on resolution
	const getInitialResolution = useGetter(initialResolution);

	const initialValues = useMemo(() => {
		const defaultValues = getInitialValues({
			applyAll: !currentPhase,
			forecastId,
			resolution: getInitialResolution(),
		});

		const mappedConfig = mapConfig(activeConfig) ?? {};
		const values = produce(defaultValues, (draft) => {
			_.merge(draft, mappedConfig);
			if (enforcedData) {
				_.merge(draft, enforcedData);
			}
			if (currentPhase) {
				draft.applyAll = false;
				_.forEach(draft.phases, (_, key) => {
					draft.phases[key] = currentPhase === key;
				});
			}
		});

		return values;
	}, [activeConfig, currentPhase, enforcedData, forecastId, getInitialResolution]);

	const form = useForm({ defaultValues: initialValues, mode: 'onChange' });
	const {
		formState: { errors },
		getValues,
		reset,
		trigger,
		watch,
	} = form;

	const [applyAll, formPhases, ...phaseAxisCombos] = watch([
		'applyAll',
		'phases',
		'gas.axis_combo',
		'oil.axis_combo',
		'water.axis_combo',
	]);

	const formError: string | boolean = useMemo(() => {
		if (!_.map(formPhases, (value) => Boolean(value)).includes(true)) {
			return 'No phases selected';
		}
		if (!_.isEmpty(errors)) {
			return 'Please correct the errors on the form';
		}
		if (!(applyAll || phaseAxisCombos.includes('rate'))) {
			return 'Cannot forecast all phases as ratio';
		}
		return false;
	}, [applyAll, errors, formPhases, phaseAxisCombos]);

	const resetAndTrigger = useCallbackRef(async (values: FormSettings) => {
		const errorPaths = getErrorPaths(errors);
		const allPhasePaths = _.reduce(
			errorPaths,
			(acc: string[], path) => {
				const curPaths = [path] as string[];

				// get same field mappings
				const [phasePath, paramPath, ...rest] = path.split('.');
				const mappedParam = sameFieldMapping[paramPath];
				if (mappedParam) {
					const mappedPath = [phasePath, mappedParam, ...rest].join('.');
					acc.push(mappedPath);
					curPaths.push(mappedPath);
				}

				if (phasePath === 'shared') {
					_.forEach(phases, ({ value: phase }) => {
						_.forEach(curPaths, (curPath) => {
							acc.push(curPath.replace('shared', phase));
						});
					});
				}
				if (phasePath === 'oil') {
					_.forEach(curPaths, (curPath) => {
						acc.push(curPath.replace('oil', 'shared'));
					});
				}
				return acc;
			},
			errorPaths
		);

		await reset(values);

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		trigger(allPhasePaths);
	});

	const handleModelChange = useCallbackRef((phase: FormPhase, modelName: string) => {
		const curValues = getValues();
		resetAndTrigger(
			produce(curValues, (draft) => {
				_handleModelChange({
					draft,
					enforcedPaths,
					newAxisCombo: draft[phase].axis_combo,
					newModel: modelName,
					phase,
				});
			})
		);
	});

	const handleApplyAllChange = useCallbackRef((applyAll: boolean) => {
		const curValues = getValues();
		resetAndTrigger(
			produce(curValues, (draft) => {
				_handleApplyAllChange({ draft, applyAll, enforcedPaths });
			})
		);
	});

	const handleAxisComboChange = useCallbackRef((phase: FormPhase, axisCombo: AxisCombo) => {
		const curValues = getValues();
		resetAndTrigger(
			produce(curValues, (draft) => {
				if (phase === 'shared' && axisCombo === 'ratio') {
					draft.oil = cloneDeep(draft.shared);
				}
				if (draft[phase].model_name !== DEFAULT_MODEL[axisCombo]) {
					_handleModelChange({
						draft,
						enforcedPaths,
						newAxisCombo: axisCombo,
						newModel: DEFAULT_MODEL[axisCombo],
						phase,
					});
				}
				if (axisCombo === 'ratio' && phase === 'shared') {
					return _handleApplyAllChange({ draft, applyAll: false, enforcedPaths });
				}
			})
		);
	});

	const getSubmissionBody = useCallbackRef(() => parseAutomaticForecastValues(getValues()));

	// reset form to default values when initialValues change
	useEffect(() => {
		reset(initialValues);
	}, [reset, initialValues]);

	return {
		form,
		formError,
		getSubmissionBody,
		handleApplyAllChange,
		handleAxisComboChange,
		handleModelChange,
	};
};

export type UseAutomaticForecastReturn = ReturnType<typeof useAutomaticForecast>;

export default useAutomaticForecast;
