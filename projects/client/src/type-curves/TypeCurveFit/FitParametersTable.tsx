import _ from 'lodash';
import { forwardRef, useImperativeHandle, useMemo } from 'react';

import AgGrid, { defaultValueFormatter, useGridStateStorage } from '@/components/AgGrid';
import { Box } from '@/components/v2';
import { genViewValue } from '@/forecasts/charts/forecastChartHelper';
import { generateForecastConvertFunc, paramsToConvert } from '@/forecasts/manual/shared/conversionHelper';
import { theme } from '@/helpers/styled';
import { fields as segModelsTemplate } from '@/inpt-shared/display-templates/segment-templates/seg_models.json';
import { fields as segParamsTemplate } from '@/inpt-shared/display-templates/segment-templates/seg_params.json';
import { useChooseHeaders } from '@/manage-wells/shared/ChooseHeadersDialog';

const PHASES = ['oil', 'gas', 'water'] as const;
const P_SERIES = ['best', 'P10', 'P50', 'P90'] as const;

type PhaseTypes = (typeof PHASES)[number];
type PSeriesTypes = (typeof P_SERIES)[number];
type ResolutionTypes = 'monthly' | 'daily';
type FitTypes = 'ratio' | 'rate';

interface SegParam {
	label: string;
	type: string;
	round?: number;
	order?: number;
	idx_label?: string;
	// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
	units?: {};
}

interface PhaseFit {
	_id: string;
	align: 'align' | 'noalign';
	basePhase: PhaseTypes & null;
	eurPercentile: boolean;
	fitType: FitTypes;
	normalize: boolean;
	phase: PhaseTypes;
	// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
	ratio_P_dict?: {};
	resolution: ResolutionTypes;
	// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
	settings: {};
	typeCurve: string;
	// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
	P_dict?: {};
}

interface Row {
	id: string;
	phase: string;
	fitType: FitTypes;
	align: string;
	normalize: string;
	resolution: ResolutionTypes;
	pSeries: PSeriesTypes;
	segment: number;
	model: string;
	b?: number;
	end_idx?: number;
	sw_idx?: number;
	start_idx?: number;
	c?: number;
	D_eff?: number;
	D_exp?: number;
	target_D_eff_sw?: number;
	realized_D_eff_sw?: number;
	D?: number;
	q_end?: number;
	q_sw?: number;
	q_start?: number;
	k?: number;
}

const paramItems = Object.entries(segParamsTemplate)
	.filter((key) => key[0] !== 'duration')
	.map((entry) => {
		const paramKey = entry[0];
		const paramValue: SegParam = entry[1];
		return {
			key: paramKey,
			name: paramValue.idx_label ?? (paramValue.label === 'Slope' ? 'Slope (Linear Segment)' : paramValue.label),
			...paramValue,
		};
	})

	.filter((item) => Number.isFinite(item.order))
	.sort((a, b) => Number(a.order) - Number(b.order));

const BASE_COLUMNS = [
	{ key: 'phase', name: 'Phase', type: 'string' },
	{ key: 'fitType', name: 'Fit Type', type: 'string' },
	{ key: 'align', name: 'Align Peak', type: 'string' },
	{ key: 'normalize', name: 'Normalization', type: 'string' },
	{ key: 'resolution', name: 'Resolution', type: 'string' },
	{ key: 'pSeries', name: 'Series', type: 'string' },
	{ key: 'segment', name: 'Segment', type: 'string' },
	{ key: 'model', name: 'Segment Type', type: 'string' },
];

const ALL_COLUMNS = [...BASE_COLUMNS, ...paramItems.map((param) => ({ ...param, type: undefined }))];

const COLUMNS_BY_KEY = _.keyBy(ALL_COLUMNS, 'key');
const ALL_COLUMNS_KEYS = _.map(ALL_COLUMNS, 'key');

// TODO: extract out to potentially use with other tables that require units
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const RenderFieldWithUnits = (params: any) => {
	const { value: paramValue } = params;
	const { value, units } = paramValue;
	return (
		<Box display='flex' width='100%' justifyContent='space-between' alignItems='baseline'>
			<span>{value}</span>
			{value && value !== 'N/A' && (
				<Box fontSize='0.7rem' color={theme.textUnitColor}>
					{units}
				</Box>
			)}
		</Box>
	);
};

const parameterComparator = (itemA, itemB) => {
	const valueA = itemA.value;
	const valueB = itemB.value;

	if (valueA === valueB) {
		return 0;
	}

	// N/A is always considered smaller than any number
	if (valueA === 'N/A') {
		return -1;
	}
	if (valueB === 'N/A') {
		return 1;
	}

	// remove commas from string
	const numA = Number(valueA.split(',').join(''));
	const numB = Number(valueB.split(',').join(''));
	return numA > numB ? 1 : -1;
};

const COLUMN_DEFS = [
	..._.map(BASE_COLUMNS, (item) => ({ field: item.key, headerName: item.name, type: 'string' })),
	...paramItems.map((param) => ({
		field: param.key,
		headerName: param.name,
		cellRenderer: RenderFieldWithUnits,
		comparator: parameterComparator,
	})),
];

const STORAGE_KEY = 'FIT_PARAMETERS_TABLE';

function getPhaseFitSegments(phaseFit: PhaseFit, pSeries: PSeriesTypes) {
	const { fitType } = phaseFit;
	if (fitType === 'ratio') {
		return phaseFit?.ratio_P_dict?.[pSeries]?.segments ?? [];
	}

	return phaseFit?.P_dict?.[pSeries]?.segments ?? [];
}

function FitParametersTable({ phaseFits }: { phaseFits: { oil?: PhaseFit; gas?: PhaseFit; water?: PhaseFit } }, ref) {
	const rows: Row[] = useMemo(() => {
		const output: Row[] = [];

		if (phaseFits) {
			Object.entries(phaseFits).forEach(([phase, phaseFit]) => {
				if (!phaseFit) {
					return;
				}

				const { align, fitType, normalize, resolution, basePhase } = phaseFit;

				const convertFuncs = generateForecastConvertFunc({
					phase,
					basePhase: fitType === 'ratio' ? basePhase : null,
				});

				const phaseKey = fitType === 'ratio' ? `${phase}/${basePhase}` : phase;
				const { q: qConversion, k: kConversion } = convertFuncs;

				P_SERIES.forEach((pSeries) => {
					const segments = getPhaseFitSegments(phaseFit, pSeries);
					segments.forEach((segment, segmentIdx) => {
						const row = {
							id: `${phase}-${pSeries}-${segmentIdx}`,
							align,
							fitType,
							model: segModelsTemplate[segment.name].label,
							normalize: normalize ? 'Yes' : 'No',
							phase,
							pSeries,
							resolution,
							segment: (segmentIdx + 1).toFixed(0),
						};

						paramItems.forEach(({ key: param, type, round, units }) => {
							const paramValue = segment?.[param];
							const toConvert = paramsToConvert.includes(param);

							let value;
							let viewUnits;
							if (param === 'k') {
								value = genViewValue(
									type,
									toConvert ? kConversion.toView(paramValue) : paramValue,
									round,
									true
								);

								viewUnits = toConvert ? kConversion.viewUnits : units?.[phaseKey];
							} else {
								value = genViewValue(
									type,
									toConvert ? qConversion.toView(paramValue) : paramValue,
									round,
									true
								);

								// hard-coding Day for idx fields as this is the only part that uses relative time in a table
								if (param.includes('idx')) {
									viewUnits = 'Day';
								} else {
									viewUnits = toConvert ? qConversion.viewUnits : units?.[phaseKey];
								}
							}

							row[param] = { value, units: viewUnits };
						});

						output.push(row);
					});
				});
			});
		}

		return output;
	}, [phaseFits]);

	const { tableStorageProps } = useGridStateStorage(STORAGE_KEY);

	const { selectedHeaders, selectHeaders } = useChooseHeaders({
		initialHeaders: ALL_COLUMNS_KEYS,
		headers: _.mapValues(COLUMNS_BY_KEY, 'name'),
		maxHeaders: null, // TODO remove this restriction by default
	});

	const columnDefs = COLUMN_DEFS.filter((column) => selectedHeaders.includes(column.field));

	useImperativeHandle(ref, () => ({ selectHeaders }));

	return (
		<AgGrid
			css='width: 100%; height: 100%;'
			columnDefs={columnDefs}
			suppressReactUi
			columnTypes={{
				string: {
					filter: 'agTextColumnFilter',
					filterParams: { filterOptions: ['contains'] },
					floatingFilter: true,
				},
			}}
			defaultColDef={{
				lockVisible: true,
				menuTabs: ['generalMenuTab'],
				resizable: true,
				sortable: true,
				valueFormatter: defaultValueFormatter,
			}}
			getRowNodeId='id'
			rowData={rows}
			rowSelection='multiple'
			suppressRowClickSelection
			suppressCsvExport
			suppressExcelExport
			{...tableStorageProps}
		/>
	);
}

export default forwardRef(FitParametersTable);
