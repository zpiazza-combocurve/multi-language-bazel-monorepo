import { faCopy } from '@fortawesome/pro-light-svg-icons';
import { faChevronRight, faEllipsisV, faExclamationTriangle } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ListItemIcon, ListItemText } from '@material-ui/core';
import {
	ColDef,
	GetContextMenuItemsParams,
	ModelUpdatedEvent,
	SelectionChangedEvent,
	SortChangedEvent,
} from 'ag-grid-community';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link as ReactRouterLink } from 'react-router-dom';

import { PERMISSIONS_TOOLTIP_MESSAGE } from '@/access-policies/Can';
import { Placeholder } from '@/components';
import AgGrid, { AgGridRef, CHECKBOX_COLUMN_DEF, useGridStateStorage } from '@/components/AgGrid';
import { Box, Button, IconButton, Menu, MenuItem, faIcon } from '@/components/v2';
import { useGetColor } from '@/components/v2/helpers';
import { useAgentVersions, useCompareVersions } from '@/data-sync/agent-instances/Agents.hooks';
import { confirmationAlert, failureAlert } from '@/helpers/alerts';
import { theme as styledTheme } from '@/helpers/styled';
import { hasNonWhitespace } from '@/helpers/text';
import useSyncFilterURLParams from '@/module-list/ModuleList/hooks/useSyncFilterURLParams';

import { HeaderCheckboxSelection } from './HeaderCheckboxSelection';
import { FiltersContext } from './filters/shared';

const TagCellRenderer = (props) => {
	return <div>{props.value}</div>;
};

const LinkCellRenderer = (props) => (
	<div>
		<ReactRouterLink to={props.value.url}>{props.value.label}</ReactRouterLink>
	</div>
);

const IconRenderer = (props) => {
	return <FontAwesomeIcon size='lg' icon={props.value.icon} color={props.value.color} />;
};

const AdditionalActions = (props) => {
	const { itemActionBtns, item } = props;
	const getColor = useGetColor();
	const [anchorEl, setAnchorEl] = useState(null);

	if (!itemActionBtns) {
		return null;
	}

	const itemActions = itemActionBtns(item);

	if (!itemActions.length) {
		return null;
	}

	if (itemActions.length === 1) {
		const action = itemActions[0];
		const { icon, color, label, onClick, disabled } = action;

		return (
			<IconButton
				css={`
					margin: 0.5rem;
				`}
				size='small'
				color={color}
				disabled={disabled}
				tooltipTitle={label}
				onClick={() => onClick(item)}
			>
				{icon}
			</IconButton>
		);
	}

	const openMenu = (event) => {
		setAnchorEl(event.currentTarget);
	};

	const closeMenu = () => {
		setAnchorEl(null);
	};

	const actions = itemActions.map(({ icon, label, onClick, color, disabled }, i) => {
		const customColor = getColor(color);

		return (
			<MenuItem
				key={i}
				disabled={disabled}
				onClick={(ev) => {
					closeMenu();
					onClick(item);
					ev.preventDefault();
					ev.stopPropagation();
				}}
			>
				{icon && (
					<ListItemIcon
						css={`
							min-width: 28px;
							${customColor && `color: ${customColor};`}
						`}
					>
						{faIcon(icon)}
					</ListItemIcon>
				)}
				<ListItemText>{label}</ListItemText>
			</MenuItem>
		);
	});

	return (
		<>
			<IconButton onClick={openMenu} size='medium'>
				{faEllipsisV}
			</IconButton>

			<Menu
				anchorEl={anchorEl}
				keepMounted
				open={!!anchorEl}
				onClose={closeMenu}
				PaperProps={{
					style: {
						minWidth: '200px',
					},
				}}
			>
				{actions}
			</Menu>
		</>
	);
};

const ConditionalIconRenderer = (props) => {
	const conditionalIcon = props?.calculateCondition?.(props);
	return (
		<Box style={{ overflow: 'hidden' }}>
			{props.value}
			{conditionalIcon && (
				<FontAwesomeIcon
					style={{
						position: 'absolute',
						top: 0,
						bottom: 0,
						right: 0,
						margin: 'auto',
					}}
					title={conditionalIcon.title}
					color={conditionalIcon.color}
					icon={conditionalIcon.icon}
				/>
			)}
		</Box>
	);
};

const VersionRenderer = (props) => {
	const { data: versions } = useAgentVersions();
	const currentVersion = props.data.version;
	const hasLatestVersion = useCompareVersions(currentVersion, versions);

	return (
		<Box style={{ overflow: 'hidden' }}>
			{props.value}
			{!hasLatestVersion && (
				<FontAwesomeIcon
					style={{
						position: 'absolute',
						top: 0,
						bottom: 0,
						right: 0,
						margin: 'auto',
					}}
					title='There is a new version available'
					color='orange'
					icon={faExclamationTriangle}
				/>
			)}
		</Box>
	);
};

const RegistrationKeyCellRenderer = (props) => {
	const handleIconClick = () => {
		navigator.clipboard.writeText(props.value);
		confirmationAlert(`Registration key added to clipboard`);
	};
	return (
		<div
			css={`
				max-width: calc(100% - 0.5rem);
				overflow: hidden;
			`}
		>
			{props.value}
			<IconButton
				css={`
					position: absolute;
					right: 0;
					margin: 0.5rem 0;
				`}
				size='small'
				tooltipTitle='Copy registration key'
				onClick={handleIconClick}
			>
				{faCopy}
			</IconButton>
		</div>
	);
};

const ActionsCellRenderer = (props) => {
	const { workMe, workMeName, data, itemActionBtns } = props;

	return (
		<div>
			{workMe && (
				<Button
					size='small'
					href=''
					variant='outlined'
					color='secondary'
					endIcon={faChevronRight}
					onClick={() => workMe(data)}
				>
					{workMeName ?? 'Work'}
				</Button>
			)}
			<AdditionalActions itemActionBtns={itemActionBtns} item={data} />
		</div>
	);
};

const CELL_RENDERERS = {
	tags: TagCellRenderer,
	link: LinkCellRenderer,
	icon: IconRenderer,
	version: VersionRenderer,
	conditionalIcon: ConditionalIconRenderer,
	registrationKey: RegistrationKeyCellRenderer,
};

export const ModulesTable = (props) => {
	const agGridRef = useRef<AgGridRef>(null);

	const {
		loaded,
		loading,
		currentItem,
		feat,
		items,
		itemDetails,
		onRowClicked,
		workMe,
		workMeName,
		itemActionBtns,
		hideActions,
		selection,
	} = props;

	useSyncFilterURLParams();
	const { initialFilters, setFilters, filters: appliedFilters } = useContext(FiltersContext);

	const { sort: initialSort, sortDir: initialSortDir } = initialFilters;
	const { sort: appliedSort, sortDir: appliedSortDir } = appliedFilters;

	const sortFromContext = appliedSort || initialSort;
	const sortDirFromContext = +appliedSortDir || +initialSortDir;

	const rowData = useMemo(
		() => [
			...(items ?? []).reduce(
				(itemList, item) => {
					// Exclude current project not to duplicate it in the list
					if (currentItem?._id === item._id) {
						return itemList;
					}
					itemList.push(item);
					return itemList;
				},
				[...(currentItem ? [{ ...currentItem, isCurrentItem: true }] : [])]
			),
		],
		[currentItem, items]
	);

	useEffect(() => {
		if (loading) {
			const api = agGridRef.current?.api;

			api?.showLoadingOverlay();

			return () => {
				api?.hideOverlay();
			};
		}
	}, [loading]);

	// https://www.ag-grid.com/react-data-grid/react-hooks/#column-definitions
	const columnDefs = useMemo(
		() => [
			...(selection
				? [
						{
							...CHECKBOX_COLUMN_DEF,
							initialPinned: 'left',
							colId: 'selection',
							headerName: 'Selection',
							headerCheckboxSelection: false,
							headerComponent: HeaderCheckboxSelection,
							headerComponentParams: { selection },
						},
				  ]
				: []),
			...(hideActions
				? []
				: [
						{
							colId: 'actions',
							headerName: 'Actions',
							sortable: false,
							lockVisible: true,
							cellRenderer: ActionsCellRenderer,
							cellRendererParams: {
								workMe,
								workMeName,
								itemActionBtns,
							},
						},
				  ]),
			...itemDetails.map((item) => {
				const {
					title,
					key,
					label,
					value,
					sort,
					onRename,
					canRename,
					width,
					type,
					cellRenderer,
					cellRendererParams,
					onCellClicked,
				} = item;

				return {
					type: type === 'number' ? 'numericColumn' : '',
					field: key,
					initialWidth: width ?? 140,
					tooltipValueGetter: (params) => {
						if (title) {
							return title(params.data);
						}
					},
					headerName: label,
					sortable: !!sort,
					initialSort: key === sortFromContext ? (sortDirFromContext === 1 ? 'asc' : 'desc') : null,
					editable: !!onRename,
					onCellValueChanged: async (event) => {
						const { newValue, oldValue, column, node, data } = event;

						try {
							await onRename(newValue, data);
							confirmationAlert('Name updated successfully');
						} catch (e) {
							if (node) {
								data[column.getColId()] = oldValue;
								event.api.refreshCells({
									rowNodes: [node],
								});
							}
							failureAlert(e?.message);
						}
					},
					onCellClicked,
					cellRenderer: CELL_RENDERERS[cellRenderer],
					cellRendererParams,
					valueGetter: (item) => value(item.data),
					valueSetter:
						key === 'name'
							? (params) => {
									const { data, newValue, oldValue } = params;
									const validValue = hasNonWhitespace(newValue);
									const changed = newValue !== oldValue;
									const isValid = validValue && changed;

									const canRenameItem = canRename?.(data) ?? true;

									if (!canRenameItem) {
										failureAlert(PERMISSIONS_TOOLTIP_MESSAGE);
										return false;
									}

									if (isValid) {
										data.name = newValue;
									}

									return isValid;
							  }
							: () => true,
				} as ColDef;
			}),
		],
		[workMe, workMeName, itemActionBtns, sortDirFromContext, sortFromContext, itemDetails, hideActions, selection]
	);

	const { tableStorageProps } = useGridStateStorage(`${feat}ModuleList_v4`);

	const handleOnSortChanged = (event: SortChangedEvent) => {
		const columnState = event.columnApi.getColumnState();
		const sortedColumn = columnState.find((column) => column.sort);

		if (sortedColumn) {
			setFilters({ sortDir: sortedColumn.sort === 'asc' ? 1 : -1, sort: sortedColumn.colId });
		} else {
			setFilters({ sortDir: initialSortDir, sort: initialSort });
		}
	};

	const handleOnModelUpdated = (event: ModelUpdatedEvent) => {
		event.api.forEachNode((rowNode) => {
			if (selection) {
				rowNode.setSelected(selection.isSelected(rowNode.data._id), false, true);
			}
		});
	};

	const handleOnSelectionChanged = (event: SelectionChangedEvent) => {
		selection.setSelectedSet(event.api.getSelectedNodes().map((rowNode) => rowNode.data._id));
	};

	if (!loaded && loading) {
		return <Placeholder loading loadingText='Loading...' />;
	}

	return (
		<AgGrid
			getRowClass={(params) => {
				if (params.data?.isCurrentItem) {
					return 'current-item';
				}
			}}
			onRowClicked={onRowClicked}
			animateRows
			ref={agGridRef}
			maintainColumnOrder
			rowHeight={56}
			css={`
				height: 100%;
				width: 100%;
				.ag-center-cols-container {
					min-width: 100% !important;
				}
				.ag-cell-inline-editing {
					height: 56px !important;
				}
				.ag-row-focus {
					background-color: rgba(${styledTheme.secondaryColorRGB}, 0.15) !important;
					border: 1px solid ${styledTheme.secondaryColor} !important;
				}
				.ag-row.current-item {
					background-color: ${styledTheme.primaryColorSolidOpaque} !important;
					&:hover {
						background-color: ${styledTheme.primaryColorOpaque} !important;
					}
				}
				.ag-right-aligned-cell {
					justify-content: end;
				}
			`}
			rowData={rowData}
			columnDefs={columnDefs}
			getRowId={(params) => params.data._id}
			defaultColDef={{
				minWidth: 100,
				lockPinned: false,
				resizable: true,
				sortable: true,
				cellStyle: {
					display: 'flex',
					alignItems: 'center',
				},
				comparator: () => 0, // HACK do nothing on the client side, sorting is done in the backend
				// comparator: (valueA, valueB, nodeA, nodeB, isInverted) =>
				// 	nodeA!.rowIndex! - nodeB!.rowIndex! * (isInverted ? -1 : 1),
			}}
			ensureDomOrder
			rowSelection='multiple'
			suppressCellFocus
			suppressCsvExport
			suppressExcelExport
			suppressMultiSort
			suppressRowClickSelection
			suppressColumnVirtualisation
			suppressRowVirtualisation
			rowBuffer={100}
			{...tableStorageProps}
			onModelUpdated={handleOnModelUpdated}
			onSortChanged={handleOnSortChanged}
			onSelectionChanged={handleOnSelectionChanged}
			stopEditingWhenCellsLoseFocus
			suppressCopyRowsToClipboard
			getContextMenuItems={(params: GetContextMenuItemsParams) => {
				const exclude = ['copyWithGroupHeaders', 'paste', 'separator'];
				return params.defaultItems?.filter((item) => !exclude.includes(item)) ?? [];
			}}
			enableBrowserTooltips
		/>
	);
};
