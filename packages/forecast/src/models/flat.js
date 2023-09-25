import { getWellLifeIdx } from '../helpers/helper';
import SegmentParent from './segmentParent';

export default class FlatSegment extends SegmentParent {
	constructor(segment = null, relativeTime = false) {
		super(segment, relativeTime);
		this.type = 'flat';
	}

	// shifted from forecastChartHelper
	generateSegmentParameter(segIn) {
		const { start_idx, end_idx, c } = segIn;
		const qStartValid = this.numericSmall <= c && c <= this.numericLarge;
		const startIdxValid = this.dateIdxSmall <= start_idx && start_idx <= end_idx;
		const newStartIdx = startIdxValid ? start_idx : end_idx;
		const newC = qStartValid ? c : 100;
		return {
			start_idx: newStartIdx,
			q_start: newC,
			end_idx,
			q_end: newC,
			c: newC,
			slope: 0,
			name: this.type,
		};
	}

	getFormCalcRange(toBeCalculatedParam, segment = this.segment) {
		return {
			start_idx: [this.dateIdxSmall, Math.floor(segment.end_idx)],
			end_idx: [Math.ceil(segment.start_idx), this.dateIdxLarge],
			duration: [1, Math.floor(this.dateIdxLarge - segment.start_idx + 1)],
			c: [this.numericSmall, this.numericLarge],
			q_start: [this.numericSmall, this.numericLarge],
			q_end: [this.numericSmall, this.numericLarge],
		};
	}
	predict(idxArr) {
		const { q_start } = this.segment;
		return idxArr.map(() => q_start);
	}

	integral(left_idx, right_idx) {
		const { q_start } = this.segment;
		return q_start * (right_idx - left_idx);
	}

	inverseIntegral(integral, left_idx) {
		const { q_start } = this.segment;
		return integral / q_start + left_idx;
	}

	// this class is a recipient class of another class, make it class method instead of static to make sure it has the
	// same syntax as the other classes
	firstDerivative(idxArr) {
		return idxArr.map(() => 0);
	}

	// form changes
	// required: q_start, q_end, start_idx, end_idx, duration
	// segmentParent: q_start, start_idx, end_idx, duration
	// here: q_end
	// warn: D_eff, b, target_D_eff_sw
	changeQEnd(newQEnd) {
		return this.changeQStart(newQEnd);
	}

	changeDeff() {
		throw Error('Flat segment does not have D-eff Sec parameter');
	}

	changeB() {
		throw Error('Flat segment does not have b parameter');
	}

	changeTargetDeffSw() {
		throw Error('Flat segment does have target D-eff Sec parameter');
	}
	// buttons
	// required: qFinal, connects, anchors, matchSlope
	// segmentParent: connects
	// here: qFinal, anchors, matchSlope

	buttonQFinal(qFinalDict, prodInfo, firstSegment) {
		const { start_idx } = this.segment;
		const { well_life_dict: wellLifeDict } = qFinalDict;
		const wellLifeEndIdx = getWellLifeIdx(prodInfo, wellLifeDict, firstSegment);
		const wellLifeValid = wellLifeEndIdx >= start_idx;
		if (wellLifeEndIdx > this.dateIdxLarge) {
			throw Error('New well life is too large! Provide a smaller well life or larger q Final.');
		}
		if (!wellLifeValid) {
			throw Error(`Flat: Calculated well life is before the start date of last segment.`);
		}
		return { ...this.segment, end_idx: wellLifeEndIdx };
	}

	// anchor
	buttonAnchorPrev() {
		return { ...this.segment };
	}

	buttonAnchorNext() {
		return { ...this.segment };
	}

	// match firstDerivative
	buttonMatchSlope(prevSegmentObject) {
		return this.buttonConnectPrev(prevSegmentObject.segment);
	}

	calcQEnd({ start_idx, q_start, end_idx }) {
		return { ...this.segment, start_idx, q_start, end_idx, c: q_start, q_end: q_start };
	}
}
