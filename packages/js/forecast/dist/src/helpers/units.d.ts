export function getUnitNomDenomLists(unitStr: any): {
    nominators: any;
    denominators: any;
};
/**
 * Generate convert function used for type curve and forecast units conversion
 *
 * @example
 * 	const convert = getConvertFunc('bbl/m', 'mbbl/d');
 * 	covert(1);
 *
 * @param {string | undefined} origUnit Unit to convert from
 * @param {string | undefined} targetUnit Unit to convert to
 */
export function getConvertFunc(origUnit: string | undefined, targetUnit: string | undefined): ((v: any) => any) | ((origNum: number | null) => number | null extends null ? null : number);
//# sourceMappingURL=units.d.ts.map