export default class MultipleSegments {
    constructor(segments?: any[], relativeTime?: boolean);
    segmentClassDict: {
        exp_inc: typeof ExpIncSegment;
        exp_dec: typeof ExpDecSegment;
        arps: typeof ArpsSegment;
        arps_inc: typeof ArpsIncSegment;
        arps_modified: typeof ArpsModifiedSegment;
        flat: typeof FlatSegment;
        empty: typeof EmptySegment;
        linear: typeof LinearSegment;
    };
    segmentObjects: any[];
    getSegmentObject(segment: any, relativeTime?: boolean): any;
    generateDefaultSegment(segIn: any, relativeTime?: boolean): any;
    applyMultiplier({ inputSegments, multiplier, relativeTime }: {
        inputSegments: any;
        multiplier: any;
        relativeTime?: boolean | undefined;
    }): any;
    shiftSegmentsIdx({ inputSegments, deltaT, shiftStartIdx, goBackward, inputAsObject, outputAsObject, relativeTime, }: {
        inputSegments: any;
        deltaT: any;
        shiftStartIdx?: number | undefined;
        goBackward?: boolean | undefined;
        inputAsObject?: boolean | undefined;
        outputAsObject?: boolean | undefined;
        relativeTime?: boolean | undefined;
    }): any;
    shiftSelfIdx(deltaT: any, shiftStartIdx?: number, goBackward?: boolean): void;
    predict({ idxArr, segments, toFill, relativeTime }: {
        idxArr: any;
        segments: any;
        toFill?: null | undefined;
        relativeTime?: boolean | undefined;
    }): any;
    predictSelf(idxArr: any, toFill?: null): any;
    predictTimeRatio({ idxArr, ratioTSegments, baseSegments, toFill }: {
        idxArr: any;
        ratioTSegments: any;
        baseSegments: any;
        toFill?: null | undefined;
    }): any;
    rateEur({ cumData, endDataIdx, leftIdx, rightIdx, forecastSegments, dataFreq, relativeTime }: {
        cumData: any;
        endDataIdx: any;
        leftIdx: any;
        rightIdx: any;
        forecastSegments: any;
        dataFreq?: string | undefined;
        relativeTime?: boolean | undefined;
    }): any;
    rateEurSelf({ cumData, endDataIdx, leftIdx, rightIdx, dataFreq }: {
        cumData: any;
        endDataIdx: any;
        leftIdx: any;
        rightIdx: any;
        dataFreq: any;
    }): any;
    ratioEur({ cumData, endDataIdx, leftIdx, rightIdx, ratioTSegments, baseSegments, dataFreq }: {
        cumData: any;
        endDataIdx: any;
        leftIdx: any;
        rightIdx: any;
        ratioTSegments: any;
        baseSegments: any;
        dataFreq: any;
    }): any;
    ratioEurInterval({ cumData, endDataIdx, leftIdx, rightIdx, ratioTSegments, baseSegments, dataFreq }: {
        cumData: any;
        endDataIdx: any;
        leftIdx: any;
        rightIdx: any;
        ratioTSegments: any;
        baseSegments: any;
        dataFreq?: string | undefined;
    }): any;
    cumFromT({ idxArr, production, series, phase, dataFreq }: {
        idxArr: any;
        production: any;
        series?: any[] | undefined;
        phase: any;
        dataFreq: any;
    }): any[];
    cumFromTRatio({ idxArr, production, phase, ratioSeries, baseSeries, dataFreq }: {
        idxArr: any;
        production: any;
        phase: any;
        ratioSeries?: any[] | undefined;
        baseSeries?: any[] | undefined;
        dataFreq: any;
    }): any[];
}
import ExpIncSegment from './models/expInc';
import ExpDecSegment from './models/expDec';
import ArpsSegment from './models/arps';
import ArpsIncSegment from './models/arpsInc';
import ArpsModifiedSegment from './models/arpsModified';
import FlatSegment from './models/flat';
import EmptySegment from './models/empty';
import LinearSegment from './models/linear';
//# sourceMappingURL=multipleSegments.d.ts.map