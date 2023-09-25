import MultipleSegments from './multipleSegments';
import * as data from './test.json';

describe('SegmentModels-multipleSegments', () => {
	const forecastSegments = data.forecast;
	const multiSeg = new MultipleSegments();
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
		return ratioPred.reduce(
			(acc, calcValue, index) => acc && Math.abs(calcValue - data.predict_ratio[index]) < 1e-6,
			true
		);
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

	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- TODO eslint fix later
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
