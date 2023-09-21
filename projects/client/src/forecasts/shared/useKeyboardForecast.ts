import { linearK2Deff } from '@combocurve/forecast/helpers';
import { MultipleSegments, SegmentParent } from '@combocurve/forecast/models';
import { useCallback, useEffect, useRef } from 'react';

import { useMergedState } from '@/components/hooks';
import { local } from '@/helpers/storage';
import { fields as segParamsTemplate } from '@/inpt-shared/display-templates/segment-templates/seg_params.json';

// TODO: move this to a more appropriate space; probably closer to the MultipleSegment classes
type Param = 'b' | 'D_eff' | 'end_idx' | 'start_idx' | 'target_D_eff_sw' | 'q_start';

type SpeedState = {
	accelerationRate: number;
	b: number;
	D_eff: number;
	dateIncrement: number;
	q_start: number;
	target_D_eff_sw: number;
};

type SpeedStateDep = {
	[Proptery in keyof SpeedState]?: number;
};

// defaults
const CALLED_MAP = {
	b: false,
	D_eff: false,
	end_idx: true,
	start_idx: true,
	target_D_eff_sw: false,
};

const REQUIRES_INT = {
	b: false,
	D_eff: false,
	end_idx: true,
	start_idx: true,
	target_D_eff_sw: false,
};

const CALL_EXPONENT = 1.5;
const Q_EXP = 0.75;
const EMPTY_OBJ = {};
const MAX_ACCELERATION = 75;
const SPEED_STATE_STORAGE_KEY = 'manual-speed-state';

const DEFAULT_SPEED_STATE: SpeedState = {
	accelerationRate: 2,
	b: 0.01,
	D_eff: 0.0025,
	dateIncrement: 5,
	q_start: 0.01,
	target_D_eff_sw: 0.0025,
};

const MIN_MAX_SPEEDS = {
	accelerationRate: { min: 0, max: 4, viewLabel: 'Acceleration Rate', placesPastDecimal: 1 },
	b: { min: 0.01, max: 0.5, placesPastDecimal: 2 },
	D_eff: { min: 0.001, max: 0.25, scale: (value) => value * 100, units: '%', placesPastDecimal: 1 },
	dateIncrement: { min: 1, max: 90, viewLabel: 'Date Increment', step: 1, units: 'Days', placesPastDecimal: 1 },
	q_start: { min: 0.0005, max: 0.02, viewLabel: 'q Value %', scale: (value) => value * 100, placesPastDecimal: 2 },
	target_D_eff_sw: { min: 0.001, max: 0.25, scale: (value) => value * 100, units: '%', placesPastDecimal: 1 },
};

const useKeyboardForecast = ({
	saveLocally = false,
	setSpeedState: setSpeedStateDep,
	speedState: speedStateDep,
	relativeTime = false,
}: {
	saveLocally?: boolean;
	setSpeedState?: (value) => void;
	speedState?: SpeedStateDep;
	relativeTime?: boolean;
} = {}) => {
	// define user input defaults
	const [speedState, _setSpeedState] = useMergedState<SpeedState>({
		...DEFAULT_SPEED_STATE,
		...(local.getItem(SPEED_STATE_STORAGE_KEY) ?? EMPTY_OBJ),
		...(speedStateDep ?? EMPTY_OBJ),
	});

	// Date/numeric bounds brought over from SegmentParent. Build that object here just to get the bounds.
	const segBounds = new SegmentParent({}, relativeTime);

	const speedStateDepRef = useRef<SpeedStateDep>({});
	const accelerationRef = useRef(0);
	const calledRef = useRef(1);

	const setSpeedState = useCallback(
		(value) => (setSpeedStateDep ?? _setSpeedState)(value),
		[_setSpeedState, setSpeedStateDep]
	);

	const incrementCalled = useCallback(() => (calledRef.current += 1), []);

	const resetAcceleration = useCallback(() => {
		accelerationRef.current = 0;
		calledRef.current = 0;
	}, []);

	const adjustSegmentParameter = useCallback(
		({
			dir,
			param,
			segmentObj,
			maxOffset,
		}: {
			dir: -1 | 1;
			maxAcceleration?: number;
			param: Param;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			segmentObj: any;
			maxOffset?: number;
		}) => {
			const useCalled = CALLED_MAP[param];

			let inc;
			if (['start_idx', 'end_idx'].includes(param)) {
				inc = speedState.dateIncrement ?? 1;
			} else {
				inc = speedState[param] ?? 1;
			}

			let maxAccel = inc * MAX_ACCELERATION;
			let speed;

			// q_start has a diffferent acceleration model
			if (param === 'q_start') {
				const startRatio = dir * inc;
				const qNew =
					segmentObj.segment.q_start *
					Math.exp(startRatio * calledRef.current ** (speedState.accelerationRate * Q_EXP));
				speed = qNew - segmentObj.segment.q_start;
				maxAccel = Infinity;
			} else {
				speed =
					dir *
					(useCalled
						? inc * calledRef.current ** (CALL_EXPONENT * speedState.accelerationRate)
						: inc + accelerationRef.current);
			}

			if (speed > maxAccel) {
				speed = maxAccel;
			} else if (speed < -maxAccel) {
				speed = -maxAccel;
			}
			const calculatedParam = param === 'start_idx' ? 'q_start' : 'q_end';
			const defaultBounds = {
				numeric: [segBounds.numericSmall, segBounds.numericLarge],
				date: [segBounds.dateIdxSmall, segBounds.dateIdxLarge],
				D: [0.01, 0.99],
				b: [0.01, 10],
			};
			const paramType = {
				q_start: 'numeric',
				b: 'b',
				end_idx: 'date',
				target_D_eff_sw: 'D',
				D_eff: 'D',
				start_idx: 'date',
			};
			const bounds = segmentObj?.getFormCalcRange(calculatedParam)?.[param] ?? defaultBounds[paramType[param]];
			const min = bounds[0];
			const max = maxOffset ? bounds[1] - maxOffset : bounds[1];

			let newValue = segmentObj.segment?.[param] + speed;
			if (REQUIRES_INT[param]) {
				newValue = Math.round(newValue);
			}

			if (newValue > max) {
				newValue = max;
				if (max === segmentObj.segment?.[param]) {
					throw Error(`Cannot increase ${segParamsTemplate[param].label}.`);
				}
			} else if (newValue < min) {
				newValue = min;
				if (min === segmentObj.segment?.[param]) {
					throw Error(`Cannot decrease ${segParamsTemplate[param].label}.`);
				}
			}

			if (useCalled || param === 'q_start') {
				incrementCalled();
			} else {
				accelerationRef.current += inc * speedState.accelerationRate;
			}

			return newValue;
		},
		[
			segBounds.numericSmall,
			segBounds.numericLarge,
			segBounds.dateIdxSmall,
			segBounds.dateIdxLarge,
			speedState,
			incrementCalled,
		]
	);

	const adjustQStartAll = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		({ dir, segmentObjects }: { dir: -1 | 1; segmentObjects: Array<any> }) => {
			const startRatio = dir * speedState.q_start;
			const qMultiplier = Math.exp(startRatio * calledRef.current ** (speedState.accelerationRate * Q_EXP));
			const bounds = segmentObjects.map((seg) => seg.getFormCalcRange('q_end')['q_start']);
			const maxExceeded = segmentObjects.reduce(
				(acc, seg, i) =>
					(seg.segment.q_start * qMultiplier > bounds[i][1] &&
						seg.type !== 'empty' &&
						seg.type !== 'linear') ||
					acc,
				false
			);
			const minExceeded = segmentObjects.reduce((acc, seg, i) => {
				return (
					(seg.segment.q_start * qMultiplier < bounds[i][0] &&
						seg.type !== 'empty' &&
						seg.type !== 'linear') ||
					acc
				);
			}, false);
			if (maxExceeded) {
				throw Error('Cannot increase rate any further.');
			}
			if (minExceeded) {
				throw Error('Cannot decrease rate any further.');
			}
			incrementCalled();
			// changeQStart is bugged for linear segments. We should move this complicated logic over there once it's
			// fixed.
			return segmentObjects.map((seg) => {
				if (seg.type === 'linear') {
					// Need to check linear segments specially.
					if (
						Math.abs(seg.segment.k * qMultiplier) > segBounds.numericLarge ||
						seg.segment.q_start * qMultiplier > segBounds.numericLarge ||
						seg.segment.q_end * qMultiplier > segBounds.numericLarge ||
						seg.segment.q_start * qMultiplier < segBounds.numericSmall ||
						seg.segment.q_end * qMultiplier < segBounds.numericSmall
					) {
						throw Error('Cannot change rate any further.');
					}
					const adjustedK = seg.segment.k * qMultiplier;
					const adjustedQStart = seg.segment.q_start * qMultiplier;
					return {
						...seg.segment,
						q_start: adjustedQStart,
						q_end: seg.segment.q_end * qMultiplier,
						k: adjustedK,
						D_eff: linearK2Deff({ k: adjustedK, q_start: adjustedQStart }),
					};
				} else {
					return seg.getNewSegmentWithLock('q_end', 'q_start', seg.segment.q_start * qMultiplier);
				}
			});
		},
		[
			incrementCalled,
			segBounds.numericLarge,
			segBounds.numericSmall,
			speedState.accelerationRate,
			speedState.q_start,
		]
	);

	const adjustAllDates = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		({ dir, segmentObjects }: { dir: -1 | 1; segmentObjects: Array<any> }) => {
			const maxAccel = speedState.dateIncrement * MAX_ACCELERATION;
			let speed =
				dir * (speedState.dateIncrement * calledRef.current ** (CALL_EXPONENT * speedState.accelerationRate));
			if (dir === 1 && speed > maxAccel) {
				speed = maxAccel;
			} else if (dir === -1 && speed < -maxAccel) {
				speed = -maxAccel;
			}

			incrementCalled();

			const multiSegmentInstance = new MultipleSegments();
			let segments = multiSegmentInstance.shiftSegmentsIdx({
				inputSegments: segmentObjects,
				deltaT: Math.ceil(speed),
				inputAsObject: true,
			});
			let newStart = segments[0].start_idx;
			let newEnd = segments[segments.length - 1].end_idx;
			if (newStart < segBounds.dateIdxSmall) {
				newStart = segBounds.dateIdxSmall;
				if (newStart === segmentObjects?.[0]?.segment?.start_idx) {
					throw Error(`Cannot decrease Start Date.`);
				}
				segments = multiSegmentInstance.shiftSegmentsIdx({
					inputSegments: segmentObjects,
					deltaT: segBounds.dateIdxSmall - newStart,
					inputAsObject: true,
				});
			}
			if (newEnd > segBounds.dateIdxLarge) {
				newEnd = segBounds.dateIdxLarge;
				if (segmentObjects && newEnd === segmentObjects[segmentObjects.length - 1].end_idx) {
					throw Error(`Cannot increase Start Date.`);
				}
				segments = multiSegmentInstance.shiftSegmentsIdx({
					inputSegments: segmentObjects,
					deltaT: segBounds.dateIdxLarge - newEnd,
					inputAsObject: true,
				});
			}
			return segments;
		},
		[
			incrementCalled,
			segBounds.dateIdxLarge,
			segBounds.dateIdxSmall,
			speedState.accelerationRate,
			speedState.dateIncrement,
		]
	);

	useEffect(() => {
		const currentParentSpeed = speedStateDepRef.current;
		if (currentParentSpeed && typeof currentParentSpeed === 'object') {
			const newSpeedState = Object.entries(currentParentSpeed).reduce((curObj, [key, value]) => {
				if (value !== speedStateDep?.[key]) {
					curObj[key] = speedStateDep?.[key];
				}

				return curObj;
			}, {});

			if (Object.keys(newSpeedState).length) {
				_setSpeedState(newSpeedState);
			}
		}

		speedStateDepRef.current = speedStateDep ?? {};
	}, [_setSpeedState, speedStateDep]);

	useEffect(() => {
		if (saveLocally) {
			local.setItem(SPEED_STATE_STORAGE_KEY, speedState);
		}
	}, [saveLocally, speedState]);

	return {
		adjustAllDates,
		adjustQStartAll,
		adjustSegmentParameter,
		resetAcceleration,
		setSpeedState,
		speedState,
	};
};

export default useKeyboardForecast;
export { DEFAULT_SPEED_STATE, MIN_MAX_SPEEDS, SpeedState };
