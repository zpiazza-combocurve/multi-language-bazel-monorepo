import { useTheme } from '@material-ui/core';
import { ColDef, ColGroupDef, ColumnRowGroupChangedEvent } from 'ag-grid-community';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from 'react-query';

import { Placeholder } from '@/components';
import AgGrid, { AgGridRef } from '@/components/AgGrid';
import { useAgGridCache } from '@/components/hooks';
import {
	BASIC_OUTPUT_ONELINER_HEADERS,
	ECON_RUN_OUTPUT_ONELINER_TABLE_COLUMN_ORDER,
	ECON_RUN_OUTPUT_ONELINER_TABLE_GROUP_CACHE,
	NUMBER_TYPE_TO_USE,
	RESERVES_CATEGORY,
	autoGroupColumnDef,
	commonColDefFields,
	getOutputFieldAggregationFunction,
	groupingHeadersNames,
	outputAgGridSidebar,
} from '@/economics/shared/shared';
import { postApi } from '@/helpers/routing';
import { hexToRgba, labelWithUnit } from '@/helpers/text';
import { MAX_SCENARIO_WELL_ASSIGNMENTS_IN_ECON_RUN_TO_ALLOW_ONELINER_GROUPING } from '@/inpt-shared/constants';
import { fields as econOutputColumns } from '@/inpt-shared/display-templates/general/economics_columns.json';
import { useCurrentScenarioId, useEconGroups } from '@/scenarios/api';

import { useEconomicsApi } from '../Economics/shared/api';

const CACHE_BLOCK_SIZE = 150;

const getGroupingColDefs = (headersArr: string[], enableGrouping: boolean) =>
	headersArr
		.filter((header) => header !== 'econ_group')
		.map((header) => ({
			field: header,
			headerName: groupingHeadersNames[header],
			enableRowGroup: enableGrouping,
			hide: true,
			enablePivot: enableGrouping,
			filter: true,
		}));

function useColumns(
	econRun: Inpt.EconRun,
	firstEconRunData: Inpt.ObjectId<'econ-run-data'> | undefined,
	enableGrouping: boolean
) {
	const firstEconDataQuery = useQuery({
		enabled: !!firstEconRunData,
		queryFn: () =>
			postApi(`/economics/getRunSumByIds/${econRun._id}`, { econRunDataIds: [firstEconRunData] }) as Promise<
				Inpt.EconRunData[]
			>,
		queryKey: ['econ-run-first-data', econRun._id],
		select: (result) => result[0],
	});

	return useMemo(() => {
		const headers = BASIC_OUTPUT_ONELINER_HEADERS.map((header) => ({
			...header,
			enableRowGroup: enableGrouping,
			enablePivot: enableGrouping,
		}));

		const isResCatGrouping =
			econRun.outputParams.headersArr?.length === 1 && econRun.outputParams.headersArr[0] === RESERVES_CATEGORY;

		const groupingColDefs = getGroupingColDefs(econRun.outputParams.headersArr, enableGrouping);

		const wellHeadersCategory: ColGroupDef = {
			headerName: 'Well Headers',
			children: [...(!isResCatGrouping ? groupingColDefs : []), ...headers],
		};

		if (!firstEconDataQuery.data) {
			return [wellHeadersCategory] as ColDef[];
		}

		const outputColumns = econRun.outputParams.columns.filter(
			({ key, selected_options }) =>
				!!selected_options.one_liner &&
				!econRun.outputParams.columnFields[key].hide &&
				!!firstEconDataQuery.data.oneLinerData?.[key]
		);

		const columnsByCategory = _.groupBy(
			outputColumns.map(({ key }) => key),
			(key) => econOutputColumns[key].category
		);

		const groupedOutputColumnsDefs: ColGroupDef[] = [];

		Object.entries(columnsByCategory).forEach(([category, categoryColumns]) => {
			const categoryColDefs = categoryColumns.map((key) => {
				const isNumeric = econRun.outputParams.columnFields[key].type === 'number';

				return {
					...commonColDefFields,
					field: key,
					headerName: labelWithUnit(
						firstEconDataQuery.data.oneLinerData[key].name,
						firstEconDataQuery.data.oneLinerData[key].unit
					),
					type: isNumeric ? NUMBER_TYPE_TO_USE : undefined,
					aggFunc: isNumeric && enableGrouping ? getOutputFieldAggregationFunction(key) : undefined,
					enableRowGroup: !isNumeric && enableGrouping,
					enablePivot: !isNumeric && enableGrouping,
					filter: !isNumeric,
					enableValue: isNumeric && enableGrouping,
				} as ColDef;
			});

			groupedOutputColumnsDefs.push({
				headerName: category,
				children: categoryColDefs,
			});
		});

		return [...(isResCatGrouping ? groupingColDefs : []), wellHeadersCategory, ...groupedOutputColumnsDefs] as (
			| ColDef
			| ColGroupDef
		)[];
	}, [firstEconDataQuery.data, econRun, enableGrouping]);
}

const formatRows = (
	lastRun: Inpt.EconRun,
	groupingData: Inpt.EconRunGroupingData,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	unformattedRows: any[],
	econGroupMap
) => {
	// do formatting in the columns instead
	const formattedRows = unformattedRows.map(({ _id, oneLinerData, well, incrementalIndex }) => {
		const oneLiner = {};
		if (oneLinerData) {
			Object.keys(oneLinerData).forEach((key) => {
				oneLiner[oneLinerData[key].key] = _.isNil(oneLinerData[key].value) ? 'N/A' : oneLinerData[key].value;
			});
		}

		return {
			_id,
			well_name: (well.well_name ? well.well_name : 'N/A') + (incrementalIndex ? ` Inc ${incrementalIndex}` : ''),
			well_number: well.well_number ? well.well_number : 'N/A',
			econ_group: well?.econ_group ?? econGroupMap[well._id] ?? 'N/A',
			isGroupCase: !!well.econ_group,
			...lastRun.outputParams.headersArr.reduce((acc, curr) => {
				if (curr === 'econ_group') return acc;
				if (curr) acc[curr] = _.isNil(groupingData[well._id]?.[curr]) ? 'N/A' : groupingData[well._id][curr];
				return acc;
			}, {}),
			...oneLiner,
		};
	});

	return formattedRows;
};

export function EconRunOutputOnelinerTable({
	lastRun,
	econRunDatas,
	groupingData,
}: {
	lastRun: Inpt.EconRun;
	econRunDatas: Inpt.ObjectId<'econ-run-data'>[];
	groupingData: Inpt.EconRunGroupingData;
}) {
	const agGridRef = useRef<AgGridRef>(null);

	const [isReadyToApplyAgGridCache, setIsReadyToApplyAgGridCache] = useState(false);

	const {
		onColumnMoved,
		onColumnRowGroupChanged: _onColumnRowGroupChanged,
		onGridReady,
	} = useAgGridCache(
		ECON_RUN_OUTPUT_ONELINER_TABLE_COLUMN_ORDER,
		ECON_RUN_OUTPUT_ONELINER_TABLE_GROUP_CACHE,
		isReadyToApplyAgGridCache
	);

	const runId = lastRun._id;
	const api = useEconomicsApi();
	const enableGrouping = econRunDatas.length <= MAX_SCENARIO_WELL_ASSIGNMENTS_IN_ECON_RUN_TO_ALLOW_ONELINER_GROUPING;
	const columns = useColumns(lastRun, econRunDatas[0], enableGrouping);

	useEffect(() => {
		if (columns.length > BASIC_OUTPUT_ONELINER_HEADERS.length !== isReadyToApplyAgGridCache) {
			setIsReadyToApplyAgGridCache(true);
		}
	}, [columns.length, isReadyToApplyAgGridCache]);

	const scenarioId = useCurrentScenarioId();
	const { econGroups } = useEconGroups(scenarioId);

	const econGroupMap = useMemo(() => {
		return (
			econGroups?.reduce((acc, group) => {
				group.wells.forEach((wellId) => {
					acc[wellId] = group.name;
				});
				return acc;
			}, {}) ?? {}
		);
	}, [econGroups]);

	const oneLinerReportQuery = useQuery(
		['econ-one-liner-report', runId, econRunDatas[0]],
		() => api.getRunSumByIds(runId, econRunDatas),
		{
			enabled: enableGrouping,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			select: (unformattedRows: any[]) => formatRows(lastRun, groupingData, unformattedRows, econGroupMap),
		}
	);

	const [groupIncludeTotalFooter, setGroupIncludeTotalFooter] = useState(false);
	const onColumnRowGroupChanged = useCallback(
		(event: ColumnRowGroupChangedEvent) => {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			setGroupIncludeTotalFooter(event.columns!.length > 0);
			_onColumnRowGroupChanged(event);
		},
		[_onColumnRowGroupChanged]
	);

	useEffect(() => {
		if (enableGrouping) {
			agGridRef?.current?.api?.refreshClientSideRowModel?.();
		}
	}, [enableGrouping, groupIncludeTotalFooter]);

	const serverSideDatasource = useMemo(
		() => ({
			getRows: async (params) => {
				const { request, success } = params;

				if (!econRunDatas?.length) {
					success({ rowCount: 0, rowData: [] });
					return;
				}

				const rows = await api.getRunSumAgGrid(runId, request, econRunDatas);
				const formatted = formatRows(lastRun, groupingData, rows, econGroupMap);

				success({ rowCount: econRunDatas.length, rowData: formatted });
			},
		}),
		[api, econRunDatas, groupingData, lastRun, runId, econGroupMap]
	);

	const sideBar = useMemo(
		() => outputAgGridSidebar({ suppressRowGroups: !enableGrouping, suppressValues: !enableGrouping }),
		[enableGrouping]
	);

	const theme = useTheme();

	if (oneLinerReportQuery.isLoading) {
		return <Placeholder main loading loadingText='Loading One Liner Report...' />;
	}

	return (
		<AgGrid
			ref={agGridRef}
			getRowNodeId='_id'
			rowModelType={enableGrouping ? undefined : 'serverSide'}
			serverSideStoreType={enableGrouping ? undefined : 'partial'}
			cacheBlockSize={enableGrouping ? undefined : CACHE_BLOCK_SIZE}
			css='height: 100%'
			rowData={oneLinerReportQuery.data}
			columnDefs={columns}
			autoGroupColumnDef={autoGroupColumnDef}
			suppressAggFuncInHeader
			sideBar={sideBar}
			groupIncludeTotalFooter={groupIncludeTotalFooter}
			enableRangeSelection
			rowSelection='multiple'
			groupDisplayType='multipleColumns'
			onColumnRowGroupChanged={onColumnRowGroupChanged}
			serverSideDatasource={enableGrouping ? undefined : serverSideDatasource}
			onGridReady={onGridReady}
			onColumnMoved={onColumnMoved}
			maintainColumnOrder
			getRowStyle={(params) => {
				if (params.data?.isGroupCase) {
					return {
						background: hexToRgba(theme.palette.primary.main, 0.15),
					};
				}
			}}
		/>
	);
}
