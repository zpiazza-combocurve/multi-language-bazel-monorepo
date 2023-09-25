export default getUnitTemplates;
declare function getUnitTemplates(): Promise<any[] & {
    defaultUnitTemplate: any;
    dailyUnitTemplate: any;
    monthlyUnitTemplate: any;
}>;
export function getTcConvertFunc(templateKey: any): any;
export namespace unitTemplates {
    export { defaultUnitTemplate };
    export { dailyUnitTemplate };
    export { monthlyUnitTemplate };
}
export function useUnitTemplates(): {
    loaded: boolean;
    defaultUnitTemplate: any;
    dailyUnitTemplate: any;
    monthlyUnitTemplate: any;
};
export function useTcConvertFunc(templateKey: any): {
    convert: any;
    loaded: boolean;
};
//# sourceMappingURL=getUnitTemplates.d.ts.map