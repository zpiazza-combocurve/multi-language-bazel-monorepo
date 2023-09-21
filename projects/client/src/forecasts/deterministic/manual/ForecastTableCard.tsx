import { faTimes as faCancel, faCompress, faExpand, faSearch } from '@fortawesome/pro-regular-svg-icons';
import _ from 'lodash';
import {
	forwardRef,
	useCallback,
	useContext,
	useDebugValue,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react';
import { useQuery } from 'react-query';
import styled, { css } from 'styled-components';

import { SmallPagination, Toolbar, WellTable, usePaginatedArray } from '@/components';
import { useGetLocalStorage, useHotkey, useSetLocalStorage } from '@/components/hooks';
import { Card, IconButton, TextField } from '@/components/v2';
import { iconAdornment } from '@/components/v2/helpers';
import { ManualEditingContext } from '@/forecasts/manual/ManualEditingContext';
import { useAlfa } from '@/helpers/alfa';
import { useWellHeaders } from '@/helpers/headers';
import { useProjectCustomHeadersQuery, useProjectHeadersDataMap } from '@/helpers/project-custom-headers';
import { postApi } from '@/helpers/routing';
import { ifProp, theme } from '@/helpers/styled';
import { fields as headersLabels } from '@/inpt-shared/display-templates/wells/well_headers.json';
import { chooseHeadersIcon, useSelectedHeaders } from '@/manage-wells/shared/ChooseHeadersDialog';
import { WellFilterButton } from '@/well-filter/WellFilterButton';
import { useFilteredByWellFilter } from '@/well-filter/hooks';

// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
const noop = () => {};
const EMPTY_ARRAY = [];

const CONSTANT_HEADERS = ['well_name', 'well_number'];
const DEFAULT_HEADERS = ['api14', 'county', 'inptID'];

const headersLabelsKeys = Object.keys(headersLabels);

function useTableColumns(
	headerStoreKey: string | null | undefined = null,
	onSort: (newSort) => void,
	sortDir: string,
	sortHeader: string | null
) {
	const initialHeaders = useGetLocalStorage(headerStoreKey, DEFAULT_HEADERS);

	const { wellHeadersLabels, projectCustomHeadersKeys } = useWellHeaders({ enableProjectCustomHeaders: true });

	const getLabel = useCallback((key) => wellHeadersLabels[key] ?? key, [wellHeadersLabels]);

	const [headers, selectHeaders, headerDialogActive] = useSelectedHeaders({
		initialKeys: initialHeaders,
		allKeys: [...headersLabelsKeys, ...projectCustomHeadersKeys],
		getLabel,
		maxHeaders: null,
		projectCustomHeadersKeys,
	});

	useSetLocalStorage(headerStoreKey, headers);

	const allChoosedHeaders = useMemo(() => [...CONSTANT_HEADERS, ...headers], [headers]);

	const columns = useMemo(
		() =>
			allChoosedHeaders.map((key) => ({
				key,
				canSort: true,
				marked: projectCustomHeadersKeys.includes(key),
				name: getLabel(key),
				onSort,
				resizable: true,
				sortDir,
				sorted: sortHeader === key,
			})),
		[allChoosedHeaders, getLabel, sortDir, sortHeader, onSort, projectCustomHeadersKeys]
	);

	return { columns, selectHeaders, allHeaders: allChoosedHeaders, headerDialogActive };
}

function useSort(initialHeader: string | null = null) {
	const [{ header, dir }, setSortHeader] = useState<{ header: string | null; dir: 'asc' | 'desc' }>({
		header: initialHeader,
		dir: 'asc',
	});
	const toggleSort = useCallback(
		(newHeader) =>
			setSortHeader((prevValues) => {
				if (prevValues.header === newHeader && prevValues.dir === 'asc') {
					return { header: newHeader, dir: 'desc' };
				}
				return { header: newHeader, dir: 'asc' };
			}),
		[]
	);
	useDebugValue(`Sorting by ${header}, ${dir}`);
	return [header, dir, toggleSort] as const;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
function getWellHeaderValues({ queryKey: [, body] }: any) {
	return postApi(`/well/getWellHeaderValuesBySearch`, body);
}

const Container = styled(Card)<{ collapsed?: boolean }>`
	${ifProp('collapsed', 'width: 20%', 'width: 100%;')};
	display: flex;
	flex-direction: column;
	height: 100%;
	margin-right: 0.5rem;
	padding: 0.5rem;
	& > div:last-child {
		flex: 1 1 0;
	}
`;

const activeStyles = css`
	// yes
	& > div > div > div {
		background: ${theme.primaryColorOpaque} !important;
	}
`;

const ClickableRow = styled.div<{ active?: boolean }>`
	cursor: pointer;
	width: 100%;
	height: 100%;
	${ifProp('active', activeStyles)};
`;

interface ForecastTableCardProps {
	wellIds: string[];
	activeWell?: string | null;
	collapsed?: boolean;
	onChangeActiveWell: (selected: string) => void;
	onToggleCollapsed?: () => void;
	headerStoreKey?: string | null;
	itemsPerPage?: number;
	onFilterActive?: (isFilterActive: boolean) => void;
	removedWells?: string[];
}

export const ForecastTableCard = forwardRef(
	(
		{
			wellIds: unfilteredWells = EMPTY_ARRAY,
			activeWell = null,
			onChangeActiveWell = noop,
			collapsed = false,
			onToggleCollapsed = noop,
			itemsPerPage = 200,
			headerStoreKey = null,
			onFilterActive = noop,
			removedWells = EMPTY_ARRAY,
		}: ForecastTableCardProps,
		ref
	) => {
		const [well, changeWell] = useState<string | null>(activeWell);
		const { project } = useAlfa();
		const [search, setSearch] = useState('');
		const [sortHeader, sortDir, toggleSort] = useSort('well_name');

		const { setOnForm } = useContext(ManualEditingContext);

		const { columns, selectHeaders, allHeaders, headerDialogActive } = useTableColumns(
			headerStoreKey,
			toggleSort,
			sortDir,
			sortHeader
		);

		// HACK: append project header values; once the table is converted to AgGrid, should be easier to manage the dual header state
		const { data: projectHeadersData } = useProjectHeadersDataMap(project?._id, unfilteredWells);
		const { data: rawProjectHeaders } = useProjectCustomHeadersQuery(project?._id);
		// TODO this query is too broad, define in a place with more visibility
		const { data: unsortedWells = [] } = useQuery(
			[
				'wells',
				{
					headers: allHeaders,
					search: { well_name: search },
					wells: unfilteredWells,
				},
			],
			getWellHeaderValues,
			{
				keepPreviousData: true,
				select: (data) =>
					_.map(data, (wellData) => ({ ...wellData, ...(projectHeadersData?.get(wellData._id) ?? {}) })),
			}
		);

		const wells = useMemo(
			() => _.orderBy(unsortedWells, [sortHeader], [sortDir]),
			[sortDir, sortHeader, unsortedWells]
		);

		const {
			wellIds: filteredWells,
			filter,
			reset,
			filterTo,
			filterActive,
		} = useFilteredByWellFilter(unfilteredWells, {
			requireAtLeastOne: true,
			removedWells,
		});

		const baseWellsAfterRemoval = useMemo(
			() => _.filter(unfilteredWells, (id) => !removedWells.includes(id)),
			[removedWells, unfilteredWells]
		);

		const filteredWellsAfterRemoval = useMemo(
			() => _.filter(filteredWells, (id) => !removedWells.includes(id)),
			[filteredWells, removedWells]
		);

		const filtered = baseWellsAfterRemoval.length !== filteredWellsAfterRemoval.length;
		const sortedFilteredWells = useMemo(
			() => _.intersection(_.map(wells, '_id'), filteredWellsAfterRemoval),
			[wells, filteredWellsAfterRemoval]
		);

		const [wellIds, pagination] = usePaginatedArray(sortedFilteredWells, { itemsPerPage });

		const rowIndexInc = pagination.page * itemsPerPage;

		const activeWellIndexRef = useRef<number>(0);

		useImperativeHandle(ref, () => ({
			getWellsToCache: () => {
				const curId = activeWellIndexRef.current;
				const nextWell = curId < wellIds?.length - 1 && wellIds[curId + 1];
				const prevWell = curId > 0 && wellIds[curId - 1];
				return [nextWell, prevWell].filter(Boolean);
			},
		}));

		useHotkey('PageDown', () => {
			if (activeWellIndexRef.current === null) {
				return false;
			}
			if (wellIds[activeWellIndexRef.current + 1]) {
				changeWell(wellIds[activeWellIndexRef.current + 1]);
			}
			return false;
		});

		useHotkey('PageUp', () => {
			if (activeWellIndexRef.current === null) {
				return false;
			}
			if (wellIds[activeWellIndexRef.current - 1]) {
				changeWell(wellIds[activeWellIndexRef.current - 1]);
			}
			return false;
		});

		useHotkey('Home', () => {
			onToggleCollapsed();
			return false;
		});

		useEffect(() => {
			onFilterActive(filterActive);
		}, [filterActive, onFilterActive]);

		useEffect(() => {
			onFilterActive(headerDialogActive);
		}, [headerDialogActive, onFilterActive]);

		// Pair local state with a debounced onChangeActiveWell to switch between wells without delay, but prevent fetch
		// on each well change.
		useEffect(() => {
			if (well) {
				onChangeActiveWell(well);
			}
		}, [onChangeActiveWell, well]);

		// if activeWell is no longer part of the wellIds, find the position of the well in the well list, and go to the next one that isn't removed, else null or the first or undefined or anything
		useEffect(() => {
			if (!wellIds?.length && wells.length) {
				reset();
				return;
			}

			const activeWellIndex = activeWellIndexRef.current;
			if (!wellIds.includes(well) && wellIds?.[0]) {
				if (wellIds.includes(wellIds[activeWellIndex])) {
					changeWell(wellIds[activeWellIndex]);
				} else {
					changeWell(wellIds[0]);
					activeWellIndexRef.current = 0;
				}
			} else {
				activeWellIndexRef.current = wellIds.findIndex((wellId) => wellId === well);
			}
		}, [well, changeWell, removedWells, reset, wellIds, wells?.length]);

		const rowRenderer = useCallback(
			({ renderBaseRow, ...props }) => {
				const {
					row: { _id: id },
				} = props;
				return (
					<ClickableRow
						active={id === well}
						onClick={() => {
							if (id !== well) {
								changeWell(id);
							}
						}}
					>
						{renderBaseRow(props)}
					</ClickableRow>
				);
			},
			[well, changeWell]
		);

		return (
			<Container collapsed={collapsed}>
				<Toolbar
					left={
						<>
							{sortedFilteredWells?.length || 0} wells
							<WellFilterButton
								wellIds={sortedFilteredWells}
								onFilterWells={filter}
								onQuickFilter={filterTo}
								onOpenDialog={() => onFilterActive?.(true)}
								onCloseDialog={() => onFilterActive?.(false)}
							/>
							{filtered && (
								<IconButton color='warning' onClick={reset} size='small' tooltipTitle='Reset Filter'>
									{faCancel}
								</IconButton>
							)}
							{!collapsed && (
								<IconButton onClick={selectHeaders} size='small' tooltipTitle='Select Headers'>
									{chooseHeadersIcon}
								</IconButton>
							)}
						</>
					}
					right={
						<>
							<SmallPagination pagination={pagination} />
							<IconButton size='small' onClick={onToggleCollapsed}>
								{collapsed ? faExpand : faCompress}
							</IconButton>
						</>
					}
				/>
				-
				<TextField
					css='margin-top: 0.25rem; margin-bottom: 0.25rem;'
					debounce
					InputProps={{ startAdornment: iconAdornment(faSearch) }}
					onBlur={() => setOnForm(false)}
					onChange={(ev) => setSearch(ev.target.value)}
					onFocus={() => setOnForm(true)}
					placeholder='Search by well name'
					value={search}
				/>
				{/* TODO: convert to ag-grid when possible */}
				{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later */}
				{/* @ts-expect-error */}
				<WellTable
					columns={columns}
					indexed
					limitColumnsSize={collapsed && 2}
					rawProjectHeaders={rawProjectHeaders}
					resize={collapsed}
					rowIndexInc={rowIndexInc}
					rowRenderer={rowRenderer}
					rows={_.filter(wells, (el) => wellIds.includes(el._id))}
				/>
			</Container>
		);
	}
);
