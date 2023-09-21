import { faMinus, faPlus, faRandom } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import produce from 'immer';
import _ from 'lodash';
import { useMemo } from 'react';
import { Button } from 'react-md';

import ReactDataSheet from '@/components/InptDataSheet';
import { Button as V2Button } from '@/components/v2';
import { GenerateData, dataRenderer, valueRenderer } from '@/cost-model/detail-components/gen-data';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { clone } from '@/helpers/utilities';
import { FieldType } from '@/inpt-shared/constants';

const defaultEscalationStart = {
	label: 'Apply To Criteria',
	value: 'apply_to_criteria',
	fieldType: 'number',
	valType: 'days',
	min: -20000,
	max: 20000,
	Default: 0,
};

const capexAppearAfterECL = {
	label: 'Yes',
	value: 'yes',
	na: 'yes',
};

const defaultAppearAfterECL = {
	label: 'No',
	value: 'no',
};

const SEED_MIN = 1;
const SEED_MAX = 1000000;

function checkAddDeleteRow(data) {
	const check = { add: false, delete: false, showBtn: false };
	const len = data.row_view.rows.length;
	const lastRow = data.row_view.rows[len - 1];

	if (len > 0) {
		check.delete = true;
	}
	if (lastRow) {
		if (
			lastRow.category.value &&
			(lastRow.tangible || lastRow.tangible === 0) &&
			(lastRow.intangible || lastRow.intangible === 0) &&
			lastRow.criteria.criteria &&
			(lastRow.criteria.value || lastRow.criteria.value === 0)
		) {
			check.add = true;
		}
	} else {
		check.add = true;
	}
	if (check.add || check.delete) {
		check.showBtn = true;
	}

	return check;
}

const removeProbCapexField = (fieldsObj) => {
	return produce(fieldsObj, (draft) => {
		draft.row_view.columns = _.pickBy(draft.row_view.columns, (val) => !val.probCapex);
	});
};

function genData(props) {
	const { state, selectionDisable, probCapex } = props;
	let { fieldsObj } = props;
	if (state && !Object.keys(state).length) {
		return null;
	}
	const ignore = new Set(['modelName', 'list', 'selectedId', 'search', 'subItems', 'selected']);

	if (selectionDisable.drilling_cost) {
		fieldsObj.row_view.columns.category.menuItems[0].disabled = false;
	} else {
		fieldsObj.row_view.columns.category.menuItems[0].disabled = true;
	}
	if (selectionDisable.completion_cost) {
		fieldsObj.row_view.columns.category.menuItems[1].disabled = false;
	} else {
		fieldsObj.row_view.columns.category.menuItems[1].disabled = true;
	}

	const data = [];

	if (!probCapex) {
		fieldsObj = removeProbCapexField(fieldsObj);
	}

	Object.keys(fieldsObj).forEach((key) => {
		if (!ignore.has(key)) {
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			GenerateData({ ...props, data, field: fieldsObj[key], stateKey: key, state: state[key], probCapex });
		}
	});

	if (!data.length) {
		return false;
	}

	const lastRow = data.length - 1;

	data[0][0].readOnly = false;

	data.forEach((row, rowIndex) => {
		const lastCol = row.length - 1;

		row.forEach((col, colIndex) => {
			/* eslint-disable no-param-reassign */
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
			/* eslint-enable no-param-reassign */
		});
	});

	return data;
}

export function OtherCapex(props) {
	const { other_capex, fields, setOtherCapex, omitSection, selected, onSelect } = props;

	const { isProbabilisticCapexEnabled } = useLDFeatureFlags();

	const probCapex = useMemo(() => {
		if (isProbabilisticCapexEnabled) {
			return other_capex.probCapex ? other_capex.probCapex : false;
		}
		return false;
	}, [other_capex, isProbabilisticCapexEnabled]);

	const setOC = () => setOtherCapex(other_capex, 'other_capex');

	const handleCriteriaSelect = ({ value, key, fullMenuItem, index }) => {
		if (!other_capex.row_view.rows[index][key]) {
			other_capex.row_view.rows[index][key] = {};
		}

		if (key === 'criteria') {
			if (value.value === 'offset_to_econ_limit') {
				other_capex.row_view.rows[index]['after_econ_limit'] = capexAppearAfterECL;
			} else if (
				!['abandonment', 'salvage'].includes(other_capex.row_view.rows[index]['category'].value) &&
				!!other_capex.row_view.rows[index]?.after_econ_limit?.na
			) {
				other_capex.row_view.rows[index]['after_econ_limit'] = defaultAppearAfterECL;
			}
		}

		other_capex.row_view.rows[index][key].criteria = fullMenuItem || value;
		if (fullMenuItem.fieldType === FieldType.static) {
			other_capex.row_view.rows[index][key].value = fullMenuItem.staticValue;
		} else if (fullMenuItem.Default || fullMenuItem.Default === 0) {
			other_capex.row_view.rows[index][key].value = fullMenuItem.Default;
		} else {
			other_capex.row_view.rows[index][key].value = '';
		}
		if (value.value === 'fromSchedule' && !other_capex.row_view.rows[index][key]?.fromSchedule?.value) {
			other_capex.row_view.rows[index][key].fromScheduleValue =
				fields.row_view.columns.criteria.fromSchedule.Default.Default;
			other_capex.row_view.rows[index][key].fromSchedule = fields.row_view.columns.criteria.fromSchedule.Default;
		} else if (value.value !== 'fromSchedule' && other_capex.row_view.rows[index][key].fromSchedule) {
			delete other_capex.row_view.rows[index][key].fromScheduleValue;
			delete other_capex.row_view.rows[index][key].fromSchedule;
		}
		if (value.value === 'fromHeaders' && !other_capex.row_view.rows[index][key]?.fromHeaders?.value) {
			other_capex.row_view.rows[index][key].fromHeadersValue =
				fields.row_view.columns.criteria.fromHeaders.Default.Default;
			other_capex.row_view.rows[index][key].fromHeaders = fields.row_view.columns.criteria.fromHeaders.Default;
		} else if (value.value !== 'fromHeaders' && other_capex.row_view.rows[index][key].fromHeaders) {
			delete other_capex.row_view.rows[index][key].fromHeadersValue;
			delete other_capex.row_view.rows[index][key].fromHeaders;
		}

		setOC();
	};

	const handleFromScheduleCriteriaSelect = ({ value, index, fullMenuItem }) => {
		if (!other_capex.row_view.rows[index].criteria.criteria.fromSchedule) {
			other_capex.row_view.rows[index].criteria.criteria.fromSchedule = {};
			other_capex.row_view.rows[index].criteria.fromSchedule = {};
		}
		other_capex.row_view.rows[index].criteria.criteria.fromSchedule = fullMenuItem || value;
		other_capex.row_view.rows[index].criteria.fromSchedule = fullMenuItem || value;

		setOC();
	};

	const handleFromHeadersCriteriaSelect = ({ value, index, fullMenuItem }) => {
		if (!other_capex.row_view.rows[index].criteria.criteria.fromHeaders) {
			other_capex.row_view.rows[index].criteria.criteria.fromHeaders = {};
			other_capex.row_view.rows[index].criteria.fromHeaders = {};
		}
		other_capex.row_view.rows[index].criteria.criteria.fromHeaders = fullMenuItem || value;
		other_capex.row_view.rows[index].criteria.fromHeaders = fullMenuItem || value;

		setOC();
	};

	const handleRowChange = ({ value, key, index }) => {
		const updatedCapexRow = produce(other_capex, (draft) => {
			draft.row_view.rows[index][key] = value;
		});

		// reset some distribution parameter fields when selecting distribution_type
		if (key === 'distribution_type') {
			if (value.value === 'na') {
				updatedCapexRow.row_view.rows[index].mean = 0;
				updatedCapexRow.row_view.rows[index].standard_deviation = 0;
				updatedCapexRow.row_view.rows[index].upper_bound = 0;
				updatedCapexRow.row_view.rows[index].lower_bound = 0;
				updatedCapexRow.row_view.rows[index].mode = 0;
			} else if (['normal', 'lognormal'].includes(value.value)) {
				updatedCapexRow.row_view.rows[index].mode = 0;
			} else if (value.value === 'triangular') {
				updatedCapexRow.row_view.rows[index].mean = 0;
				updatedCapexRow.row_view.rows[index].standard_deviation = 0;
			} else if (value.value === 'uniform') {
				updatedCapexRow.row_view.rows[index].mean = 0;
				updatedCapexRow.row_view.rows[index].standard_deviation = 0;
				updatedCapexRow.row_view.rows[index].mode = 0;
			}
		}

		if (key === 'category') {
			if (['abandonment', 'salvage'].includes(value.value)) {
				updatedCapexRow.row_view.rows[index]['after_econ_limit'] = capexAppearAfterECL;
			} else if (
				!(updatedCapexRow.row_view.rows[index]['criteria'].criteria.value === 'offset_to_econ_limit') &&
				!!other_capex.row_view.rows[index]?.after_econ_limit?.na
			) {
				updatedCapexRow.row_view.rows[index]['after_econ_limit'] = defaultAppearAfterECL;
			}
		}

		setOtherCapex(updatedCapexRow, 'other_capex');
	};

	const handleCriteriaRowChange = ({ value, key, index }) => {
		if (key === 'escalation_start' && !other_capex.row_view.rows[index][key]) {
			// hanlde old model doesn't have escalation_start field in each row
			other_capex.row_view.rows[index][key] = {
				criteria: defaultEscalationStart,
				value,
			};
		} else {
			other_capex.row_view.rows[index][key].value = value;
		}
		setOC();
	};

	const handleScheduleCriteriaRowChange = ({ value, index }) => {
		other_capex.row_view.rows[index].criteria.fromScheduleValue = value;
		setOC();
	};

	const handleHeadersCriteriaRowChange = ({ value, index }) => {
		other_capex.row_view.rows[index].criteria.fromHeadersValue = value;
		setOC();
	};

	const addRow = () => {
		const r = {};
		const allField = clone(fields.row_view.columns);

		Object.keys(allField).forEach((k) => {
			const colField = allField[k];
			if (k === 'criteria' || k === 'escalation_start') {
				r[k] = { criteria: {}, value: '' };
				if (colField.Default) {
					r[k].criteria = colField.Default;
					if (colField.Default.Default || colField.Default.Default === 0) {
						r[k].value = colField.Default.Default;
					}
				}
				return;
			}
			if (k === 'category') {
				r[k] = { label: 'Other Investment', value: 'other_investment' };
				return;
			}
			r[k] = colField.Default || colField.Default === 0 ? colField.Default : '';
		});
		other_capex.row_view.rows.push(r);
		setOC();
	};

	const deleteRow = () => {
		other_capex.row_view.rows.pop();
		setOC();
	};

	const getAddDeleteItems = (check) => {
		const selKey = `capex_sheet`;
		return [
			<Button
				icon
				key='add-rev'
				onClick={addRow}
				disabled={!check.add}
				tooltipPosition='bottom'
				tooltipLabel='Add Row'
				className={classNames(selKey, 'add-row')}
			>
				<FontAwesomeIcon className={classNames(!check.add ? 'themeMe' : 'primary-icon')} icon={faPlus} />
			</Button>,
			<Button
				icon
				key='del-rev'
				onClick={deleteRow}
				tooltipPosition='bottom'
				disabled={!check.delete}
				tooltipLabel='Delete Row'
				className={classNames(selKey, 'warn-btn-icon delete-row')}
			>
				<FontAwesomeIcon className={classNames(!check.delete ? 'themeMe' : 'warn-icon')} icon={faMinus} />
			</Button>,
		];
	};

	const handlers = {
		row: handleRowChange,
		'criteria-row': handleCriteriaRowChange,
		'criteria-select': handleCriteriaSelect,
		'schedule-criteria-row': handleScheduleCriteriaRowChange,
		'schedule-criteria-select': handleFromScheduleCriteriaSelect,
		'headers-criteria-row': handleHeadersCriteriaRowChange,
		'headers-criteria-select': handleFromHeadersCriteriaSelect,
	};

	const data = genData({ fieldsObj: fields, state: other_capex, handlers, selectionDisable: omitSection, probCapex });

	const generateSeed = () => {
		const updatedCapexRow = produce(other_capex, (draft) => {
			const rows = draft.row_view.rows;
			rows.forEach((r) => {
				r.seed = Math.round(Math.random() * (SEED_MAX - SEED_MIN) + SEED_MIN);
			});
		});

		setOtherCapex(updatedCapexRow, 'other_capex');
	};

	// add random number generation button in header
	data[0].forEach((col, col_idx) => {
		if (col.extraButton) {
			const btn = (
				<V2Button
					size='small'
					variant='outlined'
					color='secondary'
					onClick={generateSeed}
					css={`
						border: none;
						margin-left: 30px;
						min-width: unset;
						:hover {
							background-color: unset;
							border: none;
							color: #12c498;
						}
					`}
				>
					<FontAwesomeIcon icon={faRandom} />
				</V2Button>
			);
			data[0][col_idx].extraButton = btn;
		}
	});

	const check = checkAddDeleteRow(other_capex);

	const toggleProbabilistic = () => {
		const newOtherCapex = produce(other_capex, (draft) => {
			draft.probCapex = !probCapex;
		});
		setOtherCapex(newOtherCapex, 'other_capex');
	};

	if (!data) {
		return null;
	}

	return (
		<div id='cost-model-detail-inputs' className='capex_sheet sub-model-detail-sheet' css='display: flex;'>
			<div className='cost-model-detail-header-row'>
				{isProbabilisticCapexEnabled && (
					<V2Button
						size='small'
						variant='outlined'
						color='secondary'
						onClick={toggleProbabilistic}
						css='margin-left: auto; margin-bottom: 10px;'
					>
						{probCapex ? 'Standard CAPEX' : 'Probabilistic CAPEX'}
					</V2Button>
				)}
			</div>
			<div className='data-sheet-paper'>
				<ReactDataSheet
					data={data}
					dataRenderer={dataRenderer}
					valueRenderer={valueRenderer}
					selected={selected.capex_sheet}
					onSelect={(sel) => onSelect('capex_sheet', sel)}
				/>
			</div>
			<div id='add-delete-row'>{check.showBtn && getAddDeleteItems(check)}</div>
		</div>
	);
}
