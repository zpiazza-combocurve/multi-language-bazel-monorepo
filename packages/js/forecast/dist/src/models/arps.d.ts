export default class ArpsSegment extends SegmentParent {
    constructor(segment?: null, relativeTime?: boolean);
    type: string;
    generateSegmentParameter(segIn: any): {
        start_idx: any;
        q_start: any;
        end_idx: any;
        q_end: number;
        b: any;
        D: number;
        D_eff: any;
        slope: number;
        name: string;
    };
    generateDefaultParameters({ start_idx, end_idx, startIdxValid }: {
        start_idx: any;
        end_idx: any;
        startIdxValid: any;
    }): {
        defaultStartIdx: any;
        defaultQStart: number;
        defaultQEnd: number;
        defaultB: number;
        defaultD: number;
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
    };
    predict(idxArr: any): any;
    integral(left_idx: any, right_idx: any): number;
    inverseIntegral(integral: any, left_idx: any): any;
    firstDerivative(idxArr: any): any;
    changeQEnd(newQEnd: any, target?: string): any;
    changeDeff(newDeff: any): any;
    changeB(newB: any): any;
    changeTargetDeffSw(): void;
    buttonQFinal(qFinalDict: any, prodInfo: any, firstSegment: any): any;
    buttonAnchorPrev(prevSegment: any): any;
    buttonAnchorNext(nextSegment: any): any;
    buttonMatchSlope(prevSegmentObject: any): any;
    calcQStart({ start_idx, end_idx, q_end, D_eff, b }: {
        start_idx: any;
        end_idx: any;
        q_end: any;
        D_eff: any;
        b: any;
    }): any;
    calcEndIdx({ start_idx, q_start, q_end, D_eff, b }: {
        start_idx: any;
        q_start: any;
        q_end: any;
        D_eff: any;
        b: any;
    }): any;
    calcQEnd({ start_idx, end_idx, q_start, D_eff, b }: {
        start_idx: any;
        end_idx: any;
        q_start: any;
        D_eff: any;
        b: any;
    }): any;
    calcDeff({ start_idx, end_idx, q_start, q_end, b }: {
        start_idx: any;
        end_idx: any;
        q_start: any;
        q_end: any;
        b: any;
    }): any;
}
import SegmentParent from './segmentParent';
//# sourceMappingURL=arps.d.ts.map