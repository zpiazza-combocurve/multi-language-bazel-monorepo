export default getConversionFunctions;
declare function getConversionFunctions(idxDate: boolean | undefined, unitConversions: any): Promise<{
    convertToView: (segment: any, fullConversion?: boolean) => any;
    convertToCalc: (segment: any, fullConversion?: boolean) => any;
}>;
export const paramsToConvert: string[];
export function generateForecastConvertFunc({ basePhase, phase, dailyUnitTemplate, defaultUnitTemplate, }: {
    basePhase?: null | undefined;
    phase: any;
    dailyUnitTemplate?: any;
    defaultUnitTemplate?: any;
}): {
    cumsum: {
        toCalc: any;
        toView: any;
        viewUnits: any;
        calcUnits: any;
    };
    eur: {
        toCalc: any;
        toView: any;
        viewUnits: any;
        calcUnits: any;
    };
    q: {
        toCalc: any;
        toView: any;
        viewUnits: any;
        calcUnits: any;
    };
    k: {
        toCalc: any;
        toView: any;
        viewUnits: any;
        calcUnits: any;
    };
};
export function useForecastConvertFunc(props: any): any;
//# sourceMappingURL=conversionHelper.d.ts.map