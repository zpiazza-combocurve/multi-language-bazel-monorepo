export default class SegmentParent {
    constructor(segment: any, relativeTime?: boolean);
    segment: any;
    numericLarge: number;
    numericSmall: number;
    dateIdxSmall: number;
    dateIdxLarge: number;
    getCurrentSegment(): any;
    checkValidInput: (toBeCalculatedParam: any, params: any) => boolean;
    calcToView({ segment, unitConvertFunc, idxDate }?: {
        segment?: any;
        unitConvertFunc?: null | undefined;
        idxDate?: boolean | undefined;
    }): any;
    getCalcRange({ segment }?: {
        segment?: any;
    }): {
        b: number[];
        D_eff: number[];
        q_start: number[];
        q_end: any[];
        start_idx: any[];
        end_idx: any[];
        duration: number[];
        k?: undefined;
    } | {
        start_idx: any[];
        end_idx: any[];
        duration: number[];
        q_start: number[];
        q_end: number[];
        k: number[];
        D_eff: number[];
    } | {
        b: number[];
        D_eff: any[];
        target_D_eff_sw: any[];
        q_start: number[];
        q_end: any[];
        start_idx: any[];
        end_idx: any[];
        duration: number[];
        k?: undefined;
    } | {
        c: number[];
        q_start: number[];
        q_end: any[];
        start_idx: any[];
        end_idx: any[];
        duration: number[];
        k?: undefined;
        D_eff?: undefined;
    } | {
        start_idx: any[];
        end_idx: any[];
        duration: number[];
        q_start: number[];
        q_end: any[];
        D_eff: number[];
        k?: undefined;
    } | {
        start_idx: any[];
        end_idx: any[];
        duration: number[];
        q_start?: undefined;
        q_end?: undefined;
        k?: undefined;
        D_eff?: undefined;
    };
    getFormViewRange({ segment, unitConvertFunc, idxDate, toBeCalculatedParam }: {
        segment?: any;
        unitConvertFunc?: null | undefined;
        idxDate?: boolean | undefined;
        toBeCalculatedParam: any;
    }): {};
    viewToCalc({ viewSegment, unitConvertFunc, idxDate }: {
        viewSegment: any;
        unitConvertFunc?: null | undefined;
        idxDate?: boolean | undefined;
    }): any;
    getViewRange({ segment, unitConvertFunc, idxDate }?: {
        segment?: any;
        unitConvertFunc?: null | undefined;
        idxDate?: boolean | undefined;
    }): {
        b: number[];
        D_eff: number[];
        q_start: number[];
        q_end: any[];
        start_idx: any[];
        end_idx: any[];
        duration: number[];
        k?: undefined;
    } | {
        b: number[];
        D_eff: number[];
        target_D_eff_sw: number[];
        q_start: number[];
        q_end: any[];
        start_idx: any[];
        end_idx: any[];
        duration: number[];
        k?: undefined;
    } | {
        c: number[];
        q_start: number[];
        q_end: any[];
        start_idx: any[];
        end_idx: any[];
        duration: number[];
        D_eff?: undefined;
        k?: undefined;
    } | {
        start_idx: any[];
        end_idx: any[];
        duration: number[];
        q_start: number[];
        q_end: any[];
        D_eff: number[];
        k?: undefined;
    } | {
        start_idx: any[];
        end_idx: any[];
        duration: number[];
        q_start?: undefined;
        q_end?: undefined;
        D_eff?: undefined;
        k?: undefined;
    } | {
        start_idx: any[];
        end_idx: any[];
        duration: number[];
        q_start: number[];
        q_end: number[];
        k: any[];
        D_eff: number[];
    };
    qMultiplication(multiplier: any): any;
    qTranslation(distance: any): any;
    changeQStart(newQStart: any): any;
    changeStartIdx(newStartIdx: any): any;
    changeEndIdx(newEndIdx: any): any;
    changeDuration(newDuration: any): any;
    buttonConnectPrev(prevSegment: any): any;
    buttonConnectNext(nextSegment: any): any;
    getNewSegmentWithLock(toBeCalculatedParam: any, param: any, value: any): any;
}
//# sourceMappingURL=segmentParent.d.ts.map