import produce from 'immer';
import type { WritableDraft } from 'immer/dist/internal.js';
import _ from 'lodash-es';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from 'react-query';

import { useCallbackRef } from '@/components/hooks';
import { getErrorPaths } from '@/components/react-hook-form-helpers';
import { VALID_PHASES } from '@/forecasts/charts/components/graphProperties';
import { warningAlert } from '@/helpers/alerts';
import { useDebouncedValue } from '@/helpers/debounce';
import { getApi } from '@/helpers/routing';
import { numberWithCommas } from '@/helpers/utilities';
import { phases } from '@/helpers/zing';
import { MAX_AUTO_PROXIMITY_BACKGROUND_WELLS } from '@/inpt-shared/constants';
import { fields as wellHeaderTypeTemplate } from '@/inpt-shared/display-templates/wells/well_header_types.json';
import normalizationTemplate from '@/inpt-shared/type-curves/normalization-template';
import { generatePhaseSettings } from '@/type-curves/TypeCurveIndex/fit/useAutoFitForm';
import { replaceVarsInBase } from '@/type-curves/TypeCurveIndex/normalization/NormalizationPhaseForm';
import { PhaseType } from '@/type-curves/TypeCurveIndex/types';
import { EUR_HEADERS, PEAK_RATE_HEADERS, getBaseKey } from '@/type-curves/shared/utils';

import { FormPhase, Phase } from '../automatic-form/types';

export interface ForecastItem {
	_id: string;
	name: string;
	project: { _id: string; name: string };
}

const generateProximityPhaseSettings = ({ phase, phaseType = 'rate' }: { phase: Phase; phaseType?: PhaseType }) => ({
	...generatePhaseSettings({ phase, phaseType }),
	fitToTargetData: true,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const generateDefaultFormValues = ({ forecast }: { forecast?: any } = {}) => {
	const bases = normalizationTemplate.steps[0].bases;
	const defaultNormalizationValues = {
		baseKey: getBaseKey(bases[0]),
		normalizationType: 'no_normalization',
		numericalHeader: 'first_prop_weight',
		pValues: [0, 0.98],
	};

	return {
		// contains values for ALL criteria; selected criteria are filtered afterwards; this allows all the criteria to be saved even if unselected
		criteriaValues: _.mapValues(wellHeaderTypeTemplate, ({ type }) => {
			if (type === 'multi-select') {
				return { mandatory: false, type: 'string' };
			}
			if (type === 'string') {
				return { mandatory: false, type };
			}
			if (type === 'date') {
				return {
					absoluteRange: { start: null, end: null },
					mandatory: false,
					relativePercentage: null,
					relativeValue: null,
					type,
				};
			}
			if (type === 'number') {
				return {
					absoluteRange: { start: null, end: null },
					mandatory: false,
					relativePercentage: null,
					relativeValue: null,
					type,
				};
			}
		}),

		applyAll: true,
		dataThreshold: 12,
		forecasts: (forecast ? [forecast._id] : []) as Array<string>,
		overwriteManual: false,
		phases: { oil: true, gas: true, water: true },
		projectId: forecast.project._id,
		searchRadius: 10,
		selectedCriteria: [] as Array<string>,
		targetForecastId: forecast._id,
		wellCount: [1, 10],

		// shared phase states
		gas: {
			fit: generateProximityPhaseSettings({ phase: 'gas' }),
			normalization: _.clone(defaultNormalizationValues),
		},
		oil: {
			fit: generateProximityPhaseSettings({ phase: 'oil' }),
			normalization: _.clone(defaultNormalizationValues),
		},
		shared: {
			fit: generateProximityPhaseSettings({ phase: 'oil' }),
			normalization: _.clone(defaultNormalizationValues),
		},
		water: {
			fit: generateProximityPhaseSettings({ phase: 'water' }),
			normalization: _.clone(defaultNormalizationValues),
		},
	};
};

export const parseProximityForecastValues = (values: ReturnType<typeof generateDefaultFormValues>) =>
	produce(
		{
			..._.omit(values, ['criteriaValues', 'selectedCriteria', 'forecasts', 'shared']),
			forecastIds: [] as Array<string>,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			neighborCriteria: [] as Array<Record<string, any>>,
		},
		(draft) => {
			draft.forecastIds = values.forecasts;
			draft.neighborCriteria = _.map(values.selectedCriteria, (value) => ({
				criteriaType: value,
				...values.criteriaValues[value],
			}));

			const bases = normalizationTemplate.steps[0].bases;

			if (values.applyAll) {
				draft.oil = _.cloneDeep(values.shared);
				draft.gas = _.cloneDeep(values.shared);
				draft.water = _.cloneDeep(values.shared);
			}

			_.map(VALID_PHASES, (phase) => {
				const baseKey = draft[phase].normalization.baseKey;
				const { numericalHeader } = draft[phase].normalization;
				const rawBase = bases?.find((b) => getBaseKey(b) === baseKey) ?? bases?.[0];
				const base =
					rawBase &&
					replaceVarsInBase(rawBase, {
						PHASE_EUR: EUR_HEADERS[phase],
						NUMERICAL_HEADER: numericalHeader,
						PHASE_PEAK_RATE: PEAK_RATE_HEADERS[phase],
					});

				_.set(draft, `${phase}.normalization.xChain`, {
					start_feature: base.x.startFeature,
					op_chain: _.map(base.x.opChain, (thisOp) => ({ ...thisOp, op_feature: thisOp.opFeature })),
				});

				_.set(draft, `${phase}.normalization.yChain`, {
					start_feature: base.y.startFeature,
					op_chain: _.map(base.y.opChain, (thisOp) => ({ ...thisOp, op_feature: thisOp.opFeature })),
				});
			});
		}
	);

const _handleApplyAllChange = ({
	applyAll,
	draft,
}: {
	applyAll: boolean;
	draft: WritableDraft<ReturnType<typeof generateDefaultFormValues>>;
}) => {
	// copy from oil
	if (applyAll) {
		draft.shared = _.cloneDeep(draft.oil);
		if (draft.shared.fit.phaseType === 'ratio') {
			draft.shared.fit = generateProximityPhaseSettings({ phase: 'oil' });
		}
	} else {
		_.forEach(phases, ({ value: phase }) => {
			if (draft.shared.fit.phaseType === 'ratio' && phase === 'oil') {
				draft.oil.fit = generateProximityPhaseSettings({ phase: 'oil' });
				return;
			}

			if (draft.shared.fit.phaseType === 'rate') {
				draft[phase] = _.cloneDeep(draft.shared);
			} else {
				draft[phase].fit = generateProximityPhaseSettings({ phase, phaseType: 'ratio' });
			}
		});
	}

	draft.applyAll = applyAll;
};

const cleanConfig = (activeConfig) =>
	produce(activeConfig, (draft) => {
		draft.forecasts = _.filter(draft.forecasts, (forecastId) => _.isString(forecastId));
	});

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const useProximityForecast = ({ activeConfig, forecast }: { activeConfig?: any; forecast?: any }) => {
	const initialValues: ReturnType<typeof generateDefaultFormValues> = useMemo(
		() =>
			produce(generateDefaultFormValues({ forecast }), (draft) =>
				_.merge(draft, activeConfig ? cleanConfig(activeConfig) : {}, { targetForecastId: forecast._id })
			),
		[activeConfig, forecast]
	);

	const form = useForm({ defaultValues: initialValues, mode: 'onChange' });
	const {
		formState: { errors },
		getValues,
		reset,
		trigger,
		watch,
	} = form;

	const [applyAll, formPhases, _forecasts, ...phaseTypes] = watch([
		'applyAll',
		'phases',
		'forecasts',
		'gas.fit.phaseType',
		'oil.fit.phaseType',
		'water.fit.phaseType',
	]);

	const selectedForecasts = useDebouncedValue(_forecasts, 1000);

	const { data: uniqueWellCount, isLoading: isLoadingUniqueWellCount } = useQuery(
		['forecast', 'proximity', 'uniqueWellCount', selectedForecasts],
		() => getApi(`/forecast/get-unique-well-counts`, { forecastIds: selectedForecasts }),
		{ enabled: !!selectedForecasts?.length }
	);

	const formError: string | boolean = useMemo(() => {
		if (!_.map(formPhases, (value) => Boolean(value)).includes(true)) {
			return 'No phases selected';
		}
		if (!_.isEmpty(errors)) {
			return 'Please correct the errors on the form';
		}
		if (!(applyAll || phaseTypes.includes('rate'))) {
			return 'Cannot forecast all phases as ratio';
		}
		if (Number(uniqueWellCount) > MAX_AUTO_PROXIMITY_BACKGROUND_WELLS) {
			return `Cannot run proximity on greater than ${numberWithCommas(
				MAX_AUTO_PROXIMITY_BACKGROUND_WELLS
			)} unique wells`;
		}
		return false;
	}, [applyAll, errors, formPhases, phaseTypes, uniqueWellCount]);

	const resetAndTrigger = useCallbackRef(async (values) => {
		// @ts-expect-error TODO fix error later
		const errorPaths = getErrorPaths(errors);
		const allPhasePaths = _.reduce(
			errorPaths,
			(acc, path) => {
				if (path.includes('shared')) {
					_.forEach(phases, ({ value: phase }) => {
						acc.push(path.replace('shared', phase));
					});
				}
				if (path.includes('oil')) {
					acc.push(path.replace('oil', 'shared'));
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

	const handleAdjustForecasts = useCallbackRef((checked: boolean, forecastId) => {
		const curValues = getValues();
		const maxSelected = 10;

		if (curValues.forecasts.length === maxSelected && checked) {
			return warningAlert(`Max number of selected forecasts is ${maxSelected}`);
		}

		resetAndTrigger(
			produce(curValues, (draft) => {
				if (checked && !draft.forecasts.includes(forecastId)) {
					draft.forecasts.push(forecastId);
				} else {
					draft.forecasts = _.filter(draft.forecasts, (id) => id !== forecastId);
				}
			})
		);
	});

	const handleApplyAllChange = useCallbackRef((applyAll: boolean) => {
		const curValues = getValues();
		resetAndTrigger(
			produce(curValues, (draft) => {
				_handleApplyAllChange({ applyAll, draft });
			})
		);
	});

	const handlePhaseTypeChange = useCallbackRef((phase: FormPhase, phaseType: PhaseType) => {
		const curValues = getValues();
		resetAndTrigger(
			produce(curValues, (draft) => {
				if (draft.applyAll && phaseType === 'ratio') {
					draft.shared.fit.phaseType = 'ratio';
					_handleApplyAllChange({ applyAll: false, draft });
					return;
				}

				const phaseSettings = generateProximityPhaseSettings({
					phase: phase === 'shared' ? 'oil' : phase,
					phaseType,
				});
				draft[phase].fit = phaseSettings;
			})
		);
	});

	const getSubmissionBody = useCallbackRef(() => parseProximityForecastValues(getValues()));

	useEffect(() => {
		reset(initialValues);
	}, [initialValues, reset]);

	return {
		form,
		formError,
		getSubmissionBody,
		handleAdjustForecasts,
		handleApplyAllChange,
		handlePhaseTypeChange,
		isLoadingUniqueWellCount,
		uniqueWellCount,
	};
};

export type UseProximityForecastReturn = ReturnType<typeof useProximityForecast>;

export default useProximityForecast;
