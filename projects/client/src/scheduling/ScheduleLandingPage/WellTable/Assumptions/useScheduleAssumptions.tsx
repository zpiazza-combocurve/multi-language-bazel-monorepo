import { uniq } from 'lodash';
import { useMemo, useRef } from 'react';

import { AgGridSSRMRef } from '@/components/AgGrid.ssrm';
import { getItem } from '@/components/ContextMenu';
import { useCallbackRef } from '@/components/hooks';
import { Selection } from '@/components/hooks/useSelection';
import { AssumptionKey } from '@/inpt-shared/constants';
import { AssumptionCellEditor } from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/CellEditors/AssumptionCellEditor';
import { AssumptionCellRenderer } from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/CellRenderers/AssumptionCellRenderer';
import { AssumptionHeaderComponent } from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/HeaderComponents/AssumptionHeaderComponent';
import { AssumptionValueFormatter } from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/ValueFormatters/AssumptionValueFormatter';
import { getAssumptionLabel } from '@/scenarios/shared';

import { useGridItemDialog } from './Dialog';

type Props = {
	agGridRef: React.RefObject<AgGridSSRMRef>;
	projectId: Inpt.ObjectId<'project'>;
	scheduleId: Inpt.ObjectId<'schedule'>;
	assignmentIds: string[];
	selection: Selection;
	assumptions: string[];
	canUpdateSchedule: boolean;
	lookupTables: Inpt.LookupTable[];
	tcLookupTables: Inpt.LookupTable[];
};

const NULLABLE_VALUES = ['', undefined, null];

export const useScheduleAssumptions = ({
	agGridRef,
	projectId,
	scheduleId,
	selection,
	assignmentIds,
	assumptions,
	canUpdateSchedule,
	lookupTables,
	tcLookupTables,
}: Props) => {
	const assumptionsColumns = useMemo(() => {
		return {
			headerName: 'Assumptions',
			children: assumptions.map((key) => {
				return {
					headerName: getAssumptionLabel(key),
					field: key,
					filter: null,
					valueFormatter: AssumptionValueFormatter,
					cellRenderer: AssumptionCellRenderer,
					valueSetter: (params) => {
						const { data, colDef, newValue } = params;

						if (NULLABLE_VALUES.includes(newValue)) return false;

						data[colDef.field] = newValue;
						return true;
					},
					editable: canUpdateSchedule,
					cellEditor: AssumptionCellEditor,
					headerComponent: AssumptionHeaderComponent,
					sortable: false,
				};
			}),
		};
	}, [assumptions, canUpdateSchedule]);

	const selectedWellIds = useMemo(
		() => uniq(assignmentIds.filter((assignmentsId) => assignmentsId && selection.selectedSet.has(assignmentsId))),
		[assignmentIds, selection.selectedSet]
	);

	const {
		chooseLookupTable,
		chooseModel,
		choosePSeriesDialog,
		chooseTCLookupTable,
		gridItemDialog,
		removeAssignment,
		simpleSelectDialog,
		updateModel,
	} = useGridItemDialog({
		projectId,
		scheduleId,
		selectedWellIds,
		lookupTables,
		tcLookupTables,
		updateAssignments: (...args) => agGridRef.current?.updateRows?.(...args),
		reloadAssignments: (...args) => agGridRef.current?.invalidateRows?.(...args),
		tabs: [
			{ key: AssumptionKey.ownershipReversion, canUse: true },
			{ key: AssumptionKey.capex, canUse: true },
			{ key: AssumptionKey.pricing, canUse: true },
			{ key: AssumptionKey.differentials, canUse: true },
			{ key: AssumptionKey.streamProperties, canUse: true },
			{ key: AssumptionKey.expenses, canUse: true },
			{ key: AssumptionKey.productionTaxes, canUse: true },
			{ key: AssumptionKey.risking, canUse: true },
		],
	});

	const getAssumptionMenuItems = useCallbackRef((assumptionKey) => {
		return [
			getItem(
				`Choose ${getAssumptionLabel(assumptionKey)}`,
				() => chooseModel({ assumptionKey }),
				!canUpdateSchedule
			),
			assumptionKey !== AssumptionKey.carbonNetwork && // disabled for network and emission column until support is added
				assumptionKey !== AssumptionKey.emission &&
				getItem(`Choose Lookup Table`, () => chooseLookupTable({ assumptionKey }), !canUpdateSchedule),
			assumptionKey === AssumptionKey.forecast &&
				getItem(`Choose TC Lookup Table`, () => chooseTCLookupTable({ assumptionKey }), !canUpdateSchedule),
			getItem('Remove Assignments', () => removeAssignment({ assumptionKey }), !canUpdateSchedule),
		].filter(Boolean);
	});

	const getQualifiersMenuItems = () => [];

	const scrollCallbacksRef = useRef<Record<string, () => void>>({});

	const assumptionsDialogs = (
		<>
			{gridItemDialog}
			{choosePSeriesDialog}
			{simpleSelectDialog}
		</>
	);

	return {
		assumptionsDialogs,
		assumptionsColumns,
		getAssumptionMenuItems,
		getQualifiersMenuItems,
		chooseLookupTable,
		chooseModel,
		choosePSeriesDialog,
		chooseTCLookupTable,
		removeAssignment,
		updateModel,
		scrollCallbacksRef,
		// TODO: provide correct value when available
		columnsContextValue: {
			capex: {
				activeQualifier: 'default',
				qualifiers: {
					default: {
						name: 'Default',
						createdAt: '2022-08-01T20:52:16.161Z',
					},
				},
			},
			expenses: {
				activeQualifier: 'default',
				qualifiers: {
					default: {
						name: 'Default',
						createdAt: '2022-08-01T20:52:16.162Z',
					},
				},
			},
			forecast: {
				activeQualifier: 'default',
				qualifiers: {
					default: {
						name: 'Default',
						createdAt: '2022-08-01T20:52:16.162Z',
					},
				},
			},
			forecast_p_series: {
				activeQualifier: 'default',
				qualifiers: {
					default: {
						name: 'Default',
						createdAt: '2022-08-01T20:52:16.162Z',
					},
				},
			},
			ownership_reversion: {
				activeQualifier: 'default',
				qualifiers: {
					default: {
						name: 'Default',
						createdAt: '2022-08-01T20:52:16.162Z',
					},
				},
			},
			pricing: {
				activeQualifier: 'default',
				qualifiers: {
					default: {
						name: 'Default',
						createdAt: '2022-08-01T20:52:16.162Z',
					},
				},
			},
			differentials: {
				activeQualifier: 'default',
				qualifiers: {
					default: {
						name: 'Default',
						createdAt: '2022-08-01T20:52:16.162Z',
					},
				},
			},
			production_taxes: {
				activeQualifier: 'default',
				qualifiers: {
					default: {
						name: 'Default',
						createdAt: '2022-08-01T20:52:16.162Z',
					},
				},
			},
			risking: {
				activeQualifier: 'default',
				qualifiers: {
					default: {
						name: 'Default',
						createdAt: '2022-08-01T20:52:16.162Z',
					},
				},
			},
			stream_properties: {
				activeQualifier: 'default',
				qualifiers: {
					default: {
						name: 'Default',
						createdAt: '2022-08-01T20:52:16.162Z',
					},
				},
			},
			network: {
				activeQualifier: 'default',
				qualifiers: {
					default: {
						name: 'Default',
						createdAt: '2022-08-26T21:26:19.761Z',
					},
				},
			},
		},
	};
};
