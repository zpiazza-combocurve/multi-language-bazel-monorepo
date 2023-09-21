import produce from 'immer';
import _ from 'lodash-es';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { useCallbackRef } from '@/components/hooks';
import { getErrorPaths, useErrorsCache } from '@/components/react-hook-form-helpers';
import { VALID_PHASES } from '@/forecasts/charts/components/graphProperties';
import { useConfigurationDialog } from '@/forecasts/configurations/ConfigurationDialog';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { fields as formTemplates } from '@/inpt-shared/display-templates/forecast/typecurve_forms.json';

import { Align, FitPhaseTypes, FitResolution, PhaseType } from '../types';

const TC_MODEL_DEFAULTS: Record<PhaseType, string> = { rate: 'segment_arps_4_wp_free_b1', ratio: 'flat' };

type AddSeriesType = 'average' | 'collect_prod' | 'collect_cum';
type AddSeriesFitArray = Array<Date>;
type BuildupDict = {
	apply_ratio: boolean;
	apply: boolean;
	buildup_ratio: number;
	days: number;
};
type BestFitQPeakDict = {
	method: string;
	range: Array<number>;
};
type PhaseForm = {
	addSeries: AddSeriesType;
	addSeriesFitRange: AddSeriesFitArray;
	applySeries: AddSeriesType;
	b: Array<number>;
	b0: Array<number>;
	b2: Array<number>;
	b1: Array<number>;
	basePhase: Phase;
	best_fit_q_peak: BestFitQPeakDict;
	buildup: BuildupDict;
	D_lim_eff: number;
	D1_eff: Array<number>;
	D2_eff: Array<number>;
	fit_complexity: 'complex' | 'simple';
	minus_t_decline_t_0: Array<number>;
	minus_t_elf_t_peak: Array<number>;
	minus_t_peak_t0: Array<number>;
	p1_range: Array<number>;
	phaseType: PhaseType;
	q_final: number;
	q_peak: Array<number>;
	TC_model: string;
	well_life: number;
};
export type FitFormSettings = {
	[x in Phase]: PhaseForm;
} & { phases: { [x in Phase]: boolean } };

const isValidFormConfig = (config = {}) => {
	const requiredKeys = ['phases', 'oil', 'gas', 'water'];
	const configKeys = _.keys(config);
	return _.every(requiredKeys, (key) => configKeys.includes(key) && !!config[key]);
};

const getValidFormConfig = (config, phaseTypes) => {
	if (!config) {
		return {};
	}

	const hasValidKeys = isValidFormConfig(config);
	return hasValidKeys
		? _.pickBy(config, (value, key) => {
				if (key === 'phases') {
					return true;
				}
				if (VALID_PHASES.includes(key as Phase)) {
					return phaseTypes[key] === value.phaseType;
				}
				return false;
		  })
		: {};
};

export const generatePhaseSettings = ({ phase, phaseType }: { phase: Phase; phaseType: PhaseType }): PhaseForm => {
	const currentDate = new Date();
	return {
		addSeries: 'average',
		addSeriesFitRange: [
			currentDate,
			new Date(currentDate.getFullYear() + 60, currentDate.getMonth(), currentDate.getDate()),
		],
		applySeries: 'average',
		b: [-2, -0.001],
		b0: [-10, -0.001],
		b2: [0.001, 2],
		b1: [0.001, 2],
		basePhase: phase === 'oil' ? 'gas' : 'oil',
		best_fit_q_peak: { method: 'P50', range: [1, 99] },
		buildup: {
			apply_ratio: false,
			apply: true,
			buildup_ratio: 0.1,
			days: 0,
		},
		D_lim_eff: 8,
		D1_eff: [1, 99],
		D2_eff: [1, 99],
		fit_complexity: 'complex',
		minus_t_decline_t_0: [1, 300],
		minus_t_elf_t_peak: [1, 5000],
		minus_t_peak_t0: [0, 1000],
		p1_range: [-10000, 10000],
		phaseType,
		q_final: 0.8,
		q_peak: [0, 10000],
		TC_model: TC_MODEL_DEFAULTS[phaseType],
		well_life: 60,
	};
};

export const generateDefaultFormValues = ({
	phaseRepWells = { oil: [], gas: [], water: [] },
	phaseTypes = { oil: 'rate', gas: 'rate', water: 'rate' },
}: {
	phaseRepWells?: Record<Phase, Array<string>>;
	phaseTypes?: FitPhaseTypes;
} = {}): FitFormSettings => ({
	phases: { oil: !!phaseRepWells.oil.length, gas: !!phaseRepWells.gas.length, water: !!phaseRepWells.water.length },
	oil: generatePhaseSettings({ phase: 'oil', phaseType: phaseTypes.oil }),
	gas: generatePhaseSettings({ phase: 'gas', phaseType: phaseTypes.gas }),
	water: generatePhaseSettings({ phase: 'water', phaseType: phaseTypes.water }),
});

const getPhaseObj = (phaseRepWells) =>
	_.reduce(
		phaseRepWells,
		(acc, repWells, phase) => {
			if (!repWells.length) {
				acc.phases[phase] = false;
			}
			return acc;
		},
		{ phases: { oil: true, gas: true, water: true } }
	);

const useAutoFitForm = ({
	align,
	fitConfigProps,
	handleFitRequest,
	initSettings,
	normalize,
	phaseRepWells,
	phaseTypes,
	resolution,
}: {
	align: Align;
	fitConfigProps: Omit<ReturnType<typeof useConfigurationDialog>, 'dialog' | 'showConfigDialog'> & {
		dialog?: JSX.Element;
		showConfigDialog?: (any) => void;
	};
	handleFitRequest;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	initSettings: Record<string, any>;
	normalize: boolean;
	phaseRepWells: Record<Phase, Array<string>>;
	phaseTypes: FitPhaseTypes;
	resolution: FitResolution;
}) => {
	const { activeConfig, defaultConfig, dialog: configDialog, showConfigDialog: _showConfigDialog } = fitConfigProps;

	const initialValues = useMemo(
		() =>
			produce(generateDefaultFormValues({ phaseRepWells, phaseTypes }), (draft) => {
				_.merge(
					_.merge(draft, getValidFormConfig(defaultConfig, phaseTypes)),
					getValidFormConfig(initSettings, phaseTypes)
				);
			}),
		[defaultConfig, initSettings, phaseRepWells, phaseTypes]
	);

	const form = useForm({ defaultValues: initialValues, mode: 'onChange' });
	const {
		clearErrors,
		formState: { errors, isSubmitting },
		getValues,
		reset,
		trigger,
		watch,
	} = form;

	const [...formPhases] = watch(['phases.oil', 'phases.gas', 'phases.water']);
	const { set: setErrors, get: getErrors } = useErrorsCache();

	const togglePhase = useCallbackRef(async (inputPhase: Phase) => {
		const curValues = getValues();
		const curBool = curValues.phases[inputPhase];
		await reset(
			produce(curValues, (draft) => {
				draft.phases[inputPhase] = !curBool;
				if (curBool) {
					setErrors(inputPhase, _.cloneDeep(errors), (value) => value.includes(inputPhase));
				}
			}),
			{ keepErrors: true }
		);

		(curBool ? clearErrors : trigger)(getErrors(inputPhase));
	});

	const handleModelChange = useCallbackRef(async (phase: Phase, newModel: string) => {
		const curValues = getValues();
		const newModelViewOrder = formTemplates[phaseTypes[phase]][newModel].viewOrder;
		await reset(
			produce(curValues, (draft) => {
				const curModel = draft[phase].TC_model;
				draft[phase].TC_model = newModel;

				const defaultValues = generatePhaseSettings({ phase, phaseType: phaseTypes[phase] });
				const difFields: Array<string> = _.difference(
					newModelViewOrder,
					formTemplates[phaseTypes[phase]][curModel].viewOrder
				);

				// add buildup fields exception for flat_arps_modified
				if (curModel === 'flat_arps_modified') {
					difFields.push('buildup');
				}

				_.merge(draft[phase], _.pick(defaultValues, difFields));
			})
		);

		const errorPaths = getErrorPaths(errors);

		// check for errors on fields that are part of the new model
		const formFields = _.map(newModelViewOrder, (field) => `${phase}.${field}`);

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		trigger([...errorPaths, ...formFields]);
	});

	const formError: string | boolean = useMemo(() => {
		if (!_.map(formPhases, (value) => Boolean(value)).includes(true)) {
			return 'No phases selected';
		}
		if (isSubmitting) {
			return 'Submitting forecast';
		}
		if (!_.isEmpty(errors)) {
			return 'Please correct the errors on the form';
		}
		return false;
	}, [formPhases, errors, isSubmitting]);

	// check if this needs to be wrapped
	const handleSubmit = useCallback(async () => {
		const curValues = getValues();
		// make async call here
		await handleFitRequest(curValues);
	}, [getValues, handleFitRequest]);

	const showConfigDialog = useCallbackRef(() => {
		_showConfigDialog?.({ align, normalize, resolution, ...getValues() });
	});

	// update form on activeConfig change
	useEffect(() => {
		if (isValidFormConfig(activeConfig)) {
			const curValues = getValues();
			reset(
				produce(curValues, (draft) => {
					_.merge(_.merge(draft, getValidFormConfig(activeConfig, phaseTypes)), getPhaseObj(phaseRepWells));
				})
			);
		}
	}, [activeConfig, getValues, phaseRepWells, phaseTypes, reset]);

	useEffect(() => {
		const curValues = getValues();
		reset(
			produce(curValues, (draft) => {
				_.merge(draft, getPhaseObj(phaseRepWells));
			})
		);
	}, [getValues, phaseRepWells, reset]);

	return {
		activeConfig,
		configDialog,
		form,
		formError,
		handleModelChange,
		handleSubmit,
		showConfigDialog,
		togglePhase,
	};
};

export default useAutoFitForm;
export { PhaseForm };
