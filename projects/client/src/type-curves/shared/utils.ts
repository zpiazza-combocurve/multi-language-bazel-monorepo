import produce from 'immer';
import { meanBy, sortBy } from 'lodash-es';

import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { getWellHeaders } from '@/helpers/headers';
import { replaceVars } from '@/helpers/text';
import { MAX_WELLS_PERFORMANCE_TYPECURVE } from '@/inpt-shared/constants';
import { fields as dailyUnitsTemplates } from '@/inpt-shared/display-templates/units/daily-units.json';
import {
	normalization as defaultNormalizationUnitsTemplates,
	fields as defaultUnitsTempatles,
} from '@/inpt-shared/display-templates/units/default-units.json';
import { fields as monthlyUnitsTemplates } from '@/inpt-shared/display-templates/units/monthly-units.json';
import { fields as types } from '@/inpt-shared/display-templates/wells/well_header_types.json';
import { fields as headersUnits } from '@/inpt-shared/display-templates/wells/well_header_units.json';
import { fields as wellHeadersLabelsShort } from '@/inpt-shared/display-templates/wells/well_headers_abbreviated.json';

import { TypeCurveStep } from '../types';
import { PhaseWellInfo } from './useTypeCurveInfo';

const variableLabels = {
	$PHASE_EUR: 'EUR',
	$NUMERICAL_HEADER: 'Numerical Header',
	$PHASE_PEAK_RATE: 'Peak Rate',
};

export const getLabel = (key: string, { abbreviated = true } = {}) => {
	if (variableLabels[key]) {
		return variableLabels[key];
	}
	if (abbreviated) {
		return wellHeadersLabelsShort[key] ?? getWellHeaders()?.[key];
	}
	return getWellHeaders()?.[key] ?? wellHeadersLabelsShort[key];
};

export const NORMALIZATION_TYPE = {
	no_normalization: {
		label: 'No normalization',
		value: 'no_normalization',
	},
	linear: {
		label: 'Linear Fit',
		value: 'linear',
		tooltipTitle:
			'Puts a least squares linear fit through the data and uses the line to scale the relationship between the x and y values.  This is good when your data look like their y-values increase at the same rate through the values of interest. Generally, the method that gives you a better R-squared indicates whether you should use Linear or Power.',
	},
	'1_to_1': {
		label: '1-to-1 Fit',
		value: '1_to_1',
		limit: MAX_WELLS_PERFORMANCE_TYPECURVE,
		tooltipTitle:
			'Each point is scalable assuming it intersects the y-axis at zero and doubling the x component, doubles the y component.  This generally results in higher EURs for a given change and has the potential to overestimate.',
	},
	power_law: {
		label: 'Power Law Fit',
		value: 'power_law_fit',
		tooltipTitle:
			'Puts a least squares fit on the data using an exponent (raised to a power over 1 for an exponential and less than one for a logistic).  This is good when your data look like they have an additive effect on each other or when the data quality degrades at the tails.  Generally, the method that gives you a better R-squared indicates whether you should use Linear or Power.',
	},
	two_factor: {
		label: '2 - Factor Fit (Peak Rate & EUR)',
		value: 'two_factor',
	},
};

export const TYPE_OPTIONS = ['no_normalization', 'linear', '1_to_1', 'power_law', 'two_factor'].map(
	(k) => NORMALIZATION_TYPE[k]
);

/**
 * Numerical headers but it is a function to get the sorted custom headers at runtime
 *
 * @returns Sorted headers keys
 */
export function getNumericalHeaders() {
	return Object.entries(types)
		.filter(([, { type }]) => ['number', 'integer'].includes(type))
		.map(([key]) => ({ key, label: getLabel(key) }))
		.sort((a, b) => a.key.localeCompare(b.key))
		.map(({ key }) => key);
}

/**
 * @deprecated Use `getNumericalHeaders` instead, it will also get the sorted headers
 * @todo Remove it
 */
export const NUMERICAL_HEADERS = getNumericalHeaders();

export function getUnitsFromHeader(
	header: string | undefined,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	{ resolution = 'monthly', vars }: { resolution?: string; vars?: Record<string, any> } = {}
) {
	if (!header) {
		return {};
	}

	if (vars) {
		header = replaceVars(header, vars);
	}

	const appUnit = ((resolution === 'daily' ? dailyUnitsTemplates[header] : monthlyUnitsTemplates[header]) ??
		headersUnits[header]) as string | undefined;
	const userUnit = (defaultNormalizationUnitsTemplates[header] ??
		defaultUnitsTempatles[header] ??
		headersUnits[header]) as string | undefined;

	return { appUnit, userUnit };
}

export function replaceVarsInAxis(
	axis: TypeCurveStep.Base.Axis,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	vars: Record<string, any> = {}
): TypeCurveStep.Base.Axis {
	const replace = (header: string) => replaceVars(header, vars);

	return produce(axis, (draft) => {
		draft.startFeature = replace(draft.startFeature);
		draft.opChain = draft.opChain.map(({ op, opFeature }) => ({ op, opFeature: replace(opFeature) }));
	});
}

export function getChainUnits(
	axis: TypeCurveStep.Base.Axis,
	{ resolution = 'monthly', abbreviated }: { resolution?: 'daily' | 'monthly'; abbreviated?: boolean } = {}
) {
	const { startFeature, opChain } = axis;

	const getUnits = (header: string) => {
		const { appUnit, userUnit } = getUnitsFromHeader(header, { resolution });
		const headerLabel = getLabel(header, { abbreviated });
		return [appUnit, userUnit, headerLabel, header] as const;
	};

	const [appUnit, userUnit, label, key] = opChain.reduce(
		([resultAppUnit, resultUserUnit, resultHeader, resultKey], { op, opFeature }) => {
			const [opFeatureAppUnit, opFeatureUserUnit, opLabel, opKey] = getUnits(opFeature);
			return [
				`${resultAppUnit}${op}${opFeatureAppUnit}`,
				`${resultUserUnit}${op}${opFeatureUserUnit}`,
				`${resultHeader}${op}${opLabel}`,
				`${resultKey}${op}${opKey}`,
			];
		},
		getUnits(startFeature)
	);

	return { appUnit, userUnit, label, key };
}

export const EUR_HEADERS = {
	oil: 'oil_eur',
	gas: 'gas_eur',
	water: 'water_eur',
};

export const PEAK_RATE_HEADERS = {
	oil: 'oil_peak_rate',
	gas: 'gas_peak_rate',
	water: 'water_peak_rate',
};

/**
 * @example
 * 	operate('+', 1, 2); // 3
 */
export function operate(operator: string, term1: number, term2: number) {
	if (!(Number.isFinite(term1) && Number.isFinite(term2))) {
		return null;
	}
	switch (operator) {
		case '/':
			return term1 / term2;
		case '*':
			return term1 * term2;
		case '-':
			return term1 - term2;
		case '+':
			return term1 + term2;
		default:
			// TODO handle error
			return term1;
	}
}

const INVERT_OPERATOR_MAP = {
	'+': '-',
	'-': '+',
	'/': '*',
	'*': '/',
};

export function calculateChain(axis: TypeCurveStep.Base.Axis) {
	const { startFeature, opChain } = axis;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return (header: Record<string, any>) => {
		const value = opChain.reduce(
			(result, { op, opFeature }) => operate(op, result, header[opFeature]),
			header[startFeature]
		);
		return value;
	};
}

export function invertChain({ startFeature, opChain }: TypeCurveStep.Base.Axis) {
	return { startFeature, opChain: opChain.map(({ opFeature, op }) => ({ opFeature, op: INVERT_OPERATOR_MAP[op] })) };
}

export function backwardcalculateChain(axis: TypeCurveStep.Base.Axis) {
	const { startFeature, opChain } = axis;
	const finalKey = opChain.reduce((result, { op, opFeature }) => result + op + opFeature, startFeature);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return (header: Record<string, any>) => {
		const value = opChain.reduceRight(
			(result, { op, opFeature }) => operate(INVERT_OPERATOR_MAP[op], result, header[opFeature]),
			header[finalKey]
		);
		return value;
	};
}

export function createFitPoints({
	wellIds,
	getHeader,
	base,
}: {
	wellIds: string[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	getHeader(wellId: string): Record<string, any>;
	base: TypeCurveStep.Base;
}) {
	const { x: xAxis, y: yAxis } = base;

	const calcX = calculateChain(xAxis);
	const calcY = calculateChain(yAxis);
	const unsortedPoints = wellIds.map((wellId) => {
		const header = getHeader(wellId);
		// get the yTrue from header
		const x = calcX({ ...header });
		// yPredicate
		const y = calcY({ ...header });
		return {
			well: header._id,
			point: [x, y] as const,
			header,
		};
	});

	const validPoints = unsortedPoints.filter(({ point }) => Number.isFinite(point[0]) && Number.isFinite(point[1]));
	const averageX = meanBy(validPoints, 'point.0');
	const averageY = meanBy(validPoints, 'point.1');

	return {
		points: sortBy(validPoints, 'point.0'),
		averageX: Number.isFinite(averageX) ? averageX : 0,
		averageY: Number.isFinite(averageY) ? averageY : 0,
	};
}

export function getFitTarget({ base, target }) {
	const { x } = base;
	const calcX = calculateChain(x);
	return calcX(target);
}

export const getAxisKey = (axis: TypeCurveStep.Base.Axis) => getChainUnits(axis).key;

export const getBaseKey = (base: TypeCurveStep.Base) => `${getAxisKey(base.x)}_${getAxisKey(base.y)}`;

export function getStartFeatureAxis(axis: TypeCurveStep.Base.Axis): TypeCurveStep.Base.Axis {
	return {
		startFeature: getAxisKey(axis),
		opChain: axis.opChain.map(({ opFeature, op }) => {
			if (op !== '/' && op !== '*') {
				throw new Error('Only division and multiplication operations are allowed');
			}
			return {
				opFeature,
				op: op === '/' ? '*' : '/',
			};
		}),
	};
}

/**
 * Get type curve phase data to display in table
 *
 * @todo Add types
 */
export function getPhaseInfo({
	phase,
	info,
}: {
	/** Oil/Gas/Water */
	phase: string;
	/** @see `useTypeCurveWellsData` */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	info?: any;
}) {
	if (info) {
		const { forecast_data_freq, forecast_type, has_forecast } = info.forecast_info[phase];
		const { has_data } = info.data_info[phase];
		const { perf_lateral_length } = info.header;
		const eur = info.eur[phase];
		const eurpll = eur && perf_lateral_length ? eur / perf_lateral_length ?? 1 : undefined;
		return {
			[`${phase}_data_freq`]: forecast_data_freq,
			[`${phase}_forecast_type`]: forecast_type,
			[`${phase}_has_forecast`]: has_forecast,
			[`${phase}_has_data`]: has_data,
			[`${phase}_eur`]: eur,
			[`${phase}_eur/pll`]: eurpll,
			[`${phase}_valid`]: info?.valid[phase],
			[`${phase}_peak_rate`]: info?.peak_rate?.[phase],
		};
	}
	return {};
}

/** @returns Type curve well is_valid information */
export function getWellTypeCurveInfo({ info }: { info }) {
	return {
		...getPhaseInfo({ phase: 'oil', info }),
		...getPhaseInfo({ phase: 'gas', info }),
		...getPhaseInfo({ phase: 'water', info }),
	};
}

export function getPhaseStatusInfo({
	phase,
	phaseWellsInfo,
	wellId,
}: {
	phase: Phase;
	phaseWellsInfo: Record<Phase, PhaseWellInfo>;
	wellId: string;
}) {
	const phaseWellInfo = phaseWellsInfo?.[phase];
	if (!phaseWellInfo) {
		return {
			[`${phase}_excluded`]: false,
			[`${phase}_invalid`]: false,
			[`${phase}_rep`]: false,
		};
	}

	return {
		[`${phase}_excluded`]: phaseWellInfo.excludedWells.includes(wellId),
		[`${phase}_invalid`]: phaseWellInfo.invalidWells.includes(wellId),
		[`${phase}_rep`]: phaseWellInfo.repWells.includes(wellId),
	};
}

export function getWellTypeCurveStatusInfo({
	phaseWellsInfo,
	wellId,
}: {
	phaseWellsInfo: Record<Phase, PhaseWellInfo>;
	wellId: string;
}) {
	return {
		...getPhaseStatusInfo({ phase: 'oil', phaseWellsInfo, wellId }),
		...getPhaseStatusInfo({ phase: 'gas', phaseWellsInfo, wellId }),
		...getPhaseStatusInfo({ phase: 'water', phaseWellsInfo, wellId }),
	};
}
