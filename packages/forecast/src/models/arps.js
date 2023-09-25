import {
	DEFAULT_MAX_D_EFF,
	DEFAULT_WELL_LIFE_IDX,
	arpsD2Deff,
	arpsDeff2D,
	arpsGetD,
	arpsGetDFromFirstDerivative,
	arpsGetEndIdxFromQend,
	arpsGetQStart,
	arpsGetStartIdxFromQstart,
	firstDerivativeArps,
	getWellLifeIdx,
	integralArps,
	inverseIntegralArps,
	predArps,
} from '../helpers/helper';
import { roundToDigit } from '../helpers/math';
import SegmentParent from './segmentParent';

export default class ArpsSegment extends SegmentParent {
	constructor(segment = null, relativeTime = false) {
		super(segment, relativeTime);
		this.type = 'arps';
	}

	// shifted from forecastChartHelper
	generateSegmentParameter(segIn) {
		const { end_idx, start_idx, q_start, D_eff, b } = segIn;
		const qStartValid = this.numericSmall <= q_start && q_start <= this.numericLarge;
		const startIdxValid = this.dateIdxSmall <= start_idx && start_idx <= end_idx;
		const isValid =
			this.checkValidInput('q_end', { end_idx, start_idx, q_start, D_eff, b }) && qStartValid && startIdxValid;
		if (!isValid) {
			const { defaultStartIdx, defaultQStart, defaultQEnd, defaultB, defaultD } = this.generateDefaultParameters({
				start_idx,
				end_idx,
				startIdxValid,
			});
			return {
				start_idx: defaultStartIdx,
				end_idx,
				q_start: defaultQStart,
				q_end: defaultQEnd,
				b: defaultB,
				D: defaultD,
				D_eff: arpsD2Deff(defaultD, defaultB),
				slope: defaultD <= 0 ? 1 : -1,
				name: this.type,
			};
		}
		const D = arpsDeff2D(D_eff, b);
		return {
			start_idx,
			q_start,
			end_idx,
			q_end: predArps({ t: end_idx, start_idx, q_start, D, b }),
			b,
			D,
			D_eff,
			slope: D <= 0 ? 1 : -1,
			name: this.type,
		};
	}

	// Takes care of Inc/Dec default arps parameters in the invalid case.
	generateDefaultParameters({ start_idx, end_idx, startIdxValid }) {
		const defaultStartIdx = startIdxValid ? start_idx : end_idx;
		const defaultQStart = 100;
		const defaultQEnd = 50;
		const defaultB = 1.1;
		const defaultD = arpsGetD({
			start_idx: defaultStartIdx,
			q_start: defaultQStart,
			end_idx,
			q_end: defaultQEnd,
			b: defaultB,
		});
		return { defaultStartIdx, defaultQStart, defaultQEnd, defaultB, defaultD };
	}

	getFormCalcRange(toBeCalculatedParam, segment = this.segment) {
		const D = arpsDeff2D(segment.D_eff, segment.b);
		let startIdxMin;
		let startIdxMax;
		let endIdxMin;
		let endIdxMax;
		switch (toBeCalculatedParam) {
			case 'end_idx': {
				const DeffMin =
					segment.start_idx === segment.end_idx
						? 0.01
						: arpsD2Deff(arpsGetD({ ...segment, end_idx: this.dateIdxLarge }), segment.b);
				return {
					start_idx: [
						this.dateIdxSmall,
						Math.floor(
							Math.max(
								this.dateIdxSmall,
								Math.min(
									this.dateIdxLarge,
									arpsGetStartIdxFromQstart({ ...segment, D, end_idx: this.dateIdxLarge })
								)
							)
						),
					],
					end_idx: [this.dateIdxSmall, this.dateIdxLarge],
					duration: [1, this.dateIdxLarge],
					q_start: [
						segment.q_end,
						Math.max(
							segment.q_end,
							Math.min(
								this.numericLarge,
								roundToDigit(arpsGetQStart({ ...segment, D, end_idx: this.dateIdxLarge }), 6, 'down')
							)
						),
					],
					q_end: [
						Math.min(
							segment.q_start,
							Math.max(
								this.numericSmall,
								roundToDigit(predArps({ ...segment, t: this.dateIdxLarge, D }), 6, 'up')
							)
						),
						segment.q_start,
					],
					D_eff: [
						Math.min(DEFAULT_MAX_D_EFF, Math.max(0.01, roundToDigit(DeffMin, 4, 'up'))),
						DEFAULT_MAX_D_EFF,
					],
					b: [0.01, 10],
				};
			}
			case 'q_start': {
				const DeffMax =
					segment.start_idx === segment.end_idx
						? DEFAULT_MAX_D_EFF
						: arpsD2Deff(arpsGetD({ ...segment, q_start: this.numericLarge }), segment.b);
				startIdxMin = Math.min(
					Math.max(
						this.dateIdxSmall,
						arpsGetStartIdxFromQstart({ ...segment, q_start: this.numericLarge, D })
					),
					segment.end_idx
				);
				startIdxMax = segment.end_idx;
				endIdxMin = segment.start_idx;
				endIdxMax = Math.max(
					Math.min(this.dateIdxLarge, arpsGetEndIdxFromQend({ ...segment, q_start: this.numericLarge, D })),
					segment.start_idx
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
						this.numericSmall,
						Math.max(
							Math.min(
								this.numericLarge,
								predArps({ ...segment, t: segment.end_idx, q_start: this.numericLarge, D })
							),
							this.numericSmall
						),
					],
					D_eff: [0.01, Math.max(0.01, Math.min(DeffMax, DEFAULT_MAX_D_EFF))],
					b: [0.01, 10], // Painful to get exact bounds for b. Throw error if end up > this.numericLarge
				};
			}
			case 'q_end': {
				const DeffMax =
					segment.start_idx === segment.end_idx
						? DEFAULT_MAX_D_EFF
						: arpsD2Deff(arpsGetD({ ...segment, q_end: this.numericSmall }), segment.b);
				startIdxMin = Math.min(
					segment.end_idx,
					Math.max(this.dateIdxSmall, arpsGetStartIdxFromQstart({ ...segment, D, q_end: this.numericSmall }))
				);
				startIdxMax = segment.end_idx;
				endIdxMin = segment.start_idx;
				endIdxMax = Math.max(
					segment.start_idx,
					Math.min(this.dateIdxLarge, arpsGetEndIdxFromQend({ ...segment, D, q_end: this.numericSmall }))
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
							this.numericLarge,
							Math.max(this.numericSmall, arpsGetQStart({ ...segment, D, q_end: this.numericSmall }))
						),
						this.numericLarge,
					],
					q_end: [this.numericSmall, this.numericLarge],
					D_eff: [0.01, Math.max(0.01, Math.min(DEFAULT_MAX_D_EFF, DeffMax))],
					b: [0.01, 10],
				};
			}
			case 'D_eff': {
				// Perturb the bounds by this.numericSmall to prevent validation errors down the road.
				const lowD = arpsDeff2D(0.01 + this.numericSmall, segment.b);
				const highD = arpsDeff2D(DEFAULT_MAX_D_EFF - this.numericSmall, segment.b);
				const startEq = segment.q_start === segment.q_end ? segment.end_idx : segment.end_idx - 1;
				const endEq = segment.q_start === segment.q_end ? segment.start_idx : segment.start_idx + 1;
				startIdxMin = Math.min(
					startEq,
					arpsGetStartIdxFromQstart({ ...segment, D: highD }),
					Math.max(this.dateIdxSmall, arpsGetStartIdxFromQstart({ ...segment, D: lowD }))
				);
				startIdxMax = Math.min(startEq, arpsGetStartIdxFromQstart({ ...segment, D: highD }));
				endIdxMin = Math.max(endEq, arpsGetEndIdxFromQend({ ...segment, D: highD }));
				endIdxMax = Math.max(
					endEq,
					arpsGetEndIdxFromQend({ ...segment, D: highD }),
					Math.min(this.dateIdxLarge, arpsGetEndIdxFromQend({ ...segment, D: lowD }))
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
							this.numericLarge,
							arpsGetQStart({ ...segment, D: highD }),
							Math.max(segment.q_end, arpsGetQStart({ ...segment, D: lowD }))
						),
						Math.min(this.numericLarge, arpsGetQStart({ ...segment, D: highD })),
					],
					q_end: [
						Math.max(this.numericSmall, predArps({ ...segment, t: segment.end_idx, D: highD })),
						Math.max(
							this.numericSmall,
							predArps({ ...segment, t: segment.end_idx, D: highD }),
							Math.min(segment.q_start, predArps({ ...segment, t: segment.end_idx, D: lowD }))
						),
					],
					D_eff: [0.01, DEFAULT_MAX_D_EFF],
					b: [0.01, 10],
				};
			}
			default:
				return this.getCalcRange({ segment });
		}
	}

	predict(idxArr) {
		const { start_idx, b, D, q_start } = this.segment;
		return idxArr.map((t) => predArps({ t, start_idx, q_start, D, b }));
	}

	integral(left_idx, right_idx) {
		const { b, D, q_start, start_idx } = this.segment;
		return integralArps({ left_idx, right_idx, start_idx, q_start, D, b });
	}

	inverseIntegral(integral, left_idx) {
		const { b, D, q_start, start_idx } = this.segment;
		return inverseIntegralArps({ integral, left_idx, start_idx, q_start, D, b });
	}

	firstDerivative(idxArr) {
		const { q_start, D, b, start_idx } = this.segment;
		return idxArr.map((t) => firstDerivativeArps({ t, start_idx, q_start, D, b }));
	}

	// form changes
	// required: q_start, q_end, start_idx, end_idx, duration, D_eff, b
	// segmentParent: q_start, start_idx, end_idx, duration
	// here: q_end, D_eff, b
	// warning: target_D_Eff_sw
	changeQEnd(newQEnd, target = 'D_eff') {
		const { start_idx, q_start, end_idx, b, D } = this.segment;
		switch (target) {
			case 'D_eff': {
				const newD = arpsGetD({ start_idx, q_start, end_idx, q_end: newQEnd, b });
				const newDeff = arpsD2Deff(newD, b);
				return {
					...this.segment,
					D: newD,
					D_eff: newDeff,
					q_end: newQEnd,
				};
			}
			case 'end_idx': {
				const newEndIdx = Math.floor(arpsGetEndIdxFromQend({ start_idx, q_start, D, b, q_end: newQEnd }));
				const adjustedNewQEnd = predArps({ t: newEndIdx, start_idx, q_start, D, b });
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
		const { q_start, start_idx, end_idx, b } = this.segment;
		const newD = arpsDeff2D(newDeff, b);
		return {
			...this.segment,
			D: newD,
			D_eff: newDeff,
			q_end: predArps({ t: end_idx, start_idx, q_start, D: newD, b }),
		};
	}

	changeB(newB) {
		const { q_start, start_idx, end_idx, D_eff } = this.segment;
		const newD = arpsDeff2D(D_eff, newB);
		return {
			...this.segment,
			D: newD,
			b: newB,
			q_end: predArps({ t: end_idx, start_idx, q_start, D: newD, b: newB }),
		};
	}

	changeTargetDeffSw() {
		throw Error('Arps segment does have target D-eff Sec parameter');
	}
	// buttons
	// required: qFinal, connects, anchors, matchSlope
	// segmentParent: connects
	// here: qFinal, anchors, matchSlope

	buttonQFinal(qFinalDict, prodInfo, firstSegment) {
		const { q_start, start_idx, D, b } = this.segment;
		const { q_final: qFinal = null, well_life_dict: wellLifeDict } = qFinalDict;
		const wellLifeEndIdx = getWellLifeIdx(prodInfo, wellLifeDict, firstSegment);
		const wellLifeValid = wellLifeEndIdx >= start_idx;
		const qFinalValid = qFinal <= q_start;
		if (!wellLifeValid && !qFinalValid) {
			throw Error(
				`Arps: Target q Final is larger than the q Start of last segment.` +
					` And calculated well life is before the start date of last segment.`
			);
		}
		const qFinalEndIdx = qFinalValid
			? Math.floor(arpsGetEndIdxFromQend({ start_idx, q_start, D, b, q_end: qFinal }))
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
		const newQEnd = predArps({ t: newEndIdx, start_idx, q_start, D, b });
		if (newQEnd < this.numericSmall) {
			throw Error('New q Final is too small! Provide a smaller well life or a larger q Final');
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
		const { start_idx, end_idx, q_end: curQEnd, b } = this.segment;
		const newD = arpsGetD({ start_idx, q_start: prevQEnd, end_idx, q_end: curQEnd, b });
		const newDeff = arpsD2Deff(newD, b);
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
		const { start_idx, b, end_idx } = this.segment;
		const newD = arpsGetDFromFirstDerivative({ q_start: toMatchQStart, first_derivative: toMatchDerivative });
		const newDeff = arpsD2Deff(newD, b);
		return {
			...this.segment,
			q_start: toMatchQStart,
			q_end: predArps({ t: end_idx, start_idx, q_start: toMatchQStart, D: newD, b }),
			D: newD,
			D_eff: newDeff,
		};
	}

	calcQStart({ start_idx, end_idx, q_end, D_eff, b }) {
		const D = arpsDeff2D(D_eff, b);
		const new_q_start = arpsGetQStart({ D, b, start_idx, end_idx, q_end });
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
			b,
			D,
		};
	}

	calcEndIdx({ start_idx, q_start, q_end, D_eff, b }) {
		const D = arpsDeff2D(D_eff, b);
		const new_end_idx = arpsGetEndIdxFromQend({ start_idx, q_start, D, b, q_end });

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
			b,
			D,
		};
	}

	calcQEnd({ start_idx, end_idx, q_start, D_eff, b }) {
		const D = arpsDeff2D(D_eff, b);
		const new_q_end = predArps({ t: end_idx, start_idx, q_start, D, b });
		if (new_q_end > this.numericLarge) {
			throw Error('New q End is too large!');
		} else if (new_q_end < this.numericSmall) {
			throw Error('New q end is too small!');
		}
		return {
			...this.segment,
			q_end: new_q_end,
			start_idx,
			end_idx,
			q_start,
			D_eff,
			b,
			D,
		};
	}

	calcDeff({ start_idx, end_idx, q_start, q_end, b }) {
		const D = start_idx === end_idx ? this.segment.D : arpsGetD({ start_idx, q_start, end_idx, q_end, b });
		const new_D_eff = arpsD2Deff(D, b);
		if (new_D_eff > DEFAULT_MAX_D_EFF) {
			throw Error('New Di Eff-Sec is too large!');
		} else if (new_D_eff < 0.01) {
			throw Error('New Di Eff-Sec is too small!');
		}
		const ret = {
			...this.segment,
			start_idx,
			end_idx,
			q_start,
			q_end,
			b,
			D_eff: new_D_eff,
			D,
		};
		return ret;
	}
}
