import { convertDateToIdx, convertIdxToDate } from '@combocurve/forecast/helpers';
import { get } from 'lodash-es';
import { useMemo } from 'react';

import { unitTemplates } from '@/forecasts/shared/getUnitTemplates';
import { getConvertFunc } from '@/helpers/units';
import { clone } from '@/helpers/utilities';
import { fields as segmentModels } from '@/inpt-shared/display-templates/segment-templates/seg_models.json';
import { fields as segmentParameters } from '@/inpt-shared/display-templates/segment-templates/seg_params.json';

const paramsToConvert = ['c', 'q', 'q_end', 'q_start', 'q_sw', 'k'];

const getConversionFunctions = async (idxDate = false, unitConversions) => {
	const { toView = (value) => value, toCalc = (value) => value } = unitConversions ?? {};

	const convertToView = (segment, fullConversion = false) => {
		const output = clone(segment);
		const path = fullConversion ? 'params' : 'formParams.edit';
		get(segmentModels[output.name], path).forEach((param) => {
			const { type } = segmentParameters[param];
			switch (type) {
				case 'Number':
					if (paramsToConvert.includes(param)) {
						output[param] = toView(output[param]);
					}
					break;
				case 'Percent':
					output[param] *= 100;
					break;
				case 'Date':
					output[param] = idxDate ? output[param] : convertIdxToDate(output[param]);
					break;
				default:
			}
		});

		return output;
	};

	const convertToCalc = (segment, fullConversion = false) => {
		const output = clone(segment);
		const path = fullConversion ? 'params' : 'formParams.edit';
		get(segmentModels[output.name], path).forEach((param) => {
			const { type } = segmentParameters[param];
			switch (type) {
				case 'Number':
					if (paramsToConvert.includes(param)) {
						output[param] = toCalc(output[param]);
					}
					break;
				case 'Percent':
					output[param] /= 100;
					break;
				case 'Date':
					output[param] = idxDate ? output[param] : convertDateToIdx(new Date(output[param]));
					break;
				default:
			}
		});

		return output;
	};

	return { convertToView, convertToCalc };
};

const generateForecastConvertFunc = ({
	basePhase = null,
	phase,
	dailyUnitTemplate = unitTemplates.dailyUnitTemplate,
	defaultUnitTemplate = unitTemplates.defaultUnitTemplate,
}) => {
	const cumSumViewUnits = defaultUnitTemplate[`cumsum_${phase}`];
	const cumSumCalcUnits = dailyUnitTemplate[`cumsum_${phase}`];
	const eurViewUnits = cumSumViewUnits;
	const eurCalcUnits = cumSumCalcUnits;

	let qViewUnits = defaultUnitTemplate[phase];
	let qCalcUnits = dailyUnitTemplate[phase];
	let kViewUnits = defaultUnitTemplate[`${phase}_k`];
	let kCalcUnits = dailyUnitTemplate[`${phase}_k`];
	if (basePhase) {
		qViewUnits = defaultUnitTemplate[`${phase}/${basePhase}`];
		qCalcUnits = dailyUnitTemplate[`${phase}/${basePhase}`];

		kViewUnits = defaultUnitTemplate[`${phase}/${basePhase}_k`];
		kCalcUnits = dailyUnitTemplate[`${phase}/${basePhase}_k`];
	}

	const cumSumToCalc = getConvertFunc(cumSumViewUnits, cumSumCalcUnits);
	const cumSumToView = getConvertFunc(cumSumCalcUnits, cumSumViewUnits);
	const eurToCalc = cumSumToCalc;
	const eurToView = cumSumToView;
	const qToCalc = getConvertFunc(qViewUnits, qCalcUnits);
	const qToView = getConvertFunc(qCalcUnits, qViewUnits);
	const kToCalc = getConvertFunc(kViewUnits, kCalcUnits);
	const kToView = getConvertFunc(kCalcUnits, kViewUnits);
	return {
		cumsum: { toCalc: cumSumToCalc, toView: cumSumToView, viewUnits: cumSumViewUnits, calcUnits: cumSumCalcUnits },
		eur: { toCalc: eurToCalc, toView: eurToView, viewUnits: eurViewUnits, calcUnits: eurCalcUnits },
		q: { toCalc: qToCalc, toView: qToView, viewUnits: qViewUnits, calcUnits: qCalcUnits },
		k: { toCalc: kToCalc, toView: kToView, viewUnits: kViewUnits, calcUnits: kCalcUnits },
	};
};

const useForecastConvertFunc = (props) => {
	const { phase, basePhase } = props;

	const conversionFuncs = useMemo(() => generateForecastConvertFunc({ phase, basePhase }), [phase, basePhase]);

	return { ...conversionFuncs, loaded: true };
};

export default getConversionFunctions;
export { paramsToConvert, generateForecastConvertFunc, useForecastConvertFunc };
