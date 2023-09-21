import { convertIdxToDate } from '@combocurve/forecast/helpers';
import _ from 'lodash';
import { useEffect, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import ForecastFormControl, { FormControlRangeField } from '@/forecasts/forecast-form/ForecastFormControl';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';

import { FieldSection } from '../shared/formLayout';
import { Align, CalculatedBackgroundDataType, PhaseType, SinglePhaseData } from '../types';
import { ADD_SERIES_MENU_OPTIONS, BEST_FIT_Q_PEAK_MENU_OPTIONS, TOOLTIPS } from './helpers';

function AddSeriesFields({
	align,
	backgroundData,
	basePath: basePathIn,
	hasRepWells,
	phase,
	phaseData,
	phaseType,
}: {
	align?: Align;
	backgroundData?: CalculatedBackgroundDataType | null;
	basePath?: string;
	hasRepWells: boolean;
	phase: Phase;
	phaseData?: SinglePhaseData | null;
	phaseType: PhaseType;
}) {
	const basePath = basePathIn ?? phase;
	const { clearErrors, getValues, setValue, watch } = useFormContext();
	const [addSeries, bestFitMethod] = watch([`${basePath}.addSeries`, `${basePath}.best_fit_q_peak.method`]);

	const requiredMinMax = useMemo(() => {
		if (!backgroundData || !align) {
			return {
				p1MinMax: {
					min: -10_000,
					max: 25_000,
				},
				qPeakMinMax:
					bestFitMethod === 'absolute_range'
						? {
								min: 0.01,
								max: 20_000,
						  }
						: {
								min: 1,
								max: 99,
						  },
				addSeriesFitRange: null,
			};
		}

		const output = {} as Record<string, { min?: number; max?: number; startLabel?: string; endLabel?: string }>;

		// p1_range
		const dataIdx = backgroundData?.[align]?.idx;
		if (_.isArray(dataIdx)) {
			const min = dataIdx[0];
			const max = Math.round(dataIdx[dataIdx.length - 1]);
			output.p1MinMax = {
				min,
				max,
			};
		} else {
			output.p1MinMax = {
				min: -10_000,
				max: 25_000,
			};
		}

		// best_fit_q_peak.range
		if (bestFitMethod !== 'absolute_range') {
			output.qPeakMinMax = {
				min: 1,
				max: 99,
			};
		} else if (bestFitMethod === 'absolute_range') {
			const { data, idx } = phaseData?.prodData ?? {};
			if (!(data && idx)) {
				output.qPeakMinMax = {
					min: 0.01,
					max: 20_000,
				};
			} else {
				output.qPeakMinMax = {
					min: 0.01,
					max: 20_000,
				};
			}
		}

		const rollUpDateIdx = backgroundData?.cum_dict?.idx;
		if (_.isArray(rollUpDateIdx)) {
			output.addSeriesFitRange = { min: rollUpDateIdx[0], max: rollUpDateIdx[rollUpDateIdx.length - 1] };
		}

		return _.mapValues(output, (item) => ({
			...item,
			startLabel: `Min (${item.min})`,
			endLabel: `Max (${item.max})`,
		}));
	}, [align, backgroundData, bestFitMethod, phaseData?.prodData]);

	useEffect(() => {
		const { p1MinMax, qPeakMinMax, addSeriesFitRange } = requiredMinMax;
		const curValues = getValues();
		const isAbsoluteValue = _.get(curValues, `${basePath}.best_fit_q_peak.method`);

		const clearFields = [`${basePath}.p1_range`, `${basePath}.best_fit_q_peak.range`];

		setValue(`${basePath}.p1_range`, [p1MinMax?.min ?? -10_000, Math.round((p1MinMax?.max ?? 25_000) / 2)]);
		setValue(`${basePath}.best_fit_q_peak.range`, [
			qPeakMinMax?.min ?? (isAbsoluteValue ? 0.01 : 1),
			qPeakMinMax?.max ?? (isAbsoluteValue ? 20_000 : 99),
		]);

		if (addSeriesFitRange) {
			clearFields.push(`${basePath}.addSeriesFitRange`);
			setValue(
				`${basePath}.addSeriesFitRange`,
				_.map([addSeriesFitRange.min, addSeriesFitRange.max], (value) => convertIdxToDate(value))
			);
		}

		clearErrors(clearFields);
	}, [basePath, clearErrors, getValues, phase, requiredMinMax, setValue]);

	const enabledQpeak =
		['absolute_range', 'percentile_range'].includes(bestFitMethod) &&
		['collect_prod', 'collect_cum'].includes(addSeries);
	return (
		<FieldSection>
			<ForecastFormControl
				label='Best Fit Options'
				menuItems={ADD_SERIES_MENU_OPTIONS[phaseType]}
				name={`${basePath}.addSeries`}
				type='select'
			/>

			<FormControlRangeField
				disabled={!['collect_prod', 'collect_cum'].includes(addSeries)}
				label='Select Dates'
				name={`${basePath}.addSeriesFitRange`}
				required={hasRepWells && ['collect_prod', 'collect_cum'].includes(addSeries)}
				tooltip={TOOLTIPS.best_fit_q_peak.addSeriesFitRange}
				type='date'
			/>

			<ForecastFormControl
				label='Best Fit q Peak'
				menuItems={BEST_FIT_Q_PEAK_MENU_OPTIONS}
				name={`${basePath}.best_fit_q_peak.method`}
				tooltip={TOOLTIPS.best_fit_q_peak.method}
				type='select'
			/>

			<FormControlRangeField
				disabled={!enabledQpeak}
				label='Input Range'
				name={`${basePath}.best_fit_q_peak.range`}
				required={hasRepWells && ['absolute_range', 'percentile_range'].includes(bestFitMethod)}
				type='number'
				{...requiredMinMax.qPeakMinMax}
			/>

			<FormControlRangeField
				dif={1}
				isInteger
				label='P-Series Fit Range (Days)'
				name={`${basePath}.p1_range`}
				required={hasRepWells}
				type='number'
				{...requiredMinMax.p1MinMax}
			/>
		</FieldSection>
	);
}

export default AddSeriesFields;
