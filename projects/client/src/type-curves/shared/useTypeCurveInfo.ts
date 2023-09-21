import _ from 'lodash';
import { useMemo } from 'react';

import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { phases } from '@/helpers/zing';
import { useTcWellAssignments, useTypeCurveWellsData } from '@/type-curves/api';

export interface PhaseWellInfo {
	count: { total: number; rep: number; invalid: number; excluded: number };
	repAndExcludedWells: Array<string>;
	excludedWells: Array<string>;
	invalidWells: Array<string>;
	repWells: Array<string>;
}

export interface TcInfoReturn {
	loading: boolean;
	phaseWellsInfo: Record<Phase, PhaseWellInfo>;
	success: boolean;
	wellIds: Array<string>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	wellsInfoMap: Record<string, any> | undefined;
}

const DEFAULT_PHASE_WELLS_INFO: Record<Phase, PhaseWellInfo> = {
	oil: {
		count: { total: 0, rep: 0, invalid: 0, excluded: 0 },
		repAndExcludedWells: [] as string[],
		invalidWells: [] as string[],
		repWells: [] as string[],
		excludedWells: [] as string[],
	},
	gas: {
		count: { total: 0, rep: 0, invalid: 0, excluded: 0 },
		repAndExcludedWells: [] as string[],
		invalidWells: [] as string[],
		repWells: [] as string[],
		excludedWells: [] as string[],
	},
	water: {
		count: { total: 0, rep: 0, invalid: 0, excluded: 0 },
		repAndExcludedWells: [] as string[],
		invalidWells: [] as string[],
		repWells: [] as string[],
		excludedWells: [] as string[],
	},
};

const getPhaseWellInfo = ({
	assignments,
	phase,
	wellsInfoMap,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	assignments: Record<string, any> | undefined;
	phase: Phase;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	wellsInfoMap: Record<string, any>;
}): PhaseWellInfo => {
	const total = wellsInfoMap.size;

	const repAndExcludedWells = [] as string[];
	const repWells = [] as string[];
	const invalidWells = [] as string[];
	const excludedWells = [] as string[];

	wellsInfoMap.forEach((wellInfo) => {
		const {
			valid: { [phase]: valid },
			well_id: wellId,
		} = wellInfo;

		const assignment = assignments?.[wellId]?.[phase];

		if (!valid) {
			invalidWells.push(wellId);
			return;
		}

		if (!assignment) {
			excludedWells.push(wellId);
		} else if (valid) {
			repWells.push(wellId);
		}

		repAndExcludedWells.push(wellId);
	});

	return {
		count: { total, rep: repWells.length, invalid: invalidWells.length, excluded: excludedWells.length },
		excludedWells,
		invalidWells,
		repAndExcludedWells,
		repWells,
	};
};

export function useTypeCurveInfo(
	typeCurveId,
	isProximity = false,
	proximityProps = { repInitWellsMap: new Map([]) }
): TcInfoReturn {
	const repInitWellsMap = proximityProps?.repInitWellsMap;

	const infoMapQueryResult = useTypeCurveWellsData(typeCurveId, !isProximity);
	const { query: assignmentQueryResult } = useTcWellAssignments(typeCurveId);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const assignments: Record<string, any> | undefined = assignmentQueryResult.data;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const wellsInfoMap: Record<string, any> | undefined = isProximity ? repInitWellsMap : infoMapQueryResult.data;

	const success = useMemo(
		() => infoMapQueryResult.isSuccess && assignmentQueryResult.isSuccess,
		[assignmentQueryResult.isSuccess, infoMapQueryResult.isSuccess]
	);

	const phaseWellsInfo: Record<Phase, PhaseWellInfo> = useMemo(() => {
		if (!success || !wellsInfoMap) {
			return _.cloneDeep(DEFAULT_PHASE_WELLS_INFO);
		}

		return _.reduce(
			phases,
			(acc, { value: phase }) => {
				acc[phase] = getPhaseWellInfo({ assignments, wellsInfoMap, phase });
				return acc;
			},
			_.cloneDeep(DEFAULT_PHASE_WELLS_INFO) as Record<Phase, PhaseWellInfo>
		);
	}, [assignments, success, wellsInfoMap]);

	const wellIds: Array<string> = useMemo(() => (wellsInfoMap ? Array.from(wellsInfoMap.keys()) : []), [wellsInfoMap]);

	return {
		loading: infoMapQueryResult.isLoading || assignmentQueryResult.isLoading,
		phaseWellsInfo,
		success,
		wellIds,
		wellsInfoMap,
	};
}
