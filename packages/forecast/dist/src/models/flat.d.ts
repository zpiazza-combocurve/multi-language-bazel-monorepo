export default class FlatSegment extends SegmentParent {
    constructor(segment?: null, relativeTime?: boolean);
    type: string;
    generateSegmentParameter(segIn: any): {
        start_idx: any;
        q_start: any;
        end_idx: any;
        q_end: any;
        c: any;
        slope: number;
        name: string;
    };
    getFormCalcRange(toBeCalculatedParam: any, segment?: any): {
        start_idx: number[];
        end_idx: number[];
        duration: number[];
        c: number[];
        q_start: number[];
        q_end: number[];
    };
    predict(idxArr: any): any;
    integral(left_idx: any, right_idx: any): number;
    inverseIntegral(integral: any, left_idx: any): any;
    firstDerivative(idxArr: any): any;
    changeQEnd(newQEnd: any): any;
    changeDeff(): void;
    changeB(): void;
    changeTargetDeffSw(): void;
    buttonQFinal(qFinalDict: any, prodInfo: any, firstSegment: any): any;
    buttonAnchorPrev(): any;
    buttonAnchorNext(): any;
    buttonMatchSlope(prevSegmentObject: any): any;
    calcQEnd({ start_idx, q_start, end_idx }: {
        start_idx: any;
        q_start: any;
        end_idx: any;
    }): any;
}
import SegmentParent from './segmentParent';
//# sourceMappingURL=flat.d.ts.map