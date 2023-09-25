export default class ArpsModifiedSegment extends SegmentParent {
    constructor(segment?: null, relativeTime?: boolean);
    type: string;
    generateSegmentParameter(segmentInput: any): {
        start_idx: any;
        end_idx: any;
        q_start: number;
        q_end: number;
        b: number;
        D: number | null;
        D_eff: number;
        D_exp: any;
        realized_D_eff_sw: any;
        target_D_eff_sw: number;
        sw_idx: any;
        D_exp_eff: any;
        q_sw: number;
        slope: number;
        name: string;
    } | {
        start_idx: any;
        q_start: any;
        end_idx: any;
        q_end: number;
        sw_idx: any;
        q_sw: number;
        b: any;
        D: number;
        D_eff: any;
        D_exp: any;
        D_exp_eff: any;
        target_D_eff_sw: any;
        realized_D_eff_sw: any;
        slope: number;
        name: string;
    };
    getFormCalcRange(toBeCalculatedParam: any, segment?: any): {
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
    } | {
        start_idx: number[];
        end_idx: number[];
        duration: number[];
        q_start: any[];
        q_end: any[];
        D_eff: number[];
        b: number[];
        target_D_eff_sw: number[];
    };
    predict(idxArr: any): any;
    integral(left_idx: any, right_idx: any): number;
    inverseIntegral(integral: any, left_idx: any): any;
    firstDerivative(idxArr: any): any;
    changeQEnd(newQEnd: any, target?: string): any;
    changeDeff(newDeff: any): any;
    changeB(newB: any): any;
    changeTargetDeffSw(newTargetDeffSw: any): any;
    buttonQFinal(qFinalDict: any, prodInfo: any, firstSegment: any): any;
    buttonAnchorPrev(prevSegment: any): any;
    buttonAnchorNext(nextSegment: any): any;
    buttonMatchSlope(prevSegmentObject: any): any;
    calcQStart({ start_idx, end_idx, q_end, D_eff, b, target_D_eff_sw }: {
        start_idx: any;
        end_idx: any;
        q_end: any;
        D_eff: any;
        b: any;
        target_D_eff_sw: any;
    }): any;
    calcEndIdx({ start_idx, q_start, q_end, D_eff, b, target_D_eff_sw }: {
        start_idx: any;
        q_start: any;
        q_end: any;
        D_eff: any;
        b: any;
        target_D_eff_sw: any;
    }): any;
    calcQEnd({ start_idx, end_idx, q_start, D_eff, b, target_D_eff_sw }: {
        start_idx: any;
        end_idx: any;
        q_start: any;
        D_eff: any;
        b: any;
        target_D_eff_sw: any;
    }): any;
    calcDeff({ start_idx, end_idx, q_start, q_end, b, target_D_eff_sw }: {
        start_idx: any;
        end_idx: any;
        q_start: any;
        q_end: any;
        b: any;
        target_D_eff_sw: any;
    }): any;
}
import SegmentParent from './segmentParent';
//# sourceMappingURL=arpsModified.d.ts.map