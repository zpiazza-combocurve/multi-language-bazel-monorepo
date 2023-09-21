import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import type { CellClassParams, ColDef, ITooltipParams, ValueParserParams } from '@ag-grid-community/core';
import { BaseColDefParams } from '@ag-grid-community/core/dist/esm/es6/entities/colDef';
import { AgGridReact } from '@ag-grid-community/react';
import { ClipboardModule } from '@ag-grid-enterprise/clipboard';
import { RangeSelectionModule } from '@ag-grid-enterprise/range-selection';
import { faBurn, faFaucetDrip, faFlaskPotion, faTint, type IconDefinition } from '@fortawesome/pro-regular-svg-icons';
import produce from 'immer';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { DISABLED_CELL_CLASS_NAME, ERROR_CELL_CLASS_NAME } from '@/components/AgGrid';
import ExtendedCellRenderer, { ExtendedCellRendererParams } from '@/components/AgGrid/renderers/ExtendedCellRenderer';
import ThemedAgGrid, { ThemedAgGridProps as AgGridProps } from '@/components/ThemedAgGrid';
import { useAggregatedSetState } from '@/components/hooks/useAggregatedSetState';
import FontAwesomeSvgIcon from '@/components/v5/FontAwesomeSvgIcon';
import { ProductsPalette } from '@/helpers/MuiV5ThemeProvider';
import { SetStateFunction, assert } from '@/helpers/utilities';

enum Phase {
	gas = 'gas',
	oil = 'oil',
	water = 'water',
	ngl = 'ngl',
	drip_condensate = 'drip_condensate',
}

enum Criteria {
	flat = 'flat',
	fpd = 'fpd',
	asof = 'as of',
}

const COMPONENTS = [
	'N2',
	'CO2',
	'C1',
	'C2',
	'C3',
	'iC4',
	'nC4',
	'iC5',
	'nC5',
	'iC6',
	'nC6',
	'C7',
	'C8',
	'C9',
	'C10+',
	'H2S',
	'H2',
	'H2O',
	'He',
	'O2',
];

const PHASES: Phase[] = [Phase.oil, Phase.gas, Phase.water, Phase.ngl, Phase.drip_condensate];

interface PhaseData {
	criteria: Criteria;
	composition: Record<string, { percentage: number; price: number }>;
}

export interface Data {
	[Phase.oil]: PhaseData;
	[Phase.gas]: PhaseData;
	[Phase.ngl]: PhaseData;
	[Phase.drip_condensate]: PhaseData;
	[Phase.water]: PhaseData;
}

// not used for now, keeping for future reference
// const CRITERIA_OPTIONS: Criteria[] = [Criteria.flat, Criteria.fpd, Criteria.asof];

const PHASE_LABELS: Record<Phase, string> = {
	[Phase.oil]: 'Oil',
	[Phase.gas]: 'Gas',
	[Phase.water]: 'Water',
	[Phase.ngl]: 'NGL',
	[Phase.drip_condensate]: 'Drip Cond',
};

const CRITERIA_LABELS: Record<Criteria, string> = {
	[Criteria.flat]: 'Flat',
	[Criteria.fpd]: 'FPD',
	[Criteria.asof]: 'As Of',
};

const DEFAULT_FLUID_MODEL_PHASE_DATA: Omit<PhaseData, 'unit'> = {
	composition: {
		..._.transform(
			COMPONENTS,
			(acc, key) => {
				acc[key] = {
					percentage: 0,
					price: 0,
				};
			},
			{}
		),
	},
	criteria: Criteria.flat,
};

const PERCENTAGE_MIN = 0;
const PERCENTAGE_MAX = 100;

const getIcon = (icon: IconDefinition, color: keyof ProductsPalette) => (
	<FontAwesomeSvgIcon fontSize='small' sx={{ color: (theme) => theme.palette.products[color] }}>
		{icon}
	</FontAwesomeSvgIcon>
);

const PHASES_ICONS = {
	[Phase.oil]: getIcon(faTint, 'oil'),
	[Phase.gas]: getIcon(faBurn, 'gas'),
	[Phase.water]: getIcon(faFaucetDrip, 'water'),
	[Phase.ngl]: getIcon(faTint, 'ngl'),
	[Phase.drip_condensate]: getIcon(faFlaskPotion, 'drip_cond'),
} satisfies Partial<Record<Phase, JSX.Element>>;

function checkPercentageValid(percentage: number) {
	return Number.isFinite(percentage) && percentage >= PERCENTAGE_MIN && percentage <= PERCENTAGE_MAX;
}

function checkPriceValid(price: number) {
	return Number.isFinite(price) && price >= 0;
}

function checkPhaseDataValid(phaseData: PhaseData) {
	return (
		Object.values(Criteria).includes(phaseData.criteria) &&
		COMPONENTS.every((component) => {
			return (
				checkPercentageValid(phaseData.composition?.[component]?.percentage) &&
				checkPriceValid(phaseData.composition?.[component]?.price)
			);
		})
	);
}

export function checkFluidModelDataValid(fluidModelData: Data) {
	for (const phase of PHASES) {
		if (!checkPhaseDataValid(fluidModelData[phase])) {
			return false;
		}
	}
	return true;
}

export const DEFAULT_FLUID_MODEL_DATA: Data = {
	[Phase.oil]: { ...DEFAULT_FLUID_MODEL_PHASE_DATA },
	[Phase.gas]: { ...DEFAULT_FLUID_MODEL_PHASE_DATA },
	[Phase.water]: { ...DEFAULT_FLUID_MODEL_PHASE_DATA },
	[Phase.ngl]: { ...DEFAULT_FLUID_MODEL_PHASE_DATA },
	[Phase.drip_condensate]: { ...DEFAULT_FLUID_MODEL_PHASE_DATA },
};

const numberParser = (params: ValueParserParams) => {
	const asNumber = Number(params.newValue);
	if (Number.isFinite(asNumber)) return asNumber;
	return params.oldValue;
};

export interface FluidModelTabelProps {
	className?: string;
	state: Data;
	/** Don't pass the setState function to make the table readonly */
	setState?: SetStateFunction<Data>;
	domLayout?: AgGridProps['domLayout'];
}

const getFieldPath = (params: BaseColDefParams) => {
	assert(params.colDef.field, 'Field must be defined');
	return `${params.data.phase}.${params.colDef.field}`;
};

const getCellTooltip = (params: ITooltipParams | CellClassParams) =>
	(params?.colDef as ColDef)?.type === 'numericColumn' && !checkPercentageValid(params.value)
		? 'Percentage must be between 0 and 100'
		: null;

function FluidModelTable(props: FluidModelTabelProps) {
	const { className, state, setState: setState_, domLayout } = props;
	const agGridRef = useRef<AgGridReact>(null);

	// eslint-disable-next-line react-hooks/rules-of-hooks
	const setState = setState_ ? useAggregatedSetState(setState_) : undefined;

	useEffect(() => {
		if (!agGridRef.current?.api) return;
		agGridRef.current.api.refreshCells();
	}, [state]);

	const readonly = setState === undefined;

	interface Row {
		phase: Phase;
		criteria?: Criteria;
		[component: string]: number | string | undefined;
	}

	return (
		<ThemedAgGrid<Row>
			agGridReactRef={agGridRef}
			className={className}
			context={state}
			rowData={useMemo(() => PHASES.map((phase) => ({ phase })), [])}
			defaultColDef={useMemo(
				() =>
					({
						valueGetter: (params) => _.get(params.context, getFieldPath(params)),
						width: 100,
						resizable: true,
						cellClassRules: {
							[DISABLED_CELL_CLASS_NAME]: (params) => !params.column.isCellEditable(params.node),
							[ERROR_CELL_CLASS_NAME]: (params) => !!getCellTooltip(params),
						},
						tooltipValueGetter: (params) => getCellTooltip(params),
						useValueParserForImport: true,
					} satisfies ColDef<Row>),
				[]
			)}
			tooltipShowDelay={300}
			getRowId={useCallback((params) => params.data.phase, [])}
			columnDefs={useMemo(
				() => [
					{
						headerName: 'Phase',
						field: 'phase',
						refData: PHASE_LABELS,
						valueGetter: (params) => {
							assert(params.colDef.field, 'field is undefined');
							assert(params.data, 'data is undefined');

							return params.data[params.colDef.field];
						},
						cellRenderer: ExtendedCellRenderer,
						cellRendererParams: {
							getIcon: (value) => PHASES_ICONS[value],
						} satisfies ExtendedCellRendererParams<Phase>,
					},
					{
						headerName: 'Criteria',
						field: 'criteria',
						editable: readonly ? false : false, // fixed on flat for now
						refData: CRITERIA_LABELS,
					},
					...COMPONENTS.map(
						(component) =>
							({
								headerName: component,
								field: `composition.${component}.percentage`,
								valueFormatter: (params) => `${params.value} %`,
								valueParser: numberParser,
								editable: readonly ? false : true,
								width: 80,
								type: 'numericColumn',
							} satisfies ColDef<Row>)
					),
				],
				[readonly]
			)}
			readOnlyEdit
			onCellEditRequest={(params) => {
				setState?.(
					produce((draft) => {
						_.set(draft, getFieldPath(params), params.newValue ?? 0);
					})
				);
			}}
			domLayout={domLayout}
			enableRangeSelection
			modules={[ClientSideRowModelModule, ClipboardModule, RangeSelectionModule]}
		/>
	);
}

export default FluidModelTable;
