/* eslint-disable @typescript-eslint/no-explicit-any */
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useMutation } from 'react-query';

import { useCallbackRef, useSelectionFilter } from '@/components/hooks';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { confirmationAlert } from '@/helpers/alerts';
import { useDebounce } from '@/helpers/debounce';
import { postApi } from '@/helpers/routing';
import { local } from '@/helpers/storage';
import normalizationTemplate from '@/inpt-shared/type-curves/normalization-template';
import { usePhaseFormProps } from '@/type-curves/TypeCurveIndex/normalization/NormalizationPhaseForm';
import { filterPointsX, getActiveMask, trimPoints } from '@/type-curves/TypeCurveIndex/normalization/helpers';
import { EUR_HEADERS } from '@/type-curves/shared/utils';

import { stringFormat } from '../fit/ProximityFit';
import { useProximityNormalizationForm } from './useProximityNormalizationForm';

const PROXIMTIY_FORM_STORAGE_KEY_TEMPLATE = 'proximity-form-normalize-config-{0}-{1}';

export const roundObjectValues = (object, decimalPlaces) => {
	Object.keys(object).forEach((key) => {
		if (isNaN(object[key])) {
			return;
		}
		object[key] = _.round(object[key], decimalPlaces);
	});
	return object;
};
export const roundValue = (value: number, decimalPlaces = 4): number => {
	let number = value;
	if (typeof value === 'string') {
		number = parseFloat(value);
	}
	return _.round(number, decimalPlaces);
};

interface UseProximityNormalizationProps {
	phase: Phase;
	phaseRepWells: string[];
	phaseType: 'rate' | 'ratio';
	proximityProps: {
		repInitWellsMap: any;
		targetWellHeaderAndEur: any;
		setProximityBgNormalization: (norm: [number, number][]) => void;
	};
	rawBackgroundData: any;
	selection: any;
	setRawBackgroundData: (data: any) => void;
}

// a lot of the end points used to create data here don't actually need a valid ID.
//   So we just provide a fake one...
const MOCK_TYPECURVE_ID = '6169cc2b7286afe4e424b289';

const useProximityNormalization = ({
	phase,
	phaseType,
	phaseRepWells: repWells,
	proximityProps: { repInitWellsMap, targetWellHeaderAndEur },
	rawBackgroundData,
	selection: fitSelectionFilter,
	setRawBackgroundData,
}: UseProximityNormalizationProps) => {
	const isRepInitValid = repInitWellsMap.size > 0;

	// Template should be changed to reflect new norm structure
	const { bases } = normalizationTemplate.steps[0];

	// new norm data
	const headersData = useMemo(() => {
		const headersMap = new Map();
		repInitWellsMap.forEach((value, key) => {
			headersMap.set(key, { ...value.header, _id: value.well_id });
		});
		return headersMap;
	}, [repInitWellsMap]);

	const normalization = useMemo(() => {
		const eurStep = normalizationTemplate.steps[0];

		return {
			phase,
			typeCurve: MOCK_TYPECURVE_ID,
			steps: {
				[phase]: {
					eur: {
						key: eurStep.key,
						name: eurStep.name,
						base: eurStep.bases[0],
						type: 'no_normalization',
					},
				},
			},
		};
	}, [phase]);

	const { filteredArray: fitWellIds } = fitSelectionFilter;
	const normalizeSelectionFilter = useSelectionFilter(repWells);
	const selectionFilter = useMemo(() => ({ [phase]: normalizeSelectionFilter }), [normalizeSelectionFilter, phase]);

	const cacheStorageKey = useMemo(
		() => stringFormat(PROXIMTIY_FORM_STORAGE_KEY_TEMPLATE, [phase, phaseType]),
		[phase, phaseType]
	);

	const { form } = useProximityNormalizationForm({
		bases,
		headersData,
		isRepInitValid,
		normalization,
		phase,
		repWells,
		phaseType,
		targetWellHeaderAndEur,
		wellsData: repInitWellsMap,
	});

	const eurFormProps = usePhaseFormProps({
		bases,
		form,
		headersData,
		normType: 'eur',
		phase,
		selectionFilters: selectionFilter,
		wellsData: repInitWellsMap,
		wellsNormalizationData: rawBackgroundData?.normalization ?? [],
	});

	const phaseFormProps = useMemo(() => ({ [phase]: { eur: eurFormProps } }), [eurFormProps, phase]);

	const { getValues, setValue } = form;

	const handleFitTrim = useCallbackRef(() => {
		const { points } = phaseFormProps[phase].eur;

		const curValues = getValues();
		const baseKey = curValues[phase]?.eur.baseKey as string;
		const baseValues = curValues[phase]?.eur.bases?.[baseKey];

		selectionFilter[phase].filterOut(trimPoints(points, baseValues?.rangeStart, baseValues?.rangeEnd));
	});

	const handleNormalizeFilter = useCallbackRef(() => {
		const { points } = phaseFormProps[phase].eur;

		const curValues = getValues();
		const baseKey = curValues[phase]?.eur?.baseKey as string;
		const baseValues = curValues[phase]?.eur?.bases?.[baseKey];

		const filtered = filterPointsX(points, baseValues?.normalizationMin, baseValues?.normalizationMax);
		selectionFilter[phase].filterTo(filtered);
	});

	const autoFit = useCallbackRef(async () => {
		const { base, baseKey, type } = phaseFormProps[phase].eur;

		if (!base || !isRepInitValid) {
			return;
		}

		const { aValue: newAValue, bValue: newBValue } = await postApi(`/forecast/proximityNormalizationFit`, {
			tcId: MOCK_TYPECURVE_ID,
			phase,
			x: base.x,
			y: base.y,
			wells: repWells.map((wellId) => ({
				...repInitWellsMap.get(wellId)?.header,
				[EUR_HEADERS[phase]]: repInitWellsMap.get(wellId)?.eur?.[phase] ?? 0,
			})),
			normalizationType: type,
			fitMask: getActiveMask(repWells, selectionFilter[phase]),
		});

		setValue(`${phase}.eur.bases.${baseKey}.aValue`, roundValue(newAValue, 4));
		setValue(`${phase}.eur.bases.${baseKey}.bValue`, roundValue(newBValue, 4));
	});

	const normalize = useCallbackRef(async () => {
		const { aValue, bValue, base, target, baseValues, type } = phaseFormProps[phase].eur;
		if (!base || !isRepInitValid || !type || !target || !baseValues || type === 'no_normalization') {
			return;
		}

		const phaseBody = {
			phase,
			aValue,
			bValue,
			target,
			type,
			x: base.x,
			y: base.y,
			wells: repWells.map((wellId) => ({
				...repInitWellsMap.get(wellId)?.header,
				[EUR_HEADERS[phase]]: repInitWellsMap.get(wellId)?.eur?.[phase] ?? 0,
			})),
			normalizationMask: getActiveMask(repWells, selectionFilter[phase]),
		};

		const output = await postApi(`/forecast/proximityNormalize`, {
			tcId: MOCK_TYPECURVE_ID,
			phases: { [phase]: true },
			[phase]: phaseBody,
		});

		const newData = _.cloneDeep(rawBackgroundData);
		const normalization = output[phase].multipliers.map((multiplier) => [multiplier, 1]);
		newData.normalization = normalization;
		setRawBackgroundData(newData);
		const formValues = getValues();
		local.setItem(cacheStorageKey, { settings: formValues?.[phase]?.eur });
		confirmationAlert('Normalization generated successfully');
	});

	const { isLoading: autoFitting, mutate: handleAutoFit } = useMutation(autoFit);

	const { isLoading: normalizing, mutate: handleNormalize } = useMutation(normalize);

	const [shouldAutofit, setShouldAutofit] = useState(false);

	useEffect(() => {
		if (fitWellIds?.length) {
			setShouldAutofit(true);
		}
	}, [fitWellIds, phase, phaseType, targetWellHeaderAndEur, eurFormProps.type, eurFormProps.targetX]);

	// without debouncing, normalization will use outdated form values
	const debouncedNormalize = useDebounce(handleNormalize, 850);
	useEffect(() => {
		if (shouldAutofit) {
			setShouldAutofit(false);
			handleAutoFit();
			debouncedNormalize();
		}
	}, [debouncedNormalize, handleAutoFit, shouldAutofit]);

	const normalizationProps = {
		autoFit: handleAutoFit,
		bases,
		form,
		handleFitTrim,
		handleNormalize,
		handleNormalizeFilter,
		performingAction: autoFitting || normalizing,
		phase,
		phaseFormProps,
		phaseType,
		selection: selectionFilter[phase],
	};

	return normalizationProps;
};

export { useProximityNormalization };
