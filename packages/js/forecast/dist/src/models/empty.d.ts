export default class EmptySegment extends SegmentParent {
    constructor(segment?: null, relativeTime?: boolean);
    type: string;
    generateSegmentParameter(segIn: any): {
        start_idx: any;
        q_start: number;
        end_idx: any;
        q_end: number;
        slope: number;
        name: string;
    };
    getFormCalcRange(toBeCalculatedParam: any, segment?: any): {
        start_idx: number[];
        end_idx: number[];
        duration: number[];
        q_start: number[];
        q_end: number[];
    };
    predict(idxArr: any): any;
    integral(): number;
    inverseIntegral(integral: any, left_idx: any): any;
    firstDerivative(idxArr: any): any;
    changeQStart(): void;
    changeQEnd(): void;
    changeDeff(): void;
    changeB(): void;
    changeTargetDeffSw(): void;
    buttonQFinal(qFinalDict: any, prodInfo: any, firstSegment: any): any;
    buttonConnectPrev(): any;
    buttonConnectNext(): any;
    buttonAnchorPrev(): any;
    buttonAnchorNext(): any;
    buttonMatchSlope(): any;
    calcQEnd({ start_idx, end_idx }: {
        start_idx: any;
        end_idx: any;
    }): any;
}
import SegmentParent from './segmentParent';
//# sourceMappingURL=empty.d.ts.map