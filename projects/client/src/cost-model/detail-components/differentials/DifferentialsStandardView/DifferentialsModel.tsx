import { faMinus, faPlus } from '@fortawesome/pro-regular-svg-icons';
import classNames from 'classnames';
import { has } from 'lodash-es';
import { Component } from 'react';

import { InptDataSheet } from '@/components';
import { Header } from '@/components/HelpDialog';
import { IconButton, InfoTooltipWrapper } from '@/components/v2';
import { defaultHandlePasteCells, parseValue } from '@/cost-model/detail-components/copy-paste';
import { DIFFERENTIALS_CATEGORIES_MAP } from '@/cost-model/detail-components/differentials/constants';
import { DifferentialsProps, DifferentialsTemplate } from '@/cost-model/detail-components/differentials/types';
import {
	GenerateData,
	createNewRow,
	dataRenderer,
	rowDateRangeChange,
	valueRenderer,
} from '@/cost-model/detail-components/gen-data';
import { clone } from '@/helpers/utilities';
import { AssumptionKey } from '@/inpt-shared/constants';

const description = (
	<ul>
		<li>
			<div>
				<b>Differentials</b>: Negative values indicate subtraction from price
			</div>
		</li>
	</ul>
);
interface PhaseCheckResult {
	add: boolean;
	delete: boolean;
	showBtn: boolean;
}

interface DifferentialChecks {
	oil: PhaseCheckResult;
	gas: PhaseCheckResult;
	ngl: PhaseCheckResult;
	drip_condensate: PhaseCheckResult;
}

interface DifferentialsCheckResult {
	differentials_1: DifferentialChecks;
	differentials_2: DifferentialChecks;
	differentials_3: DifferentialChecks;
	showAdd?: boolean;
	showDel?: boolean;
}

function checkAddDeleteRow(differentials: DifferentialsTemplate): DifferentialsCheckResult {
	const check: DifferentialsCheckResult = {} as DifferentialsCheckResult;

	Object.keys(differentials).forEach((key) => {
		const subDiff = differentials[key].subItems;
		check[key] = {};
		Object.keys(subDiff).forEach((phase) => {
			check[key][phase] = {
				add: false,
				delete: false,
				showBtn: false,
				rows: subDiff[phase].subItems.row_view.rows,
			};
		});
	});

	Object.keys(check).forEach((c) => {
		const subCheck = check[c];

		Object.keys(subCheck).forEach((p) => {
			const phase = subCheck[p];
			const len = phase.rows.length;
			const lastRow = phase.rows[len - 1];

			if (len >= 2) {
				phase.delete = true;
			}
			if (lastRow.differential || lastRow.differential === 0) {
				if (lastRow.criteria && lastRow.criteria.start_date) {
					phase.add = true;
				}
				if (lastRow.criteria && lastRow.criteria.period) {
					phase.add = true;
				}
			}
			delete phase.rows;
			if (phase.add) {
				check['showAdd'] = true;
			}
			if (phase.delete) {
				check['showDel'] = true;
			}
			if (phase.add || phase.delete) {
				phase.showBtn = true;
			}
		});
	});
	return check;
}

export type GenDataProps = {
	state?: object;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	fieldsObj?: { [x: string]: any };
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	handlers: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	collapseState: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	setCollapseState: (partial: any) => any;
	keyList: string[];
};

function genData(props: GenDataProps) {
	const { fieldsObj, state } = props;
	if (state && !Object.keys(state).length) {
		return null;
	}
	const ignore = new Set(['modelName', 'list', 'selectedId', 'search', 'subItems', 'selected']);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const data: Array<any[]> = [];
	if (state == null || fieldsObj == null) {
		return null;
	}
	Object.keys(state).forEach((key) => {
		if (!ignore.has(key)) {
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			GenerateData({ ...props, data, field: fieldsObj[key], stateKey: key, state: state[key] });
		}
	});

	if (!data.length) {
		return false;
	}

	const lastRow = data.length - 1;

	if (!data[0] || !data[0][0]) {
		return false;
	}

	data[0][0].readOnly = false;

	data.forEach((row, rowIndex) => {
		const lastCol = row.length - 1;

		row.forEach((col, colIndex) => {
			col.i = rowIndex;
			col.j = colIndex;
			col.lastCol = lastCol === colIndex;
			col.lastRow = lastRow === rowIndex;
			col.lastCell = lastRow === rowIndex && col.lastCol;
			col.className = classNames(
				col.className,
				`i_${rowIndex}`,
				`j_${colIndex}`,
				col.lastCol && 'last_col',
				col.lastRow && 'last_row',
				col.lastCell && 'last_cell',
				!rowIndex && !colIndex && 'read-only'
			);
		});
	});

	return data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export class DifferentialModel extends Component<DifferentialsProps, any> {
	state = {
		collapse: {
			differentials_1: {},
			differentials_2: {},
			differentials_3: {},
		},
	};

	setCollapseState = (partial) => {
		const { keyList, bool } = partial;
		const { collapse } = this.state;
		const newCollapse = clone(collapse);

		newCollapse[keyList[0]][keyList[1]] = bool;

		this.setState({
			collapse: newCollapse,
		});
	};

	setD = () => {
		const { differentials, setDifferentials } = this.props;
		setDifferentials(differentials, AssumptionKey.differentials);
	};

	applyRowChange = ({ value, key, index, keyList }) => {
		const { differentials } = this.props;
		differentials[keyList[0]].subItems[keyList[1]].subItems.row_view.rows[index][key] = value;
	};

	handleRowChange = (propz) => {
		this.applyRowChange(propz);
		this.setD();
	};

	applySubChange = ({ value, subKey, keyList }) => {
		const { differentials } = this.props;
		differentials[keyList[0]].subItems[keyList[1]].subItems[subKey] = value;
	};

	handleSubChange = (propz) => {
		this.applySubChange(propz);
		this.setD();
	};

	applyRowHeaderChange = ({ value, key, keyList, fullMenuItem }) => {
		const { differentials } = this.props;

		const row_view = differentials[keyList[0]].subItems[keyList[1]].subItems.row_view;

		row_view.headers[key] = value;
		row_view.rows.forEach((r) => {
			if (fullMenuItem.Default || fullMenuItem.Default === 0) {
				r[key] = fullMenuItem.Default;
			} else if (fullMenuItem.staticValue) {
				r[key] = fullMenuItem.staticValue;
			} else {
				r[key] = '';
			}
		});

		if (value.value === 'entire_well_life') {
			row_view.rows = [row_view.rows[0]];
		}
	};

	handleRowHeaderChange = (propz) => {
		this.applyRowHeaderChange(propz);
		this.setD();
	};

	applyRowDateRangeChange = ({ value, key, index, keyList }) => {
		const { differentials } = this.props;
		const rows = differentials[keyList[0]].subItems[keyList[1]].subItems.row_view.rows;

		if (!has(rows[index][key], 'start_date')) {
			rows[index][key] = { start_date: '', end_date: '' };
		}

		rowDateRangeChange({ rows, value, key, index });
	};

	handleRowDateRangeChange = (propz) => {
		this.applyRowDateRangeChange(propz);
		this.setD();
	};

	applyRowNumberRangeChange = ({ value, key, index, keyList }) => {
		const { differentials } = this.props;
		const row_view = differentials[keyList[0]].subItems[keyList[1]].subItems.row_view;

		if (!has(row_view.rows[index][key], 'start')) {
			row_view.rows[index][key] = { start: '', end: '', period: '' };
		}

		const len = row_view.rows.length;
		const cur = row_view.rows[index][key];

		cur.period = value;

		if (index === 0) {
			cur.start = 1;
			cur.end = value;
		}

		if (index > 0) {
			const prev = row_view.rows[index - 1][key] || {};
			cur.start = prev.end + 1;
			cur.end = prev.end + value;
		}

		if (value >= 1) {
			let cum = cur.end;
			if (index + 1 !== len) {
				for (let i = index + 1; i < len; i += 1) {
					if (row_view.rows[i][key].period) {
						row_view.rows[i][key].start = cum + 1;
						row_view.rows[i][key].end = cum + row_view.rows[i][key].period;
						cum = row_view.rows[i][key].end;
					}
				}
			}
		}
	};

	handleRowNumberRangeChange = (propz) => {
		this.applyRowNumberRangeChange(propz);
		this.setD();
	};

	applyAddRow = (diffKey, phase) => {
		const { fields, differentials } = this.props;
		const row_view = differentials[diffKey].subItems[phase].subItems.row_view;
		const columnFields = fields[diffKey].subItems[phase].subItems.row_view.columns;
		const newRow = createNewRow(row_view.rows[0], columnFields, row_view.headers);
		row_view.rows.push(newRow);
	};

	handleAddRow = (diffKey, phase) => {
		this.applyAddRow(diffKey, phase);
		this.setD();
	};

	applyChangeCell = (meta, rawValue) => {
		const value = parseValue(meta, rawValue);

		switch (meta.fieldType) {
			case 'date-range':
				this.applyRowDateRangeChange({ ...meta, value, startEnd: 'start' });
				return;
			case 'number-range':
				this.applyRowNumberRangeChange({ ...meta, value });
				return;
			default:
				if (meta.subKey === 'row_view') {
					const index = meta.fullMenuItems.findIndex(
						(item) => item.value === rawValue || item.label === rawValue
					);
					this.applyRowHeaderChange({
						...meta,
						fullMenuItem: meta.fullMenuItems[index],
						value: meta.menuItems[index],
					});
					return;
				}
				if (meta.index || meta.index === 0) {
					this.applyRowChange({ ...meta, value });
				}
		}
	};

	handlePasteCells = (diffKey, phase, changes, additions) => {
		const { differentials } = this.props;
		const onlyFirstRow =
			differentials[diffKey].subItems[phase].subItems.row_view.headers.criteria.value === 'entire_well_life';

		defaultHandlePasteCells({
			additions,
			changes,
			addRow: () => this.applyAddRow(diffKey, phase),
			changeCell: this.applyChangeCell,
			onlyFirstRow,
		});

		this.setD();
	};

	deleteRow = (diffKey, phase) => {
		const { differentials } = this.props;
		const row_view = differentials[diffKey].subItems[phase].subItems.row_view;

		row_view.rows.pop();
		const new_rows = row_view.rows;
		if (new_rows.length && new_rows[new_rows.length - 1].criteria) {
			new_rows[new_rows.length - 1].criteria.end_date = 'Econ Limit';
		}
		this.setD();
	};

	getAddDeleteItems = (allCheck, diffKey, phase) => {
		return [
			<IconButton
				key='add-rev'
				tooltipPlacement='top'
				tooltipTitle='Add Row'
				disabled={!allCheck[diffKey][phase].add}
				onClick={() => this.handleAddRow(diffKey, phase)}
				color='primary'
			>
				{faPlus}
			</IconButton>,
			<IconButton
				key='del-rev'
				tooltipPlacement='top'
				tooltipTitle='Delete Row'
				disabled={!allCheck[diffKey][phase].delete}
				onClick={() => this.deleteRow(diffKey, phase)}
				color='error'
			>
				{faMinus}
			</IconButton>,
		];
	};

	renderPhaseSheet = (diffKey, phase, data) => {
		const { selected, onSelect } = this.props as DifferentialsProps;
		const selKey = `${diffKey}_${phase}_sheet`;
		return (
			<InptDataSheet
				data={data}
				dataRenderer={dataRenderer}
				valueRenderer={valueRenderer}
				selected={selected[selKey]}
				onSelect={(sel) => onSelect(selKey, sel)}
				className='on-hover-paper-2 data-sheet-paper'
				onPasteCells={(changes, additions) => this.handlePasteCells(diffKey, phase, changes, additions)}
			/>
		);
	};

	renderDifferentials(allData, allCheck, diffKey, header) {
		return (
			<div>
				<div>
					<h4 className='md-text'>{header}</h4>
				</div>

				<div className='price-data-sheets main-expense-options'>
					{Object.keys(allData[diffKey]).map((phase) => (
						<div key={phase} className={`${diffKey}_${phase}_sheet expense-table-container`}>
							{this.renderPhaseSheet(diffKey, phase, allData[diffKey][phase])}
							{allCheck[diffKey][phase].showBtn && this.getAddDeleteItems(allCheck, diffKey, phase)}
						</div>
					))}
				</div>
			</div>
		);
	}

	render() {
		const { setCollapseState } = this;
		const { collapse: collapseState } = this.state;
		const { differentials, fields } = this.props as DifferentialsProps;

		const handlers = {
			row: this.handleRowChange,
			subItems: this.handleSubChange,
			rowHeader: this.handleRowHeaderChange,
			'date-range': this.handleRowDateRangeChange,
			'number-range': this.handleRowNumberRangeChange,
		};

		const allData = {};

		Object.keys(fields).forEach((key) => {
			allData[key] = {};
			const subFields = fields[key].subItems;
			const subDiff = differentials[key].subItems;
			Object.keys(subFields).forEach((phase) => {
				allData[key][phase] = genData({
					fieldsObj: { [phase]: subFields[phase] },
					state: { [phase]: subDiff[phase] },
					handlers,
					collapseState,
					setCollapseState,
					keyList: [key, phase],
				});
			});
		});

		const check = checkAddDeleteRow(differentials);

		if (!allData) {
			return null;
		}

		return (
			<div id='cost-model-detail-inputs' className='sub-model-detail-sheet'>
				<Header>
					<h2 className='md-text'>Components</h2>
					<InfoTooltipWrapper tooltipTitle={description} iconFontSize='16px' />
				</Header>
				{Object.entries(DIFFERENTIALS_CATEGORIES_MAP).map(([key, value]) =>
					this.renderDifferentials(allData, check, key, value)
				)}
			</div>
		);
	}
}
