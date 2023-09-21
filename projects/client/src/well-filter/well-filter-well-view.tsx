import { faArrowDown, faArrowUp, faChevronDown, faChevronUp, faLocation } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Paper } from '@material-ui/core';
import TablePagination from '@material-ui/core/TablePagination';
import { ToggleButton } from '@material-ui/lab';
import classNames from 'classnames';
import { Component, createRef } from 'react';
import { TableBody, TableColumn, TableHeader, TableRow } from 'react-md';
import styled from 'styled-components';

import DataTable from '@/components/DataTable';
import ColoredCircle from '@/components/misc/ColoredCircle';
import { Button, IconButton } from '@/components/v2';
import { SCOPE_KEY, WELLS_COLLECTION_KEY, getHeaderValueDisplay } from '@/helpers/headers';
import { clone } from '@/helpers/utilities';
import { projectCustomHeaderColor } from '@/manage-wells/WellsPage/TableView/CollectionTable/HeadersTable.module.scss';
import { ExportMap } from '@/map/ExportMap';
import MapLayers from '@/map/MapLayers';
import { MapShortcutsFloater } from '@/map/MapShortcutsFloater';

import WellFilterVis1 from './well-filter-vis-1';

const initState = ({ filterCount, defaultVis1Headers }) => ({
	coordsFilter: false,
	counter: filterCount,
	baseSelectionAll: true,
	markedWells: [],
	vis1Filters: [],
	vis1Headers: clone(defaultVis1Headers),
	mapViewTable: true,
});

type WellFilterWellViewProps = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	appliedFilters: any[];
	mainView: string;
	className: string;
	applyVis1Filter: () => void;
	deleteVis1Filter: (x) => void;
	filterResult;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	polygons: any[];
	project;
	selectedWellHeaders: string[];
	selectedProjectHeaders: string[];
	setGeoFilter: (x) => void;
	sortTable: (header) => void;
	sortedHeader?;
	wellHeaders;
	projectHeaders;
	ipp: number;
	showNewWells: boolean;
	onlyNewWells: boolean;
	filterToNewWells: (x) => void;
	wellHeaderTypes;
	projectHeaderTypes;
	filterCount: number;
	defaultVis1Headers: string[];
	changePage: (x, y) => void;
	multipleWellSelect: (x, y) => void;
	mapFeatures;
};

const FilterToNewToggleButton = styled(ToggleButton)`
	color: ${({ theme }) => theme.palette.text.primary};
	${({ theme, selected }) => (selected ? `background-color: ${theme.palette.primary.main} !important;` : null)}
	padding: 2px 8px;
	font-size: 1rem;
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
class WellFilterWellView extends Component<WellFilterWellViewProps, any> {
	mapLayersRef = createRef();

	state = initState(this.props);

	_isMounted = false;

	componentDidMount() {
		this._isMounted = true;
	}

	componentDidUpdate({ appliedFilters: prevAppliedFilters, mainView: prevMainView }) {
		const { appliedFilters, mainView } = this.props;

		if (JSON.stringify(appliedFilters) !== JSON.stringify(prevAppliedFilters)) {
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			this.SetState({ baseSelectionAll: true, markedWells: [] });
		}

		if (mainView !== prevMainView) {
			if (mainView === 'map') {
				this.handleCenterMap();
			} else if (!this.state.mapViewTable) {
				// eslint-disable-next-line new-cap -- TODO eslint fix later
				this.SetState({ mapViewTable: true });
			}
		}
	}

	componentWillUnmount() {
		this._isMounted = false;
	}

	SetState = (obj) =>
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		new Promise((r: any) => {
			if (!this._isMounted) {
				r('not mounted');
			} else {
				this.setState(obj, r);
			}
		});

	// eslint-disable-next-line new-cap -- TODO eslint fix later
	handleChange = (obj) => this.SetState(obj);

	ippChange = (ipp) => {
		const { changePage } = this.props;

		changePage(0, ipp);
	};

	jumpPage = (number) => {
		const { changePage, ipp } = this.props;

		changePage((Math.floor(number) - 1) * ipp, ipp);
	};

	changeVis1Filters = (vis1) => {
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ vis1Filters: vis1 });
	};

	handleSingleWellSelect = (well, checked) => {
		const { filterResult: { totalCount = 0 } = {} } = this.props;
		const { baseSelectionAll, markedWells } = this.state;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		let newMarkedWells: any[] = markedWells.filter((w) => w !== well._id);

		if (checked !== baseSelectionAll) {
			newMarkedWells = [...newMarkedWells, well._id];
		}

		if (newMarkedWells.length === totalCount) {
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			this.SetState({ baseSelectionAll: !baseSelectionAll, markedWells: [] });
			return;
		}

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ markedWells: newMarkedWells });
	};

	handleSelectAll = (selected) => {
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ baseSelectionAll: selected, markedWells: [] });
	};

	handleApplySelection = () => {
		const { multipleWellSelect } = this.props;
		const { baseSelectionAll, markedWells } = this.state;

		multipleWellSelect(markedWells, baseSelectionAll);
	};

	handleCenterMap = () => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		this.mapLayersRef?.current?.mapRef.current?.centerMap();
	};

	handleToggleTable = () => {
		const { mapViewTable } = this.state;
		this.setState({ mapViewTable: !mapViewTable });
	};

	render() {
		const {
			className,
			appliedFilters,
			applyVis1Filter,
			deleteVis1Filter,
			filterResult: { viewPage = [], totalCount = 0, startIndex = 0, newWellsCount = 0 } = {},
			mainView,
			mapFeatures,
			project,
			selectedWellHeaders = [],
			selectedProjectHeaders = [],
			setGeoFilter,
			sortTable,
			sortedHeader,
			wellHeaders,
			projectHeaders,
			ipp,
			showNewWells,
			onlyNewWells,
			filterToNewWells,
			wellHeaderTypes,
			projectHeaderTypes,
		} = this.props;

		const { baseSelectionAll, markedWells, coordsFilter, vis1Filters, vis1Headers, mapViewTable } = this.state;

		const showMap = mainView === 'map';

		const allSelected = baseSelectionAll && !markedWells.length;

		const markedWellsSet = new Set(markedWells);

		return (
			<Paper
				className={className}
				css={`
					height: 100%;
					overflow: auto;
					padding: ${({ theme }) => theme.spacing(1)}px;
					display: flex;
					flex-direction: column;
				`}
			>
				<h2
					css={`
						display: flex;
						gap: ${({ theme }) => theme.spacing(1)}px;
						flex: 0;
						align-items: baseline;
						width: 100%;
						margin-bottom: 0.5rem;
					`}
				>
					<span>{`Filtered Items (${totalCount})`}</span>
					{showNewWells && (
						<FilterToNewToggleButton
							value={onlyNewWells}
							selected={onlyNewWells}
							onChange={() => {
								filterToNewWells(!onlyNewWells);
							}}
						>
							{`(${newWellsCount ?? 0} new)`}
						</FilterToNewToggleButton>
					)}
					{showMap && (
						<>
							<IconButton onClick={this.handleCenterMap} tooltipTitle='Center on Wells' size='small'>
								{faLocation}
							</IconButton>
							<div css={{ flexGrow: 1 }} />
							<MapShortcutsFloater />
							{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later */}
							{/* @ts-expect-error */}
							<ExportMap mapLayersRef={this.mapLayersRef} />
						</>
					)}
				</h2>

				{showMap && (
					<MapLayers
						ref={this.mapLayersRef}
						css={{ flex: 1 }}
						filterCount={totalCount}
						coordsFilter={coordsFilter}
						expanded={!mapViewTable}
						mapVisible={showMap}
						setGeoFilter={setGeoFilter}
						mapFeatures={mapFeatures}
						appliedFilters={appliedFilters}
						altProject={project}
						showDraw
						allowShowingMapSettings
					/>
				)}

				{mainView === 'vis1' && (
					<WellFilterVis1
						css={`
							flex: 1;
							overflow: auto;
						`}
						{...this.state}
						{...this.props}
						vis1Headers={vis1Headers}
						vis1Filters={vis1Filters}
						appliedFilters={appliedFilters}
						applyVis1Filter={applyVis1Filter}
						deleteVis1Filter={deleteVis1Filter}
						// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
						handleChange={this.handleChange}
						changeVis1Filters={this.changeVis1Filters}
					/>
				)}

				<div
					css={`
						display: flex;
						flex-direction: column;
						flex: ${mapViewTable ? 1 : 0};
					`}
				>
					<section
						css={`
							display: flex;
							flex-wrap: wrap;
							flex-direction: row;
							align-items: center;
						`}
					>
						{mainView === 'map' && (
							<IconButton onClick={this.handleToggleTable} size='small'>
								{mapViewTable ? faChevronDown : faChevronUp}
							</IconButton>
						)}
						{mapViewTable && (
							<>
								<div
									css={`
										flex: 1;
									`}
								/>

								{!allSelected && (
									<Button color='primary' onClick={this.handleApplySelection}>
										Apply
									</Button>
								)}

								<TablePagination
									component='div'
									count={totalCount}
									page={startIndex / ipp}
									onPageChange={(ev, newPage) => this.jumpPage(newPage + 1)}
									rowsPerPage={ipp}
									onRowsPerPageChange={(ev) => this.ippChange(ev.target.value)}
									rowsPerPageOptions={[25, 50, 100, 200, 500, 1000]}
								/>
							</>
						)}
					</section>

					<WellTable
						css={{ flex: '1' }}
						className={classNames({ 'map-hidden': !mapViewTable })}
						allSelected={allSelected}
						onSelectAll={this.handleSelectAll}
						selectedProjectHeaders={selectedProjectHeaders}
						selectedWellHeaders={selectedWellHeaders}
						sortTable={sortTable}
						sortedHeader={sortedHeader}
						wellHeaderTypes={wellHeaderTypes}
						wellHeaders={wellHeaders}
						projectHeaders={projectHeaders}
						projectHeaderTypes={projectHeaderTypes}
						viewPage={viewPage}
						onSingleWellSelect={this.handleSingleWellSelect}
						baseSelectionAll={baseSelectionAll}
						markedWellsSet={markedWellsSet}
						startIndex={startIndex}
						totalCount={totalCount}
					/>
				</div>
			</Paper>
		);
	}
}

export default WellFilterWellView;

const sortIcons = {
	asc: <FontAwesomeIcon className='primary-icon' icon={faArrowUp} />,
	dsc: <FontAwesomeIcon className='primary-icon' icon={faArrowDown} />,
};

function WellTableHeader({ header, label, headerType, sortDir, sortTable }) {
	const { projectHeader } = headerType;

	const canSortHeader = header !== WELLS_COLLECTION_KEY && header !== SCOPE_KEY;

	return (
		<TableColumn className='well-filter-view-table-header'>
			<div
				tabIndex={0}
				role='button'
				title={label}
				onClick={() => canSortHeader && sortTable(header)}
				className='header-content'
				style={{ cursor: canSortHeader ? 'pointer' : 'default' }}
			>
				{sortDir && sortIcons[sortDir]}
				{projectHeader && <ColoredCircle $color={projectCustomHeaderColor} />}
				{label}
			</div>
		</TableColumn>
	);
}

function WellTableCell({ well, header, headerTypes }) {
	const display = getHeaderValueDisplay(well, header, headerTypes) ?? '';

	return (
		<TableColumn>
			<div className='body-content' title={display}>
				{display}
			</div>
		</TableColumn>
	);
}

function WellTable({
	className,
	allSelected,
	onSelectAll,
	selectedProjectHeaders,
	selectedWellHeaders,
	sortTable,
	sortedHeader,
	wellHeaderTypes,
	wellHeaders,
	projectHeaders,
	projectHeaderTypes,
	viewPage,
	onSingleWellSelect,
	baseSelectionAll,
	markedWellsSet,
	startIndex,
	totalCount,
}) {
	return (
		<DataTable
			overflow
			className={className}
			css={`
				.md-table-column--data,
				.md-table-column--header {
					height: auto;
				}

				.md-table-checkbox {
					width: 1rem;
				}

				.header-content {
					svg {
						margin-right: 3px;
					}
				}

				.header-content,
				.body-content {
					width: 100%;
					text-align: left;
				}
			`}
			baseId='well-filter-table'
		>
			<TableHeader>
				<TableRow selected={allSelected} onCheckboxClick={(_, s) => onSelectAll(s)}>
					<TableColumn key='row-number' className='well-filter-view-table-header row-number'>
						<div className='header-content on-hover-color-primary finger text-ellip'>#</div>
					</TableColumn>
					{selectedWellHeaders.map((header) => (
						<WellTableHeader
							key={header}
							header={header}
							label={wellHeaders[header]}
							headerType={wellHeaderTypes[header]}
							sortDir={sortedHeader && sortedHeader.header === header && sortedHeader.dir}
							sortTable={sortTable}
						/>
					))}
					{selectedProjectHeaders.map((header) => (
						<WellTableHeader
							key={header}
							header={header}
							label={projectHeaders[header]}
							headerType={projectHeaderTypes[header]}
							sortDir={sortedHeader && sortedHeader.header === header && sortedHeader.dir}
							sortTable={sortTable}
						/>
					))}
				</TableRow>
			</TableHeader>
			<TableBody>
				{(viewPage || []).map((well, i) => (
					<TableRow
						key={well._id}
						onCheckboxClick={(_, checked) => onSingleWellSelect(well, checked)}
						selected={baseSelectionAll !== markedWellsSet.has(well._id)}
					>
						<TableColumn>
							<div className='body-content'>{i + Math.min(startIndex + 1, totalCount)}</div>
						</TableColumn>
						{selectedWellHeaders.map((header) => (
							<WellTableCell key={header} well={well} header={header} headerTypes={wellHeaderTypes} />
						))}
						{selectedProjectHeaders.map((header) => (
							<WellTableCell key={header} well={well} header={header} headerTypes={projectHeaderTypes} />
						))}
					</TableRow>
				))}
			</TableBody>
		</DataTable>
	);
}
