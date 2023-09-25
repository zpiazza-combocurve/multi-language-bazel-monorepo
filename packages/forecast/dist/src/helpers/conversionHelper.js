"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useForecastConvertFunc = exports.generateForecastConvertFunc = exports.paramsToConvert = void 0;
const lodash_es_1 = require("lodash-es");
const utilities_1 = require("../../helpers/main-combocurve/utilities");
const units_1 = require("../../helpers/units");
const seg_models_json_1 = require("../../templates/segment-templates/seg_models.json");
const seg_params_json_1 = require("../../templates/segment-templates/seg_params.json");
const PhaseGraph_1 = require("./charts/classes/PhaseGraph");
const getUnitTemplates_1 = require("./getUnitTemplates");
const math_1 = require("./math");
const paramsToConvert = ['c', 'q', 'q_end', 'q_start', 'q_sw', 'k'];
exports.paramsToConvert = paramsToConvert;
const getConversionFunctions = async (idxDate = false, unitConversions) => {
    const { toView = (value) => value, toCalc = (value) => value } = unitConversions ?? {};
    const convertToView = (segment, fullConversion = false) => {
        const output = (0, utilities_1.clone)(segment);
        const path = fullConversion ? 'params' : 'formParams.edit';
        (0, lodash_es_1.get)(seg_models_json_1.fields[output.name], path).forEach((param) => {
            const { type } = seg_params_json_1.fields[param];
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
                    output[param] = idxDate ? output[param] : (0, PhaseGraph_1.convertIdxToDate)(output[param]);
                    break;
                default:
            }
        });
        return output;
    };
    const convertToCalc = (segment, fullConversion = false) => {
        const output = (0, utilities_1.clone)(segment);
        const path = fullConversion ? 'params' : 'formParams.edit';
        (0, lodash_es_1.get)(seg_models_json_1.fields[output.name], path).forEach((param) => {
            const { type } = seg_params_json_1.fields[param];
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
                    output[param] = idxDate ? output[param] : (0, math_1.convertDateToIdx)(new Date(output[param]));
                    break;
                default:
            }
        });
        return output;
    };
    return { convertToView, convertToCalc };
};
const generateForecastConvertFunc = ({ basePhase = null, phase, dailyUnitTemplate = getUnitTemplates_1.unitTemplates.dailyUnitTemplate, defaultUnitTemplate = getUnitTemplates_1.unitTemplates.defaultUnitTemplate, }) => {
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
    const cumSumToCalc = (0, units_1.getConvertFunc)(cumSumViewUnits, cumSumCalcUnits);
    const cumSumToView = (0, units_1.getConvertFunc)(cumSumCalcUnits, cumSumViewUnits);
    const eurToCalc = cumSumToCalc;
    const eurToView = cumSumToView;
    const qToCalc = (0, units_1.getConvertFunc)(qViewUnits, qCalcUnits);
    const qToView = (0, units_1.getConvertFunc)(qCalcUnits, qViewUnits);
    const kToCalc = (0, units_1.getConvertFunc)(kViewUnits, kCalcUnits);
    const kToView = (0, units_1.getConvertFunc)(kCalcUnits, kViewUnits);
    return {
        cumsum: { toCalc: cumSumToCalc, toView: cumSumToView, viewUnits: cumSumViewUnits, calcUnits: cumSumCalcUnits },
        eur: { toCalc: eurToCalc, toView: eurToView, viewUnits: eurViewUnits, calcUnits: eurCalcUnits },
        q: { toCalc: qToCalc, toView: qToView, viewUnits: qViewUnits, calcUnits: qCalcUnits },
        k: { toCalc: kToCalc, toView: kToView, viewUnits: kViewUnits, calcUnits: kCalcUnits },
    };
};
exports.generateForecastConvertFunc = generateForecastConvertFunc;
const useForecastConvertFunc = (props) => {
    const { phase, basePhase } = props;
    const conversionFuncs = useMemo(() => generateForecastConvertFunc({ phase, basePhase }), [phase, basePhase]);
    return { ...conversionFuncs, loaded: true };
};
exports.useForecastConvertFunc = useForecastConvertFunc;
exports.default = getConversionFunctions;
