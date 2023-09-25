export default class LinearSegment extends SegmentParent {
    type: string;
    generateSegmentParameter(segIn: any): {
        start_idx: any;
        q_start: any;
        end_idx: any;
        q_end: any;
        k: any;
        D_eff: number;
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
        start_idx: any[];
        end_idx: any[];
        duration: number[];
        q_start: any[];
        q_end: any[];
        k: number[];
    };
    predict(idxArr: any): any;
    integral(left_idx: any, right_idx: any): number;
    inverseIntegral(integral: any, left_idx: any): any;
    firstDerivative(idxArr: any): any;
    changeQEnd(newQEnd: any, target?: string): any;
    changeDeff(newDeff: any): any;
    changeK(newK: any): any;
    changeB(): void;
    changeTargetDeffSw(): void;
    buttonQFinal(qFinalDict: any, prodInfo: any, firstSegment: any): any;
    buttonAnchorPrev(prevSegment: any): any;
    buttonAnchorNext(nextSegment: any): any;
    buttonMatchSlope(prevSegmentObject: any): any;
    calcQStart({ start_idx, end_idx, q_end, k }: {
        start_idx: any;
        end_idx: any;
        q_end: any;
        k: any;
    }): any;
    calcEndIdx({ start_idx, q_start, q_end, k }: {
        start_idx: any;
        q_start: any;
        q_end: any;
        k: any;
    }): any;
    calcQEnd({ start_idx, end_idx, q_start, k }: {
        start_idx: any;
        end_idx: any;
        q_start: any;
        k: any;
    }): any;
    calcK({ start_idx, end_idx, q_start, q_end }: {
        start_idx: any;
        end_idx: any;
        q_start: any;
        q_end: any;
    }): any;
}
import SegmentParent from './segmentParent';
//# sourceMappingURL=linear.d.ts.map