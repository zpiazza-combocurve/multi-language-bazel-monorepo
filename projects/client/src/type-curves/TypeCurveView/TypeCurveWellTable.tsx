import { useTheme } from '@material-ui/core';
import { AgGridColumn } from 'ag-grid-react';
import produce from 'immer';
import _ from 'lodash';
import { Ref, forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { useMutation } from 'react-query';

import AgGrid, {
	AgGridRef,
	CHECKBOX_COLUMN_DEF,
	NUMBER_CELL_CLASS_NAME,
	defaultValueFormatter,
	useAgGridSelection,
} from '@/components/AgGrid';
import { useSetLocalStorage } from '@/components/hooks';
import { useChooseItems } from '@/components/hooks/useChooseItems';
import { getWellHeaderTypes, useCustomFields } from '@/helpers/headers';
import { labelWithUnit } from '@/helpers/text';
import { getConvertFunc } from '@/helpers/units';
import { exportXLSX, tableToSheet } from '@/helpers/xlsx';
import { PROXIMITY_TARGET_WELL_COLOR } from '@/helpers/zing';
import { fields as dailyUnitsTemplate } from '@/inpt-shared/display-templates/units/daily-units.json';
import { fields as defaultUnitsTemplate } from '@/inpt-shared/display-templates/units/default-units.json';
import { fields as WELL_HEADER_TYPES } from '@/inpt-shared/display-templates/wells/well_header_types.json';
import { TYPE_CURVES_WELL_INFO } from '@/type-curves/shared/data';

import { useTypeCurveWellHeaders } from '../api';
import { useHeaders } from '../shared/useHeaders';
import { useTypeCurveInfo } from '../shared/useTypeCurveInfo';
import { getWellTypeCurveInfo, getWellTypeCurveStatusInfo } from '../shared/utils';

const initialPhaseHeaders = (p: string) => [
	`${p}_data_freq`,
	`${p}_forecast_type`,
	`${p}_has_forecast`,
	`${p}_has_data`,
	`${p}_valid`,
	`${p}_invalid`,
	`${p}_rep`,
	`${p}_excluded`,
];
const initialEurHeaders = (p: string) => [`${p}_eur`, `${p}_eur/pll`];

const IMPORTANT_HEADERS = ['well_name'];
// const IMPORTANT_HEADERS = ['well_name', 'well_number', 'api14'];

const INITIAL_HEADERS = [
	...initialPhaseHeaders('oil'),
	...initialPhaseHeaders('gas'),
	...initialPhaseHeaders('water'),
	...initialEurHeaders('oil'),
	...initialEurHeaders('gas'),
	...initialEurHeaders('water'),
];

const TC_REP_KEY = 'type-curve-rep-table';
const PHASE_EUR_KEYS = ['oil_eur', 'gas_eur', 'water_eur'];
export const TC_EXCLUDE_HEADERS = ['eur', 'eur/pll', 'oil_eur_pll', 'gas_eur_pll', 'water_eur_pll'];

/**
 * @example
 * 	const labels = { oil: 'Oil' };
 * 	const getLabel = getter(labels);
 * 	getLabel('oil'); // 'Oil'
 *
 * 	const types = { oil: { type: 'string' } };
 * 	getter(types)('oil'); // { type: 'string' }
 * 	getter(types, ({ type }) => type)('oil'); // string
 */
const getter =
	(
		col,
		it: // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		any = _.identity
	) =>
	(key) =>
		it(col[key]);

/** @returns Table headers information: labels, units, types */
function useTypeCurveHeaders() {
	const { headers: allLabels, units: originalUnits } = useHeaders({ abbreviated: false });
	const labels = useMemo(
		() =>
			_.reduce(
				allLabels,
				(acc, value, key) => {
					if (!TC_EXCLUDE_HEADERS.includes(key)) {
						acc[key] = value;
					}
					return acc;
				},
				{}
			),
		[allLabels]
	);

	const units = produce(originalUnits, (draft) => {
		PHASE_EUR_KEYS.forEach((key) => {
			const displayUnit = defaultUnitsTemplate[key];
			draft[key] = displayUnit;
		});
	});

	const types = useMemo(
		() => ({
			...getWellHeaderTypes(),
			...TYPE_CURVES_WELL_INFO,
		}),
		[]
	);

	const getLabel = useMemo(() => getter(labels), [labels]);
	const getUnit = useMemo(() => getter(units), [units]);
	const getType = useMemo(() => getter(types, ({ type = undefined } = {}) => type), [types]);

	return { labels, types, units, getLabel, getUnit, getType };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const PROXIMTY_EMPTY_OBJ: { targetWellHeaderAndEur?: any; repInitWellsMap: Map<string, any> } = {
	repInitWellsMap: new Map([]),
};

function TypeCurveWellTable(
	{
		expanded = true,
		isProximity,
		onToggleExpanded: toggleExpanded = _.noop,
		proximityProps = PROXIMTY_EMPTY_OBJ,
		selection,
		typeCurveId: id,
		wellIds: passedWellIds,
	}: {
		expanded?: boolean;
		isProximity?: boolean;
		onToggleExpanded?: () => void;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		proximityProps?: any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		selection?: any;
		typeCurveId: string;
		wellIds?: Array<string>;
	},
	ref: Ref<{
		selectHeaders(): void;
		downloadTable(): void;
	}>
) {
	const theme = useTheme();
	const { labels, getLabel, getUnit, getType } = useTypeCurveHeaders();

	// These are only needed for proximity support
	const { phaseWellsInfo, wellsInfoMap, wellIds } = useTypeCurveInfo(id, isProximity, proximityProps);

	const headersQueryResult = useTypeCurveWellHeaders(id, !isProximity);
	const proximityWellHeaders = useMemo(() => {
		if (isProximity) {
			return new Map(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				(Array.from(proximityProps?.repInitWellsMap.entries()) as Array<[string, Record<string, any>]>).map(
					(x) => {
						return [x[0], x[1].header];
					}
				)
			);
		}
		return new Map();
	}, [isProximity, proximityProps?.repInitWellsMap]);

	const { data: companyCustomStreams } = useCustomFields('wells');

	const companyCustomStreamsKeys = useMemo(() => Object.keys(companyCustomStreams ?? {}), [companyCustomStreams]);

	const onlyWellHeadersKeys = useMemo(
		() => Object.keys(labels).filter((key) => !companyCustomStreamsKeys.includes(key)),
		[labels, companyCustomStreamsKeys]
	);

	const items = useMemo(
		() => Object.keys(labels).map((key) => ({ key, label: labelWithUnit(getLabel(key), getUnit(key)) })),
		[labels, getLabel, getUnit]
	);

	const { selectedKeys: selectedHeaders, selectItems: selectHeaders } = useChooseItems({
		title: 'Well Headers',
		defaultKeys: INITIAL_HEADERS,
		alwaysVisibleItemKeys: IMPORTANT_HEADERS,
		storageKey: 'TYPE_CURVE_TABLE',
		items,
		sections: [
			{ key: 'Headers', label: 'Headers', itemKeys: onlyWellHeadersKeys },
			{ key: 'Company Custom Headers', label: 'Company Custom Headers', itemKeys: companyCustomStreamsKeys },
		],
	});

	const handleSelectHeaders = () => {
		selectHeaders();
		if (!expanded) {
			toggleExpanded();
		}
	};

	const headers = useMemo(
		() => (expanded ? _.uniq([...IMPORTANT_HEADERS, ...selectedHeaders]) : IMPORTANT_HEADERS),
		[expanded, selectedHeaders]
	);

	useSetLocalStorage(TC_REP_KEY, selectedHeaders);

	const filteredWells = passedWellIds;
	const includedWells: Array<string> = useMemo(
		() => (isProximity ? filteredWells ?? [] : wellIds),
		[filteredWells, isProximity, wellIds]
	);

	const rows = useMemo(
		() =>
			includedWells.map((wellId) => {
				const info = wellsInfoMap?.get(wellId);
				const ret = {
					...getWellTypeCurveInfo({ info }),
					...getWellTypeCurveStatusInfo({ phaseWellsInfo, wellId }),
					...headersQueryResult.data?.get(wellId),
					...info?.header,
					...proximityWellHeaders?.get(wellId),
					_id: wellId,
				};

				PHASE_EUR_KEYS.forEach((key) => {
					const dbUnit = dailyUnitsTemplate[key];
					const displayUnit = defaultUnitsTemplate[key];
					const convertFunc = getConvertFunc(dbUnit, displayUnit);
					ret[key] = convertFunc(ret[key]);
				});

				return ret;
			}),
		[includedWells, wellsInfoMap, phaseWellsInfo, headersQueryResult.data, proximityWellHeaders]
	);

	const targetWellRow = useMemo(() => {
		if (proximityProps?.targetWellHeaderAndEur) {
			const ret = {
				isTargetWell: true,
				...getWellTypeCurveInfo({ info: proximityProps?.targetWellHeaderAndEur }),
				...(proximityProps?.targetWellHeaderAndEur?.header ?? {}),
				_id: proximityProps?.targetWellHeaderAndEur?.header?._id,
			};

			PHASE_EUR_KEYS.forEach((key) => {
				const dbUnit = dailyUnitsTemplate[key];
				const displayUnit = defaultUnitsTemplate[key];
				const convertFunc = getConvertFunc(dbUnit, displayUnit);
				ret[key] = convertFunc(ret[key]);
			});
			return ret;
		}
		return {};
	}, [proximityProps?.targetWellHeaderAndEur]);

	const renderRows = useMemo(
		() => (isProximity ? [targetWellRow, ...rows] : rows),
		[isProximity, targetWellRow, rows]
	);

	const getColumn = useCallback(
		(key) => ({
			key,
			name: labelWithUnit(getLabel(key), getUnit(key)),
			type: getType(key),
		}),
		[getLabel, getType, getUnit]
	);

	const columns = useMemo(
		() =>
			_.sortBy(headers.map(getColumn), [
				({ key }) => {
					const indexOf = IMPORTANT_HEADERS.indexOf(key);
					if (indexOf !== -1) {
						return indexOf;
					}
					return IMPORTANT_HEADERS.length;
				},
				({ key, type }) => {
					if (['number', 'integer'].includes(type)) {
						if (TYPE_CURVES_WELL_INFO[key]) {
							return 1;
						}
						if (WELL_HEADER_TYPES[key]) {
							return 2;
						}
					}
					return 3;
				},
				'name',
			]),
		[getColumn, headers]
	);

	const downloadTableMutation = useMutation(async () => {
		const downloadHeaders = selectedHeaders.reduce(
			(acc, key) => {
				if (!acc.includes(key)) {
					acc.push(key);
				}
				return acc;
			},
			[...IMPORTANT_HEADERS]
		);

		exportXLSX({
			sheets: [
				tableToSheet({
					rows,
					columns: downloadHeaders.map(getColumn),
					name: 'Wells',
				}),
			],
			fileName: `well-type-curve-rep.xlsx`,
		});
	});

	const getRowStyle = useMemo(() => {
		// this function runs for a lot of wells
		if (isProximity) {
			return (params: {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				data: { isTargetWell: any; oil_valid: boolean; gas_valid: boolean; water_valid: boolean };
			}) => {
				if (params.data.isTargetWell) {
					return { color: PROXIMITY_TARGET_WELL_COLOR };
				}
				const { oil_valid, gas_valid, water_valid } = params.data;
				if (oil_valid || gas_valid || water_valid) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					return {} as any;
				}
				return { color: theme.palette.warning[theme.palette.type] };
			};
		}
		return (params) => {
			const { oil_valid, gas_valid, water_valid } = params.data;
			if (oil_valid || gas_valid || water_valid) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				return {} as any;
			}
			return { color: theme.palette.warning[theme.palette.type] };
		};
	}, [isProximity, theme.palette.type, theme.palette.warning]);

	useImperativeHandle(ref, () => ({
		selectHeaders: handleSelectHeaders,
		// Why isn't this using mutateAsync?
		downloadTable: downloadTableMutation.mutate,
	}));

	const agGridRef = useRef<AgGridRef>(null);
	useAgGridSelection(agGridRef, selection); // TODO improve selection hook, this is the one used for the wells page but can be improved for the other tables

	return (
		<AgGrid
			ref={agGridRef}
			css='width: 100%; height: 100%;'
			suppressReactUi
			columnTypes={{
				string: {
					filter: 'agTextColumnFilter',
					filterParams: { filterOptions: ['contains'] },
					floatingFilter: true,
				},
				number: { cellClass: NUMBER_CELL_CLASS_NAME },
				boolean: {
					filter: 'agBooleanColumnFilter',
				},
			}}
			defaultColDef={{
				lockVisible: true,
				menuTabs: ['generalMenuTab'],
				resizable: true,
				sortable: true,
				valueFormatter: defaultValueFormatter,
				headerCheckboxSelectionFilteredOnly: true,
			}}
			getRowNodeId='_id'
			rowData={renderRows}
			rowSelection='multiple'
			suppressRowClickSelection
			suppressCsvExport
			suppressExcelExport
			isRowSelectable={(rowNode) => {
				const { oil_valid, gas_valid, water_valid, isTargetWell } = rowNode.data;
				return (oil_valid || gas_valid || water_valid) && !isTargetWell;
			}}
			getRowStyle={getRowStyle}
			// https://github.com/ag-grid/ag-grid/issues/1692#issuecomment-501113777
			// sizeColumnsToFit will cause some styling issue in https://combocurve.atlassian.net/browse/CC-11249
			// onGridReady={(params) => {
			// 	params.api.sizeColumnsToFit();
			// }}
			onFirstDataRendered={(params) => {
				params.columnApi.autoSizeColumns(params.columnApi.getAllColumns()?.map((i) => i.getColId()) ?? []);
			}}
		>
			<AgGridColumn {...CHECKBOX_COLUMN_DEF} pinned='left' />
			{columns.map(({ name, key, type }) => (
				<AgGridColumn key={key} field={key} headerName={name} type={type} />
			))}
		</AgGrid>
	);
}

export default forwardRef(TypeCurveWellTable);
