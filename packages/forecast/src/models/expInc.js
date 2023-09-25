import {
	DEFAULT_WELL_LIFE_IDX,
	expD2Deff,
	expDeff2D,
	expGetD,
	expGetDFromFirstDerivative,
	expGetEndIdxFromQend,
	expGetQStart,
	expGetStartIdxFromQstart,
	firstDerivativeExp,
	getWellLifeIdx,
	integralExp,
	inverseIntegralExp,
	predExp,
} from '../helpers/helper';
import SegmentParent from './segmentParent';

export default class ExpIncSegment extends SegmentParent {
	constructor(segment = null, relativeTime = false) {
		super(segment, relativeTime);
		this.type = 'exp_inc';
	}

	// shifted from forecastChartHelper
	generateSegmentParameter(segIn) {
		const { start_idx, end_idx, D, q_start } = segIn;
		const qStartValid = this.numericSmall <= q_start && q_start <= this.numericLarge;
		const startIdxValid = this.dateIdxSmall <= start_idx && start_idx <= end_idx;
		const D_eff = expD2Deff(D);
		const isValid =
			this.checkValidInput('q_end', { start_idx, end_idx, D_eff, q_start }) && startIdxValid && qStartValid;
		if (!isValid) {
			const defaultStartIdx = startIdxValid ? start_idx : end_idx;
			const defaultQStart = 50;
			const defaultQEnd = 100;
			const defaultD = -0.001;
			return {
				start_idx: defaultStartIdx,
				q_start: defaultQStart,
				end_idx,
				q_end: defaultQEnd,
				D: defaultD,
				D_eff: expD2Deff(defaultD),
				slope: 1,
				name: this.type,
			};
		}
		return {
			start_idx,
			q_start,
			end_idx,
			q_end: predExp({ t: end_idx, start_idx, q_start, D_exp: D }),
			D,
			D_eff: expD2Deff(D),
			slope: 1,
			name: this.type,
		};
	}

	getFormCalcRange(toBeCalculatedParam, segment = this.segment) {
		let DeffMin;
		let DeffMax;
		const D = expDeff2D(segment.D_eff);
		let startIdxMin;
		let startIdxMax;
		let endIdxMin;
		let endIdxMax;
		switch (toBeCalculatedParam) {
			case 'end_idx': {
				if (segment.start_idx === segment.end_idx) {
					DeffMin = -this.numericLarge;
					DeffMax = -0.01;
				} else {
					DeffMin = Math.min(
						-0.01,
						Math.max(-this.numericLarge, expD2Deff(expGetD({ ...segment, end_idx: segment.start_idx + 1 })))
					);
					DeffMax = Math.max(
						-this.numericLarge,
						Math.min(-0.01, expD2Deff(expGetD({ ...segment, end_idx: this.dateIdxLarge })))
					);
				}
				return {
					start_idx: [
						this.dateIdxSmall,
						Math.floor(
							Math.max(
								this.dateIdxSmall,
								Math.min(
									this.dateIdxLarge,
									expGetStartIdxFromQstart({ ...segment, D, end_idx: this.dateIdxLarge })
								)
							)
						),
					],
					end_idx: [this.dateIdxSmall, this.dateIdxLarge],
					duration: [1, this.dateIdxLarge],
					q_start: [
						Math.min(
							segment.q_end,
							Math.max(
								this.numericSmall,
								expGetQStart({ ...segment, D_exp: D, end_idx: this.dateIdxLarge })
							)
						),
						segment.q_end,
					],
					q_end: [
						segment.q_start,
						Math.min(this.numericLarge, predExp({ ...segment, t: this.dateIdxLarge, D_exp: D })),
					],
					D_eff: [DeffMin, DeffMax],
				};
			}
			case 'q_start': {
				DeffMin =
					segment.start_idx === segment.end_idx
						? -this.numericLarge
						: Math.max(-this.numericLarge, expD2Deff(expGetD({ ...segment, q_start: this.numericSmall })));
				startIdxMin = Math.min(
					segment.end_idx,
					Math.max(this.dateIdxSmall, expGetStartIdxFromQstart({ ...segment, q_start: this.numericSmall, D }))
				);
				startIdxMax = segment.end_idx;
				endIdxMin = segment.start_idx;
				endIdxMax = Math.max(
					segment.start_idx,
					Math.min(this.dateIdxLarge, expGetEndIdxFromQend({ ...segment, q_start: this.numericSmall, D }))
				);
				return {
					start_idx: [Math.ceil(startIdxMin), Math.floor(startIdxMax)],
					end_idx: [Math.ceil(endIdxMin), Math.floor(endIdxMax)],
					duration: [
						Math.ceil(endIdxMin - segment.start_idx + 1),
						Math.floor(endIdxMax - segment.start_idx + 1),
					],
					q_start: [this.numericSmall, this.numericLarge],
					q_end: [
						Math.min(
							this.numericLarge,
							Math.max(
								this.numericSmall,
								predExp({ ...segment, q_start: this.numericSmall, t: segment.end_idx, D_exp: D })
							)
						),
						this.numericLarge,
					],
					D_eff: [DeffMin, -0.01],
				};
			}
			case 'q_end': {
				DeffMin =
					segment.start_idx === segment.end_idx
						? -this.numericLarge
						: Math.min(
								-0.01,
								Math.max(
									-this.numericLarge,
									expD2Deff(expGetD({ ...segment, q_end: this.numericLarge }))
								)
						  );
				startIdxMin = Math.max(
					this.dateIdxSmall,
					Math.min(segment.end_idx, expGetStartIdxFromQstart({ ...segment, D, q_end: this.numericLarge }))
				);
				startIdxMax = segment.end_idx;
				endIdxMin = segment.start_idx;
				endIdxMax = Math.max(
					segment.start_idx,
					Math.min(this.dateIdxLarge, expGetEndIdxFromQend({ ...segment, D, q_end: this.numericLarge }))
				);
				return {
					start_idx: [Math.ceil(startIdxMin), Math.floor(startIdxMax)],
					end_idx: [Math.ceil(endIdxMin), Math.floor(endIdxMax)],
					duration: [
						Math.ceil(endIdxMin - segment.start_idx + 1),
						Math.floor(endIdxMax - segment.start_idx + 1),
					],
					q_start: [
						this.numericSmall,
						Math.max(
							this.numericSmall,
							Math.min(
								this.numericLarge,
								expGetQStart({ ...segment, D_exp: D, q_end: this.numericLarge })
							)
						),
					],
					q_end: [this.numericSmall, this.numericLarge],
					D_eff: [DeffMin, -0.01],
				};
			}
			case 'D_eff': {
				// Perturb the bounds by this.numericSmall to prevent validation errors down the road.
				const highD = expDeff2D(-0.01 - this.numericSmall);
				const lowD = expDeff2D(-this.numericLarge + this.numericSmall);
				const startEq = segment.q_start === segment.q_end ? segment.end_idx : segment.end_idx - 1;
				const endEq = segment.q_start === segment.q_end ? segment.start_idx : segment.start_idx + 1;
				startIdxMin = Math.min(
					startEq,
					expGetStartIdxFromQstart({ ...segment, D: lowD }),
					Math.max(this.dateIdxSmall, expGetStartIdxFromQstart({ ...segment, D: highD }))
				);
				startIdxMax = Math.min(startEq, expGetStartIdxFromQstart({ ...segment, D: lowD }));
				endIdxMin = Math.max(endEq, expGetEndIdxFromQend({ ...segment, D: lowD }));
				endIdxMax = Math.max(
					endEq,
					expGetEndIdxFromQend({ ...segment, D: lowD }),
					Math.min(this.dateIdxLarge, expGetEndIdxFromQend({ ...segment, D: highD }))
				);
				return {
					start_idx: [Math.ceil(startIdxMin), Math.floor(startIdxMax)],
					end_idx: [Math.ceil(endIdxMin), Math.floor(endIdxMax)],
					duration: [
						Math.ceil(endIdxMin - segment.start_idx + 1),
						Math.floor(endIdxMax - segment.start_idx + 1),
					],
					q_start: [
						Math.min(
							segment.q_end,
							expGetQStart({ ...segment, D: highD }),
							Math.max(this.numericSmall, expGetQStart({ ...segment, D_exp: lowD }))
						),
						Math.min(segment.q_end, expGetQStart({ ...segment, D_exp: highD })),
					],
					q_end: [
						Math.max(segment.q_start, predExp({ ...segment, t: segment.end_idx, D_exp: highD })),
						Math.max(
							segment.q_start,
							predExp({ ...segment, t: segment.end_idx, D: lowD }),
							Math.min(this.numericLarge, predExp({ ...segment, t: segment.end_idx, D_exp: lowD }))
						),
					],
					D_eff: [-this.numericLarge, -0.01],
				};
			}
			default:
				return this.getCalcRange({ segment });
		}
	}

	predict(idxArr) {
		const { start_idx, q_start, D } = this.segment;
		return idxArr.map((t) => predExp({ t, start_idx, q_start, D_exp: D }));
	}

	integral(left_idx, right_idx) {
		const { start_idx, D, q_start } = this.segment;
		return integralExp({ left_idx, right_idx, start_idx, q_start, D_exp: D });
	}

	inverseIntegral(integral, left_idx) {
		const { start_idx, D, q_start } = this.segment;
		return inverseIntegralExp({ integral, left_idx, start_idx, q_start, D_exp: D });
	}

	firstDerivative(idxArr) {
		const { q_start, D, start_idx } = this.segment;
		return idxArr.map((t) => firstDerivativeExp({ t, start_idx, q_start, D_exp: D }));
	}

	// form changes
	// required: q_start, q_end, start_idx, end_idx, duration, D_eff
	// segmentParent: q_start, start_idx, end_idx, duration
	// here: q_end, D_eff
	// warn: b, target_D_eff_sw
	changeQEnd(newQEnd, target = 'D_eff') {
		const { start_idx, q_start, end_idx, D } = this.segment;
		switch (target) {
			case 'D_eff': {
				const newD = expGetD({ start_idx, q_start, end_idx, q_end: newQEnd });
				const newDeff = expD2Deff(newD);
				return {
					...this.segment,
					D: newD,
					D_eff: newDeff,
					q_end: newQEnd,
				};
			}
			case 'end_idx': {
				const newEndIdx = Math.floor(expGetEndIdxFromQend({ start_idx, q_start, D, q_end: newQEnd }));
				const adjustedNewQEnd = predExp({ t: newEndIdx, start_idx, q_start, D_exp: D });
				return {
					...this.segment,
					end_idx: newEndIdx,
					q_end: adjustedNewQEnd,
				};
			}
			default: {
				return this.segment;
			}
		}
	}

	changeDeff(newDeff) {
		const { q_start, start_idx, end_idx } = this.segment;
		const newD = expDeff2D(newDeff);
		return {
			...this.segment,
			D: newD,
			D_eff: newDeff,
			q_end: predExp({ t: end_idx, start_idx, q_start, D_exp: newD }),
		};
	}

	changeB() {
		throw Error('Exp-Inc segment does not have b parameter');
	}

	changeTargetDeffSw() {
		throw Error('Exp-Inc segment does have target D-eff Sec parameter');
	}
	// buttons
	// required: qFinal, connects, anchors, matchSlope
	// segmentParent: connects
	// here: qFinal, anchors, matchSlope

	buttonQFinal(qFinalDict, prodInfo, firstSegment) {
		const { q_start, start_idx, D } = this.segment;
		const { q_final: qFinal = null, well_life_dict: wellLifeDict } = qFinalDict;
		const wellLifeEndIdx = getWellLifeIdx(prodInfo, wellLifeDict, firstSegment);
		const wellLifeValid = wellLifeEndIdx >= start_idx;
		const qFinalValid = qFinal >= q_start;
		if (!wellLifeValid && !qFinalValid) {
			throw Error(
				`Exp-Inc: Target q Final is smaller than the q Start of last segment.` +
					` And calculated well life is before the start date of last segment.`
			);
		}
		const qFinalEndIdx = qFinalValid
			? Math.floor(expGetEndIdxFromQend({ start_idx, q_start, D, q_end: qFinal }))
			: DEFAULT_WELL_LIFE_IDX;
		let newEndIdx;
		if (qFinalValid && wellLifeValid) {
			newEndIdx = Math.min(wellLifeEndIdx, qFinalEndIdx);
		} else if (qFinalValid && !wellLifeValid) {
			newEndIdx = qFinalEndIdx;
		} else {
			newEndIdx = wellLifeEndIdx;
		}
		if (newEndIdx > this.dateIdxLarge) {
			throw Error('New well life is too large! Provide a smaller well life or larger q Final.');
		}
		const newQEnd = predExp({ t: newEndIdx, start_idx, q_start, D_exp: D });
		if (newQEnd > this.numericLarge) {
			throw Error('New q Final is too Large! Provide a smaller well life or a smaller q Final');
		}
		return {
			...this.segment,
			end_idx: newEndIdx,
			q_end: newQEnd,
		};
	}

	// anchor
	buttonAnchorPrev(prevSegment) {
		const { q_end: prevQEnd } = prevSegment;
		const { start_idx, end_idx, q_end: curQEnd } = this.segment;
		const newD = expGetD({ start_idx, q_start: prevQEnd, end_idx, q_end: curQEnd });
		const newDeff = expD2Deff(newD);
		return {
			...this.segment,
			q_start: prevQEnd,
			D: newD,
			D_eff: newDeff,
		};
	}

	buttonAnchorNext(nextSegment) {
		const { q_start: nextQStart } = nextSegment;
		return this.changeQEnd(nextQStart);
	}

	// match firstDerivative
	buttonMatchSlope(prevSegmentObject) {
		const toMatchDerivative = prevSegmentObject.firstDerivative([prevSegmentObject.segment.end_idx])[0];
		const { q_end: toMatchQStart } = prevSegmentObject.segment;
		const { start_idx, end_idx } = this.segment;
		const newD = expGetDFromFirstDerivative({ q_start: toMatchQStart, first_derivative: toMatchDerivative });
		const newDeff = expD2Deff(newD);
		return {
			...this.segment,
			q_start: toMatchQStart,
			q_end: predExp({ t: end_idx, start_idx, q_start: toMatchQStart, D_exp: newD }),
			D: newD,
			D_eff: newDeff,
		};
	}

	calcQStart({ start_idx, end_idx, q_end, D_eff }) {
		const D_exp = expDeff2D(D_eff);
		const new_q_start = expGetQStart({ D_exp, start_idx, end_idx, q_end });
		if (new_q_start > this.numericLarge) {
			throw Error('New q Start is too large!');
		} else if (new_q_start < this.numericSmall) {
			throw Error('New q Start is too small!');
		}
		return {
			...this.segment,
			q_start: new_q_start,
			q_end,
			start_idx,
			end_idx,
			D_eff,
			D: D_exp,
		};
	}

	calcEndIdx({ start_idx, q_start, q_end, D_eff }) {
		const D_exp = expDeff2D(D_eff);
		const new_end_idx = expGetEndIdxFromQend({ start_idx, q_start, D: D_exp, q_end });
		if (new_end_idx > this.dateIdxLarge) {
			throw Error('New End Date is too large!');
		}
		return {
			...this.segment,
			end_idx: Math.floor(new_end_idx),
			start_idx,
			q_start,
			q_end,
			D_eff,
			D: D_exp,
		};
	}

	calcQEnd({ start_idx, end_idx, q_start, D_eff }) {
		const D_exp = expDeff2D(D_eff);
		const new_q_end = predExp({ t: end_idx, start_idx, q_start, D_exp });
		if (new_q_end > this.numericLarge) {
			throw Error('New q End is too large!');
		} else if (new_q_end < this.numericSmall) {
			throw Error('New q end is too small!');
		}
		return {
			...this.segment,
			q_end: new_q_end,
			q_start,
			start_idx,
			end_idx,
			D_eff,
			D: D_exp,
		};
	}

	calcDeff({ start_idx, end_idx, q_start, q_end }) {
		const D_exp = start_idx === end_idx ? this.segment.D : expGetD({ start_idx, q_start, end_idx, q_end });
		const new_D_eff = expD2Deff(D_exp);
		if (new_D_eff > -0.01 || new_D_eff < -this.numericLarge) {
			throw Error('New Di Eff-Sec is out of bounds!');
		}
		return {
			...this.segment,
			D_eff: new_D_eff,
			start_idx,
			end_idx,
			q_start,
			q_end,
			D: D_exp,
		};
	}
}
