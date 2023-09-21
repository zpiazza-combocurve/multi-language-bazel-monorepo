import _ from 'lodash';

import { getConvertFunc } from '@/helpers/units';
import { formatValue } from '@/helpers/utilities';
import { getChainUnits } from '@/type-curves/shared/utils';

import { replaceVarsInBase } from './NormalizationPhaseForm';
import { FormSubmissionBaseType, NormalizationMultipliers } from './types';

export const formatWithUnits = (value, units: ReturnType<typeof getChainUnits>) => {
	if (!Number.isFinite(value)) {
		return 'N/A';
	}
	const { appUnit, userUnit } = units;
	const convert = getConvertFunc(appUnit, userUnit);
	const adjustedValue = formatValue(convert(value));
	const adjustedUnit = userUnit?.toUpperCase();
	if (!adjustedUnit) {
		return adjustedValue;
	}
	return `${adjustedValue} ${adjustedUnit}`;
};

export const getActiveMask = (ids, selectionFilter) => ids.map((id) => selectionFilter.filteredSet.has(id));

export const trimPoints = (points, startFraction = 0.02, endFraction = 0.98) => {
	const start = Math.floor(points.length * startFraction);
	const end = Math.floor(points.length * endFraction);
	const excludeIds = points.filter((_p, index) => index < start || index >= end).map(({ well }) => well);
	return excludeIds;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const mergeNormalizationData = (phase, typeCurveId, currNormalization = [], newNormData: any = null) => {
	if (!newNormData) return currNormalization;
	const { eur, qPeak, twoFactor } = newNormData;

	const newNormalizationValues = _.map(eur?.adjusted_headers, ({ _id }, idx) => {
		const multipliers: NormalizationMultipliers = {
			eur: null,
			qPeak: null,
		};
		const ret: {
			multipliers: NormalizationMultipliers;
			nominalMultipliers?: NormalizationMultipliers;
			phase: string;
			typeCurve: string;
			well: string;
		} = {
			multipliers,
			phase,
			typeCurve: typeCurveId,
			well: _id,
		};

		const validMask = twoFactor?.validMask?.[idx];
		ret.multipliers.eur = !twoFactor || validMask ? eur.multipliers[idx] : 1;

		if (qPeak && twoFactor) {
			ret.multipliers.qPeak = validMask ? qPeak.multipliers[idx] : 1;
			const nominalQPeak = validMask ? twoFactor?.nominalQPeak?.[idx] ?? multipliers.qPeak ?? 1 : 1;
			const nominalEur = validMask ? twoFactor?.nominalEur?.[idx] ?? multipliers.eur ?? 1 : 1;
			const nominalMultipliers: NormalizationMultipliers = {
				eur: nominalEur,
				qPeak: nominalQPeak,
			};
			ret.nominalMultipliers = nominalMultipliers;
		} else {
			multipliers.eur = qPeak ? qPeak : multipliers.eur;
			ret.nominalMultipliers = { eur: multipliers.eur, qPeak: null };
		}
		return ret;
	});

	return _.unionBy(newNormalizationValues, currNormalization, 'well');
};

export function createFilterFn(min, max) {
	const validMin = Number.isFinite(min);
	const validMax = Number.isFinite(max);
	if (validMin && validMax) {
		return (v) => min <= v && v <= max;
	}
	if (validMin) {
		return (v) => min <= v;
	}
	if (validMax) {
		return (v) => v <= max;
	}
	return () => true;
}

export const filterPointsX = (points, xMin, xMax) => {
	const filter = createFilterFn(xMin, xMax);
	return points.filter(({ point }) => filter(point[0])).map(({ well }) => well);
};

export function generateStepByBase(baseProps: FormSubmissionBaseType) {
	return {
		base: replaceVarsInBase(baseProps.rawBase, {
			NUMERICAL_HEADER: baseProps.numericalHeader,
			PHASE_EUR: 'eur',
			PHASE_PEAK_RATE: 'peak_rate',
		}),
		target: baseProps.target,
		type: baseProps.type,
	};
}
