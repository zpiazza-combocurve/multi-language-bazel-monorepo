import {
	faBan,
	faBurn,
	faChevronDown,
	faChevronUp,
	faFaucetDrip,
	faFlaskPotion,
	faInfoCircle,
	faSackDollar,
	faTint,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { InputAdornment, Popper, TooltipProps, createTheme } from '@material-ui/core';
import {
	Column,
	GridApi,
	ICellEditor,
	ICellEditorParams,
	ICellRendererParams,
	RowNode,
	SuppressKeyboardEventParams,
} from 'ag-grid-community';
import classNames from 'classnames';
import { add, endOfMonth, format, startOfMonth } from 'date-fns';
import { clamp, isNil, range as lodashRange } from 'lodash';
import { ForwardedRef, RefObject, forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import styled, { CSSProp } from 'styled-components';
import { create } from 'zustand';

import { Autocomplete, Divider, Icon, IconButton, InfoTooltipWrapper, Input, Tooltip } from '@/components/v2';
import { CAPEX_COLUMNS_WITH_DEFAULT } from '@/cost-model/detail-components/capex/CapexAdvancedView/constants';
import { RATE_LABELS } from '@/cost-model/detail-components/expenses/ExpensesAdvancedView/constants';
import { withExtendedThemeProvider } from '@/helpers/theme';
import { assert, isMac } from '@/helpers/utilities';

import { ECON_LIMIT, INVALID_VALUE, PERIOD_DATA_KEY, ROW_ID_KEY } from './constants';
import { parseDateValue } from './shared';
import { AdvancedTableCellEditorAction, AdvancedTableCellEditorActions, TemplateYupDescription } from './types';

export { PERIOD_DATA_KEY };

const ACTIONS_DIVIDER_KEY = '__DIVIDER__';

const AutocompletePopper = styled(Popper)`
	min-width: 10rem;
`;

const columnsWithMDollarsSign = ['tangible', 'intangible'];
const columnsWithDollarSign = ['cap'];

const OIL_ICON = () => (
	<Icon
		fontSize='small'
		css={`
			color: ${({ theme }) => theme.palette.products.oil};
		`}
	>
		{faTint}
	</Icon>
);

const NGL_ICON = () => (
	<Icon
		fontSize='small'
		css={`
			color: ${({ theme }) => theme.palette.products.ngl};
		`}
	>
		{faTint}
	</Icon>
);

const GAS_ICON = () => (
	<Icon
		fontSize='small'
		css={`
			color: ${({ theme }) => theme.palette.products.gas};
		`}
	>
		{faBurn}
	</Icon>
);

const DRIP_COND_ICON = () => (
	<Icon
		fontSize='small'
		css={`
			color: ${({ theme }) => theme.palette.products.drip_cond};
		`}
	>
		{faFlaskPotion}
	</Icon>
);

const FIXED_EXPENSES_ICON = () => (
	<Icon
		fontSize='small'
		css={`
			color: ${({ theme }) => theme.palette.products.fixed_expenses};
		`}
	>
		{faSackDollar}
	</Icon>
);

const WATER_DISPOSAL_ICON = () => (
	<Icon
		fontSize='small'
		css={`
			color: ${({ theme }) => theme.palette.products.water};
		`}
	>
		{faFaucetDrip}
	</Icon>
);

const ICONS_PER_PRODUCT = {
	Oil: <OIL_ICON />,
	NGL: <NGL_ICON />,
	Gas: <GAS_ICON />,
	'Drip Cond': <DRIP_COND_ICON />,
	'Fixed Expenses': <FIXED_EXPENSES_ICON />,
	'Water Disposal': <WATER_DISPOSAL_ICON />,
	Water: <WATER_DISPOSAL_ICON />,
};

export const Cell = styled.div`
	display: flex;
	align-items: center;
	width: 100%;
	height: 100%;
	padding: 0 0.5rem;
	&.error {
		background-color: var(--warning-color-opaque);
	}
`;

const CellInput = styled(Input).attrs({ fullWidth: true, disableUnderline: true })``;

const WRAPPED_VALUE = Symbol('WRAPPED_VALUE');

type ExtraInfo = {
	error?: string;
	description?: TemplateYupDescription;
	start?;
	end?;
};

export type WrappedValue = ExtraInfo & {
	[WRAPPED_VALUE]: true;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	value: any;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
function isWrappedValue(value: any): value is WrappedValue {
	return !!value?.[WRAPPED_VALUE];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const unwrapValue = (v: any | WrappedValue): any => (isWrappedValue(v) ? v.value?.label ?? v.value : v); // HACK: `?.label` is a hack for escalation_model

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const wrapValue = (value: any, extra?: ExtraInfo) =>
	({
		[WRAPPED_VALUE]: true,
		value,
		...extra,
	} as WrappedValue);

const BACKSPACE_KEYCODE = 8;

const DELETE_KEY = 'Delete';
const ENTER_KEY = 'Enter';
const TAB_KEY = 'Tab';

/**
 * @returns True if cell is editable
 * @note it will not work if your editable function requires `column` `columnApi` or `context`
 */
function checkCellEditable(api: GridApi, colId: string, rowNodeId: string) {
	const colDef = api.getColumnDef(colId);

	if (!colDef) {
		// TODO perhaps throw error?
		return false;
	}

	const node = api.getRowNode(rowNodeId);

	if (!node) {
		// TODO perhaps throw error?
		return false;
	}

	if (typeof colDef.editable === 'function') {
		return colDef.editable({
			node,
			data: node.data,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			column: undefined as any, // omitted bc not enough data // TODO find out how to provide it
			colDef,
			api,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			columnApi: undefined as any, // omitted bc not enough data // TODO find out how to provide it
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			context: undefined as any, // omitted bc not enough data // TODO find out how to provide it
		});
	}

	return !!colDef.editable;
}

/**
 * Suppresses ag grid `Enter` key handler when ctrl is pressed
 *
 * @example
 * 	<AgGrid defaultColDef={{ suppressKeyboardEvent: suppressKeyboardEventOnCtrlEnter }} />;
 */
export function suppressKeyboardEventOnCtrlEnter(params: SuppressKeyboardEventParams) {
	const controlOrCommand = isMac ? params.event.metaKey : params.event.ctrlKey;
	return params.event.key === ENTER_KEY && controlOrCommand;
}

export function suppressKeyboardEventOnCtrlShift(params: SuppressKeyboardEventParams) {
	const controlOrCommand = isMac ? params.event.metaKey : params.event.ctrlKey;
	return params.event.shiftKey && controlOrCommand;
}

export function suppressKeyboardEventOnShiftEnter(params: SuppressKeyboardEventParams) {
	return params.event.shiftKey && params.event.key === ENTER_KEY;
}

/**
 * Deletes selected cells when "Delete" key is pressed
 *
 * @example
 * 	<AgGrid defaultColDef={{ suppressKeyboardEvent: suppressKeyboardEventOnEditing }} />;
 *
 * @note need to pass `onDataChange` through the context
 * @see https://blog.ag-grid.com/deleting-selected-rows-and-cell-ranges-via-key-press/#keyboard-events
 * @see https://stackblitz.com/edit/ag-grid-react-immutable-store?file=index.js
 */
export function suppressKeyboardEventOnDelete(params: SuppressKeyboardEventParams) {
	if (params.event.key !== DELETE_KEY) {
		return false;
	}

	const updates = {};
	const model = params.api.getModel();

	params.api.getCellRanges()?.forEach((range) => {
		if (!range.startRow || !range.endRow) {
			throw new Error('Expected ag-grid range to now be null when deleting cells');
		}

		const colIds = range.columns.map((col) => col.getColId());

		const [start, end] = [range.startRow.rowIndex, range.endRow.rowIndex].sort((a, b) => a - b);

		lodashRange(start, end + 1).forEach((i) => {
			const node = model.getRow(i);
			if (node && node.id) {
				updates[node.id] ??= {};
				colIds.forEach((colId) => {
					if (checkCellEditable(params.api, colId, node.id as string)) {
						updates[node.id as string][colId] = undefined;
					}
				});
			}
		});
	});

	params.context.onDataChange?.(updates);

	return true;
}

/** Adjust behavior of pressing tab when editing, wanted: stop the edition */
export function suppressKeyboardEventOnEditingTab(params: SuppressKeyboardEventParams) {
	if (params.event.key !== TAB_KEY || !params.editing) {
		return false; // only trap tab key when editing
	}

	params.event.preventDefault();
	params.api.stopEditing();
	if (params.event.shiftKey) {
		params.api.tabToPreviousCell();
	} else {
		params.api.tabToNextCell();
	}
	return true;
}

/** Adjust the behavior of pressing enter when editing to navigate downwards */
export function suppressKeyboardEventOnEditingEnter(params: SuppressKeyboardEventParams) {
	if (params.event.key !== ENTER_KEY || !params.editing) {
		return false; // only trap enter key when editing
	}
	const cells = params.api.getEditingCells();

	assert(cells.length === 1, 'Expected to be editing one cell only');

	const [cell] = cells;

	params.event.preventDefault();
	params.api.stopEditing();
	const model = params.api.getModel();
	const totalRows = model.getRowCount();

	const newRowIndex = clamp(cell.rowIndex + 1, totalRows - 1);

	params.api.setFocusedCell(newRowIndex, cell.column);
	params.api.clearRangeSelection();

	params.api.addCellRange({ rowStartIndex: newRowIndex, rowEndIndex: newRowIndex, columns: [cell.column] });
	return true;
}

/**
 * Uses autocomplete free solo for cell editing
 *
 * Accepts `description` (see yup.describe) through the ag grid `cellEditorParams.value.description`
 *
 * @example
 * 	<AgGrid
 * 		columnDefs={[
 * 			{
 * 				field: 'myField',
 * 				cellEditorFramework: FreeSoloCellEditor,
 * 				suppressKeyboardEvent: suppressKeyboardEventOnEditing,
 * 			},
 * 		]}
 * 	/>;
 *
 * @note need to pass `suppressKeyboardEvent` to allow enter key to work
 * @see https://v4.mui.com/components/autocomplete/#free-solo
 */
export const FreeSoloCellEditor = forwardRef(
	(
		props: ICellEditorParams & {
			options?: string[];
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			getOptions?: (colId: string | undefined, rowData: any) => any[];
			getOptionLabel?: (option) => string;
			tooltips?: Record<string, string>;
			actions?: AdvancedTableCellEditorAction[];
			freeSolo?: boolean;
		},
		ref: ForwardedRef<ICellEditor>
	) => {
		const {
			stopEditing,
			tooltips,
			actions,
			freeSolo = true,
			getOptions,
			getOptionLabel = (option) => option,
			colDef,
			data,
		} = props;
		const inputRef = useRef<HTMLInputElement>(null);
		const actionLabels = (actions ?? []).map(({ label }) => label);
		const mergedOptions = useMemo(() => [...actionLabels], [actionLabels]);

		if (mergedOptions.length > 0 && (props.options ?? []).length > 0) {
			mergedOptions.push(ACTIONS_DIVIDER_KEY);
		}

		mergedOptions.push(...(props.options ?? []), ...(getOptions?.(colDef.field, data) ?? []));

		const shouldSupportNAOption = useMemo(() => mergedOptions.some((option) => isNil(option)), [mergedOptions]);

		const highlightedRef = useRef<string | null>(null);
		const enterRef = useRef(false);
		const [inputValue, setInputValue] = useState('');
		const shouldDisplayNAAsSelectedRef = useRef(false);

		const setValue = (val: string) => {
			const value = val ?? '';
			if (inputRef.current) {
				inputRef.current.value = value;
			}
			setInputValue(value);
		};

		useImperativeHandle(ref, () => ({
			getValue: () => {
				if (
					(shouldDisplayNAAsSelectedRef.current && !inputRef.current?.value) ||
					(shouldDisplayNAAsSelectedRef.current && inputRef.current?.value === 'N/A')
				) {
					return null;
				}
				const inputValue = inputRef.current?.value ?? '';
				const highlightedValue = highlightedRef.current;
				return props.parseValue(enterRef.current ? highlightedValue ?? inputValue : inputValue);
			},
		}));

		useEffect(() => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
			// @ts-expect-error
			if (props.keyPress === BACKSPACE_KEYCODE) {
				setValue('');
				inputRef.current?.focus();
				return;
			}
			if (props.charPress) {
				setValue(props.charPress);
				inputRef.current?.focus();
				return;
			}

			const receivedValue = props.formatValue(unwrapValue(props.value));

			// If we should support NA as an option and we have received an empty string,
			// we should recommend the user to make use of N/A.
			// Otherwise as the string is already empty, selecting N/A would not do anything
			// as its parsed value at this point is === '' too.
			if (shouldSupportNAOption && !receivedValue) {
				setValue('N/A');
				inputRef.current?.focus();
				shouldDisplayNAAsSelectedRef.current = true;
				return;
			}

			setValue(receivedValue);
			inputRef.current?.focus();
			inputRef.current?.select();
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, []);

		useEffect(() => {
			// HACK needed to capture the event faster than the grid
			const handler = (ev) => {
				if (ev.key === 'Delete') {
					setValue('');
					stopEditing();
				}
				if (['Enter', 'Tab'].includes(ev.key)) {
					enterRef.current = true;
				}
			};
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			const input = inputRef.current!;
			input.addEventListener('keydown', handler);
			return () => input.removeEventListener('keydown', handler);
		}, [stopEditing]);

		return (
			<Cell>
				<Autocomplete
					css={`
						width: 100%;
						.MuiAutocomplete-popper {
							min-width: 20rem;
						}
					`}
					PopperComponent={AutocompletePopper}
					// autoHighlight
					freeSolo={freeSolo}
					openOnFocus
					disableClearable
					inputRef={inputRef}
					options={mergedOptions.map((option) => props.formatValue(option))}
					inputValue={inputValue}
					value={actionLabels.length > 0 ? inputValue : undefined}
					onInputChange={(_ev, newValue) => {
						setValue(newValue);

						const upperCasedValue = newValue.toUpperCase();
						const NAWasInputByUser = shouldSupportNAOption && upperCasedValue === 'N/A';

						// If N/A is a supported option and the user has
						// selected N/A from the dropdown, we should display
						// N/A as selected and stop editing.
						// Stopping the edit is needed as otherwise the input
						// component would think this is an invalid input and
						// therefore keep the user editing a cell which will
						// seem empty to them as when the mergedOptions are parsed,
						// null values (N/As) are parsed as empty strings when selected.
						if (shouldSupportNAOption && _ev?.type === 'click' && !newValue) {
							shouldDisplayNAAsSelectedRef.current = true;
							props.stopEditing();
							return;
						}

						// If N/A is a supported option and the user has
						// typed-in N/A we should not display N/A as plain
						// text but instead handle it properly just as if the option
						// was selected from the dropdown.
						if (shouldSupportNAOption && _ev?.type !== 'click' && NAWasInputByUser) {
							shouldDisplayNAAsSelectedRef.current = true;
							return;
						}

						// If N/A is a supported option and the user has
						// deleted all the content within the input, we should not
						// display N/A as selected and instead display the input as empty;
						if (shouldSupportNAOption && !newValue) {
							shouldDisplayNAAsSelectedRef.current = false;
						}
					}}
					InputProps={{ disableUnderline: true }}
					filterOptions={(options) => options}
					onHighlightChange={(_ev, option) => {
						highlightedRef.current = option;
					}}
					onChange={async (_ev, newValue) => {
						if (actionLabels.includes(newValue)) {
							setValue(props.formatValue(unwrapValue(props.value)));
							props.stopEditing();
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
							await actions!.find(({ label }) => label === newValue)!.onClick(props.data[ROW_ID_KEY]);
						} else {
							setValue(newValue);
							props.stopEditing();
						}
					}}
					renderOption={(itemValue) => {
						if (itemValue === ACTIONS_DIVIDER_KEY) {
							return <Divider css='width: 100%;' />;
						}

						return (
							<InfoTooltipWrapper placeIconAfter tooltipTitle={tooltips?.[itemValue]}>
								{getOptionLabel(itemValue)}
							</InfoTooltipWrapper>
						);
					}}
					getOptionDisabled={(value) => value === ACTIONS_DIVIDER_KEY}
				/>
			</Cell>
		);
	}
);

/** Makes the number look more consistent, removes dangling 0s */
const tryParseNumber = (v: string) => {
	const parsed = Number(v);
	if (Number.isFinite(parsed)) {
		return parsed.toString();
	}
	return v;
};

interface CellEditorProps extends ICellEditorParams {
	type?: string;
	extraData?: { criteria: string; start; isLastRow; end };
}

const CellEditor = forwardRef((props: CellEditorProps, ref: ForwardedRef<ICellEditor>) => {
	const { extraData } = props;
	const [value, setValue] = useState('');
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (props.charPress) {
			setValue(props.charPress);
			inputRef.current?.focus();
			return;
		}
		setValue(unwrapValue(props.value));
		inputRef.current?.focus();
		inputRef.current?.select();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useImperativeHandle(ref, () => ({
		getValue: () => {
			if (props.type === 'number') {
				if (value === '') return null;
				return tryParseNumber(value);
			}
			return value;
		},
	}));

	const placeholder = (() => {
		if (!extraData) return null;
		const { criteria, start, isLastRow, end } = extraData;
		if (criteria === 'Flat') return null;
		if (criteria === 'Flat') return null;
		if (criteria === 'Dates') return formatDateRange(value, end, isLastRow);
		if (RATE_LABELS.includes(criteria)) return formatMonthRange(start, end, isLastRow);
		return formatMonthRange(start, typeof end === 'number' ? end - 1 : end, isLastRow);
	})();

	return (
		<Cell>
			<CellInput
				inputRef={inputRef}
				value={value ?? ''}
				onChange={(event) => setValue(event.target.value)}
				endAdornment={placeholder ? <InputAdornment position='end'>{placeholder}</InputAdornment> : null}
			/>
		</Cell>
	);
});

interface GenericCellEditorParams extends ICellEditorParams {
	description?: TemplateYupDescription;
	actions?: AdvancedTableCellEditorActions;
}

export const GenericCellEditor = forwardRef(
	({ description, actions, ...props }: GenericCellEditorParams, ref: ForwardedRef<ICellEditor>) => {
		const column = props.column.getColId();
		if (column === 'period') {
			const { criteria } = props.data[PERIOD_DATA_KEY];
			if (criteria !== 'Flat') {
				return <CellEditor {...props} extraData={props.data[PERIOD_DATA_KEY]} ref={ref} />;
			}
		}
		if (description?.oneOf?.length || actions?.[column]?.length) {
			return (
				<FreeSoloCellEditor
					{...props}
					options={description?.oneOf ?? []}
					actions={actions?.[column]}
					tooltips={description?.meta?.tooltips}
					ref={ref}
				/>
			);
		}
		return <CellEditor {...props} ref={ref} type={description?.type} />;
	}
);

export interface CellRendererProps extends ICellRendererParams {
	error?: string;
	description?: TemplateYupDescription;
	tooltipMessage?: string;
	isCellEditable?: boolean;
}

function formatDateRange(start, end, isLastRow) {
	const startDate = (() => {
		const startDate = parseDateValue(start);

		if (startDate === INVALID_VALUE || startDate === ECON_LIMIT) {
			return ' ';
		}

		return format(startOfMonth(startDate), 'MM/dd/yyyy');
	})();

	const endDate = (() => {
		const endDate = parseDateValue(end);

		if (isLastRow) {
			return 'Econ Limit';
		}

		if (endDate === INVALID_VALUE || endDate === ECON_LIMIT) {
			return ' ';
		}

		return format(endOfMonth(add(endDate, { months: -1 })), 'MM/dd/yyyy');
	})();

	return `${startDate} - ${endDate}`;
}

function formatMonthRange(start, end, isLastRow) {
	if (!Number.isFinite(Number(start)) || !Number.isFinite(Number(start))) return null;
	if (!isLastRow && (!Number.isFinite(Number(end)) || !Number.isFinite(Number(end)))) return `${start} - `;
	return `${start} - ${end}`;
}

interface ProductIndicatorProps {
	column: string;
	value: string;
	forceRender?: boolean;
	customCSS?: CSSProp;
	isELTRow?: boolean;
}

export function ProductIndicator({ column, value, forceRender, customCSS, isELTRow }: ProductIndicatorProps) {
	if (!forceRender && columnsWithMDollarsSign.includes(column) && !isELTRow) {
		return <span css={customCSS}>$M </span>;
	}

	if (!forceRender && columnsWithDollarSign.includes(column) && !isELTRow && !!value) {
		return <span css={customCSS}>$ </span>;
	}

	if (!forceRender && column !== 'key') {
		return null;
	}

	return ICONS_PER_PRODUCT[value] ?? null;
}

function getCriteriaPlaceholder(props, criteria) {
	const item = props.description?.meta?.template?.menuItems?.find(
		({ label }) => label.toLowerCase() === criteria.toLowerCase()
	);

	const value = item?.valType ?? item?.unit;

	if (!value) {
		return;
	}

	if (value === 'datetime') {
		return 'Dates';
	}

	if (value === 'months') {
		return 'Months';
	}

	return value;
}

export function isNodeFocused(api: GridApi, node: RowNode, column: Column) {
	const focus = api.getFocusedCell();

	if (!focus) return false;

	return focus.column.getId() === column.getId() && focus.rowIndex === node.rowIndex;
}

interface ControlledTooltipProps extends TooltipProps {
	forceOpen: boolean;
	children: React.ReactElement;
	title: string;
}

const useTooltipStore = create(() => ({
	isHovering: false,
}));

export const ControlledTooltip = forwardRef(({ ...props }: ControlledTooltipProps, ref) => {
	// https://v4.mui.com/components/tooltips/#controlled-tooltips
	const { forceOpen, ...tooltipProps } = props;
	const [open, setOpen] = useState(false);
	const { isHovering } = useTooltipStore();

	const onOpen = () => {
		setOpen(true);
		if (!forceOpen) {
			useTooltipStore.setState({ isHovering: true });
		} else {
			useTooltipStore.setState({ isHovering: false });
		}
	};

	const onClose = () => {
		setOpen(false);
		useTooltipStore.setState({ isHovering: false });
	};

	return (
		<Tooltip
			ref={ref}
			open={(forceOpen && !isHovering) || open}
			{...tooltipProps}
			onClose={() => onClose()}
			onOpen={() => onOpen()}
		/>
	);
});

function useOnScreen(ref: RefObject<HTMLElement>, options?: IntersectionObserverInit) {
	const [isIntersecting, setIntersecting] = useState(false);

	const observer = useMemo(
		() => new IntersectionObserver(([entry]) => setIntersecting(entry.isIntersecting), options),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ref]
	);

	useEffect(() => {
		if (ref.current) {
			observer.observe(ref.current);
			return () => observer.disconnect();
		}
	}, [observer, ref]);

	return isIntersecting;
}

const TooltipCellIcon = ({ isCellEditable }: { isCellEditable?: boolean }) => (
	<span css={{ flex: '1 0 auto', textAlign: 'left' }}>
		<FontAwesomeIcon
			css={{
				cursor: 'help',
				width: '1em',
			}}
			icon={isCellEditable ? faInfoCircle : faBan}
		/>
	</span>
);

export function CellRenderer(props: CellRendererProps) {
	const { valueFormatted, error, data, tooltipMessage, isCellEditable } = props;
	const { isELTRow } = data ?? {};

	const column = props?.column?.getColId() || '';

	const placeholder = (() => {
		if (isELTRow && column !== 'eltName') {
			return null;
		}

		if (props.data?.[PERIOD_DATA_KEY]) {
			const { criteria, start, isLastRow, end } = props.data[PERIOD_DATA_KEY];

			if (column === 'criteria') {
				return getCriteriaPlaceholder(props, criteria);
			}

			if (column !== 'period') {
				const def = props.description?.meta?.default ?? props.description?.meta?.template?.Default?.label; // HACK for fixed expenses
				// if formattedValue is falsy and there's a default value to replace it with
				if (valueFormatted == null && def != null) return def;
				return;
			}

			if (valueFormatted == null || criteria === 'Flat') return null;
			if (criteria === 'Dates') return formatDateRange(valueFormatted, end, isLastRow);
			if (RATE_LABELS.includes(criteria)) return formatMonthRange(start, end, isLastRow);
			return formatMonthRange(start, typeof end === 'number' ? end - 1 : end, isLastRow);
		}

		if (CAPEX_COLUMNS_WITH_DEFAULT.includes(column)) {
			const defaultValue = props.description?.meta?.default;

			// if formattedValue is falsy and there's a default value to replace it with
			if (valueFormatted == null && defaultValue != null) return defaultValue;
		}
	})();

	const productIndicatorCSS = [...columnsWithMDollarsSign, ...columnsWithDollarSign].includes(column)
		? { color: 'var(--text-color-secondary)' }
		: {};

	const hasError = Boolean(error);

	const ref = useRef<HTMLDivElement>(null);
	const isVisible = useOnScreen(ref, {
		root: ref.current?.parentElement?.parentElement?.parentElement?.parentElement,
	});

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const isFocused = isNodeFocused(props.api, props.node, props.column!);

	const shouldForceOpenTooltip = isFocused && isVisible && hasError;

	const isCellOmitted = props?.description?.tests?.find(({ name }) => name === 'omitted');
	const isAggCell = !!props?.node?.aggData;
	const shouldDisplayTooltipCellIcon = tooltipMessage && !isCellOmitted && !isAggCell;

	const cell = (
		<ControlledTooltip ref={ref} forceOpen={shouldForceOpenTooltip} title={error || ''} placement='top'>
			<Cell css={{ display: 'flex' }} className={classNames({ error: hasError })}>
				{shouldDisplayTooltipCellIcon && <TooltipCellIcon isCellEditable={isCellEditable} />}
				<span css={{ flex: '1 0 auto' }}>
					<ProductIndicator
						column={column ?? ''}
						value={valueFormatted}
						customCSS={productIndicatorCSS}
						isELTRow={isELTRow}
					/>
					{valueFormatted}
				</span>
				<span css={{ flex: '0 1 auto', color: 'var(--text-color-secondary)', marginLeft: '0.5rem' }}>
					{placeholder}
				</span>
			</Cell>
		</ControlledTooltip>
	);

	return cell;
}

function useRerender() {
	const [, setState] = useState(() => Symbol('rerender'));
	return () => setState(Symbol('rerender'));
}

export function CellRendererRowGroup(props: CellRendererProps) {
	const { valueFormatted, error, tooltipMessage } = props;

	const cellWithToggle =
		(props?.colDef?.field === 'key' && !props?.data?.isELTRow) ||
		(props?.colDef?.field === 'eltName' && props?.data?.isELTRow);

	const rerender = useRerender();

	const handleToggleGroup = () => {
		rerender();
		props.api.setRowNodeExpanded(props.node, !props.node.expanded);
	};

	const column = props?.column?.getColId();

	const placeholder = (() => {
		if (props?.colDef?.field === 'eltName' && props?.data?.isELTRow) {
			return 'Select a Lookup Table';
		}

		return null;
	})();

	const hasError = Boolean(error);

	const ref = useRef<HTMLDivElement>(null);
	const isVisible = useOnScreen(ref, {
		root: ref.current?.parentElement?.parentElement?.parentElement?.parentElement,
	});

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const isFocused = isNodeFocused(props.api, props.node, props.column!);

	const shouldForceOpenTooltip = isFocused && isVisible && hasError;

	const cell = (
		<ControlledTooltip ref={ref} forceOpen={shouldForceOpenTooltip} title={error || ''} placement='top'>
			<Cell className={classNames({ error: hasError })} css={{ gap: '0.5rem' }}>
				{cellWithToggle && props.node.allChildrenCount != null && props.node.allChildrenCount > 0 && (
					<IconButton onClick={handleToggleGroup} size='small'>
						{props.node.expanded ? faChevronUp : faChevronDown}
					</IconButton>
				)}
				<ProductIndicator column={column ?? ''} value={valueFormatted} />
				<InfoTooltipWrapper tooltipTitle={tooltipMessage} tooltipPlacement='right' placeIconAfter>
					{valueFormatted || (
						<span css={{ color: 'var(--text-color-secondary)', marginLeft: '0.5rem' }}>{placeholder}</span>
					)}
				</InfoTooltipWrapper>
			</Cell>
		</ControlledTooltip>
	);

	return cell;
}

export const AgGridTheme = withExtendedThemeProvider((prevTheme) =>
	createTheme({
		...prevTheme,
		overrides: {
			...prevTheme.overrides,
			MuiInput: { root: { fontSize: '14px' } },
			MuiTypography: { body1: { fontSize: '14px' } },
		},
	})
);

export const eltColumnDefinition = {
	field: 'eltName',
	headerName: 'Embedded Lookup Table',
	minWidth: 260,
	cellRenderer: CellRendererRowGroup,
};
