import { DAYS_IN_MONTH, getLastDayOfMonth } from './helpers';
import { convertDateToIdx, convertIdxToDate } from './helpers/math';
import ArpsSegment from './models/arps';
import ArpsIncSegment from './models/arpsInc';
import ArpsModifiedSegment from './models/arpsModified';
import EmptySegment from './models/empty';
import ExpDecSegment from './models/expDec';
import ExpIncSegment from './models/expInc';
import FlatSegment from './models/flat';
import LinearSegment from './models/linear';

export default class MultipleSegments {
	constructor(segments = [], relativeTime = false) {
		this.segmentClassDict = {
			exp_inc: ExpIncSegment,
			exp_dec: ExpDecSegment,
			arps: ArpsSegment,
			arps_inc: ArpsIncSegment,
			arps_modified: ArpsModifiedSegment,
			flat: FlatSegment,
			empty: EmptySegment,
			linear: LinearSegment,
		};

		this.segmentObjects = segments.map((curSeg) => this.getSegmentObject(curSeg, relativeTime));
	}

	getSegmentObject(segment, relativeTime = false) {
		return new this.segmentClassDict[segment.name](segment, relativeTime);
	}

	generateDefaultSegment(segIn, relativeTime = false) {
		const { name } = segIn;
		const thisSegmentObj = new this.segmentClassDict[name]({}, relativeTime);
		return thisSegmentObj.generateSegmentParameter(segIn);
	}

	applyMultiplier({ inputSegments, multiplier, relativeTime = false }) {
		return inputSegments.map((curSegment) => {
			const curSegmentObject = this.getSegmentObject(curSegment, relativeTime);
			return curSegmentObject.qMultiplication(multiplier);
		});
	}

	shiftSegmentsIdx({
		inputSegments,
		deltaT,
		shiftStartIdx = 0,
		goBackward = false,
		inputAsObject = false,
		outputAsObject = false,
		relativeTime = false,
	}) {
		let sliceStartIndex;
		let sliceEndIndex;

		if (goBackward) {
			sliceStartIndex = 0;
			sliceEndIndex = shiftStartIdx + 1;
		} else {
			sliceStartIndex = shiftStartIdx;
			sliceEndIndex = inputSegments.length;
		}

		return inputSegments.slice(sliceStartIndex, sliceEndIndex).map((cur) => {
			let curSeg;
			if (inputAsObject) {
				curSeg = cur.segment;
			} else {
				curSeg = cur;
			}
			const newSeg = { ...curSeg, start_idx: curSeg.start_idx + deltaT, end_idx: curSeg.end_idx + deltaT };
			if (curSeg.name === 'arps_modified') {
				newSeg.sw_idx += deltaT;
			}
			if (outputAsObject) {
				return this.getSegmentObject(newSeg, relativeTime);
			}
			return newSeg;
		});
	}

	shiftSelfIdx(deltaT, shiftStartIdx = 0, goBackward = false) {
		let sliceStartIndex;
		let sliceEndIndex;

		if (goBackward) {
			sliceStartIndex = 0;
			sliceEndIndex = shiftStartIdx + 1;
		} else {
			sliceStartIndex = shiftStartIdx;
			sliceEndIndex = this.segmentObjects.length;
		}
		for (let i = sliceStartIndex; i < sliceEndIndex; i++) {
			const curSegmentObject = this.segmentObjects[i];
			const curSeg = curSegmentObject.segment;
			const newSeg = { ...curSeg, start_idx: curSeg.start_idx + deltaT, end_idx: curSeg.end_idx + deltaT };
			if (curSeg.name === 'arps_modified') {
				newSeg.sw_idx += deltaT;
			}
			curSegmentObject.segment = newSeg;
		}
	}

	predict({ idxArr, segments, toFill = null, relativeTime = false }) {
		if (segments.length === 0) {
			return idxArr.map(() => toFill);
		}
		const leadingOutOfRangeIdxArr = idxArr.filter((idx) => idx < segments[0].start_idx);
		let ret = Array(leadingOutOfRangeIdxArr.length).fill(toFill);
		segments.forEach((curSeg) => {
			const curIdxArr = idxArr.filter((idx) => {
				return idx >= curSeg.start_idx && idx <= curSeg.end_idx;
			});
			const thisSegObject = this.getSegmentObject(curSeg, relativeTime);
			ret = ret.concat(thisSegObject.predict(curIdxArr));
		});

		const trailingOutOfRangeIdxArr = idxArr.filter((idx) => idx > segments[segments.length - 1].end_idx);
		ret = ret.concat(Array(trailingOutOfRangeIdxArr.length).fill(toFill));
		return ret;
	}

	predictSelf(idxArr, toFill = null) {
		if (!this.segmentObjects.length) {
			return idxArr.map(() => toFill);
		}
		const leadingOutOfRangeIdxArr = idxArr.filter((idx) => idx < this.segmentObjects[0].segment.start_idx);
		let ret = Array(leadingOutOfRangeIdxArr.length).fill(toFill);

		this.segmentObjects.forEach((curSegObject) => {
			const curIdxArr = idxArr.filter((idx) => {
				return idx >= curSegObject.segment.start_idx && idx <= curSegObject.segment.end_idx;
			});
			ret = ret.concat(curSegObject.predict(curIdxArr));
		});

		const trailingOutOfRangeIdxArr = idxArr.filter(
			(idx) => idx > this.segmentObjects[this.segmentObjects.length - 1].segment.end_idx
		);
		ret = ret.concat(Array(trailingOutOfRangeIdxArr.length).fill(toFill));
		return ret;
	}

	predictTimeRatio({ idxArr, ratioTSegments, baseSegments, toFill = null }) {
		const basePred = this.predict({ idxArr, segments: baseSegments, toFill });
		const ratioPred = this.predict({ idxArr, segments: ratioTSegments, toFill });
		return basePred.map((baseValue, index) => {
			const ratioValue = ratioPred[index];
			if (baseValue === null || ratioValue === null) {
				return toFill;
			}
			return baseValue * ratioValue;
		});
	}

	rateEur({ cumData, endDataIdx, leftIdx, rightIdx, forecastSegments, dataFreq = 'monthly', relativeTime = false }) {
		let useEndDataIdx = endDataIdx;
		if (dataFreq === 'monthly') {
			const endDataDate = convertIdxToDate(endDataIdx);
			const endDataMonthEndDate = new Date(endDataDate.getFullYear(), endDataDate.getMonth() + 1, 0);
			useEndDataIdx = convertDateToIdx(endDataMonthEndDate);
		}

		const useLeftIdx = Math.max(useEndDataIdx + 1, leftIdx);
		let ret = cumData;
		forecastSegments.forEach((curSeg) => {
			const curSegObject = this.getSegmentObject(curSeg, relativeTime);
			let curAdd = 0;
			if (curSeg.end_idx >= useLeftIdx) {
				const startIdx = Math.max(curSeg.start_idx, useLeftIdx);
				const endIdx = Math.min(curSeg.end_idx, rightIdx);
				if (startIdx < endIdx) {
					curAdd += curSegObject.predict([startIdx])[0] + curSegObject.predict([endIdx])[0];
					curAdd += curSegObject.integral(startIdx + 0.5, endIdx - 0.5);
				} else if (startIdx === endIdx) {
					curAdd += curSegObject.predict([startIdx])[0];
				}
			}
			ret += curAdd;
		});
		return ret;
	}

	rateEurSelf({ cumData, endDataIdx, leftIdx, rightIdx, dataFreq }) {
		let useEndDataIdx = endDataIdx;
		if (dataFreq === 'monthly') {
			const endDataDate = convertIdxToDate(endDataIdx);
			const endDataMonthEndDate = new Date(endDataDate.getFullYear(), endDataDate.getMonth() + 1, 0);
			useEndDataIdx = convertDateToIdx(endDataMonthEndDate);
		}

		const useLeftIdx = Math.max(useEndDataIdx + 1, leftIdx);
		let ret = cumData;
		this.segmentObjects.forEach((curSegObject) => {
			const curSeg = curSegObject.segment;
			let curAdd = 0;
			if (curSeg.end_idx >= useLeftIdx) {
				const startIdx = Math.max(curSeg.start_idx, useLeftIdx);
				const endIdx = Math.min(curSeg.end_idx, rightIdx);
				const curSlope = curSeg.slope;
				if (startIdx <= endIdx) {
					if (curSlope >= 0) {
						curAdd += curSegObject.predict([endIdx])[0];
						curAdd += curSegObject.integral(startIdx - 0.5, endIdx - 0.5);
					} else {
						curAdd += curSegObject.predict([startIdx])[0];
						curAdd += curSegObject.integral(startIdx + 0.5, endIdx + 0.5);
					}
				}
			}
			ret += curAdd;
		});
		return ret;
	}

	ratioEur({ cumData, endDataIdx, leftIdx, rightIdx, ratioTSegments, baseSegments, dataFreq }) {
		let useEndDataIdx = endDataIdx;
		if (dataFreq === 'monthly') {
			const endDataDate = convertIdxToDate(endDataIdx);
			const endDataMonthEndDate = new Date(endDataDate.getFullYear(), endDataDate.getMonth() + 1, 0);
			useEndDataIdx = convertDateToIdx(endDataMonthEndDate);
		}

		const useLeftIdx = Math.max(useEndDataIdx + 1, leftIdx);
		const useRightIdx = Math.max(useEndDataIdx + 1, rightIdx);
		let ret = cumData;
		if (useRightIdx >= useLeftIdx) {
			const predIdxArr = Array(useRightIdx + 1 - useLeftIdx)
				.fill(0)
				.map((v, index) => index + useLeftIdx);
			const pred = this.predictTimeRatio({ idxArr: predIdxArr, ratioTSegments, baseSegments, toFill: 0 });
			ret += pred.reduce((acc, value) => acc + value, 0);
		}
		return ret;
	}

	ratioEurInterval({ cumData, endDataIdx, leftIdx, rightIdx, ratioTSegments, baseSegments, dataFreq = 'monthly' }) {
		let useEndDataIdx = endDataIdx;
		if (dataFreq === 'monthly') {
			const endDataDate = convertIdxToDate(endDataIdx);
			const endDataMonthEndDate = new Date(endDataDate.getFullYear(), endDataDate.getMonth() + 1, 0);
			useEndDataIdx = convertDateToIdx(endDataMonthEndDate);
		}

		if (
			!Array.isArray(ratioTSegments) ||
			ratioTSegments.length === 0 ||
			!Array.isArray(baseSegments) ||
			baseSegments.length === 0
		) {
			return cumData;
		}

		const useLeftIdx = Math.max(useEndDataIdx + 1, leftIdx, ratioTSegments[0].start_idx, baseSegments[0].start_idx);
		const useRightIdx = Math.min(
			rightIdx,
			ratioTSegments[ratioTSegments.length - 1].end_idx,
			baseSegments[baseSegments.length - 1].end_idx
		);

		if (useLeftIdx >= useRightIdx) {
			return cumData;
		}
		const ratioPredIdxMin = useLeftIdx + 14;
		const ratioPredIdxMax = useRightIdx + 30;
		const predIdx = Array(Math.ceil((ratioPredIdxMax - ratioPredIdxMin) / 30))
			.fill(0)
			.map((v, i) => i * 30 + ratioPredIdxMin);
		const predCheckIdx = predIdx.map((x) => x + 15);
		const pred = this.predictTimeRatio({
			idxArr: predIdx,
			ratioTSegments,
			baseSegments,
			toFill: 0,
		});
		const rightStopIndex = predCheckIdx.findIndex((v) => v > useRightIdx);
		if (rightStopIndex === 0) {
			return cumData + (useRightIdx - useLeftIdx + 1) * pred[rightStopIndex];
		}

		return (
			pred.slice(0, rightStopIndex).reduce((acc, v) => acc + v * 30, cumData) +
			(useRightIdx - predCheckIdx[rightStopIndex - 1]) * pred[rightStopIndex]
		);
	}

	cumFromT({ idxArr, production, series = [], phase, dataFreq }) {
		const { index: origIndex, [phase]: origProdArr } = production || {};

		let prodArr;
		let index;
		if (origProdArr?.length && origIndex?.length) {
			prodArr =
				dataFreq === 'monthly'
					? origProdArr.map((v) => {
							return v * DAYS_IN_MONTH;
					  })
					: origProdArr;
			index = origIndex;
		} else {
			prodArr = [];
			index = [];
		}

		const indexLength = index.length;

		// start idxArr is earlier than the first production day
		let dataStartIdx;
		let dataEndIdx;
		if (index?.length) {
			const lastMonth = index[indexLength - 1];
			if (dataFreq === 'daily') {
				dataStartIdx = index[0];
				dataEndIdx = lastMonth;
			} else {
				dataStartIdx = index[0] - 14;
				dataEndIdx = getLastDayOfMonth(lastMonth);
			}
		} else if (series?.length) {
			dataEndIdx = series[0].start_idx - 100;
			dataStartIdx = dataEndIdx + 10;
		} else {
			return Array(idxArr.length).fill(0);
		}

		const output = [];
		let prevSum = 0;
		let currentIndex = 0;

		const prodSum = prodArr.reduce((_sum, curValue) => {
			const sum = _sum;
			return sum + curValue;
		}, 0);

		idxArr.forEach((t) => {
			if (t < dataStartIdx) {
				output.push(0);
			} else if (t <= dataEndIdx && t >= dataStartIdx) {
				if (dataFreq === 'daily') {
					while (index[currentIndex] <= t) {
						prevSum += Number(prodArr[currentIndex++]);
					}

					// after the loop, we get currentIndex of index that is greater than t
					output.push(prevSum);
				} else {
					// get last day of previous month
					let lastDayOfMonth = getLastDayOfMonth(index[currentIndex]);
					while (lastDayOfMonth < t) {
						prevSum += prodArr[currentIndex++];
						lastDayOfMonth = getLastDayOfMonth(index[currentIndex]);
					}

					// currentIndex will be exactly the month that has end_month_idx >= t
					const curIndexMonthStartIdx = index[currentIndex] - 14;
					const tDate = convertIdxToDate(t);
					const lastMonthDate = convertIdxToDate(lastDayOfMonth);

					// our current time is larger than t and the last day of the following month, so check if t and last day are the same month
					// if t and last day of the month are in the same month, interpolate
					if (
						tDate.getFullYear() === lastMonthDate.getFullYear() &&
						tDate.getMonth() === lastMonthDate.getMonth()
					) {
						// interpolate
						const daysInMonth = lastDayOfMonth - curIndexMonthStartIdx + 1;
						const daysPast = t - curIndexMonthStartIdx + 1;
						output.push(prevSum + (prodArr[currentIndex] * daysPast) / daysInMonth);
					} else {
						output.push(prevSum);
					}
				}
			} else {
				const a = this.rateEur({
					cumData: prodSum,
					endDataIdx: dataEndIdx,
					leftIdx: dataEndIdx + 1,
					rightIdx: t,
					forecastSegments: series,
					dataFreq,
				});
				output.push(a);
			}
		});

		return output;
	}

	cumFromTRatio({ idxArr, production, phase, ratioSeries = [], baseSeries = [], dataFreq }) {
		const { index: origIndex, [phase]: origProdArr } = production || {};

		let prodArr;
		let index;
		if (origProdArr?.length && origIndex?.length) {
			prodArr =
				dataFreq === 'monthly'
					? origProdArr.map((v) => {
							return v * DAYS_IN_MONTH;
					  })
					: origProdArr;
			index = origIndex;
		} else {
			prodArr = [];
			index = [];
		}

		const indexLength = index.length;

		// start idxArr is earlier than the first production day
		let dataStartIdx;
		let dataEndIdx;
		if (index?.length) {
			const lastMonth = index[indexLength - 1];
			if (dataFreq === 'daily') {
				dataStartIdx = index[0];
				dataEndIdx = lastMonth;
			} else {
				dataStartIdx = index[0] - 14;
				dataEndIdx = getLastDayOfMonth(lastMonth);
			}
		} else if (ratioSeries?.length && baseSeries.length) {
			dataEndIdx = ratioSeries[0].start_idx - 1;
			dataStartIdx = dataEndIdx + 1;
		} else {
			return Array(idxArr.length).fill(0);
		}

		const ratioPredIdxMin = dataEndIdx + 1;
		const ratioPredIdxMax = Math.max(...idxArr) + 30;

		const output = [];
		let prevSum = 0;
		let currentIndex = 0;

		const prodSum = prodArr.reduce((_sum, curValue) => {
			const sum = _sum;
			return sum + curValue;
		}, 0);

		let curCheckIdx = null;
		let curPredSum = prodSum;
		let idxDeltas;
		let predIdx;
		let predCheckIdx;
		let pred;
		if (ratioPredIdxMax > ratioPredIdxMin) {
			// Get an array of deltas for the index array
			idxDeltas = idxArr.slice(1).map((n, i) => {
				return n - idxArr[i];
			});
			idxDeltas.push(0);

			// predIdx: halfway points that are evaluated for segments
			// predCheckIdx: last day of the time interval; usually months, for first 200 values can be daily/bidaily
			predIdx = idxArr.map((x, i) => x + Math.floor(idxDeltas[i] / 2));
			predCheckIdx = idxArr.slice(1).map((x) => x - 1);

			pred = this.predictTimeRatio({
				idxArr: predIdx,
				ratioTSegments: ratioSeries,
				baseSegments: baseSeries,
				toFill: 0,
			});
		}

		idxArr.forEach((t) => {
			if (t < dataStartIdx) {
				output.push(0);
			} else if (t <= dataEndIdx && t >= dataStartIdx) {
				if (dataFreq === 'daily') {
					while (index[currentIndex] <= t) {
						prevSum += Number(prodArr[currentIndex++]);
					}

					// after the loop, we get currentIndex of index that is greater than t
					output.push(prevSum);
				} else {
					// get last day of previous month
					let lastDayOfMonth = getLastDayOfMonth(index[currentIndex]);
					while (lastDayOfMonth < t) {
						prevSum += prodArr[currentIndex++];
						lastDayOfMonth = getLastDayOfMonth(index[currentIndex]);
					}

					// currentIndex will be exactly the month that has end_month_idx >= t
					const curIndexMonthStartIdx = index[currentIndex] - 14;
					const tDate = convertIdxToDate(t);
					const lastMonthDate = convertIdxToDate(lastDayOfMonth);

					// our current time is larger than t and the last day of the following month, so check if t and last day are the same month
					// if t and last day of the month are in the same month, interpolate
					if (
						tDate.getFullYear() === lastMonthDate.getFullYear() &&
						tDate.getMonth() === lastMonthDate.getMonth()
					) {
						// interpolate
						const daysInMonth = lastDayOfMonth - curIndexMonthStartIdx + 1;
						const daysPast = t - curIndexMonthStartIdx + 1;
						output.push(prevSum + (prodArr[currentIndex] * daysPast) / daysInMonth);
					} else {
						output.push(prevSum);
					}
				}
			} else {
				for (let i = curCheckIdx === null ? 0 : curCheckIdx; i < predCheckIdx.length; i++) {
					const v = predCheckIdx[i];
					if (v <= t) {
						// Check that we aren't adding predicted values when we already have data
						if (v > dataEndIdx) {
							// multiply by the width of the box for the reimann sum
							curPredSum += pred[i] * idxDeltas[i];
						}
					} else {
						curCheckIdx = i;
						break;
					}
				}
				if (curCheckIdx === 0) {
					output.push(curPredSum + (t - dataEndIdx) * pred[curCheckIdx]);
				} else {
					output.push(curPredSum + (t - predCheckIdx[curCheckIdx - 1]) * pred[curCheckIdx]);
				}
			}
		});

		return output;
	}
}
