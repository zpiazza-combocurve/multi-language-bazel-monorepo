import { Q_FINAL_DECIMAL, dateTimeToDateStr, fixedFloatWithFlexibleDecimal } from '@combocurve/forecast/helpers';
import { MultipleSegments } from '@combocurve/forecast/models';
import { faCalculator } from '@fortawesome/pro-regular-svg-icons';
import produce from 'immer';
import _, { isDate } from 'lodash-es';
import { forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useMutation } from 'react-query';

import { useCallbackRef } from '@/components/hooks';
import { Button, Divider, IconButton } from '@/components/v2';
import { generateNextSegment } from '@/forecasts/charts/forecastChartHelper';
import { ManualDateField, ManualNumberField } from '@/forecasts/deterministic/manual/components';
import { ManualEditingContext } from '@/forecasts/manual/ManualEditingContext';
import { checkAnchor, checkConnect, getValidAdjacentSegment } from '@/forecasts/manual/shared';
import { useForecastConvertFunc } from '@/forecasts/manual/shared/conversionHelper';
import { checkValidSegmentIndices } from '@/forecasts/manual/shared/errorChecking';
import { AddSegmentDialog, MAX_EDIT_SEGMENTS } from '@/forecasts/shared';
import useKeyboardForecast, { SpeedState } from '@/forecasts/shared/useKeyboardForecast';
import { confirmationAlert, genericErrorAlert, infoAlert, warningAlert } from '@/helpers/alerts';
import { useDebounce } from '@/helpers/debounce';
import { useDialog } from '@/helpers/dialog';
import bindInput from '@/helpers/keyEvents';
import { convertDateToIdx } from '@/helpers/zing';
import { PERMISSIONS_TOOLTIP_MESSAGE } from '@/inpt-shared/access-policies/shared';
import { fields as segmentModels } from '@/inpt-shared/display-templates/segment-templates/seg_models.json';
import { fields as segmentParameters } from '@/inpt-shared/display-templates/segment-templates/seg_params.json';

import QFinalDictDialog from '../deterministic/manual/QFinalDictDialog';
import { ControlsSectionContainer, ManualFormActionsContainer } from '../deterministic/manual/layout';
import { Phase } from '../forecast-form/automatic-form/types';

const KEYBOARD_TOAST_TIMER = 3000;

const LOCK_FIELDS = {
	arps_modified: { params: ['q_end', 'q_start', 'D_eff', 'end_idx'], default: 'end_idx' },
	arps: { params: ['q_end', 'q_start', 'D_eff', 'end_idx'], default: 'end_idx' },
	arps_inc: { params: ['q_end', 'q_start', 'D_eff', 'end_idx'], default: 'end_idx' },
	exp_inc: { params: ['q_end', 'q_start', 'D_eff', 'end_idx'], default: 'end_idx' },
	exp_dec: { params: ['q_end', 'q_start', 'D_eff', 'end_idx'], default: 'end_idx' },
	flat: { params: [], default: null },
	empty: { params: [], default: null },
	linear: { params: ['q_end', 'q_start', 'k', 'end_idx'], default: 'end_idx' },
};

const LOCK_PARAMS = ['q_end', 'q_start', 'D_eff', 'end_idx', 'k'];

const DEFAULT_LOCK_OBJ = { ...LOCK_PARAMS.reduce((obj, param) => ({ ...obj, [param]: false }), {}) };

const ADJ_ALL_INVALID_KEYS = ['Control', 'Shift', 'Alt', 'Meta'];

const RATIO_SEGMENT_PARAMETER_LABELS = {
	q_end: 'Ratio End',
	q_start: 'Ratio Start',
};

const getToBeCalculatedParam = (lockObj) => Object.entries(lockObj).find(([, bool]) => bool)?.[0] ?? null;

const checkAndUpdateParamValue = ({ calcMin, calcMax, viewMin, viewMax, value }) => {
	let applyValue = value;

	if (applyValue < calcMin) {
		applyValue = calcMin;
		warningAlert(`Minimum allowed value is ${viewMin instanceof Date ? dateTimeToDateStr(viewMin) : viewMin}`);
	}
	if (applyValue > calcMax) {
		applyValue = calcMax;
		warningAlert(`Maximum allowed value is ${viewMax instanceof Date ? dateTimeToDateStr(viewMax) : viewMax}`);
	}
	return applyValue;
};

/**
 * Receives initSeries as a prop generates an instance of MultipleSegments from initSeries changes made on the
 * MultipleSegments property are propogated back up to the parent/context
 */
function ManualEditing(
	{
		basePhase,
		canUpdate = true,
		editBase = 'deterministic-forecast',
		editSaveForecast,
		editSaveQFinalDict,
		forceDisableKeyboard = false,
		forecastType = 'rate',
		idxDate = false,
		initSeries,
		inputQFinalDict,
		noPadding,
		phase,
		prodInfo,
		speedState,
	}: {
		basePhase?: Phase;
		canUpdate?: boolean;
		editBase?: string;
		editSaveForecast: (values) => void;
		editSaveQFinalDict: ({ values, phaseKey }) => void;
		forceDisableKeyboard?: boolean;
		forecastType?: 'rate' | 'ratio';
		idxDate?: boolean;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		initSeries?: Array<any>;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		inputQFinalDict?: any;
		noPadding?: boolean;
		phase: Phase;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		prodInfo?: any;
		speedState?: SpeedState;
	},
	ref
) {
	// lock state
	const [lockParamsObj, setLockParamsObj] = useState({ ...DEFAULT_LOCK_OBJ });
	const isMac = navigator.userAgent.includes('Mac');

	const [duration, setDuration] = useState(0);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const [viewSegment, setViewSegment] = useState<any>(null);
	const [segmentEdited, setSegmentEdited] = useState(false);
	const [addSegmentDialogProps, setAddSegmentDialogProps] = useState<{
		visible?: boolean;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		resolve?: any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		reject?: any;
	}>({
		visible: false,
		resolve: null,
		reject: null,
	});

	const {
		addToStack,
		getManualSeries,
		multipleSegments,
		onForm,
		pKey,
		refreshChart,
		refreshGridChart,
		resetStack,
		segIdx,
		setMultipleSegments,
		setOnForm,
		setSegIdx,
		undo,
	} = useContext(ManualEditingContext);

	const editingKeyDownRef = useRef(false);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const keyboardWatcher = useRef<any>(null);

	const useProdInfo = useMemo(() => {
		if (editBase === 'typecurve') {
			const curManualSeries = getManualSeries();
			return curManualSeries.length
				? { startIdx: curManualSeries[0].start_idx, endIdx: curManualSeries[0].start_idx }
				: { startIdx: null, endIdx: null };
		}

		return prodInfo;
	}, [editBase, prodInfo, getManualSeries]);

	const phaseQFinalDict = useMemo(() => {
		if (forecastType === 'ratio') {
			return inputQFinalDict?.[`${phase}/${basePhase}`] ?? {};
		}
		return inputQFinalDict?.[phase] ?? {};
	}, [inputQFinalDict, forecastType, phase, basePhase]);

	const debouncedRefreshGridChart = useDebounce(() => {
		if (!editingKeyDownRef.current) {
			refreshGridChart();
		}
	}, 500);

	const { q: qConversion } = useForecastConvertFunc({
		phase,
		basePhase: forecastType === 'ratio' && phase !== basePhase ? basePhase : null,
	});

	// Currently the only manual charts that are in relative time are type curves.
	const relativeTime = editBase === 'typecurve';

	const { adjustAllDates, adjustQStartAll, adjustSegmentParameter, resetAcceleration } = useKeyboardForecast({
		speedState,
		relativeTime,
	});

	const currentSegment = useMemo(
		() => multipleSegments?.segmentObjects?.[segIdx],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[multipleSegments, segIdx, segmentEdited]
	);

	const formFieldParameters = useMemo(
		() => (multipleSegments?.segmentObjects ? segmentModels?.[viewSegment?.name]?.formParams?.edit ?? [] : []),
		[multipleSegments, viewSegment]
	);

	const toggleSegmentEdited = useCallbackRef((runGridRefresh = true) => {
		refreshChart();
		setSegmentEdited((prevValue) => !prevValue);

		if (runGridRefresh) {
			addToStack(_.cloneDeep(multipleSegments));
		}
		if (runGridRefresh && editBase === 'deterministic-forecast') {
			refreshGridChart();
		}
	});

	const anchor = useCallback(
		(dir) => {
			const curManualSeries = getManualSeries();
			try {
				const [adjacentSegment] = getValidAdjacentSegment({
					segIdx,
					editSeries: curManualSeries,
					dir,
				});

				checkAnchor({
					adjacentSegment,
					segment: currentSegment.segment,
					segIdx,
					maxIdx: curManualSeries.length - 1,
					dir,
				});

				currentSegment.segment =
					currentSegment[dir > 0 ? 'buttonAnchorNext' : 'buttonAnchorPrev'](adjacentSegment);
			} catch (error) {
				warningAlert(error.message);
			} finally {
				toggleSegmentEdited();
			}
		},
		[currentSegment, getManualSeries, segIdx, toggleSegmentEdited]
	);

	const connect = useCallback(
		(dir) => {
			const curManualSeries = getManualSeries();
			try {
				const [adjacentSegment] = getValidAdjacentSegment({ segIdx, editSeries: curManualSeries, dir });
				checkConnect({
					adjacentSegment,
					segment: currentSegment.segment,
					segIdx,
					maxIdx: curManualSeries.length - 1,
					dir,
				});

				currentSegment.segment =
					currentSegment[dir > 0 ? 'buttonConnectNext' : 'buttonConnectPrev'](adjacentSegment);
			} catch (error) {
				warningAlert(error.message);
			} finally {
				toggleSegmentEdited();
			}
		},
		[currentSegment, getManualSeries, segIdx, toggleSegmentEdited]
	);

	const matchSlope = useCallback(() => {
		const curManualSeries = getManualSeries();
		try {
			const invalidNames = ['empty', 'flat', 'exp_inc'];
			if (invalidNames.includes(currentSegment.segment.name)) {
				throw new Error('Cannot smoothly connect segment to previous segment');
			}

			if (segIdx !== 0) {
				const [adjacentSegment, adjIdx] = getValidAdjacentSegment({
					segIdx,
					editSeries: curManualSeries,
					dir: -1,
					invalidNames,
				});

				if (invalidNames.includes(adjacentSegment.name)) {
					throw new Error('Previous segment cannot be smoothly connected to');
				}

				currentSegment.segment = currentSegment.buttonMatchSlope(multipleSegments.segmentObjects[adjIdx]);
			}
		} catch (error) {
			warningAlert(error.message);
		} finally {
			toggleSegmentEdited();
		}
	}, [currentSegment, getManualSeries, multipleSegments.segmentObjects, segIdx, toggleSegmentEdited]);

	const shiftMultipleIdx = useCallback(
		(newSegment) => {
			const prevDeltaT = newSegment.start_idx - currentSegment.segment.start_idx;
			if (prevDeltaT !== 0) {
				multipleSegments.shiftSelfIdx(prevDeltaT, segIdx - 1, true);
			}
			const nextDeltaT = newSegment.end_idx - currentSegment.segment.end_idx;
			if (nextDeltaT !== 0) {
				multipleSegments.shiftSelfIdx(nextDeltaT, segIdx + 1, false);
			}
		},
		[currentSegment, multipleSegments, segIdx]
	);

	const applyDuration = useCallback(() => {
		const floorDuration = Math.floor(duration);
		if (floorDuration < 1) {
			return;
		}

		const toBeCalculatedParam = getToBeCalculatedParam(lockParamsObj);
		if (toBeCalculatedParam === 'end_idx' || ['flat', 'empty'].includes(currentSegment.type)) {
			const newSegment = currentSegment.changeDuration(floorDuration);
			if (newSegment.end_idx !== currentSegment.segment.end_idx) {
				shiftMultipleIdx(newSegment);
				currentSegment.segment = newSegment;
				toggleSegmentEdited();
			}
		} else {
			const newStartIdx = currentSegment.segment.end_idx - floorDuration + 1;
			if (newStartIdx !== currentSegment.segment.start_idx) {
				const newSegment = currentSegment.getNewSegmentWithLock(toBeCalculatedParam, 'start_idx', newStartIdx);
				shiftMultipleIdx(newSegment);
				currentSegment.segment = newSegment;
				toggleSegmentEdited();
			}
		}
		// HACK, this will cause this useCallback to run one more time, but it should be fine
		// try to solve a case like duration changes from '4000' to '4000.5'
		setDuration(floorDuration);
	}, [currentSegment, duration, setDuration, shiftMultipleIdx, toggleSegmentEdited, lockParamsObj]);

	const getNewSegment = useCallback(
		(param, value) => {
			switch (param) {
				case 'duration':
					return applyDuration();
				case 'q_start':
					return currentSegment.changeQStart(value);
				case 'q_end':
					return currentSegment.changeQEnd(value);
				case 'c':
					return currentSegment.changeQStart(value);
				case 'D_eff':
					return currentSegment.changeDeff(value);
				case 'b':
					return currentSegment.changeB(value);
				case 'target_D_eff_sw':
					return currentSegment.changeTargetDeffSw(value);
				case 'start_idx':
					return currentSegment.changeStartIdx(value);
				case 'end_idx':
					return currentSegment.changeEndIdx(value);
				case 'k':
					return currentSegment.changeK(value);
				default:
					throw new Error('Invalid Field');
			}
		},
		[applyDuration, currentSegment]
	);

	const getNewSegmentWithLock = useCallback(
		(param, value) => {
			const toBeCalculatedParam = getToBeCalculatedParam(lockParamsObj);
			if (toBeCalculatedParam && LOCK_PARAMS.includes(toBeCalculatedParam)) {
				return currentSegment.getNewSegmentWithLock(toBeCalculatedParam, param, value);
			}
			return getNewSegment(param, value);
		},
		[currentSegment, getNewSegment, lockParamsObj]
	);

	const toggleLockParam = useCallback((param) => setLockParamsObj({ ...DEFAULT_LOCK_OBJ, [param]: true }), []);

	const applyFormParam = useCallback(
		(param) => {
			const backgroundViewSegment = currentSegment.calcToView({
				unitConvertFunc: qConversion.toCalc,
				idxDate,
			});
			if (idxDate && (param === 'start_idx' || param === 'end_idx')) {
				viewSegment[param] = Math.floor(viewSegment[param]);
			}

			if (String(viewSegment[param]) !== String(backgroundViewSegment[param]) || param === 'duration') {
				let value =
					param === 'duration'
						? Math.floor(duration)
						: currentSegment.viewToCalc({ viewSegment, unitConvertFunc: qConversion.toCalc, idxDate })[
								param
						  ];
				const toBeCalculatedParam = getToBeCalculatedParam(lockParamsObj);

				const [formMin, formMax] = currentSegment.getFormCalcRange(toBeCalculatedParam)[param];

				// if toBecalculatedParam is not part of the form, the form itself will ignore it
				const [viewMin, viewMax] = currentSegment.getFormViewRange({
					toBeCalculatedParam,
					unitConvertFunc: qConversion.toView,
					idxDate,
				})[param];

				value = checkAndUpdateParamValue({
					calcMin: formMin,
					calcMax: formMax,
					viewMin,
					viewMax,
					value,
				});

				let updateParam = param;
				let updateValue = value;
				if (param === 'duration') {
					updateParam = 'end_idx';
					updateValue =
						currentSegment.viewToCalc({ viewSegment, unitConvertFunc: qConversion.toCalc, idxDate })[
							'start_idx'
						] +
						value -
						1;
				}
				try {
					const newSegment = getNewSegmentWithLock(updateParam, updateValue);
					if (currentSegment) {
						shiftMultipleIdx(newSegment);
						currentSegment.segment = newSegment;
					}
				} catch (error) {
					warningAlert(error.message);
				} finally {
					toggleSegmentEdited();
				}
			}
		},
		[
			currentSegment,
			qConversion.toCalc,
			qConversion.toView,
			idxDate,
			viewSegment,
			duration,
			lockParamsObj,
			getNewSegmentWithLock,
			shiftMultipleIdx,
			toggleSegmentEdited,
		]
	);

	const generateField = useCallback(
		(param) => {
			if (currentSegment?.type) {
				const { type, label: templateLabel /* , units */ } = segmentParameters[param];
				const label =
					forecastType === 'ratio' ? RATIO_SEGMENT_PARAMETER_LABELS[param] ?? templateLabel : templateLabel;

				const isLocked = lockParamsObj?.[param];

				const [min, max] = currentSegment?.getFormViewRange({
					unitConvertFunc: qConversion.toView,
					idxDate,
					toBeCalculatedParam: getToBeCalculatedParam(lockParamsObj),
				})?.[param] ?? [-Infinity, Infinity];

				const disabled = label === 'Duration' ? lockParamsObj?.['end_idx'] : isLocked;
				const numberProps = {
					disabled,
					label,
					max,
					min,
					onFocus: () => setOnForm(true),
					onBlur: () => {
						if (Number.isFinite(label === 'Duration' ? duration : viewSegment[param])) {
							applyFormParam(param);
						}
						setOnForm(false);
					},
					param,
					setVal:
						label === 'Duration'
							? (value) => setDuration(value)
							: (value, parameter) => setViewSegment((prev) => ({ ...prev, [parameter]: value })),

					value: label === 'Duration' ? duration : viewSegment[param],
					required: true,
				};

				const dateProps = {
					color: 'primary',
					disabled: isLocked,
					label,
					value: viewSegment[param],
					onFocus: () => setOnForm(true),
					onBlur: () => {
						if (isDate(viewSegment[param])) {
							applyFormParam(param);
						}
						setOnForm(false);
					},
					onChange: (value) => {
						if (isDate(value) && Number.isFinite(value.getTime())) {
							setViewSegment((prev) => ({ ...prev, [param]: value }));
						}
					},
					placeholder: 'Enter Date',
					required: true,
					minDate: min,
					maxDate: max,
				};

				let fieldComponent;
				switch (type) {
					case 'Number':
					case 'Percent':
						fieldComponent = <ManualNumberField key={param} {...numberProps} />;
						break;
					case 'Date':
						fieldComponent = idxDate ? (
							<ManualNumberField key={param} {...numberProps} />
						) : (
							<ManualDateField key={param} {...dateProps} />
						);
						break;
					default:
						return null;
				}
				return (
					<div css='display: flex;'>
						<div css='flex-grow: 1;'>{fieldComponent}</div>
						{LOCK_FIELDS?.[currentSegment.type]?.params?.includes(param) && (
							<span>
								<IconButton disabled={isLocked} onClick={() => toggleLockParam(param)} size='small'>
									{faCalculator}
								</IconButton>
							</span>
						)}
					</div>
				);
			}
			return null;
		},
		[
			currentSegment,
			forecastType,
			lockParamsObj,
			qConversion.toView,
			idxDate,
			duration,
			viewSegment,
			setOnForm,
			applyFormParam,
			toggleLockParam,
		]
	);

	const renderFields = useMemo(
		() => viewSegment && formFieldParameters.map((param) => generateField(param)),
		[viewSegment, formFieldParameters, generateField]
	);

	const addSegment = useCallback(
		(newSeg, addToEnd = true) => {
			try {
				if (multipleSegments.segmentObjects.length >= MAX_EDIT_SEGMENTS) {
					throw new Error(`Max number of segments for a manual forecast is ${MAX_EDIT_SEGMENTS}`);
				}

				const segment = multipleSegments.generateDefaultSegment(newSeg, relativeTime);
				const newEditSeries = multipleSegments.segmentObjects;
				const newSegmentObj = multipleSegments.getSegmentObject(segment, relativeTime);
				if (addToEnd) {
					newEditSeries.push(newSegmentObj);
				} else {
					newEditSeries.unshift(newSegmentObj);
				}

				toggleSegmentEdited();
				setSegIdx(addToEnd ? newEditSeries.length - 1 : 0);
			} catch (error) {
				warningAlert(error.message);
			}
		},
		[multipleSegments, relativeTime, setSegIdx, toggleSegmentEdited]
	);

	const quickAddSegment = useCallback(
		(name) => {
			const series = getManualSeries();
			try {
				const segment = generateNextSegment({ name, series, relativeTime: editBase === 'typecurve' });
				addSegment(segment);
			} catch (error) {
				warningAlert(error.message);
			}
		},
		[addSegment, editBase, getManualSeries]
	);

	const initAddDialog = useCallback(async () => {
		try {
			setOnForm(true);
			await new Promise((resolve, reject) => {
				const addSegDialog = { resolve, reject, visible: true };
				setAddSegmentDialogProps(addSegDialog);
			})
				.then((resolved) => {
					if (resolved) {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
						const [newSeg, addToEnd] = resolved as any;
						addSegment(newSeg, addToEnd);
					}
				})
				.finally(() => {
					const addSegDialog = { resolve: null, reject: null, visible: false };
					setAddSegmentDialogProps(addSegDialog);
				});
		} catch (error) {
			warningAlert(error.message);
		} finally {
			setOnForm(false);
		}
	}, [addSegment, setOnForm]);

	const removeSegment = useCallback(() => {
		try {
			const len = multipleSegments.segmentObjects.length;

			const isZeroSegmentEditBase = ['deterministic-forecast', 'typecurve'].includes(editBase);
			if (len < 1 && isZeroSegmentEditBase) {
				throw new Error('No segments to remove');
			}
			if (len < 2 && !isZeroSegmentEditBase) {
				throw new Error('Cannot remove last segment');
			}
			if (segIdx !== 0 && segIdx !== len - 1) {
				throw new Error('Only the first or last segment can be removed');
			}

			const newEditSeries = multipleSegments.segmentObjects;
			if (segIdx === 0) {
				newEditSeries.shift();
			} else {
				newEditSeries.pop();
			}

			setSegIdx(segIdx === 0 ? 0 : segIdx - 1);
		} catch (error) {
			warningAlert(error.message);
		} finally {
			toggleSegmentEdited();
		}
	}, [editBase, multipleSegments.segmentObjects, segIdx, setSegIdx, toggleSegmentEdited]);

	// TODO: consider blocking these functions if there are no segments in manual series
	const generateKeyboardForecastCallback = useCallback(
		(inputs, invalidKeys = []) => {
			return () => {
				if (invalidKeys.map((key) => keyboardWatcher.current.keyDown(key)).filter(Boolean).length) {
					return;
				}
				try {
					const { param } = inputs;
					let maxOffset = 0;
					// end_idx moves the subsequent segments as well.
					if (param === 'end_idx') {
						const segs = multipleSegments?.segmentObjects;
						const remainderStart = segs?.[segIdx + 1]?.segment?.start_idx;
						const remainderEnd = segs?.[segs.length - 1]?.segment?.end_idx;
						maxOffset = remainderStart ? remainderEnd - remainderStart + 1 : 0;
					}
					const newValue = adjustSegmentParameter({ ...inputs, maxOffset });
					const calculatedParam = param === 'start_idx' ? 'q_start' : 'q_end';
					const newSegment = currentSegment.getNewSegmentWithLock(calculatedParam, param, newValue);
					shiftMultipleIdx(newSegment);
					currentSegment.segment = newSegment;

					editingKeyDownRef.current = true;
					toggleSegmentEdited(false);
				} catch (error) {
					warningAlert(error.message, KEYBOARD_TOAST_TIMER, { preventDuplicate: true });
				}
			};
		},
		[
			adjustSegmentParameter,
			currentSegment,
			multipleSegments?.segmentObjects,
			segIdx,
			shiftMultipleIdx,
			toggleSegmentEdited,
		]
	);

	const generateQStartAllCallback = useCallback(
		(dir) => {
			return () => {
				try {
					if (
						ADJ_ALL_INVALID_KEYS.map((key) => keyboardWatcher.current.keyDown(key)).filter(Boolean).length
					) {
						return;
					}

					const newSegments = adjustQStartAll({
						dir,
						segmentObjects: multipleSegments.segmentObjects,
					});

					multipleSegments.segmentObjects.map((segmentObject, idx) => {
						const segment = segmentObject;
						segment.segment = newSegments[idx];
						return segment;
					});

					editingKeyDownRef.current = true;
					toggleSegmentEdited(false);
				} catch (error) {
					warningAlert(error.message, KEYBOARD_TOAST_TIMER, { preventDuplicate: true });
				}
			};
		},
		[adjustQStartAll, multipleSegments, toggleSegmentEdited]
	);

	const generateAdjustAllDatesCallback = useCallback(
		(dir, invalidKeys) => {
			return () => {
				if (invalidKeys?.map((key) => keyboardWatcher.current.keyDown(key)).filter(Boolean).length) {
					return;
				}

				const newSegments = adjustAllDates({ dir, segmentObjects: multipleSegments.segmentObjects });
				multipleSegments.segmentObjects.map((segmentObject, idx) => {
					const segment = segmentObject;
					segment.segment = newSegments[idx];
					return segment;
				});

				editingKeyDownRef.current = true;
				toggleSegmentEdited(false);
			};
		},
		[adjustAllDates, multipleSegments.segmentObjects, toggleSegmentEdited]
	);

	const debouncedAddToStack = useDebounce(() => {
		if (!editingKeyDownRef.current) {
			addToStack(_.cloneDeep(multipleSegments));
		}
	}, 500);

	const keyboardForecastKeyUp = useCallbackRef((ev) => {
		const validRefreshValues = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
		editingKeyDownRef.current = false;
		resetAcceleration();
		if (validRefreshValues.includes(ev.code)) {
			debouncedAddToStack();
			if (editBase === 'deterministic-forecast') {
				debouncedRefreshGridChart();
			}
		}
	});

	// NOTE: anything causes this to rerender will lead to reset of the keymap, and will lead to infinite keyboard triggers
	const enableKeyboardForecast = useCallback(() => {
		if (!getManualSeries().length) {
			return;
		}

		if (document.activeElement) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			(document.activeElement as any).blur();
		}

		// HACK: currently when elements are removed from the DOM, focus is moved to the document.body. this causes issues for scoped keyboard functions. swap to hotkey-js in the future
		keyboardWatcher.current = bindInput(document.body);
		const keyWatcher = keyboardWatcher.current;

		document.body.addEventListener('keyup', keyboardForecastKeyUp, false);

		const invalidKeys = [...ADJ_ALL_INVALID_KEYS, 'a'];
		const shared = {
			dir: 1,
			segmentObj: currentSegment,
		};

		// adjust q start values
		// changes q_end, q_sw for arps_modified
		keyWatcher.watch({
			callback: generateKeyboardForecastCallback({ ...shared, param: 'q_start' }, invalidKeys),
			keys: ['ArrowUp'],
			name: 'arrowUp',
			time: 100,
		});

		keyWatcher.watch({
			callback: generateKeyboardForecastCallback({ ...shared, dir: -1, param: 'q_start' }, invalidKeys),
			keys: ['ArrowDown'],
			name: 'arrowDown',
			time: 100,
		});

		// adjust q start for all segments
		keyWatcher.watch({
			callback: generateQStartAllCallback(1),
			keys: ['a', 'ArrowUp'],
			name: 'adjAllUp',
			time: 100,
		});

		keyWatcher.watch({
			callback: generateQStartAllCallback(-1),
			keys: ['a', 'ArrowDown'],
			name: 'adjAllDown',
			time: 100,
		});

		// adjust D_eff values
		// changes D, q_end, for arps_modified: q_sw, sw_idx, realized_D_eff_sw, D_exp, D_exp_eff
		keyWatcher.watch({
			callback: generateKeyboardForecastCallback({ ...shared, param: 'D_eff' }),
			keys: isMac ? ['Shift', '<'] : ['Control', 'ArrowDown'],
			name: 'ctrlDown',
		});

		keyWatcher.watch({
			callback: generateKeyboardForecastCallback({ ...shared, dir: -1, param: 'D_eff' }),
			keys: isMac ? ['Shift', '>'] : ['Control', 'ArrowUp'],
			name: 'ctrlUp',
		});

		// adjust target_D_eff_sw values (only availabe for arps_modified)
		// q_end, q_sw, sw_idx, realized_D_eff_sw, D_exp, D_exp_eff
		keyWatcher.watch({
			callback: generateKeyboardForecastCallback({ ...shared, dir: -1, param: 'target_D_eff_sw' }),
			keys: ['Alt', 'ArrowUp'],
			name: 'altUp',
		});

		keyWatcher.watch({
			callback: generateKeyboardForecastCallback({ ...shared, param: 'target_D_eff_sw' }),
			keys: ['Alt', 'ArrowDown'],
			name: 'altDown',
		});

		// adjust b values (only available for arps/arps_modified)
		// changes D (assuming D_eff doesn't change?), q_end, for arps_modified: q_sw, sw_idx, realized_D_eff_sw, D_exp, D_exp_eff
		keyWatcher.watch({
			callback: generateKeyboardForecastCallback({ ...shared, param: 'b' }),
			keys: ['Shift', 'ArrowUp'],
			name: 'shiftUp',
			time: 100,
		});

		keyWatcher.watch({
			callback: generateKeyboardForecastCallback({ ...shared, dir: -1, param: 'b' }),
			keys: ['Shift', 'ArrowDown'],
			name: 'shiftDown',
			time: 100,
		});

		// adjust all segements start and end indices
		keyWatcher.watch({
			callback: generateAdjustAllDatesCallback(-1, invalidKeys),
			keys: ['ArrowLeft'],
			name: 'arrowLeft',
		});

		keyWatcher.watch({
			callback: generateAdjustAllDatesCallback(1, invalidKeys),
			keys: ['ArrowRight'],
			name: 'arrowRight',
		});

		// Control modifier suppress keyup events on Macs. Disable these hotkeys in that case.
		if (!isMac) {
			// adjust first segment start index
			// changes q_start
			keyWatcher.watch({
				callback: generateKeyboardForecastCallback({
					...shared,
					dir: -1,
					param: 'start_idx',
					maxAcceleration: 200,
				}),
				keys: ['Control', 'ArrowLeft'],
				name: 'ctrlLeft',
			});

			keyWatcher.watch({
				callback: generateKeyboardForecastCallback({
					...shared,
					dir: 1,
					param: 'start_idx',
					maxAcceleration: 200,
				}),
				keys: ['Control', 'ArrowRight'],
				name: 'ctrlRight',
			});
		}

		// adjust last segment end index
		// changes q_end
		keyWatcher.watch({
			callback: generateKeyboardForecastCallback({
				...shared,
				dir: -1,
				param: 'end_idx',
				maxAcceleration: 200,
			}),
			keys: ['Shift', 'ArrowLeft'],
			name: 'shiftLeft',
		});

		keyWatcher.watch({
			callback: generateKeyboardForecastCallback({
				...shared,
				dir: 1,
				param: 'end_idx',
				maxAcceleration: 200,
			}),
			keys: ['Shift', 'ArrowRight'],
			name: 'shiftRight',
		});
	}, [
		getManualSeries,
		keyboardForecastKeyUp,
		currentSegment,
		generateKeyboardForecastCallback,
		generateQStartAllCallback,
		isMac,
		generateAdjustAllDatesCallback,
	]);

	const disableKeyboardForecast = useCallback(() => {
		const keyWatcher = keyboardWatcher.current;
		if (keyWatcher) {
			keyWatcher.unwatchAll();
			keyWatcher.detach();

			if (document.body) {
				document.body.removeEventListener('keyup', keyboardForecastKeyUp, false);
			}
		}
	}, [keyboardForecastKeyUp]);

	const { isLoading: savingForecast, mutateAsync: saveForecast } = useMutation(async () => {
		if (canUpdate) {
			if (!_.isEqual(initSeries, getManualSeries())) {
				await editSaveForecast({
					saveCurPhase: phase,
					saveManualSeries: _.cloneDeep(getManualSeries()),
					saveForecastType: forecastType,
					saveBasePhase: basePhase,
					savePKey: pKey,
				});
			} else {
				infoAlert('No updates to save');
			}
		} else {
			warningAlert(PERMISSIONS_TOOLTIP_MESSAGE);
		}
	});

	const [dialog, showMoreInputsDialog] = useDialog(QFinalDictDialog);

	const applyQFinalDict = useCallback(
		(qFinalDict) => {
			try {
				if (_.isEmpty(qFinalDict)) {
					throw Error('Please input the value of q Final and well life by clicking the Q FINAL button.');
				}

				const firstSegmentObject = multipleSegments.segmentObjects?.[0];
				const lastSegmentObject = multipleSegments.segmentObjects?.[multipleSegments.segmentObjects.length - 1];
				if (lastSegmentObject) {
					lastSegmentObject.segment = lastSegmentObject.buttonQFinal(
						qFinalDict,
						useProdInfo,
						firstSegmentObject.segment
					);
				}
			} catch (error) {
				warningAlert(error.message);
			} finally {
				toggleSegmentEdited();
			}
		},
		[multipleSegments, toggleSegmentEdited, useProdInfo]
	);

	const handleQFinalUpdate = useCallback(async () => {
		setOnForm(true);
		const phaseKey = forecastType === 'ratio' ? `${phase}/${basePhase}` : phase;
		const values = await showMoreInputsDialog({ initialValues: phaseQFinalDict, editBase, qConversion });

		try {
			if (!values) {
				return;
			}

			await editSaveQFinalDict({ values, phaseKey });
			confirmationAlert('New value for qFinal and well life has been saved successfully');
			applyQFinalDict(values);
		} catch (error) {
			warningAlert(error.message);
		} finally {
			setOnForm(false);
		}
	}, [
		applyQFinalDict,
		basePhase,
		editBase,
		editSaveQFinalDict,
		forecastType,
		phase,
		phaseQFinalDict,
		qConversion,
		setOnForm,
		showMoreInputsDialog,
	]);

	const defaultKeyEvents = useCallback(
		(event) => {
			const { altKey, code, ctrlKey, shiftKey, metaKey } = event;
			const mappedCtrl = isMac ? metaKey : ctrlKey;

			// these should be disabled if there are no segments in the manual series
			if (getManualSeries().length) {
				if (code === 'KeyC') {
					connect(-1);
				}
				if ((code === 'KeyR' && !altKey) || code === 'Delete' || code === 'Backspace') {
					removeSegment();
				}
				if (code === 'KeyM' && !altKey) {
					matchSlope();
				}
				if (code === 'Tab') {
					setSegIdx((prevSegIdx) => {
						let newSegIdx = prevSegIdx + 1;
						if (newSegIdx > getManualSeries().length - 1) {
							newSegIdx = 0;
						}

						return newSegIdx;
					});
					event.preventDefault();
				}
				if (shiftKey && code === 'Enter') {
					applyQFinalDict(phaseQFinalDict);
				}
			}

			// can save empty forecast
			if (mappedCtrl && code === 'KeyS') {
				if (savingForecast) {
					warningAlert('We are saving the forecast, saving is not allowed now');
				} else {
					saveForecast();
				}
				event.preventDefault();
			}

			// undo if possible
			if (mappedCtrl && code === 'KeyZ') {
				undo();
			}

			// Alt is reserved for adding segments
			if (altKey) {
				event.preventDefault();

				if (code === 'KeyA') {
					quickAddSegment('arps');
				}
				if (code === 'KeyR') {
					quickAddSegment('arps_inc');
				}
				if (code === 'KeyD') {
					quickAddSegment('exp_dec');
				}
				if (code === 'KeyI') {
					quickAddSegment('exp_inc');
				}
				if (code === 'KeyF') {
					quickAddSegment('flat');
				}
				if (code === 'KeyL') {
					quickAddSegment('linear');
				}
				if (code === 'KeyM') {
					quickAddSegment('arps_modified');
				}
				if (code === 'Digit0') {
					quickAddSegment('empty');
				}
			}
		},
		[
			applyQFinalDict,
			connect,
			getManualSeries,
			isMac,
			matchSlope,
			phaseQFinalDict,
			quickAddSegment,
			removeSegment,
			saveForecast,
			savingForecast,
			setSegIdx,
			undo,
		]
	);

	const initSegmentInstance = useCallbackRef(() => {
		try {
			const toInit = initSeries?.length && checkValidSegmentIndices(initSeries) ? initSeries : [];

			const initSegments = new MultipleSegments(toInit, relativeTime);
			setMultipleSegments(initSegments);
			setSegIdx(0);
			resetStack(_.cloneDeep(initSegments));
		} catch (error) {
			genericErrorAlert(error);
		}
	});

	const ActionButtonRender = useMemo(() => {
		const manualSeries = getManualSeries();
		return (
			<ManualFormActionsContainer>
				{/* connect buttons */}
				{segIdx !== 0 && (
					<Button color='primary' onClick={() => connect(-1)} size='small'>
						Cnct Prev
					</Button>
				)}

				{segIdx !== manualSeries.length - 1 && manualSeries.length > 1 && (
					<Button color='primary' onClick={() => connect(1)} size='small'>
						Cnct Next
					</Button>
				)}

				{segIdx !== 0 && (
					<Button color='primary' onClick={matchSlope} size='small'>
						Match Slope
					</Button>
				)}

				{/* anchor buttons */}
				{segIdx !== 0 && (
					<Button color='primary' onClick={() => anchor(-1)} size='small'>
						Anchor Prev
					</Button>
				)}

				{segIdx !== manualSeries.length - 1 && manualSeries.length > 1 && (
					<Button color='primary' onClick={() => anchor(1)} size='small'>
						Anchor Next
					</Button>
				)}

				<Button
					color='primary'
					onClick={handleQFinalUpdate}
					tooltipTitle={
						fixedFloatWithFlexibleDecimal(qConversion.toView(phaseQFinalDict?.q_final), Q_FINAL_DECIMAL) ??
						'Click to set the Q Final'
					}
					size='small'
				>
					q Final
				</Button>

				<Button color='primary' onClick={initAddDialog} size='small'>
					Add Seg
				</Button>

				{(segIdx === 0 || segIdx === manualSeries.length - 1) &&
					((manualSeries.length > 1 && editBase !== 'deterministic-forecast') ||
						editBase === 'deterministic-forecast' ||
						editBase === 'typecurve') && (
						<Button color='warning' onClick={removeSegment} size='small'>
							Rmv Seg
						</Button>
					)}
			</ManualFormActionsContainer>
		);
	}, [
		anchor,
		connect,
		editBase,
		getManualSeries,
		handleQFinalUpdate,
		initAddDialog,
		matchSlope,
		phaseQFinalDict?.q_final,
		qConversion,
		removeSegment,
		segIdx,
	]);

	// init editSeries
	useEffect(() => {
		initSegmentInstance();
	}, [initSegmentInstance, initSeries]);

	// HACK: check to see if we can just use one keyword here (saveForecast vs save)
	useImperativeHandle(ref, () => ({
		manualSetOnForm: setOnForm,
		reset: initSegmentInstance,
		save: saveForecast,
		saveForecast,
	}));

	// keyboard init
	useEffect(() => {
		if (!onForm && !forceDisableKeyboard) {
			document.addEventListener('keydown', defaultKeyEvents, false);
			enableKeyboardForecast();
		} else {
			document.removeEventListener('keydown', defaultKeyEvents, false);
			disableKeyboardForecast();
		}

		return () => {
			document.removeEventListener('keydown', defaultKeyEvents, false);
			disableKeyboardForecast();
		};
	}, [defaultKeyEvents, disableKeyboardForecast, enableKeyboardForecast, forceDisableKeyboard, onForm]);

	useEffect(() => {
		if (currentSegment?.segment) {
			const newViewSegment = currentSegment.calcToView({ unitConvertFunc: qConversion.toView, idxDate });

			const { start_idx, end_idx } = newViewSegment;

			const dateConversionFunc = idxDate ? (val) => val : convertDateToIdx;
			setDuration(dateConversionFunc(end_idx) - dateConversionFunc(start_idx) + 1);
			setViewSegment(newViewSegment);
		}
	}, [currentSegment, idxDate, qConversion.toView, segmentEdited]);

	useEffect(() => {
		if (currentSegment) {
			setLockParamsObj(
				produce((draft) => {
					const { type } = currentSegment;

					const curLockParam = getToBeCalculatedParam(draft);
					if (!LOCK_FIELDS?.[type]?.params?.includes(curLockParam)) {
						if (curLockParam) {
							draft[curLockParam] = false;
						}
						if (LOCK_FIELDS?.[type]?.default) {
							draft[LOCK_FIELDS?.[type]?.default] = true;
						}
					}
				})
			);
		}
	}, [currentSegment, segIdx]);

	return (
		<>
			{dialog}

			{Boolean(getManualSeries()?.length) && (
				<>
					<ControlsSectionContainer noPadding={noPadding}>{renderFields}</ControlsSectionContainer>

					<Divider />
				</>
			)}

			{ActionButtonRender}

			<AddSegmentDialog
				{...addSegmentDialogProps}
				editBase={editBase}
				editSeries={getManualSeries() ?? []}
				qConversion={qConversion}
			/>
		</>
	);
}

export default forwardRef(ManualEditing);
