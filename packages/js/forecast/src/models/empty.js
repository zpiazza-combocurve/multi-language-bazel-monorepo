import { getWellLifeIdx } from '../helpers/helper';
import SegmentParent from './segmentParent';

// this class is a recipient class of another class, make it class method instead of static to make sure it has the
// same syntax as the other classes
export default class EmptySegment extends SegmentParent {
	constructor(segment = null, relativeTime = false) {
		super(segment, relativeTime);
		this.type = 'empty';
	}

	// shifted from forecastChartHelper
	generateSegmentParameter(segIn) {
		const { start_idx, end_idx } = segIn;
		const startIdxValid = this.dateIdxSmall <= start_idx && start_idx <= end_idx;
		if (!startIdxValid) {
			const newStartIdx = startIdxValid ? start_idx : end_idx;
			return {
				start_idx: newStartIdx,
				q_start: 0,
				end_idx: newStartIdx,
				q_end: 0,
				slope: 0,
				name: this.type,
			};
		}
		if (end_idx < start_idx || end_idx > this.dateIdxLarge) {
			return {
				start_idx,
				q_start: 0,
				end_idx: start_idx,
				q_end: 0,
				slope: 0,
				name: this.type,
			};
		}
		return {
			start_idx,
			q_start: 0,
			end_idx,
			q_end: 0,
			slope: 0,
			name: this.type,
		};
	}

	getFormCalcRange(toBeCalculatedParam, segment = this.segment) {
		return {
			start_idx: [this.dateIdxSmall, Math.floor(segment.end_idx)],
			end_idx: [Math.ceil(segment.start_idx), Math.floor(this.dateIdxLarge)],
			duration: [1, Math.floor(this.dateIdxLarge - segment.start_idx + 1)],
			q_start: [this.numericSmall, this.numericLarge],
			q_end: [this.numericSmall, this.numericLarge],
		};
	}

	predict(idxArr) {
		return idxArr.map(() => 0);
	}

	integral() {
		return 0;
	}

	inverseIntegral(integral, left_idx) {
		return left_idx;
	}

	firstDerivative(idxArr) {
		return idxArr.map(() => 0);
	}

	// form changes
	// required: start_idx, end_idx, duration
	// segmentParent: start_idx, end_idx, duration
	// here: ---
	// error
	changeQStart() {
		throw Error('Empty segment does not allow q to be changed');
	}

	changeQEnd() {
		throw Error('Empty segment does not allow q to be changed');
	}

	changeDeff() {
		throw Error('Empty segment does not have D-eff Sec parameter');
	}

	changeB() {
		throw Error('Empty segment does not have b parameter');
	}

	changeTargetDeffSw() {
		throw Error('Empty segment does have target D-eff Sec parameter');
	}
	// buttons
	// required: qFinal, connects, anchors, matchSlope
	// segmentParent: connects, will be overwritten here
	// here: qFinal, anchors, matchSlope

	buttonQFinal(qFinalDict, prodInfo, firstSegment) {
		const { start_idx } = this.segment;
		const { well_life_dict: wellLifeDict } = qFinalDict;
		const wellLifeEndIdx = getWellLifeIdx(prodInfo, wellLifeDict, firstSegment);
		const wellLifeValid = wellLifeEndIdx >= start_idx;
		if (wellLifeEndIdx > this.dateIdxLarge) {
			throw Error('New well life is too large! Provide a smaller well life.');
		}
		if (!wellLifeValid) {
			throw Error(`Shut-In: Calculated well life is before the start date of last segment.`);
		}
		return { ...this.segment, end_idx: wellLifeEndIdx };
	}

	// connect
	buttonConnectPrev() {
		return { ...this.segment };
	}

	buttonConnectNext() {
		return { ...this.segment };
	}

	// anchor
	buttonAnchorPrev() {
		return { ...this.segment };
	}

	buttonAnchorNext() {
		return { ...this.segment };
	}

	// match firstDerivative
	buttonMatchSlope() {
		return { ...this.segment };
	}
	calcQEnd({ start_idx, end_idx }) {
		return { ...this.segment, start_idx, end_idx };
	}
}
