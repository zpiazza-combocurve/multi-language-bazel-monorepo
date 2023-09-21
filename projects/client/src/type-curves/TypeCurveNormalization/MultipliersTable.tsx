import { AgGridColumn } from 'ag-grid-react';
import produce from 'immer';
import _ from 'lodash';
import { Ref, forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useMutation } from 'react-query';

import AgGrid, {
	CHECKBOX_COLUMN_DEF,
	DISABLED_CELL_CLASS_NAME,
	Editors,
	NUMBER_CELL_CLASS_NAME,
	defaultValueFormatter,
	getCountColumnDef,
	useAgGridSelection,
} from '@/components/AgGrid';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { warningAlert, withLoadingBar } from '@/helpers/alerts';
import { useDebounce } from '@/helpers/debounce';
import { postApi } from '@/helpers/routing';
import { labelWithUnit } from '@/helpers/text';
import { formatNumber } from '@/helpers/utilities';
import { exportXLSX, tableToSheet } from '@/helpers/xlsx';
import { fields as HEADERS_TYPE } from '@/inpt-shared/display-templates/wells/well_header_types.json';

import { useTypeCurveWellHeaders, useTypeCurveWellsData } from '../api';
import { getHeaders } from '../shared/useHeaders';
import { getPhaseInfo } from '../shared/utils';

const MULTIPLIERS_CALC_DEBOUNCE_TIME = 5000;
export const use2FactorMultipliersChange = ({
	setWellsNormalizationData,
	typeCurveId,
	wellsData,
	wellsNormalizationData,
}) => {
	const [recalculatingMultipliers, setRecalculatingMultipliers] = useState(false);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const twoFactorNormReference = useRef<any>(null);
	const multipliersChangedIndexes = useRef<number[] | null>(null);
	const { mutateAsync: recalculateMultipliers, isLoading: _recalculatingMultipliers } = useMutation(
		async ({ phase }: { phase: Phase }) => {
			if (multipliersChangedIndexes.current?.length) {
				const repWells = wellsNormalizationData[phase].map(({ well }) => well);
				const twoFactorBody = {
					[phase]: {
						q_peak_values: _.map(repWells, (wellId) => wellsData?.get(wellId)?.['peak_rate'][phase]),
						eur_values: _.map(repWells, (wellId) => wellsData?.get(wellId)?.['eur'][phase]),
						q_peak_multipliers: wellsNormalizationData[phase].map(({ multipliers }) => multipliers.qPeak),
						eur_multipliers: wellsNormalizationData[phase].map(({ multipliers }) => multipliers.eur),
						well_ids: repWells,
						resolved_resolution: _.map(
							repWells,
							(wellId) => wellsData?.get(wellId)?.['resolved_resolution'][phase]
						),
					},
				};
				twoFactorBody[phase] = _.mapValues(twoFactorBody[phase], (valueArray) =>
					valueArray.filter((_, index) => multipliersChangedIndexes.current?.includes(index))
				);

				const twoFactorOutput = await withLoadingBar(
					postApi(`/type-curve/${typeCurveId}/normalization/normalize-two-factor`, twoFactorBody)
				);

				setWellsNormalizationData(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					produce((draft: any) => {
						const { nominalQPeak, nominalEur, validMask } = twoFactorOutput[phase];

						multipliersChangedIndexes.current?.forEach((multiplierIndex, index) => {
							if (validMask[index]) {
								draft[phase][multiplierIndex].nominalMultipliers.qPeak = nominalQPeak[index];
								draft[phase][multiplierIndex].nominalMultipliers.eur = nominalEur[index];
							} else {
								draft[phase][multiplierIndex].multipliers =
									twoFactorNormReference.current?.[phase][multiplierIndex].multipliers;
							}
						});
					})
				);
				if (!_.every(twoFactorOutput[phase].validMask, Boolean)) {
					warningAlert('Invalid multipliers, resetting values.');
				}
			}

			setRecalculatingMultipliers(false);
			twoFactorNormReference.current = null;
			multipliersChangedIndexes.current = null;
		}
	);
	const debounceRecalculateMultipliers = useDebounce(
		(phase) => recalculateMultipliers({ phase }),
		MULTIPLIERS_CALC_DEBOUNCE_TIME
	);

	const handleNormalizationMultipliersChange = useCallback(
		(multiplierChangeArgs) => {
			const { key, normType, phase, value } = multiplierChangeArgs;

			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			const idx = _.findIndex(wellsNormalizationData[phase], (item: any) => item.well === key);
			const qPeakMultiplier = wellsNormalizationData[phase][idx].multipliers?.qPeak;
			const isTwoFactorActiveInChange = qPeakMultiplier !== null;

			if (!isTwoFactorActiveInChange && normType === 'eur') {
				setWellsNormalizationData(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					produce((draft: any) => {
						draft[phase][idx].multipliers[normType] = value;
						draft[phase][idx].nominalMultipliers[normType] = value;
					})
				);
			} else {
				if (!twoFactorNormReference.current) {
					twoFactorNormReference.current = _.cloneDeep(wellsNormalizationData);
				}
				if (!multipliersChangedIndexes.current) multipliersChangedIndexes.current = [];
				if (!multipliersChangedIndexes.current.includes(idx)) multipliersChangedIndexes.current.push(idx);

				setWellsNormalizationData(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					produce((draft: any) => {
						draft[phase][idx].multipliers[normType] = value;
					})
				);
				setRecalculatingMultipliers(true);
				debounceRecalculateMultipliers(phase);
			}
		},
		[debounceRecalculateMultipliers, setWellsNormalizationData, wellsNormalizationData]
	);

	return {
		handleNormalizationMultipliersChange,
		recalculatingMultipliers: recalculatingMultipliers || _recalculatingMultipliers,
	};
};

const getEurHeaders = (phase: string) => [`${phase}_eur`, `${phase}_eur/pll`];
const getPeakRateHeaders = (phase: string) => [`${phase}_peak_rate`];

const SHARED_COLUMNS = [
	{ key: 'well_name', name: 'Well Name' },
	{ key: 'well_number', name: 'Well Number' },
	{ key: 'api14', name: 'API14' },
	{
		key: 'qPeakMultiplier',
		name: 'Peak Rate Multiplier',
		type: 'number',
		initialPinned: 'right',
		valueFormatter: (params) => formatNumber(params.value, 3),
		editable: (params) => params.colDef.field === 'qPeakMultiplier' && params.node.data.qPeakMultiplier != null,
	},
	{
		key: 'eurMultiplier',
		name: 'EUR Multiplier',
		type: 'number',
		initialPinned: 'right',
		valueFormatter: (params) => formatNumber(params.value, 3),
		editable: (params) => params.colDef.field === 'eurMultiplier' && params.node.data.eurMultiplier != null,
	},
];

const getType = (key: string) => {
	const headerType = HEADERS_TYPE[key]?.type;
	if (headerType === 'string' || headerType === 'multi-select') {
		return 'string';
	}
	return undefined;
};

interface NormalizationMultipliersTableProps {
	eurMultipliers: Record<string, { eur?: number; q_peak?: number }>;
	qPeakMultipliers: Record<string, { eur?: number; q_peak?: number }>;
	onChangeMultiplier: (key: string, value: number, normType: string) => void;
	phase: string;
	selection: import('@/components/hooks/useSelection').Selection;
	showActions?: boolean;
	showCount?: boolean;
	typeCurveId: string;
	wellIds: string[];
}

export const NormalizationMultipliersTableRender = forwardRef(
	(
		{
			eurMultipliers,
			qPeakMultipliers,
			onChangeMultiplier,
			phase,
			selection,
			typeCurveId,
			wellIds,
		}: NormalizationMultipliersTableProps,
		ref: Ref<{ handleDownload(): void }>
	) => {
		const headersQueryResult = useTypeCurveWellHeaders(typeCurveId);
		const wellsDataQuery = useTypeCurveWellsData(typeCurveId);

		const columns = useMemo(() => {
			const { headers, units, types } = getHeaders();
			return [
				...SHARED_COLUMNS,
				...[
					...getEurHeaders(phase),
					...getPeakRateHeaders(phase),
					'total_proppant_per_perforated_interval',
					'total_fluid_per_perforated_interval',
					'perf_lateral_length',
					'true_vertical_depth',
					'state',
					'county',
					'landing_zone',
				].map((key) => ({ key, name: labelWithUnit(headers[key], units[key]), type: types[key]?.type })),
			];
		}, [phase]);

		const rows = useMemo(
			() =>
				wellIds.map((wellId) => ({
					eurMultiplier: eurMultipliers?.[wellId],
					qPeakMultiplier: qPeakMultipliers?.[wellId],
					...headersQueryResult.data?.get(wellId),
					...getPhaseInfo({ phase, info: wellsDataQuery.data?.get(wellId) }),
				})),
			[wellIds, eurMultipliers, qPeakMultipliers, headersQueryResult.data, phase, wellsDataQuery.data]
		);

		const handleDownload = () => {
			exportXLSX({ fileName: 'Normalization Table.xlsx', sheets: [tableToSheet({ columns, rows })] });
		};

		useImperativeHandle(ref, () => ({ handleDownload }));

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const agGridRef = useRef<any>();
		useAgGridSelection(agGridRef, selection);

		return (
			<AgGrid
				ref={agGridRef}
				css='width: 100%; height: 100%;'
				suppressReactUi
				rowData={rows}
				getRowNodeId='_id'
				rowSelection='multiple'
				enableRangeSelection
				suppressRowClickSelection
				suppressScrollOnNewData
				immutableData
				defaultColDef={{
					valueFormatter: defaultValueFormatter,
					sortable: true,
					menuTabs: ['generalMenuTab'],
					cellClassRules: {
						[NUMBER_CELL_CLASS_NAME]: (params) => params.colDef.type === 'number',
						[DISABLED_CELL_CLASS_NAME]: (params) => params.colDef.field !== 'multiplier',
					},
					headerCheckboxSelectionFilteredOnly: true,
				}}
				columnTypes={{
					string: {
						floatingFilter: true,
						filterParams: { filterOptions: ['contains'] },
						filter: 'agTextColumnFilter',
					},
					number: { cellEditor: Editors.NumberEditor },
				}}
				// https://github.com/ag-grid/ag-grid/issues/1692#issuecomment-501113777
				onGridReady={(params) => {
					params.api.sizeColumnsToFit();
				}}
				onFirstDataRendered={(params) => {
					params.columnApi.autoSizeColumns(params.columnApi.getAllColumns()?.map((i) => i.getColId()) ?? []);
				}}
				suppressCsvExport
				suppressExcelExport
				suppressLastEmptyLineOnPaste // fixes excel issue https://www.ag-grid.com/javascript-data-grid/grid-properties/#reference-clipboard
			>
				<AgGridColumn {...CHECKBOX_COLUMN_DEF} initialPinned='left' />
				<AgGridColumn {...getCountColumnDef()} initialPinned='left' />
				{columns.map(({ name, key, ...tableProps }) => (
					<AgGridColumn
						key={key}
						{...tableProps}
						field={key}
						headerName={name}
						type={getType(key)}
						resizable
						valueSetter={(ev) => {
							const normType = ev.colDef.field === 'eurMultiplier' ? 'eur' : 'qPeak';
							if (ev.newValue === '') {
								// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
								onChangeMultiplier(ev.node!.id!, 1, normType);
								return true;
							}
							const asNumber = Number(ev.newValue);
							if (!ev.node?.id || !Number.isFinite(asNumber) || asNumber <= 0) {
								return false;
							}
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
							onChangeMultiplier(ev.node!.id!, asNumber, normType);
							return true;
						}}
					/>
				))}
			</AgGrid>
		);
	}
);
