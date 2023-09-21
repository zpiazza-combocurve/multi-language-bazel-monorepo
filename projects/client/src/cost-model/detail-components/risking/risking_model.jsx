/* eslint-disable no-param-reassign */
import { faMinus, faPlus } from '@fortawesome/pro-regular-svg-icons';
import produce from 'immer';
import { pickBy } from 'lodash';

import { Header } from '@/components/HelpDialog';
import ReactDataSheet from '@/components/InptDataSheet';
import { useMergedState } from '@/components/hooks';
import { IconButton } from '@/components/v2';
import { clone } from '@/helpers/utilities';
import { FieldType } from '@/inpt-shared/constants';

import { defaultHandlePasteCells, getSelectValueProps, parseValue } from '../copy-paste';
import { dataRenderer, valueRenderer } from '../gen-data';
import { addDeleteRow, genData, rowDateRangeChange, rowNumberRangeChange } from '../helper';

const PHASES = ['oil', 'gas', 'ngl', 'drip_condensate', 'water', 'well_stream'];
const SEASONAL = 'seasonal';

const defaultSeasonalRows = [
	{ multiplier: 100, criteria: 'Jan' },
	{ multiplier: 100, criteria: 'Feb' },
	{ multiplier: 100, criteria: 'Mar' },
	{ multiplier: 100, criteria: 'Apr' },
	{ multiplier: 100, criteria: 'May' },
	{ multiplier: 100, criteria: 'Jun' },
	{ multiplier: 100, criteria: 'Jul' },
	{ multiplier: 100, criteria: 'Aug' },
	{ multiplier: 100, criteria: 'Sep' },
	{ multiplier: 100, criteria: 'Oct' },
	{ multiplier: 100, criteria: 'Nov' },
	{ multiplier: 100, criteria: 'Dec' },
];

const wellStreamDefault = {
	subItems: {
		row_view: {
			headers: {
				multiplier: {
					label: 'Count',
					value: 'count',
				},
				criteria: {
					label: 'FPD',
					value: 'offset_to_fpd',
				},
			},
			rows: [
				{
					multiplier: 1,
					criteria: { start: 1, end: 12, period: 12, end_date: 'Econ Limit' },
				},
			],
		},
	},
};

export function RiskingModel(props) {
	const { risking_model: _risking_model, fields, setRiskingModel, selected, onSelect } = props;

	const hasWellStream = 'well_stream' in _risking_model;
	const risking_model = hasWellStream
		? _risking_model
		: {
				..._risking_model,
				well_stream: wellStreamDefault,
		  };

	const [collapseState, changeCollapseState] = useMergedState({});

	const setCollapseState = (partial) => changeCollapseState({ ...partial });

	const setRM = () => setRiskingModel(risking_model, 'risking_model');

	const handleChange = (properties) => {
		const { value, key } = properties;
		setRiskingModel(
			produce(risking_model, (draft) => {
				draft[key] = value;
			}),
			'risking_model'
		);
	};

	const handleSubChange = (properties) => {
		const { value, key, subKey } = properties;
		risking_model[key].subItems[subKey] = value;
		setRM();
	};

	const applyRowChange = (properties) => {
		const { value, key, index, stateKey } = properties;
		risking_model[stateKey].subItems.row_view.rows[index][key] = value;
	};

	const handleRowChange = (properties) => {
		applyRowChange(properties);
		setRM();
	};

	const applyRowHeaderChange = (properties) => {
		const { value, key, stateKey, fullMenuItem } = properties;
		const row_view = risking_model[stateKey].subItems.row_view;
		const prevCriteria = row_view.headers[key].value;

		row_view.headers[key] = value;

		if (prevCriteria === value.value) {
			// no operation when select same criteria
			return;
		}

		row_view.rows.forEach((r) => {
			if (fullMenuItem.Default || fullMenuItem.Default === 0) {
				r[key] = fullMenuItem.Default;
			} else if (fullMenuItem.staticValue) {
				r[key] = fullMenuItem.staticValue;
			} else {
				r[key] = '';
			}
		});

		if (value.value === 'entire_well_life' || (prevCriteria === SEASONAL && value.value !== SEASONAL)) {
			// clear seasonal rows when switch to other criteria
			row_view.rows = [row_view.rows[0]];
		} else if (prevCriteria !== SEASONAL && value.value === SEASONAL) {
			// auto populate 12 seasonal rows when select seasonal
			row_view.rows = defaultSeasonalRows;
		}
	};

	const handleRowHeaderChange = (properties) => {
		applyRowHeaderChange(properties);
		setRM();
	};

	const applyRowDateRangeChange = (properties) => {
		const { value, key, index, stateKey } = properties;
		const rows = risking_model[stateKey].subItems.row_view.rows;
		rowDateRangeChange({ rows, value, key, index });
	};

	const handleRowDateRangeChange = (properties) => {
		applyRowDateRangeChange(properties);
		setRM();
	};

	const applyRowNumberRangeChange = (properties) => {
		const { value, key, index, stateKey } = properties;
		const rows = risking_model[stateKey].subItems.row_view.rows;
		rowNumberRangeChange({ rows, value, key, index });
	};

	const handleRowNumberRangeChange = (properties) => {
		applyRowNumberRangeChange(properties);
		setRM();
	};

	const handlers = {
		subItems: handleSubChange,
		row: handleRowChange,
		rowHeader: handleRowHeaderChange,
		'date-range': handleRowDateRangeChange,
		'number-range': handleRowNumberRangeChange,
	};

	const checkAddDeleteRow = (risking_model) => {
		const check = PHASES.reduce(
			(a, key) => ({
				...a,
				[key]: {
					add: false,
					delete: false,
					showBtn: false,
					rows: risking_model[key].subItems.row_view.rows,
					skipCheck: risking_model[key].subItems.row_view.headers.criteria.value === SEASONAL,
				},
			}),
			{}
		);

		const rowValueKey = 'multiplier';

		addDeleteRow({ check, rowValueKey });

		return check;
	};

	const applyAddRow = (phase) => {
		const row_view = risking_model[phase].subItems.row_view;
		const columnFields = fields[phase].subItems.row_view.columns;

		const r = clone(row_view.rows[0]);
		Object.keys(r).forEach((k) => {
			const columnField = columnFields[k];
			if (columnField?.fieldType === FieldType.number && columnField?.Default) {
				r[k] = columnField?.Default;
			}
			// HACK: For now we're agreed to hardcode this condition statement, cause it is a temporary hack and will be deleted
			// later after providing Advanced UI for this model
			else if (phase === 'well_stream' && k === 'multiplier') {
				if (row_view.headers[k].value === 'count') {
					r[k] = row_view.rows.at(-1)[k];
				} else {
					// HACK: When percentage is chosen the first row should be processed as a count with default value 1,
					// every next row should has default as percent with value 100%, that's why in risking.json default
					// for percentage is 1, but here we override it with 100% for every next row added to Well Stream
					r[k] = 100;
				}
			} else {
				r[k] = '';
			}
		});
		row_view.rows.push(r);
	};

	const handleAddRow = (phase) => {
		applyAddRow(phase);
		setRM();
	};

	const applyChangeCell = (meta, rawValue) => {
		const value = parseValue(meta, rawValue);

		switch (meta.fieldType) {
			case 'date-range':
				applyRowDateRangeChange({ ...meta, value, startEnd: 'start' });
				return;
			case 'number-range':
				applyRowNumberRangeChange({ ...meta, value });
				return;
			default:
				if (meta.subKey === 'row_view') {
					const selectProps = getSelectValueProps(meta, rawValue);
					if (selectProps) {
						applyRowHeaderChange({ ...meta, ...selectProps });
					}
					return;
				}
				if (meta.index || meta.index === 0) {
					applyRowChange({ ...meta, value });
				}
		}
	};

	const handlePasteCells = (phase, changes, additions) => {
		const onlyFirstRow = risking_model[phase].subItems.row_view.headers.criteria.value === 'entire_well_life';

		defaultHandlePasteCells({
			additions,
			changes,
			addRow: () => applyAddRow(phase),
			changeCell: applyChangeCell,
			onlyFirstRow,
		});

		setRM();
	};

	const deleteRow = (phase) => {
		const row_view = risking_model[phase].subItems.row_view;

		row_view.rows.pop();
		const new_rows = row_view.rows;
		if (new_rows.length && new_rows[new_rows.length - 1].criteria) {
			new_rows[new_rows.length - 1].criteria.end_date = 'Econ Limit';
		}
		setRM();
	};

	const getAddDeleteItems = (allCheck, phase) => {
		return [
			<IconButton
				key='add-rev'
				tooltipPlacement='top'
				tooltipTitle='Add Row'
				disabled={!allCheck[phase].add}
				onClick={() => handleAddRow(phase)}
				color='primary'
			>
				{faPlus}
			</IconButton>,
			<IconButton
				key='del-rev'
				tooltipPlacement='top'
				tooltipTitle='Delete Row'
				disabled={!allCheck[phase].delete}
				onClick={() => deleteRow(phase)}
				color='error'
			>
				{faMinus}
			</IconButton>,
		];
	};

	const renderPhaseSheet = (phase, data) => {
		const selKey = `risking_${phase}_sheet`;
		return (
			<ReactDataSheet
				data={data}
				dataRenderer={dataRenderer}
				valueRenderer={valueRenderer}
				selected={selected[selKey]}
				onSelect={(sel) => onSelect(selKey, sel)}
				className='on-hover-paper-2 data-sheet-paper'
				onPasteCells={(changes, additions) => handlePasteCells(phase, changes, additions)}
			/>
		);
	};

	const renderRisking = (dataByPhase, allCheck) => {
		return (
			<div className='price-data-sheets main-expense-options'>
				{PHASES.map((phase) => (
					<div key={phase} className={`$${phase}_sheet expense-table-container`}>
						{renderPhaseSheet(phase, dataByPhase[phase])}
						{allCheck[phase].showBtn && getAddDeleteItems(allCheck, phase)}
					</div>
				))}
			</div>
		);
	};

	const check = checkAddDeleteRow(risking_model);

	const dataByPhase = {};

	Object.keys(fields).forEach((phase) => {
		dataByPhase[phase] = genData({
			fieldsObj: { [phase]: fields[phase] },
			state: { [phase]: risking_model[phase] },
			handlers,
			handleChange,
			collapseState,
			setCollapseState,
		});
	});

	const riskOptions = Object.values(pickBy(dataByPhase, (val, key) => !PHASES.includes(key))).reduce(
		(arr, element) => {
			return arr.concat(element);
		},
		[]
	);

	return (
		<div id='cost-model-detail-inputs' className='sub-model-detail-sheet'>
			<Header>
				<h2 className='md-text'>Risking</h2>
			</Header>
			<div className='price-data-sheets phase-cat-selects'>
				<ReactDataSheet
					data={riskOptions}
					dataRenderer={dataRenderer}
					valueRenderer={valueRenderer}
					selected={selected.risking_risk_prod_sheet}
					className='on-hover-paper-2 data-sheet-paper var-exp'
					onSelect={(sel) => onSelect('risking_risk_prod_sheet', sel)}
				/>
			</div>
			{renderRisking(dataByPhase, check)}
		</div>
	);
}
