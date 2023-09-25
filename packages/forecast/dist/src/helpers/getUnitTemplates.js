"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTcConvertFunc = exports.useUnitTemplates = exports.unitTemplates = exports.getTcConvertFunc = void 0;
const daily_units_json_1 = require("../../display-templates/units/daily-units.json");
const default_units_json_1 = require("../../display-templates/units/default-units.json");
const monthly_units_json_1 = require("../../display-templates/units/monthly-units.json");
const units_1 = require("../../helpers/units");
const unitTemplates = {
    defaultUnitTemplate: default_units_json_1.fields,
    dailyUnitTemplate: daily_units_json_1.fields,
    monthlyUnitTemplate: monthly_units_json_1.fields,
};
exports.unitTemplates = unitTemplates;
const getUnitTemplates = () => Promise.resolve(Object.assign([default_units_json_1.fields, daily_units_json_1.fields, monthly_units_json_1.fields], {
    defaultUnitTemplate: default_units_json_1.fields,
    dailyUnitTemplate: daily_units_json_1.fields,
    monthlyUnitTemplate: monthly_units_json_1.fields,
}));
const useUnitTemplates = () => {
    return { ...unitTemplates, loaded: true };
};
exports.useUnitTemplates = useUnitTemplates;
const getTcConvertFunc = (templateKey) => (0, units_1.getConvertFunc)(daily_units_json_1.fields[templateKey], default_units_json_1.fields[templateKey]);
exports.getTcConvertFunc = getTcConvertFunc;
const useTcConvertFunc = (templateKey) => {
    const convert = useMemo(() => getTcConvertFunc(templateKey), [templateKey]);
    return { convert, loaded: true };
};
exports.useTcConvertFunc = useTcConvertFunc;
exports.default = getUnitTemplates;
