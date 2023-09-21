import produce from 'immer';
import _ from 'lodash';
import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';

import { SelectionFilter, useCallbackRef } from '@/components/hooks';
import { FormPhase, Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { withLoadingBar } from '@/helpers/alerts';
import { postApi } from '@/helpers/routing';
import {
	EUR_HEADERS,
	PEAK_RATE_HEADERS,
	backwardcalculateChain,
	calculateChain,
	getAxisKey,
	getBaseKey,
	getNumericalHeaders,
	replaceVarsInAxis,
} from '@/type-curves/shared/utils';
import { TypeCurveNormalization, TypeCurveStep, TypeCurveWellHeaders } from '@/type-curves/types';

import { FitPhaseTypes } from '../types';
import { replaceVarsInBase } from './NormalizationPhaseForm';

const DEFAULT_NUMERICAL_HEADER = 'first_prop_weight';
const DEFAULT_TARGET_VALUE = 100;
const PHASES = ['oil', 'gas', 'water'];

export type NormalizationBase = {
	rangeStart: number;
	rangeEnd: number;
	aValue: number;
	bValue: number;
	normalizationMin: number;
	normalizationMax: number;
	numericalHeader: string;
};

const DEFAULT_BASE_VALUES: NormalizationBase = {
	rangeStart: 0.02,
	rangeEnd: 0.98,
	aValue: 1,
	bValue: 0,
	normalizationMin: 0,
	normalizationMax: 0,
	numericalHeader: DEFAULT_NUMERICAL_HEADER,
};

interface NormalizationFormInput {
	bases?: Array<TypeCurveStep.Base>;
	headersData?: Map<string, TypeCurveWellHeaders>;
	normalizations: Record<Phase, TypeCurveNormalization | undefined>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onSubmit: (values: any) => void;
	phaseRepWells: Record<Phase, Array<string>>;
	phaseTypes: FitPhaseTypes;
	selectionFilters: Record<Phase, SelectionFilter>;
	typeCurveId: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	wellsData: any;
}

const cleanInitialBase = (base: TypeCurveStep.Base & { key?: string }) => {
	// will try to roll back variables changes to the base, eg eur -> $PHASE_EUR and pll to NUMERICAL_HEADER, will also tell which numerical header it is using
	let numericalHeader = DEFAULT_NUMERICAL_HEADER;
	const cleanBase = produce(base, (draft) => {
		draft.y.startFeature = base.key === 'peak_pll' ? '$PHASE_PEAK_RATE' : '$PHASE_EUR';
		if (draft.x.opChain.length === 0) {
			// HACK perf_lateral_length belongs to eur vs pll base and will be excluded from eur vs numerical
			if (draft.x.startFeature !== '$NUMERICAL_HEADER' && draft.x.startFeature !== 'perf_lateral_length') {
				numericalHeader = draft.x.startFeature;
				draft.x.startFeature = '$NUMERICAL_HEADER';
			}
		}
	});
	return { numericalHeader, cleanBase };
};

const DEFAULT_EUR_BASE = {
	key: 'eur_pll',
	x: { opChain: [], startFeature: 'perf_lateral_length' },
	y: { opChain: [], startFeature: '$PHASE_EUR' },
};

const DEFAULT_PEAK_RATE_BASE = {
	key: 'peak_pll',
	x: { opChain: [], startFeature: 'perf_lateral_length' },
	y: { opChain: [], startFeature: '$PHASE_PEAK_RATE' },
};

const generateTargetData = ({
	actualVars,
	bases,
	headersData,
	step,
	repWells,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	actualVars: Record<string, any>;
	bases: Array<TypeCurveStep.Base>;
	headersData: Map<string, TypeCurveWellHeaders>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	step?: any;
	repWells: Array<string>;
}) => {
	const headerTarget = {
		..._.mapValues(_.keyBy(getNumericalHeaders()), (header) => {
			if (step?.target?.[header]) {
				return step.target[header];
			}
			const headerValues = repWells.map((id) => headersData.get(id)?.[header]).filter((p) => Number.isFinite(p));
			const meanValue = _.mean(headerValues);
			if (Number.isFinite(meanValue)) {
				return _.round(meanValue, 2);
			}
			return DEFAULT_TARGET_VALUE;
		}),
	};

	return {
		...headerTarget,
		..._.transform(
			bases,
			(acc, b) => {
				const resolvedXAxis = replaceVarsInAxis(b.x, actualVars); // replace variables in the x axis, for calculating prop/pll target values and such
				acc[getAxisKey(resolvedXAxis)] = calculateChain(resolvedXAxis)(headerTarget);
			},
			{}
		),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	} as Record<string, any>;
};

const generatePhaseNormalization = ({
	bases,
	headersData,
	normalization,
	phase,
	repWells = [],
}: {
	bases?: Array<TypeCurveStep.Base>;
	headersData?: Map<string, TypeCurveWellHeaders>;
	normalization?: TypeCurveNormalization;
	phase: Phase;
	repWells?: Array<string>;
}) => {
	const { eur: ogEurStep, qPeak: ogQPeakStep, normalizationType } = normalization?.steps ?? {};
	if (!(bases && headersData) || (!ogEurStep && ogQPeakStep)) {
		return {
			eur: { target: {}, bases: {}, baseKey: '', type: 'no_normalization' },
			qPeak: { target: {}, bases: {}, baseKey: '', type: 'no_normalization' },
			shared: null,
			type: 'no_normalization',
		};
	}

	// get the base as found in display templates, infers PHASE_EUR and NUMERICAL_HEADER from the headers saved in the db
	const { cleanBase: cleanBaseEUR, numericalHeader: numericalHeaderEUR } = cleanInitialBase(
		ogEurStep?.base ?? DEFAULT_EUR_BASE
	);
	const { cleanBase: cleanBaseQPeak, numericalHeader: numericalHeaderQPeak } = cleanInitialBase(
		ogQPeakStep?.base ?? DEFAULT_PEAK_RATE_BASE
	);

	const actualVarsEUR = { PHASE_EUR: EUR_HEADERS[phase], NUMERICAL_HEADER: numericalHeaderEUR };
	const actualVarsQPeak = { PHASE_PEAK_RATE: PEAK_RATE_HEADERS[phase] };

	const initialBaseKeyEur = getBaseKey(cleanBaseEUR);
	const initialBaseKeyQPeak = getBaseKey(cleanBaseQPeak);

	let initialIndexEur = bases?.findIndex((b) => getBaseKey(b) === initialBaseKeyEur);
	let initialIndexQPeak = bases?.findIndex((b) => getBaseKey(b) === initialBaseKeyQPeak);

	initialIndexEur = initialIndexEur === -1 ? 0 : initialIndexEur; // if for some reason it doesn't find the base stored in the db it will default to the first base
	initialIndexQPeak = initialIndexQPeak === -1 ? 0 : initialIndexQPeak;

	const initialBaseEur = bases[initialIndexEur];
	const initialBaseQPeak = bases[initialIndexQPeak];

	const eurHeaderTarget = generateTargetData({
		actualVars: actualVarsEUR,
		bases,
		headersData,
		step: ogEurStep,
		repWells,
	});

	const qPeakHeaderTarget = generateTargetData({
		actualVars: actualVarsQPeak,
		bases,
		headersData,
		step: ogQPeakStep,
		repWells,
	});

	return {
		eur: {
			target: eurHeaderTarget,
			bases: _.transform(
				bases,
				(acc, b, i) => {
					acc[getBaseKey(b)] = {
						...DEFAULT_BASE_VALUES, // default values
						...(i === initialIndexEur && ogEurStep), // saved values from db
						numericalHeader: numericalHeaderEUR,
					};
				},
				{}
			) as Record<string, NormalizationBase>,
			baseKey: getBaseKey(initialBaseEur),
			type: ogEurStep?.type ?? 'no_normalization',
		},
		qPeak: {
			target: qPeakHeaderTarget,
			bases: _.transform(
				bases,
				(acc, b, i) => {
					acc[getBaseKey(b)] = {
						...DEFAULT_BASE_VALUES, // default values
						...(i === initialIndexQPeak && ogQPeakStep), // saved values from db
						numericalHeader: numericalHeaderQPeak,
					};
				},
				{}
			) as Record<string, NormalizationBase>,
			baseKey: getBaseKey(initialBaseQPeak),
			type: ogQPeakStep?.type ?? 'no_normalization',
		},
		shared: { target: { perf_lateral_length: eurHeaderTarget.perf_lateral_length } },
		type:
			normalizationType === 'eur_and_q_peak'
				? 'two_factor'
				: (normalization?.steps[normalizationType ?? 'eur']?.type as string) ?? 'no_normalization',
	};
};

interface NormalizationPhaseFormValues {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	target: Record<string, any>;
	bases: Record<string, NormalizationBase>;
	baseKey: string;
	type: string;
}

export interface NormalizationFormValues {
	phases: Record<Phase, boolean>;
	oil: {
		eur: NormalizationPhaseFormValues;
		qPeak: NormalizationPhaseFormValues;
		shared: { target: { perf_lateral_length: number } } | null;
		type: string;
	};
	gas: {
		eur: NormalizationPhaseFormValues;
		qPeak: NormalizationPhaseFormValues;
		shared: { target: { perf_lateral_length: number } } | null;
		type: string;
	};
	water: {
		eur: NormalizationPhaseFormValues;
		qPeak: NormalizationPhaseFormValues;
		shared: { target: { perf_lateral_length: number } } | null;
		type: string;
	};
}

interface Output {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	eur?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	qPeak?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	twoFactor?: any;
}
export interface NormalizationOutput {
	oil?: Output | null;
	gas?: Output | null;
	water?: Output | null;
}

const generateDefaultFormValues = ({
	bases,
	headersData,
	normalizations,
	phaseRepWells,
	phaseTypes,
}: Omit<
	NormalizationFormInput,
	'onSubmit' | 'typeCurveId' | 'wellsData' | 'selectionFilters'
>): NormalizationFormValues => ({
	phases: { oil: phaseTypes.oil === 'rate', gas: phaseTypes.gas === 'rate', water: phaseTypes.water === 'rate' },
	oil: generatePhaseNormalization({
		bases,
		headersData,
		normalization: normalizations?.oil,
		phase: 'oil',
		repWells: phaseRepWells.oil,
	}),
	gas: generatePhaseNormalization({
		bases,
		headersData,
		normalization: normalizations?.gas,
		phase: 'gas',
		repWells: phaseRepWells.oil,
	}),

	water: generatePhaseNormalization({
		bases,
		headersData,
		normalization: normalizations?.water,
		phase: 'water',
		repWells: phaseRepWells.oil,
	}),
});

const getSubmitFormProps = ({ bases, phase, values }) => {
	const { type: normalizationType, shared, ...phaseObject } = values[phase];
	return _.mapValues(phaseObject, (phaseFormValues) => {
		const { baseKey, target: target_, type } = phaseFormValues;
		const { aValue, bValue, numericalHeader } = phaseFormValues.bases[baseKey];

		const rawBase = bases?.find((b) => getBaseKey(b) === baseKey) ?? bases?.[0];
		const base =
			rawBase &&
			replaceVarsInBase(rawBase, {
				PHASE_EUR: EUR_HEADERS[phase],
				NUMERICAL_HEADER: numericalHeader,
				PHASE_PEAK_RATE: PEAK_RATE_HEADERS[phase],
			});

		let target = !base
			? target_
			: { ...target_, [base.x.startFeature]: backwardcalculateChain(base.x)(target_ ?? {}) };

		if (normalizationType === 'two_factor') {
			target = { ...target, ...shared.target };
		}

		return {
			aValue,
			base,
			baseKey,
			bValue,
			numericalHeader,
			rawBase,
			target,
			type,
		};
	});
};

const useNormalizationForm = ({
	bases,
	headersData,
	normalizations,
	onSubmit,
	phaseRepWells,
	phaseTypes,
	selectionFilters,
	typeCurveId,
	wellsData,
}: NormalizationFormInput) => {
	const getInitialValues = useCallbackRef(() =>
		generateDefaultFormValues({ bases, headersData, normalizations, phaseRepWells, phaseTypes })
	);

	const form = useForm({
		defaultValues: getInitialValues(),
	});

	const { getValues, reset } = form;

	const resetTargetValues = useCallbackRef(() => {
		const curValues = getValues();

		const newValues = produce(curValues, (draft) => {
			_.forEach(PHASES, (phase) => {
				const eurTarget = generateTargetData({
					actualVars: { PHASE_EUR: EUR_HEADERS[phase], NUMERICAL_HEADER: DEFAULT_NUMERICAL_HEADER },
					bases: bases ?? [],
					headersData: headersData ?? new Map(),
					repWells: phaseRepWells[phase],
				});
				const qPeakTarget = generateTargetData({
					actualVars: { PHASE_PEAK_RATE: PEAK_RATE_HEADERS[phase] },
					bases: bases ?? [],
					headersData: headersData ?? new Map(),
					repWells: phaseRepWells[phase],
				});

				draft[phase].eur.target = eurTarget;
				draft[phase].qPeak.target = qPeakTarget;
				draft[phase].shared.target = { perf_lateral_length: eurTarget.perf_lateral_length };
			});
		});
		reset({ ...newValues });
	});

	const togglePhase = useCallback(
		(inputPhase: Phase) => {
			const { phases } = getValues();
			const newPhases = produce(phases, (draft) => {
				draft[inputPhase] = !draft[inputPhase];
			});
			reset({ phases: newPhases });
		},
		[getValues, reset]
	);

	const { mutateAsync: handleSubmit, isLoading: normalizing } = useMutation(
		async (values: NormalizationFormValues) => {
			const { phases } = values;

			const twoFactorPhases = PHASES.reduce((acc: string[], phase) => {
				if (values[phase]['type'] === 'two_factor' && phases[phase]) {
					acc.push(phase);
				}
				return acc;
			}, []);

			const isTwoFactorActive = twoFactorPhases.length > 0;

			const getPhaseBody = (phase: Phase, normType) => {
				const {
					[normType]: { aValue, base, bValue, target, type },
				} = getSubmitFormProps({
					bases,
					phase,
					values,
				});

				const selectedWellIds = selectionFilters[phase].filteredArray;
				const wells = _.map(selectedWellIds, (wellId) => ({
					...(headersData?.get(wellId) ?? {}),
					[EUR_HEADERS[phase]]: wellsData?.get(wellId)?.eur?.[phase] ?? 0,
					[PEAK_RATE_HEADERS[phase]]: wellsData?.get(wellId)?.peak_rate?.[phase] ?? 0,
				}));

				return {
					aValue,
					bValue,
					normalizationMask: selectedWellIds,
					target,
					type,
					wells,
					x: base.x,
					y: base.y,
				};
			};

			let eurOutput = postApi(`/type-curve/${typeCurveId}/normalization/normalize`, {
				phases,
				tcId: typeCurveId,
				..._.reduce(
					phases,
					(acc, phaseBool, phase) => {
						if (phaseBool) {
							acc[phase] = getPhaseBody(phase as Phase, 'eur');
						}
						return acc;
					},
					{}
				),
			});

			let qPeakOutput;
			let twoFactorOutput;
			if (isTwoFactorActive) {
				qPeakOutput = postApi(`/type-curve/${typeCurveId}/normalization/normalize`, {
					phases: _.mapValues(phases, (phaseBool, phase) => phaseBool && twoFactorPhases.includes(phase)),
					tcId: typeCurveId,
					..._.reduce(
						twoFactorPhases,
						(acc, phase) => {
							acc[phase] = getPhaseBody(phase as Phase, 'qPeak');
							return acc;
						},
						{}
					),
				});
			}

			[eurOutput, qPeakOutput] = await withLoadingBar(Promise.all([eurOutput, qPeakOutput]));

			if (qPeakOutput) {
				const twoFactorBody = _.reduce(
					twoFactorPhases,
					(acc, phase) => {
						const selectedWellIds = selectionFilters[phase].filteredArray;

						return {
							...acc,
							[phase]: {
								q_peak_values: _.map(
									selectedWellIds,
									(wellId) => wellsData.get(wellId)['peak_rate'][phase]
								),
								eur_values: _.map(selectedWellIds, (wellId) => wellsData.get(wellId)['eur'][phase]),
								q_peak_multipliers: qPeakOutput[phase]?.multipliers,
								eur_multipliers: eurOutput[phase]?.multipliers,
								well_ids: selectedWellIds,
								resolved_resolution: _.map(
									selectedWellIds,
									(wellId) => wellsData?.get(wellId)?.['resolved_resolution'][phase]
								),
							},
						};
					},
					{}
				);

				twoFactorOutput = await withLoadingBar(
					postApi(`/type-curve/${typeCurveId}/normalization/normalize-two-factor`, twoFactorBody)
				);
			}

			const output: NormalizationOutput = _.reduce(
				Object.keys(eurOutput),
				(acc, phase) => {
					const eur = eurOutput[phase];
					const qPeak = qPeakOutput?.[phase];
					const twoFactor = twoFactorOutput?.[phase];

					if (eur || qPeak || twoFactor) {
						acc[phase] = {};
						if (eur) {
							acc[phase].eur = eur;
						}
						if (qPeak) {
							acc[phase].qPeak = qPeak;
						}
						if (twoFactor) {
							acc[phase].twoFactor = twoFactor;
						}
					}

					return acc;
				},
				{}
			);
			onSubmit({ formValues: values, output });
		}
	);

	const handleAdjustType = useCallback(
		({ phase, type }: { phase: FormPhase; type: string }) => {
			const curValues = getValues();
			reset(
				produce(curValues, (draft) => {
					draft[phase].type = type;
					if (type !== 'two_factor') {
						draft[phase].eur.type = type;
					} else {
						draft[phase].eur.baseKey = 'perf_lateral_length_$PHASE_EUR';
						draft[phase].eur.type = 'linear';
						draft[phase].qPeak.type = 'linear';
					}
				})
			);
		},
		[getValues, reset]
	);

	const handleCopyPhase = useCallbackRef((phaseIn: Phase) => {
		const curValues = getValues();
		reset(
			produce(curValues, (draft) => {
				// add stricter typing that ignores 'bases' if necessary
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				const toCopy: any = _.cloneDeep(draft[phaseIn]);

				// remove eur.bases and qPeak.bases aValues and bValues as they should not be copied
				toCopy.eur.bases = _.mapValues(toCopy.eur.bases, (value) => _.omit(value, ['aValue', 'bValue']));
				toCopy.qPeak.bases = _.mapValues(toCopy.qPeak.bases, (value) => _.omit(value, ['aValue', 'bValue']));

				_.forEach(
					_.filter(PHASES, (p) => p !== phaseIn),
					(phase) => {
						draft[phase] = _.merge(draft[phase], toCopy);
					}
				);
			})
		);
	});

	useEffect(() => {
		resetTargetValues();
	}, [phaseRepWells, resetTargetValues]);

	useEffect(() => {
		reset(getInitialValues());
	}, [getInitialValues, reset, bases, headersData, phaseTypes]);

	return {
		form,
		handleAdjustType,
		handleCopyPhase,
		handleSubmit,
		togglePhase,
		normalizing,
	};
};

export default useNormalizationForm;
export {
	DEFAULT_BASE_VALUES,
	DEFAULT_EUR_BASE,
	DEFAULT_PEAK_RATE_BASE,
	DEFAULT_TARGET_VALUE,
	cleanInitialBase,
	getSubmitFormProps,
	generateTargetData,
	NormalizationPhaseFormValues,
};
