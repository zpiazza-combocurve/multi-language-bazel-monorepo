export function getLastDayOfMonth(indexValue: any): number;
export function getDaysInMonth(index: any): number;
export function predExp({ t, start_idx, q_start, D_exp }: {
    t: any;
    start_idx: any;
    q_start: any;
    D_exp: any;
}): number;
export function predArps({ t, start_idx, q_start, D, b }: {
    t: any;
    start_idx: any;
    q_start: any;
    D: any;
    b: any;
}): number;
export function predLinear({ t, start_idx, q_start, k }: {
    t: any;
    start_idx: any;
    q_start: any;
    k: any;
}): any;
export function linearK2Deff({ k, q_start }: {
    k: any;
    q_start: any;
}): number;
export function linearDeff2K({ D_eff, q_start }: {
    D_eff: any;
    q_start: any;
}): number;
export function linearGetK({ end_idx, start_idx, q_start, q_end }: {
    end_idx: any;
    start_idx: any;
    q_start: any;
    q_end: any;
}): number;
export function linearK2Slope({ k }: {
    k: any;
}): number;
export function getSlope({ q_start, q_end }: {
    q_start: any;
    q_end: any;
}): number;
export function predArpsModified({ t, start_idx, q_start, D, b, sw_idx, q_sw, D_exp }: {
    t: any;
    start_idx: any;
    q_start: any;
    D: any;
    b: any;
    sw_idx: any;
    q_sw: any;
    D_exp: any;
}): number;
export function firstDerivativeExp({ t, start_idx, q_start, D_exp }: {
    t: any;
    start_idx: any;
    q_start: any;
    D_exp: any;
}): number;
export function firstDerivativeArps({ t, start_idx, q_start, D, b }: {
    t: any;
    start_idx: any;
    q_start: any;
    D: any;
    b: any;
}): number;
export function arpsGetDFromFirstDerivative({ q_start, first_derivative }: {
    q_start: any;
    first_derivative: any;
}): number;
export function expGetDFromFirstDerivative({ q_start, first_derivative }: {
    q_start: any;
    first_derivative: any;
}): number;
export function integralExp({ left_idx, right_idx, start_idx, q_start, D_exp }: {
    left_idx: any;
    right_idx: any;
    start_idx: any;
    q_start: any;
    D_exp: any;
}): number;
export function integralArps({ left_idx, right_idx, start_idx, q_start, D, b }: {
    left_idx: any;
    right_idx: any;
    start_idx: any;
    q_start: any;
    D: any;
    b: any;
}): number;
export function inverseIntegralExp({ integral, left_idx, start_idx, q_start, D_exp }: {
    integral: any;
    left_idx: any;
    start_idx: any;
    q_start: any;
    D_exp: any;
}): any;
export function inverseIntegralArps({ integral, left_idx, start_idx, q_start, D, b }: {
    integral: any;
    left_idx: any;
    start_idx: any;
    q_start: any;
    D: any;
    b: any;
}): any;
export function linearGetQStart({ k, start_idx, end_idx, q_end }: {
    k: any;
    start_idx: any;
    end_idx: any;
    q_end: any;
}): number;
export function arpsGetQStart({ D, b, start_idx, end_idx, q_end }: {
    D: any;
    b: any;
    start_idx: any;
    end_idx: any;
    q_end: any;
}): number;
export function arpsModifiedGetQStart({ D, b, start_idx, end_idx, q_end, sw_idx, D_exp }: {
    D: any;
    b: any;
    start_idx: any;
    end_idx: any;
    q_end: any;
    sw_idx: any;
    D_exp: any;
}): number;
export function arpsDeff2D(D_eff: any, b: any): number;
export function arpsD2Deff(D: any, b: any): number;
export function expGetQStart({ D_exp, start_idx, end_idx, q_end }: {
    D_exp: any;
    start_idx: any;
    end_idx: any;
    q_end: any;
}): number;
export function expDeff2D(D_eff: any): number;
export function expD2Deff(D: any): number;
export function arpsGetDDelta({ D, b, delta_t }: {
    D: any;
    b: any;
    delta_t: any;
}): number;
export function arpsGetIdxFromDnew({ start_idx, D, Dnew, b }: {
    start_idx: any;
    D: any;
    Dnew: any;
    b: any;
}): any;
export function arpsGetEndIdxFromQend({ start_idx, q_start, D, b, q_end }: {
    start_idx: any;
    q_start: any;
    D: any;
    b: any;
    q_end: any;
}): any;
export function arpsGetStartIdxFromQstart({ q_start, D, b, end_idx, q_end }: {
    q_start: any;
    D: any;
    b: any;
    end_idx: any;
    q_end: any;
}): any;
export function arpsModifiedGetEndIdxFromQend({ start_idx, q_start, D, b, q_end, sw_idx, D_exp, q_sw }: {
    start_idx: any;
    q_start: any;
    D: any;
    b: any;
    q_end: any;
    sw_idx: any;
    D_exp: any;
    q_sw: any;
}): any;
export function arpsModifiedGetStartIdxFromQstart({ q_start, D, b, end_idx, q_end, target_D_eff_sw }: {
    q_start: any;
    D: any;
    b: any;
    end_idx: any;
    q_end: any;
    target_D_eff_sw: any;
}): any;
export function expGetEndIdxFromQend({ start_idx, q_start, D, q_end }: {
    start_idx: any;
    q_start: any;
    D: any;
    q_end: any;
}): any;
export function expGetStartIdxFromQstart({ q_start, D, end_idx, q_end }: {
    q_start: any;
    D: any;
    end_idx: any;
    q_end: any;
}): any;
export function linearGetEndIdxFromQend({ start_idx, q_start, k, q_end }: {
    start_idx: any;
    q_start: any;
    k: any;
    q_end: any;
}): any;
export function linearGetStartIdxFromQstart({ end_idx, q_start, k, q_end }: {
    end_idx: any;
    q_start: any;
    k: any;
    q_end: any;
}): any;
export function arpsGetD({ start_idx, q_start, end_idx, q_end, b }: {
    start_idx: any;
    q_start: any;
    end_idx: any;
    q_end: any;
    b: any;
}): number;
export function expGetD({ start_idx, q_start, end_idx, q_end }: {
    start_idx: any;
    q_start: any;
    end_idx: any;
    q_end: any;
}): number;
export function arpsModifiedGetD({ q_start, q_end, b, start_idx, end_idx, target_D_eff_sw }: {
    q_start: any;
    q_end: any;
    b: any;
    start_idx: any;
    end_idx: any;
    target_D_eff_sw: any;
}): number | null;
export function arpsModifiedSwitch({ b, D, target_D_eff_sw, start_idx }: {
    b: any;
    D: any;
    target_D_eff_sw: any;
    start_idx: any;
}): {
    realized_D_eff_sw: number;
    sw_idx: any;
    D_exp: any;
    D_exp_eff: number;
} | {
    realized_D_eff_sw: any;
    sw_idx: any;
    D_exp: number;
    D_exp_eff: any;
};
export function shiftIdxByYear(origIdx: any, shiftNum: any): number;
export function getWellLifeIdx(prodInfo: any, wellLifeDict: any, firstSegment: any): any;
export const DAYS_IN_YEAR: 365.25;
export const DAYS_IN_MONTH: number;
export const DEFAULT_WELL_LIFE_IDX: -1000000000;
export const DEFAULT_MAX_D_EFF: 0.9999;
//# sourceMappingURL=helper.d.ts.map