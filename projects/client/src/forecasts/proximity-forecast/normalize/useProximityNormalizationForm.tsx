/* eslint-disable @typescript-eslint/no-explicit-any */
import { produce } from 'immer';
import _ from 'lodash';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { useCallbackRef } from '@/components/hooks';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { local } from '@/helpers/storage';
import {
	DEFAULT_BASE_VALUES,
	DEFAULT_EUR_BASE,
	DEFAULT_TARGET_VALUE,
	NormalizationPhaseFormValues,
	cleanInitialBase,
} from '@/type-curves/TypeCurveIndex/normalization/useNormalizationForm';
import {
	EUR_HEADERS,
	calculateChain,
	getAxisKey,
	getBaseKey,
	getNumericalHeaders,
	replaceVarsInAxis,
} from '@/type-curves/shared/utils';
import { TypeCurveStep, TypeCurveWellHeaders } from '@/type-curves/types';

import { stringFormat } from '../fit/ProximityFit';

const PROXIMTIY_FORM_STORAGE_KEY_TEMPLATE = 'proximity-form-normalize-config-{0}-{1}';

export const roundValue = (value, decimalPlaces = 4) => {
	let number = value;
	if (typeof value === 'string') {
		number = parseFloat(value);
	}
	return _.round(number, decimalPlaces);
};
const roundObjectValues = (object, decimalPlaces) => {
	Object.keys(object).forEach((key) => {
		if (isNaN(object[key])) {
			return;
		}
		object[key] = _.round(object[key], decimalPlaces);
	});
	return object;
};

type NormalizationFormValues = Record<Phase, { eur: NormalizationPhaseFormValues }>;

interface NormalizationFormInput {
	bases?: Array<TypeCurveStep.Base>;
	headersData?: Map<string, TypeCurveWellHeaders>;
	isRepInitValid: boolean;
	normalization: any;
	phase: Phase;
	repWells: Array<string>;
	phaseType: 'rate' | 'ratio';
	targetWellHeaderAndEur: any;
	wellsData: any;
}

const defaultBaseValues = {
	...DEFAULT_BASE_VALUES,
	rangeStart: 0,
};

const generateDefaultFormValues = ({
	bases,
	cacheStorageKey,
	headersData: repInitWellsMap,
	isRepInitValid,
	normalization,
	phase,
	repWells,
	targetWellHeaderAndEur,
}: {
	bases: any;
	cacheStorageKey: string;
	headersData: any;
	isRepInitValid: boolean;
	normalization: any;
	phase: Phase;
	repWells: string[];
	targetWellHeaderAndEur: any;
}): NormalizationFormValues => {
	const localConfig = local.getItem(cacheStorageKey);
	let proximityNormalizeConfig: NormalizationFormValues | null = localConfig;
	if (localConfig?.settings) {
		proximityNormalizeConfig = { [phase]: { eur: localConfig.settings } } as NormalizationFormValues;
	} else if (localConfig?.[phase]) {
		proximityNormalizeConfig = localConfig;
	}

	if (!bases || !isRepInitValid) {
		return (proximityNormalizeConfig ?? {
			[phase]: {
				eur: {
					baseKey: '',
					type: 'no_normalization',
					bases: _.transform(
						bases,
						(acc, b) => {
							acc[getBaseKey(b)] = {
								...DEFAULT_EUR_BASE, // default values
							};
						},
						{}
					),
				},
			},
		}) as NormalizationFormValues;
	}
	const originalStep = normalization?.steps?.[phase]?.eur;

	// a lot of mappings here but it will make sure there's a valid selected base even if the db has a base not valid
	// get the base as found in display templates, infers PHASE_EUR and NUMERICAL_HEADER from the headers saved in the db
	const { cleanBase, numericalHeader } = cleanInitialBase(originalStep?.base ?? DEFAULT_EUR_BASE);
	const actualVars = { PHASE_EUR: EUR_HEADERS[phase], NUMERICAL_HEADER: numericalHeader };
	const initialBaseKey = getBaseKey(cleanBase);
	let initialIndex = bases?.findIndex((b) => getBaseKey(b) === initialBaseKey);
	initialIndex = initialIndex === -1 ? 0 : initialIndex; // if for some reason it doesn't find the base stored in the db it will default to the first base
	const initialBase = bases[initialIndex];

	const headerTarget = {
		..._.mapValues(_.keyBy(getNumericalHeaders()), (header) => {
			if (originalStep?.target?.[header]) {
				return originalStep.target[header];
			}
			if (targetWellHeaderAndEur?.header?.[header]) {
				return targetWellHeaderAndEur?.header?.[header];
			}
			const headerValues = repWells
				.map((id) => repInitWellsMap.get(id)?.[header])
				.filter((p) => Number.isFinite(p));
			const meanValue = _.mean(headerValues);
			if (Number.isFinite(meanValue)) {
				return _.round(meanValue, 2);
			}
			return DEFAULT_TARGET_VALUE;
		}),
	};
	const target = {
		...headerTarget,
		..._.transform(
			bases,
			(acc, b) => {
				const resolvedXAxis = replaceVarsInAxis(b.x, actualVars); // replace variables in the x axis, for calculating prop/pll target values and such
				acc[getAxisKey(resolvedXAxis)] = _.round(calculateChain(resolvedXAxis)(headerTarget), 4);
			},
			{}
		),
	};

	if (proximityNormalizeConfig) {
		// load the target well's header information while keep others
		return produce(proximityNormalizeConfig, (draft) => {
			if (!draft[phase]?.eur) {
				return;
			}
			draft[phase].eur.target = target;
		}) as NormalizationFormValues;
	}

	return {
		[phase]: {
			eur: {
				target,
				bases: _.transform(
					bases,
					(acc, b, i) => {
						acc[getBaseKey(b)] = {
							...defaultBaseValues, // default values
							...(i === initialIndex && roundObjectValues(originalStep, 4)), // saved values from db
							numericalHeader,
						};
					},
					{}
				),
				baseKey: getBaseKey(initialBase),
				type: originalStep?.type ?? 'no_normalization',
			},
		},
	} as NormalizationFormValues;
};

export const useProximityNormalizationForm = ({
	bases,
	headersData,
	isRepInitValid,
	normalization,
	phase,
	repWells,
	phaseType,
	targetWellHeaderAndEur,
}: NormalizationFormInput) => {
	const cacheStorageKey = useMemo(
		() => stringFormat(PROXIMTIY_FORM_STORAGE_KEY_TEMPLATE, [phase, phaseType]),
		[phase, phaseType]
	);

	const getInitialValues = useCallbackRef(() =>
		generateDefaultFormValues({
			bases,
			cacheStorageKey,
			headersData,
			isRepInitValid,
			normalization,
			phase,
			repWells,
			targetWellHeaderAndEur,
		})
	);

	const form = useForm({ defaultValues: getInitialValues() });

	const { reset } = form;

	useEffect(() => {
		reset(getInitialValues());
	}, [getInitialValues, reset, bases, headersData, repWells, phaseType]);

	return { form, defaultValues: getInitialValues() };
};
