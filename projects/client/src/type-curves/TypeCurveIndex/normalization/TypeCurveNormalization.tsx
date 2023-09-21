import produce from 'immer';
import _ from 'lodash';
import { useMemo } from 'react';
import { useMutation, useQuery } from 'react-query';

import usePermissions, { SUBJECTS } from '@/access-policies/usePermissions';
import { Placeholder } from '@/components';
import { SelectionFilter, useCallbackRef, useDerivedState, useSelectionFilter } from '@/components/hooks';
import { Divider, Typography } from '@/components/v2';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { confirmationAlert, withLoadingBar } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { useProjectHeadersQuery } from '@/helpers/project-custom-headers';
import { queryClient } from '@/helpers/query-cache';
import { postApi } from '@/helpers/routing';
import { assert } from '@/helpers/utilities';
import { phases } from '@/helpers/zing';
import { use2FactorMultipliersChange } from '@/type-curves/TypeCurveNormalization/MultipliersTable';
import {
	TC_KEYS,
	useTypeCurve,
	useTypeCurveEur,
	useTypeCurveStep,
	useTypeCurveWellHeaders,
	useTypeCurveWellsData,
} from '@/type-curves/api';
import { EUR_HEADERS, NORMALIZATION_TYPE, PEAK_RATE_HEADERS } from '@/type-curves/shared/utils';

import { FormTitle } from '../shared/formLayout';
import { FitPhaseTypes, Multiplier } from '../types';
import NormalizationForm from './NormalizationForm';
import { usePhaseFormProps } from './NormalizationPhaseForm';
import { filterPointsX, generateStepByBase, getActiveMask, mergeNormalizationData, trimPoints } from './helpers';
import { NormalizationTypes } from './types';
import useNormalizationForm, { getSubmitFormProps } from './useNormalizationForm';

const useCustomNumericalHeaders = () => {
	const { project } = useAlfa();
	const { data: headers } = useProjectHeadersQuery(project?._id);
	return headers?.hasProjectHeaders
		? Object.keys(headers.projectHeaders)
				.filter((key) => {
					return headers.projectHeadersTypes[key].type === 'number';
				})
				.map((key) => {
					const value = headers.projectHeaders[key];
					return {
						key,
						value,
					};
				})
				.sort((a, b) => a.value.localeCompare(b.value))
		: [];
};

const useTypeCurveNormalization = ({
	basePhase,
	phaseRepWells,
	phaseTypes,
	typeCurveId,
}: {
	basePhase: Phase;
	phaseRepWells: Record<Phase, Array<string>>;
	phaseTypes: FitPhaseTypes;
	typeCurveId: string;
}) => {
	const { data: typeCurve } = useTypeCurve(typeCurveId);
	assert(typeCurve);

	const { normalizations } = typeCurve;

	const [steps, setSteps] = useDerivedState(
		{
			oil: normalizations?.oil?.steps,
			gas: normalizations?.gas?.steps,
			water: normalizations?.water?.steps,
		},
		[normalizations]
	);

	const { data: { bases } = {}, isLoading: isLoadingBases } = useTypeCurveStep(typeCurveId);
	const { data: eurData, isLoading: isLoadingEurData } = useTypeCurveEur(typeCurveId);
	const { data: headersData, isLoading: isLoadingHeadersData } = useTypeCurveWellHeaders(typeCurveId);
	const { data: wellsData, isLoading: isLoadingWellData } = useTypeCurveWellsData(typeCurveId);

	const { data: _wellsNormalizationData, isLoading: isLoadingWellsNormalization } = useQuery({
		queryKey: TC_KEYS.wellsNormalization(typeCurveId),
		select: (normalizationData) => {
			// normalization data needs to be sorted to match the rep wells for the multipliers to match to the right well
			if (!normalizationData) return normalizationData;
			const transformedNormData = _.mapValues(normalizationData, (data) => _.keyBy(data, 'well'));
			return _.mapValues(transformedNormData, (_, phase) => {
				return phaseRepWells[phase]
					.map((repWellId) => {
						return transformedNormData[phase][repWellId];
					})
					.filter(Boolean);
			});
		},
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const [wellsNormalizationData, setWellsNormalizationData] = useDerivedState<any>(_wellsNormalizationData);

	const { eurAndQPeakMultipliers, multipliersMap } = useMemo(() => {
		if (!wellsNormalizationData || _.isEmpty(wellsNormalizationData)) {
			return { eurAndQPeakMultipliers: {}, multipliersMap: {} };
		}

		const phaseMap = _.mapValues(wellsNormalizationData, (data) => _.keyBy(data, 'well'));

		const eurAndQPeakMultipliers = {};
		const multipliersMap = _.reduce(
			phases,
			(acc, { value: phase }) => {
				const isRatioPhase = phaseTypes[phase] === 'ratio';
				const dataKey = isRatioPhase ? basePhase : phase;
				const multiplierData: {
					[well: string]: { well: string; multipliers: Multiplier; nominalMultipliers?: Multiplier };
				} = phaseMap[dataKey];

				if (!multiplierData) return acc;

				const currPhaseMultipliers = {};
				acc[phase] = _.reduce(
					phaseRepWells[phase],
					(acc, well) => {
						// multipliers
						currPhaseMultipliers[well] = multiplierData[well]
							? { ...multiplierData[well].multipliers }
							: { eur: null, qPeak: null };
						// nominal multipliers
						const { eur = null, qPeak = null } = multiplierData[well]?.nominalMultipliers ?? {};
						acc[well] = [eur, qPeak];
						return acc;
					},
					{}
				);

				eurAndQPeakMultipliers[phase] = _.map(
					phaseRepWells[phase],
					(wellId) => currPhaseMultipliers[wellId] ?? { eur: null, qPeak: null }
				);

				return acc;
			},
			{}
		);

		return { eurAndQPeakMultipliers, multipliersMap };
	}, [basePhase, phaseRepWells, phaseTypes, wellsNormalizationData]);

	const isEdited = useMemo(() => {
		const { oil: oilStep, gas: gasStep, water: waterStep } = steps;

		return !_.isMatch(
			[
				oilStep?.eur,
				oilStep?.qPeak,
				gasStep?.eur,
				gasStep?.qPeak,
				waterStep?.eur,
				waterStep?.qPeak,
				wellsNormalizationData,
			],
			[
				normalizations?.oil?.steps?.eur,
				normalizations?.oil?.steps?.qPeak,
				normalizations?.gas?.steps?.eur,
				normalizations?.gas?.steps?.qPeak,
				normalizations?.water?.steps?.eur,
				normalizations?.water?.steps?.qPeak,
				_wellsNormalizationData,
			]
		);
	}, [_wellsNormalizationData, normalizations, steps, wellsNormalizationData]);

	const resetData = useCallbackRef(() => {
		setSteps({
			oil: normalizations?.oil?.steps,
			gas: normalizations?.gas?.steps,
			water: normalizations?.water?.steps,
		});

		setWellsNormalizationData(_wellsNormalizationData);
	});

	// selection filters
	const oilSelectionFilter = useSelectionFilter(phaseRepWells.oil);
	const gasSelectionFilter = useSelectionFilter(phaseRepWells.gas);
	const waterSelectionFilter = useSelectionFilter(phaseRepWells.water);

	const { canUpdate: canUpdateTypeCurve } = usePermissions(SUBJECTS.TypeCurves, typeCurve.project);

	const selectionFilters: Record<Phase, SelectionFilter> = useMemo(
		() => ({
			oil: oilSelectionFilter,
			gas: gasSelectionFilter,
			water: waterSelectionFilter,
		}),
		[gasSelectionFilter, oilSelectionFilter, waterSelectionFilter]
	);

	const onSubmit = useCallbackRef(({ formValues, output }) => {
		setSteps(
			produce((draft) => {
				_.forEach(output, (outputValues, phase) => {
					const { eur, qPeak } = getSubmitFormProps({
						bases,
						phase,
						values: formValues,
					});

					// set normalizationType; strict typing should probably be added for this
					if (formValues[phase].type === NORMALIZATION_TYPE.two_factor.value) {
						draft[phase].normalizationType = 'eur_and_q_peak';
					} else {
						draft[phase].normalizationType = 'eur';
					}

					if (outputValues?.eur) {
						draft[phase].eur = {
							...draft[phase].eur,
							..._.omit(formValues[phase].eur.bases?.[eur.baseKey], 'numericalHeader'),
							...generateStepByBase(eur),
						};
					}

					if (outputValues?.qPeak) {
						draft[phase].qPeak = {
							...draft[phase].qPeak,
							..._.omit(formValues[phase].qPeak.bases?.[qPeak.baseKey], 'numericalHeader'),
							...generateStepByBase(qPeak),
						};
					} else {
						draft[phase].qPeak = null;
					}
				});
			})
		);

		setWellsNormalizationData(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			produce((draft: any) => {
				_.map(_.keys(output), (phase) => {
					draft[phase] = mergeNormalizationData(phase, typeCurveId, draft[phase], output[phase]);
				});
			})
		);

		confirmationAlert('Multipliers adjusted successfully');
	});

	const { form, handleAdjustType, handleCopyPhase, handleSubmit } = useNormalizationForm({
		bases,
		headersData,
		normalizations,
		onSubmit,
		phaseRepWells,
		phaseTypes,
		selectionFilters,
		typeCurveId,
		wellsData,
	});

	const oilEurFormProps = usePhaseFormProps({
		bases,
		form,
		headersData,
		normType: 'eur',
		phase: 'oil',
		selectionFilters,
		wellsData,
		wellsNormalizationData,
	});

	const oilPeakRateFormProps = usePhaseFormProps({
		bases,
		form,
		headersData,
		normType: 'qPeak',
		phase: 'oil',
		selectionFilters,
		wellsData,
		wellsNormalizationData,
	});

	const gasEurFormProps = usePhaseFormProps({
		bases,
		form,
		headersData,
		normType: 'eur',
		phase: 'gas',
		selectionFilters,
		wellsData,
		wellsNormalizationData,
	});
	const gasPeakRateFormProps = usePhaseFormProps({
		bases,
		form,
		headersData,
		normType: 'qPeak',
		phase: 'gas',
		selectionFilters,
		wellsData,
		wellsNormalizationData,
	});

	const waterEurFormProps = usePhaseFormProps({
		bases,
		form,
		headersData,
		normType: 'eur',
		phase: 'water',
		selectionFilters,
		wellsData,
		wellsNormalizationData,
	});

	const waterPeakRateFormProps = usePhaseFormProps({
		bases,
		form,
		headersData,
		normType: 'qPeak',
		phase: 'water',
		selectionFilters,
		wellsData,
		wellsNormalizationData,
	});

	const { getValues, setValue } = form;

	const phaseFormProps = {
		oil: { eur: oilEurFormProps, qPeak: oilPeakRateFormProps },
		gas: { eur: gasEurFormProps, qPeak: gasPeakRateFormProps },
		water: { eur: waterEurFormProps, qPeak: waterPeakRateFormProps },
	};

	const handleFitTrim = useCallbackRef((phase: Phase, normType: NormalizationTypes) => {
		const { points } = phaseFormProps[phase][normType];

		const curValues = getValues();
		const baseKey = curValues[phase][normType].baseKey;
		const baseValues = curValues[phase][normType].bases[baseKey];

		selectionFilters[phase].filterOut(trimPoints(points, baseValues?.rangeStart, baseValues?.rangeEnd));
	});

	const handleNormalizeFilter = useCallbackRef((phase: Phase, normType: NormalizationTypes) => {
		const { points } = phaseFormProps[phase][normType];

		const curValues = getValues();
		const baseKey = curValues[phase][normType].baseKey;
		const baseValues = curValues[phase][normType].bases[baseKey];

		const filtered = filterPointsX(points, baseValues?.normalizationMin, baseValues?.normalizationMax);
		selectionFilters[phase].filterTo(filtered);
	});

	const { mutateAsync: autoFit, isLoading: fitting } = useMutation(
		async ({
			checkSaved = false,
			normType,
			phase,
		}: {
			checkSaved?: boolean;
			normType: NormalizationTypes;
			phase: Phase;
		}) => {
			const savedNormalization = normalizations?.[phase]?.steps;
			const savedType = savedNormalization?.[normType]?.type;

			// check to see if there is a saved normalization
			if (!(checkSaved && savedType?.length) || savedType === NORMALIZATION_TYPE.no_normalization.value) {
				const { base, baseKey, type } = phaseFormProps[phase][normType];

				const { aValue: newAValue, bValue: newBValue } = await withLoadingBar(
					postApi(`/type-curve/${typeCurveId}/normalization/fit`, {
						fitMask: getActiveMask(phaseRepWells[phase], selectionFilters[phase]),
						normalizationType: type,
						phase,
						tcId: typeCurveId,
						wells: _.map(phaseRepWells[phase], (wellId) => ({
							...(headersData?.get(wellId) ?? {}),
							[EUR_HEADERS[phase]]: wellsData?.get(wellId)?.eur?.[phase] ?? 0,
							[PEAK_RATE_HEADERS[phase]]: wellsData?.get(wellId)?.peak_rate?.[phase] ?? 0,
						})),
						x: base.x,
						y: base.y,
					})
				);

				setValue(`${phase}.${normType}.bases.${baseKey}.aValue`, newAValue);
				setValue(`${phase}.${normType}.bases.${baseKey}.bValue`, newBValue);
			}
		}
	);

	const { mutateAsync: saveNormalization, isLoading: saving } = useMutation(async () => {
		await withLoadingBar(
			postApi(`/type-curve/${typeCurveId}/normalizations/save`, {
				steps: _.mapValues(steps, (step, phase) => ({
					...step,
					wells: wellsNormalizationData?.[phase],
				})),
			})
		);

		queryClient.setQueryData(TC_KEYS.wellsNormalization(typeCurveId), wellsNormalizationData);
		queryClient.invalidateQueries(TC_KEYS.view(typeCurveId));

		confirmationAlert('Normalization saved successfully');
	});

	const { recalculatingMultipliers, handleNormalizationMultipliersChange } = use2FactorMultipliersChange({
		wellsNormalizationData,
		setWellsNormalizationData,
		wellsData,
		typeCurveId,
	});

	const customNumericalHeaders = useCustomNumericalHeaders();

	return {
		autoFit,
		bases,
		canUpdateTypeCurve,
		eurAndQPeakMultipliers,
		eurData,
		form,
		handleAdjustType,
		handleCopyPhase,
		handleFitTrim,
		handleNormalizeFilter,
		handleSubmit,
		headersData,
		isEdited,
		loading:
			isLoadingWellData ||
			isLoadingBases ||
			isLoadingWellsNormalization ||
			isLoadingHeadersData ||
			isLoadingEurData,
		multipliersMap,
		normalizationSelection: selectionFilters,
		performingAction: fitting || saving,
		phaseFormProps,
		resetData,
		handleNormalizationMultipliersChange,
		saveNormalization,
		recalculatingMultipliers: recalculatingMultipliers && 'Calculating Multipliers',
		customNumericalHeaders,
	};
};

function TypeCurveNormalization({
	loading,
	...formProps
}: ReturnType<typeof useNormalizationForm> & { loading?: boolean }) {
	return (
		<Placeholder loading={loading} minShow={50} minHide={500} forceOnFirstRender>
			<FormTitle>
				<Typography css='font-weight: 500;' variant='body1'>
					Normalization
				</Typography>
			</FormTitle>

			<Divider />

			{/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later */}
			<NormalizationForm {...(formProps as any)} />
		</Placeholder>
	);
}

export default TypeCurveNormalization;
export { useTypeCurveNormalization };
