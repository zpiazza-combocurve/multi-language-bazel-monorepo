import { MultipleSegments } from '@combocurve/forecast/models';
import { Dispatch, SetStateAction, createContext, useCallback, useEffect, useMemo, useState } from 'react';

import { BKey } from '@/type-curves/TypeCurveIndex/types';

import useStateStack from './shared/useStateStack';

const ManualEditingContext = createContext<{
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	addToStack: (value: any) => void;
	bKey: BKey;
	canUndo: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	getManualSeries: () => Array<any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	manualGridSeries: Array<any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	manualSeries: Array<any>;
	multipleSegments: MultipleSegments;
	onForm: boolean;
	pKey: string;
	refreshChart: () => void;
	refreshChartDep: boolean;
	refreshGridChart: () => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	resetStack: (value: any) => void;
	segIdx: number;
	setBKey: Dispatch<SetStateAction<BKey>>;
	setMultipleSegments: Dispatch<SetStateAction<MultipleSegments>>;
	setOnForm: Dispatch<SetStateAction<boolean>>;
	setPKey: Dispatch<SetStateAction<string>>;
	setSegIdx: Dispatch<SetStateAction<number>>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	undo: () => any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
}>({} as any);

const ManualEditingProvider = (props) => {
	const { children } = props;

	// used for typeCurveFit only
	const [bKey, setBKey] = useState<BKey>('average');

	const [multipleSegments, setMultipleSegments] = useState(new MultipleSegments());
	const [onForm, setOnForm] = useState<boolean>(false);
	const [pKey, setPKey] = useState<string>('best');
	const [refreshChartDep, setRefreshChartDep] = useState<boolean>(false);
	const [segIdx, setSegIdx] = useState<number>(0);

	const getManualSeries = useCallback(
		() => multipleSegments.segmentObjects.map((segmentObject) => segmentObject.segment),
		[multipleSegments.segmentObjects]
	);

	// TODO: clean up other parts to use getManualSeries instead
	// NOTE: Use ONLY for dynamic visual components. not meant for callbacks that require static values (ex. a save function)
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const manualSeries = useMemo(() => getManualSeries(), [multipleSegments.segmentObjects, refreshChartDep]);

	const refreshChart = useCallback(() => setRefreshChartDep((prevValue) => !prevValue), []);

	// only used for the grid chart in deterministic-manual-forecast
	const [refreshGridChartDep, setRefreshGridChartDep] = useState(false);
	const refreshGridChart = useCallback(() => setRefreshGridChartDep((prevValue) => !prevValue), []);

	const manualGridSeries = useMemo(
		() => multipleSegments.segmentObjects.map((segmentObject) => segmentObject.segment),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[multipleSegments.segmentObjects, refreshGridChartDep]
	);

	const { addToStack, canUndo, resetStack, undo } = useStateStack({
		callback: useCallback(
			(value) => {
				setMultipleSegments(value);
				refreshChart();
				refreshGridChart();
			},
			[refreshChart, refreshGridChart]
		),
	});

	// ---------- grid-chart-only-end ----------
	const contextObj = useMemo(
		() => ({
			addToStack,
			bKey,
			canUndo,
			getManualSeries,
			manualGridSeries,
			manualSeries,
			multipleSegments,
			onForm,
			pKey,
			refreshChart,
			refreshChartDep,
			refreshGridChart,
			refreshGridChartDep,
			resetStack,
			segIdx,
			setBKey,
			setMultipleSegments,
			setOnForm,
			setPKey,
			setSegIdx,
			undo,
		}),
		[
			addToStack,
			bKey,
			canUndo,
			getManualSeries,
			manualGridSeries,
			manualSeries,
			multipleSegments,
			onForm,
			pKey,
			refreshChart,
			refreshChartDep,
			refreshGridChart,
			refreshGridChartDep,
			resetStack,
			segIdx,
			undo,
		]
	);

	useEffect(() => {
		setSegIdx((curSegIdx) => {
			if (curSegIdx <= multipleSegments.segmentObjects.length - 1) {
				return curSegIdx;
			}
			return 0;
		});
	}, [pKey, multipleSegments]);

	return <ManualEditingContext.Provider value={contextObj}>{children}</ManualEditingContext.Provider>;
};

export default ManualEditingProvider;
export { ManualEditingContext };
