import { useDrag, useDrop } from 'react-dnd';
import styled, { css } from 'styled-components';

import { ReactSelect } from '@/components';
import { ReactDatePicker } from '@/components/v2';
import { InfoTooltipWrapper } from '@/components/v2/misc/InfoIcon';
import { ifProp, theme } from '@/helpers/styled';
import { CHOICE, EQUAL, HIGH, LOW, NUMBER, PERCENT, STRING } from '@/lookup-tables/shared/constants';
import {
	getBooleanWarning,
	getFixedDateWarning,
	getFixedNumberWarning,
	getRangeWarnings,
	isBooleanType,
	isFixedDateType,
	isFixedNumberType,
	isRangeType,
} from '@/lookup-tables/shared/validators';

import { getRowSourceSpec, getRowTargetSpec } from './drag-drop';

const ROW_HEIGHT = '30';

const HeaderContent = styled.div`
	& {
		padding: 0 1rem;
		min-width: ${({ minWidth = 200 }) => minWidth}px;
		border-left: 0;
		border-top: 0;
		height: ${({ height = ROW_HEIGHT }) => height}px !important;
		border: 1px solid ${theme.borderColor};
		display: flex;
		align-items: center;
		justify-content: center !important;
	}
`;

const StyledHeader = styled.th`
	position: sticky;
	top: ${({ top }) => (top ? `${top}px` : 0)};
`;

const Header = ({ minWidth, isOver, children, top, height, ...rest }) => {
	const className = isOver ? 'cell read-only drop-target' : 'cell read-only';
	return (
		<StyledHeader className={className} top={top} {...rest}>
			<HeaderContent className='value-viewer' height={height} minWidth={minWidth}>
				{children}
			</HeaderContent>
		</StyledHeader>
	);
};

function headerColumnMapper({ name, key, type, tooltip }, index) {
	const text = <InfoTooltipWrapper tooltipTitle={tooltip}>{name}</InfoTooltipWrapper>;
	if (isRangeType(type)) {
		return (
			<Header colSpan='2' key={key} columnIndex={index}>
				{text}
			</Header>
		);
	}
	return (
		<Header height={ROW_HEIGHT * 2} rowSpan='2' key={key} columnIndex={index}>
			{text}
		</Header>
	);
}

function getRangedText(type, col) {
	if (type === NUMBER || type === PERCENT) {
		if (col === 'low') {
			return 'Min (>=)';
		}
		return 'Max (<=)';
	}
	if (col === 'low') {
		return 'Start (>=)';
	}
	return 'End (<=)';
}

function subHeaderColumnMapper(row, { key, type }) {
	const isRanged = isRangeType(type);
	if (isRanged) {
		row.push(
			<Header top={ROW_HEIGHT} key={`${key}-low`}>
				{getRangedText(type, 'low')}
			</Header>
		);
		row.push(
			<Header top={ROW_HEIGHT} key={`${key}-high`}>
				{getRangedText(type, 'high')}
			</Header>
		);
	}
}

export const SheetRenderer = ({ className, headerColumns = [], assignmentColumns = [], children }) => {
	const headerCols = [
		<Header height={ROW_HEIGHT * 2} rowSpan='2' key='drag-drop' columnIndex={0} minWidth={100}>
			Priority
		</Header>,
		...headerColumns.map((v, i) => headerColumnMapper(v, i + 1)),
		...assignmentColumns.map((v, i) => headerColumnMapper(v, i + headerColumns.length + 1)),
	];
	const subHeaderCols = [];
	headerColumns.forEach((v) => subHeaderColumnMapper(subHeaderCols, v));
	assignmentColumns.forEach((v) => subHeaderColumnMapper(subHeaderCols, v));
	return (
		<table className={className}>
			<thead>
				<tr>{headerCols}</tr>
				<tr>{subHeaderCols}</tr>
			</thead>
			<tbody>{children}</tbody>
		</table>
	);
};

const Cell = styled.div`
	${ifProp(
		'warning',
		css`
			background: ${theme.warningColorOpaque};
		`
	)}
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const InnerValueViewer = ({ value, showWarning, columnKey: key }) => {
	return (
		<Cell className='value-viewer' warning={showWarning} key={key}>
			{value}
		</Cell>
	);
};

const isEnterKey = (ev) => ev.key === 'Enter';

const SelectViewer = ({ value, onChange, onCommit, cell: { options = [] } }) => {
	const mappedOptions = options?.map((option) =>
		typeof option === 'string' ? { label: option, value: option } : option
	);
	const changeAndCommit = ({ value: newValue }) => {
		onCommit(newValue);
	};
	return (
		<ReactSelect
			value={value}
			inputValue={value}
			onChange={changeAndCommit}
			onInputChange={onChange}
			autoFocus
			onKeyDown={(event) => {
				if (isEnterKey(event)) {
					onCommit(value);
				}
			}}
			options={mappedOptions}
		/>
	);
};

const FixedDateViewer = ({ value, onCommit }) => {
	return (
		<div
			css={{
				position: 'absolute',
				zIndex: 1000,
			}}
		>
			<ReactDatePicker inline onChange={(newValue) => onCommit(newValue.toLocaleDateString())} value={value} />
		</div>
	);
};

const ValueViewer = ({ value, cell: { showWarning, key }, row }) => {
	return <InnerValueViewer value={value} showWarning={showWarning} key={key} columnKey={`${row}-${key}`} />;
};

const booleanOptions = [
	{ value: 'Yes', label: 'Yes' },
	{ value: 'No', label: 'No' },
];
function rowGridColumnMapper(row, { key, type, validValues }, rule) {
	const cellKey = key;
	const sharedProps = {
		columnKey: key,
		key: cellKey,
		valueViewer: ValueViewer,
		value: rule?.conditions?.[key]?.value || rule?.assignments?.[key] || '',
		operator: EQUAL,
	};
	const isRanged = isRangeType(type);
	if (isRanged) {
		const { low, high } = rule?.conditions?.[key] || {};

		const [showLowWarning, showHighWarning] = getRangeWarnings(low, high, type);

		row.push({
			...sharedProps,
			value: low,
			key: `${cellKey}-low`,
			operator: LOW,
			showWarning: showLowWarning,
			valueViewer: ValueViewer,
		});
		row.push({
			...sharedProps,
			value: high,
			key: `${cellKey}-high`,
			operator: HIGH,
			showWarning: showHighWarning,
			valueViewer: ValueViewer,
		});
		return;
	}
	if (key === '_index') {
		row.push({
			value: rule.index + 1,
			columnKey: key,
			readOnly: true,
			key: cellKey,
		});
		return;
	}

	const value = rule?.conditions?.[key]?.value || rule?.assignments?.[key] || '';

	if (isBooleanType(type)) {
		const showWarning = getBooleanWarning(value);
		row.push({
			...sharedProps,
			showWarning,
			dataEditor: SelectViewer,
			options: booleanOptions,
		});
		return;
	}

	if (isFixedDateType(type)) {
		const showWarning = getFixedDateWarning(value);
		row.push({
			...sharedProps,
			showWarning,
			dataEditor: FixedDateViewer,
		});
		return;
	}

	if (isFixedNumberType(type)) {
		const showWarning = getFixedNumberWarning(value);
		row.push({
			...sharedProps,
			showWarning,
		});
		return;
	}

	if (type === CHOICE || type === STRING) {
		row.push({
			...sharedProps,
			showWarning: type !== STRING && !validValues?.find((name) => name === value) && value,
			options: validValues,
			dataEditor: SelectViewer,
		});
		return;
	}

	row.push(sharedProps);
}

export function rowsFromRules(rules = [], headerColumns, assignmentColumns) {
	const newRows = [];
	for (let i = 0; i < rules.length; i++) {
		const rule = rules[i];
		const row = newRows[i] || []; // mutation required ahead; try precaution
		[...headerColumns, ...assignmentColumns].forEach((v) => rowGridColumnMapper(row, v, rule));
		newRows[i] = row;
	}
	return newRows;
}

export const RowRenderer = (props) => {
	const [, connectDragSource, connectDragPreview] = useDrag(getRowSourceSpec(props));
	const [{ isOver }, connectDropTarget] = useDrop(getRowTargetSpec(props));
	const { rowIndex, children } = props;

	const className = isOver ? 'drop-target' : '';

	return connectDropTarget(
		connectDragPreview(
			<tr className={className}>
				{connectDragSource(
					<td className='cell read-only row-handle' key='$$actionCell'>
						<span className='value-viewer'>{rowIndex + 1}</span>
					</td>
				)}
				{children}
			</tr>
		)
	);
};
