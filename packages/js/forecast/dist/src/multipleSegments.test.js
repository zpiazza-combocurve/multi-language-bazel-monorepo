"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multipleSegments_1 = __importDefault(require("./multipleSegments"));
const data = __importStar(require("./test.json"));
describe('SegmentModels-multipleSegments', () => {
    const forecastSegments = data.forecast;
    const multiSeg = new multipleSegments_1.default();
    // predict
    const leftIdx = forecastSegments[0].start_idx;
    const rightIdx = forecastSegments[forecastSegments.length - 1].end_idx;
    const pred = multiSeg.predict({ idxArr: data.t, segments: forecastSegments });
    const ratioPred = multiSeg.predictTimeRatio({
        idxArr: data.t,
        ratioTSegments: forecastSegments,
        baseSegments: forecastSegments,
    });
    const comparePredict = () => {
        return pred.reduce((acc, calcValue, index) => acc && Math.abs(calcValue - data.predict[index]) < 1e-6, true);
    };
    const comparePredictRatio = () => {
        return ratioPred.reduce((acc, calcValue, index) => acc && Math.abs(calcValue - data.predict_ratio[index]) < 1e-6, true);
    };
    const compareEur = () => {
        return data.cum_data.reduce((acc, curCum, index) => {
            const curEndDataIdx = data.end_data_idx[index];
            const curDataFreq = data.data_freq[index];
            const thisEur = multiSeg.rateEur({
                cumData: curCum,
                endDataIdx: curEndDataIdx,
                leftIdx,
                rightIdx,
                forecastSegments,
                dataFreq: curDataFreq,
            });
            return acc && Math.abs(thisEur - data.eur[index]) < 1e-3;
        }, true);
    };
    const compareRatioEur = () => {
        return data.cum_data.reduce((acc, curCum, index) => {
            const curEndDataIdx = data.end_data_idx[index];
            const curDataFreq = data.data_freq[index];
            const thisEur = multiSeg.ratioEur({
                cumData: curCum,
                endDataIdx: curEndDataIdx,
                leftIdx,
                rightIdx,
                ratioTSegments: forecastSegments,
                baseSegments: forecastSegments,
                dataFreq: curDataFreq,
            });
            return acc && Math.abs(thisEur - data.eur_ratio[index]) < 1e-3;
        }, true);
    };
    const compareRatioEurInterval = () => {
        return data.cum_data.reduce((acc, curCum, index) => {
            const curEndDataIdx = data.end_data_idx[index];
            const curDataFreq = data.data_freq[index];
            const thisEur = multiSeg.ratioEurInterval({
                cumData: curCum,
                endDataIdx: curEndDataIdx,
                leftIdx,
                rightIdx,
                ratioTSegments: forecastSegments,
                baseSegments: forecastSegments,
                dataFreq: curDataFreq,
            });
            return acc && Math.abs(thisEur - data.eur_ratio_interval[index]) < 1e-3;
        }, true);
    };
    test('multipleSegments-predict', () => {
        expect(comparePredict()).toEqual(true);
    });
    test('multipleSegments-predictTRatio', () => {
        expect(comparePredictRatio()).toEqual(true);
    });
    test('multipleSegments-rateEur', () => {
        expect(compareEur()).toEqual(true);
    });
    test('multipleSegments-ratioEur', () => {
        expect(compareRatioEur()).toEqual(true);
    });
});
