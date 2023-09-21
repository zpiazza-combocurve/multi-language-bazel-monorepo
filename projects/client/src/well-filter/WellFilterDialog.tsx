import { Paper } from '@material-ui/core';
import _ from 'lodash';
import { Component } from 'react';

import { Doggo } from '@/components';
import { Dialog } from '@/components/v2';
import { customErrorAlert, genericErrorAlert, withLoadingBar } from '@/helpers/alerts';
import { AlfaStore, subscribe } from '@/helpers/alfa';
import { addFilter, filterHeadersFilters, filterTypes, getFiltersObj, getSeparateFilters } from '@/helpers/filters';
import { fixPolygon, getAllPolygons, getCoordinates, toFeature } from '@/helpers/map/helpers';
import {
	RawProjectHeadersProps,
	getProjectHeaders,
	getProjectHeadersTypes,
	withRawProjectHeaders,
} from '@/helpers/project-custom-headers';
import { queryClient } from '@/helpers/query-cache';
import { deleteApi, getApi, postApi } from '@/helpers/routing';
import { fields as wellsHeaderTypesDt } from '@/inpt-shared/display-templates/wells/well_header_types.json';

import {
	DEFAULT_FILTER_SETTINGS,
	DEFAULT_VIS1_HEADERS,
	INITIAL_FILTER_RESULT,
	SPECIAL_HEADERS,
	SPECIAL_HEADER_TYPES,
	getInitialFilters,
	getModuleNewTotalCount,
} from './shared';
import AnimatedFlexItem from './shared/AnimatedFlexItem';
import { WellFilterDialogProps } from './types';
import { showFilterSaveDialog } from './well-filter-save';
import WellFilterSideBar from './well-filter-side-bar';
import wellFilterTypes from './well-filter-types';
import WellFilterHeadersView from './well-filter-view-headers';
import WellFilterWellView from './well-filter-well-view';

import './well-filter.scss';

import { WELL_FILTERS_QUERY_KEY } from './utils';

const SORT_WELL_LIMIT = 50000;
const DEFAULT_TAKE = 25;
let filterGlobalCounter = 1;

export const initState = ({ wells }: { wells? }) => ({
	filterResult: INITIAL_FILTER_RESULT,
	appliedFilters: getInitialFilters(wells),
	selectionFilters: [],
	filterCount: 0,
	excludeWells: [],
	mainView: 'headers',
	currentFilter: false,
	sortedHeader: undefined,
	selectedWellHeaders: ['well_name'],
	selectedProjectHeaders: [],
	applyingFilters: false,
	savedFilters: [],
	ipp: DEFAULT_TAKE,
	selectedSavedFilter: undefined,
	onlyNewWells: false,
	mapFeatures: [],
});

type WellFilterDialogPropsEx = WellFilterDialogProps &
	Pick<AlfaStore, 'wellHeaders' | 'project'> &
	RawProjectHeadersProps;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
class WellFilterDialog extends Component<WellFilterDialogPropsEx, any> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	state: any = initState(this.props); // TODO fix state types

	_isMounted = false;

	async componentDidMount() {
		const { gotAllIds, visible } = this.props;
		const { appliedFilters, selectedWellHeaders, selectedProjectHeaders } = this.state;
		this._isMounted = true;

		const wellHeaderTypes = await this.getHeaderTypes();
		this.asyncSetState({ wellHeaderTypes: { ...wellHeaderTypes, ...SPECIAL_HEADER_TYPES } });

		if (visible) {
			this.getSavedFilter();
			this.getFilterResults({ appliedFilters, selectedWellHeaders, selectedProjectHeaders }).then(() => {
				if (gotAllIds) {
					gotAllIds();
				}
			});
		} else if (gotAllIds) {
			gotAllIds();
		}
	}

	async componentDidUpdate({ visible: prevVisible }) {
		const { visible } = this.props;

		if (!prevVisible && visible) {
			this.getSavedFilter();
			await this.asyncSetState(initState(this.props));
			this.loadFilterSettings();
		}
	}

	componentWillUnmount() {
		this._isMounted = false;
	}

	asyncSetState = (obj) =>
		new Promise<void | string>((r) => {
			if (!this._isMounted) r('not mounted');
			else this.setState(obj, r);
		});

	handleChange = (obj) => this.asyncSetState(obj);

	getProject = () => {
		const { project, altProject } = this.props;
		return altProject === undefined ? project : altProject;
	};

	updateSaveFilters = (newFilter) => {
		let { savedFilters } = this.state;
		savedFilters = [...savedFilters, newFilter];
		this.asyncSetState({ savedFilters });
	};

	allowsProjectHeaders = () => {
		const { wells, hasProjectHeaders } = this.props;
		const project = this.getProject();

		const showingProjectWells = Array.isArray(wells); // TODO: we probably want a more explicit way to determine this

		return project && showingProjectWells && hasProjectHeaders;
	};

	getSavedFilter = () => {
		const project = this.getProject();
		if (!project) {
			return;
		}
		getApi(`/filters/getSaveFilters/${project._id}`).then((response) => {
			const filters = response.map((f) => {
				return { _id: f._id, name: f.name, filter: f.filter };
			});

			this.asyncSetState({ savedFilters: filters });
		});
	};

	getHeaderTypes = async () => {
		return wellsHeaderTypesDt;
	};

	getFilterResults = async ({
		appliedFilters,
		selectedWellHeaders,
		selectedProjectHeaders,
		skip,
		take,
		sortedHeader,
	}: {
		appliedFilters?;
		selectedWellHeaders?;
		selectedProjectHeaders?;
		skip?;
		take?;
		sortedHeader?;
		selectionFilters?; // TODO selectionFilter not used
	}) => {
		const { existingWells } = this.props;
		const {
			selectedWellHeaders: selectedWellHeadersState,
			selectedProjectHeaders: selectedProjectHeadersState,
			sortedHeader: sortedHeaderState,
			appliedFilters: appliedFiltersState,
			ipp,
		} = this.state;

		const project = this.getProject();

		const { header: sortingHeader, dir: sortingDir } = sortedHeader || sortedHeaderState || {};
		const sorting = sortingHeader && [{ field: sortingHeader, direction: sortingDir === 'dsc' ? -1 : 1 }];

		const filterResult = await withLoadingBar(
			postApi('/filters/lightFilterWells', {
				project: project?._id,
				filters: appliedFilters || appliedFiltersState,
				selectedWellHeaders: selectedWellHeaders || selectedWellHeadersState,
				selectedProjectHeaders: selectedProjectHeaders || selectedProjectHeadersState,
				existingWells,
				sorting,
				skip: skip || 0,
				take: take || ipp,
			})
		);
		return this.asyncSetState({ filterResult });
	};

	confirm = async () => {
		const {
			resolve,
			limit,
			type,
			returnFilters,
			confirm,
			wellsPerformanceThreshold,
			existingWells,
			wells: inputWells,
		} = this.props;

		const { appliedFilters, filterResult: { totalCount = 0, newWellsCount = 0 } = {} } = this.state;

		if (limit != null && totalCount > limit) {
			const filterType = type ? wellFilterTypes[type] : wellFilterTypes.filter;
			const typeWord = filterType.label.toLowerCase();
			customErrorAlert(`Can only ${typeWord} up to ${limit} wells`, 'Try again with fewer filtered wells');
			return;
		}

		const curExistingWells = (type === 'add' ? existingWells?.length : inputWells?.length) ?? 0;
		if (
			confirm &&
			!(await confirm(
				newWellsCount ?? totalCount,
				Number.isFinite(wellsPerformanceThreshold) &&
					getModuleNewTotalCount({ type, newWellsCount, existingWells: curExistingWells }) >
						(wellsPerformanceThreshold as number) // typescript being dumb? if Number.isFinite returns true it should be a number
					? wellsPerformanceThreshold
					: undefined
			))
		) {
			return;
		}

		if (returnFilters) {
			resolve(appliedFilters);
			return;
		}

		this.asyncSetState({ applyingFilters: true });

		const wellIds = await this.getWellIds();
		if (!wellIds) {
			return;
		}

		resolve(wellIds);
	};

	getWellIds = async () => {
		const { appliedFilters, sortedHeader } = this.state;

		const project = this.getProject();
		const { header: sortingHeader, dir: sortingDir } = sortedHeader || {};
		const sorting = sortingHeader && [{ field: sortingHeader, direction: sortingDir === 'dsc' ? -1 : 1 }];

		this.asyncSetState({ applyingFilters: true });

		try {
			const { wells } = await postApi('/filters/getWellsIds', {
				filters: appliedFilters,
				project: project?._id,
				sorting,
			});
			return wells;
		} catch (error) {
			genericErrorAlert(error);
			return null;
		} finally {
			this.asyncSetState({ applyingFilters: false });
		}
	};

	handleClose = () => {
		const { onHide } = this.props;
		onHide();
	};

	saveFilter = () => {
		const { appliedFilters } = this.state;
		const project = this.getProject();

		showFilterSaveDialog({
			updateSaveFilters: this.updateSaveFilters,
			project,
			appliedFilters,
		});
	};

	deleteFilter = async ({ _id: idToRemove }) => {
		const { savedFilters } = this.state;

		if (idToRemove) {
			await withLoadingBar(deleteApi(`/filters/deleteFilter/${idToRemove}`));
			this.asyncSetState({ savedFilters: savedFilters.filter((f) => f._id !== idToRemove) });
			queryClient.invalidateQueries(WELL_FILTERS_QUERY_KEY);
		}
	};

	clearFilters = () => {
		const { appliedFilters } = this.state;

		const newAppliedFilters = appliedFilters.filter((f) => f._id === 0);

		this.asyncSetState({
			appliedFilters: newAppliedFilters,
			selectionFilters: [],
			selectedSavedFilter: undefined,
			mapFeatures: [],
		});

		this.getFilterResults({ appliedFilters: newAppliedFilters, selectionFilters: [] });
	};

	applyFilter = () => {
		const { appliedFilters, selectionFilters } = this.state;
		const newAppliedFilters = [
			...appliedFilters.filter(({ _id }) => _id === 0),
			...(selectionFilters?.length
				? [
						{
							_id: filterGlobalCounter,
							name: `Filter${filterGlobalCounter++}`,
							...getFiltersObj(selectionFilters),
						},
				  ]
				: []),
		];

		this.asyncSetState({ appliedFilters: newAppliedFilters });

		return this.getFilterResults({ appliedFilters: newAppliedFilters });
	};

	sortTable = (header) => {
		const {
			sortedHeader: { header: prevHeader, dir: prevDir } = { header: '', dir: 'asc' },
			filterResult: { totalCount = 0 } = {},
		} = this.state;

		if (totalCount > SORT_WELL_LIMIT) {
			customErrorAlert(`Can only sort up to ${SORT_WELL_LIMIT} wells`, 'Try again with fewer filtered wells');
			return;
		}

		const opposite = { asc: 'dsc', dsc: 'asc' };

		const newSortedHeader = {
			header,
			dir: prevHeader === header ? opposite[prevDir] : 'asc',
		};

		this.asyncSetState({ sortedHeader: newSortedHeader });
		this.getFilterResults({ sortedHeader: newSortedHeader });
	};

	saveFilterSettings = () => {
		const { selectedWellHeaders: selectedHeaders, selectedProjectHeaders } = this.state;

		return postApi('/filter-settings', {
			project: this.getProject()?._id,
			settings: { selectedHeaders, selectedProjectHeaders },
		});
	};

	loadFilterSettings = async () => {
		const { projectHeaders: projectHeadersDoc } = this.props;

		const project = this.getProject()?._id;

		const { selectedHeaders, selectedProjectHeaders } = {
			...DEFAULT_FILTER_SETTINGS,
			...(await getApi('/filter-settings', project ? { project } : {})),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		} as any; // TODO fix type

		const projectHeaders = getProjectHeaders(projectHeadersDoc);

		this.setSelectedHeaders({
			wellHeaders: selectedHeaders,
			projectHeaders: selectedProjectHeaders.filter((h) => projectHeaders[h]),
		});
	};

	changeSelectedHeaders = async ({ wellHeaders, projectHeaders }: { wellHeaders?; projectHeaders? }) => {
		await this.setSelectedHeaders({ wellHeaders, projectHeaders });
		this.saveFilterSettings();
	};

	setSelectedHeaders = async ({ wellHeaders, projectHeaders }) => {
		const { selectionFilters, selectedWellHeaders, selectedProjectHeaders } = this.state;

		await this.asyncSetState({
			selectedWellHeaders: wellHeaders ?? selectedWellHeaders,
			selectedProjectHeaders: this.allowsProjectHeaders() ? projectHeaders ?? selectedProjectHeaders : [],
		});

		const wellHeadersFilter = selectionFilters.find((f) => f.type === filterTypes.headersFilter);
		const projectHeadersFilter = selectionFilters.find((f) => f.type === filterTypes.projectHeadersFilter);

		let filterSet = false;
		if (wellHeaders && wellHeadersFilter) {
			const newWellHeadersFilter = filterHeadersFilters(wellHeadersFilter, wellHeaders);
			await this.setWellHeadersFilter(newWellHeadersFilter);
			filterSet = true;
		}
		if (projectHeaders && projectHeadersFilter) {
			const newProjectHeadersFilters = filterHeadersFilters(projectHeadersFilter, projectHeaders);
			await this.setProjectHeadersFilter(newProjectHeadersFilters);
			filterSet = true;
		}

		if (!filterSet) {
			await this.applyFilter();
		}
	};

	changeMainView = (view) => {
		return this.asyncSetState({ mainView: view });
	};

	addSaveFilter = async (filter) => {
		const { selectedWellHeaders, selectedProjectHeaders } = this.state;

		const filterData = filter.filter;

		const filterWellHeaders = filterData?.headers?.headers?.map(({ key }) => key) ?? [];
		const newSelectedWellHeaders = [...new Set(selectedWellHeaders.concat(filterWellHeaders))];

		const filterProjectHeaders = filterData?.projectHeaders?.headers?.map(({ key }) => key) ?? [];
		const newSelectedProjectHeaders = [...new Set(selectedProjectHeaders.concat(filterProjectHeaders))];

		const selectionFilters = getSeparateFilters(filterData);

		await this.asyncSetState({
			selectedSavedFilter: filter,
			selectionFilters,
			selectedWellHeaders: newSelectedWellHeaders,
			selectedProjectHeaders: this.allowsProjectHeaders() ? newSelectedProjectHeaders : [],
			mapFeatures: filterData.geo?.map(toFeature) ?? [],
		});
		return this.applyFilter();
	};

	addFilter = async (filter) => {
		const { selectionFilters } = this.state;

		const newSelectionFilters = addFilter(selectionFilters, filter);
		await this.asyncSetState({ selectionFilters: newSelectionFilters });
		return this.applyFilter();
	};

	singleWellSelect = (index, well, selected) =>
		this.addFilter({ type: selected ? filterTypes.include : filterTypes.exclude, well: well._id });

	multipleWellSelect = async (wells, deselectWells) => {
		const { selectionFilters } = this.state;

		let newSelectionFilters = selectionFilters;

		if (!deselectWells) {
			newSelectionFilters = addFilter(newSelectionFilters, { type: filterTypes.excludeAll });
		}

		const wellsFilterType = deselectWells ? filterTypes.exclude : filterTypes.include;
		const filters = wells.map((w) => ({ type: wellsFilterType, well: w }));
		newSelectionFilters = filters.reduce((cum, f) => addFilter(cum, f), newSelectionFilters);

		await this.asyncSetState({ selectionFilters: newSelectionFilters });
		return this.applyFilter();
	};

	changePage = async (skip, take) => {
		await this.asyncSetState({ ipp: take });
		this.getFilterResults({ skip });
	};

	setGeoFilter = (newMapFeatures) => {
		const { mapFeatures } = this.state;

		const newPolygons = getAllPolygons(newMapFeatures).map(fixPolygon).flat();
		const prevPolygons = getAllPolygons(mapFeatures).map(fixPolygon).flat();

		if (_.isEqual(prevPolygons, newPolygons)) {
			return;
		}

		this.asyncSetState({ mapFeatures: newMapFeatures });
		this.addFilter({ type: filterTypes.geoFilter, polygons: newPolygons.map(getCoordinates) });
	};

	setWellHeadersFilter = ({ headers }) => this.addFilter({ type: filterTypes.headersFilter, headers });

	setProjectHeadersFilter = ({ headers }) => this.addFilter({ type: filterTypes.projectHeadersFilter, headers });

	applyVis1Filter = (wells, header, values, id) =>
		this.addFilter({ type: filterTypes.vis1, id, header, values, wells });

	deleteVis1Filter = ({ id }) => {
		const { selectionFilters } = this.state;

		const index = selectionFilters.findIndex(
			({ type, id: filterId }) => type === filterTypes.vis1 && filterId === id
		);

		this.asyncSetState({ selectionFilters: selectionFilters.slice(0, index) }).then(() => {
			return this.applyFilter();
		});
	};

	setExcludeMode = (isExcluding) => this.addFilter({ type: filterTypes.excludeMode, isExcluding });

	filterToNewWells = async (value) => {
		const { wells, existingWells } = this.props;
		const { appliedFilters } = this.state;

		let newAppliedFilters;
		if (!value) {
			newAppliedFilters = [...getInitialFilters(wells), ...appliedFilters.filter(({ _id }) => _id !== 0)];
		} else {
			const baseFilter = appliedFilters.find(({ _id }) => _id === 0);
			let newBaseFilter;
			if (baseFilter) {
				const existingWellsSet = new Set(existingWells ?? []);
				const include = (baseFilter.include ?? []).filter((w) => !existingWellsSet.has(w));
				newBaseFilter = { ...baseFilter, include };
			} else {
				newBaseFilter = {
					_id: 0,
					name: 'Initial wells',
					exclude: existingWells,
				};
			}
			newAppliedFilters = [newBaseFilter, ...appliedFilters.filter(({ _id }) => _id !== 0)];
		}

		await this.asyncSetState({ appliedFilters: newAppliedFilters, onlyNewWells: value });
		return this.applyFilter();
	};

	render() {
		const { visible, wellHeaders, projectHeaders: projectHeadersDoc, existingWells } = this.props;
		const {
			selectedWellHeaders,
			selectedProjectHeaders,
			applyingFilters,
			selectionFilters,
			mainView,
			savedFilters,
			ipp,
			selectedSavedFilter,
			onlyNewWells,
			wellHeaderTypes,
			mapFeatures,
		} = this.state;

		const allHeaders = { ...wellHeaders, ...SPECIAL_HEADERS };

		const project = this.getProject();

		const finalSelectedWellHeaders = [...new Set([...selectedWellHeaders])];
		const finalSelectedProjectHeaders = [...new Set([...selectedProjectHeaders])];

		const projectHeaders = getProjectHeaders(projectHeadersDoc);
		const projectHeaderTypes = getProjectHeadersTypes(projectHeadersDoc);

		const headersFilter = selectionFilters.find(({ type }) => type === filterTypes.headersFilter);
		const projectHeadersFilter = selectionFilters.find(({ type }) => type === filterTypes.projectHeadersFilter);
		const isExcluding = selectionFilters.find(({ type }) => type === filterTypes.excludeMode)?.isExcluding;

		const sharedProps = {
			...this.props,
			...this.state,
			mainView,
			project,
			wellHeaders: allHeaders,
			projectHeaders,
			selectedWellHeaders: finalSelectedWellHeaders,
			selectedProjectHeaders: finalSelectedProjectHeaders,
			wellHeaderTypes,
			projectHeaderTypes,
			mapFeatures,
			headersFilter,
			projectHeadersFilter,
			defaultVis1Headers: DEFAULT_VIS1_HEADERS,
			ipp,
			showNewWells: !!existingWells,
			onlyNewWells,
			applyVis1Filter: this.applyVis1Filter,
			revert: this.clearFilters,
			setWellHeadersFilter: this.setWellHeadersFilter,
			setProjectHeadersFilter: this.setProjectHeadersFilter,
			changeSelectedWellHeaders: (headers) => this.changeSelectedHeaders({ wellHeaders: headers }),
			changeSelectedProjectHeaders: (headers) => this.changeSelectedHeaders({ projectHeaders: headers }),
			applyFilter: this.applyFilter,
			sortTable: this.sortTable,
			setParentState: this.handleChange,
			singleWellSelect: this.singleWellSelect,
			changePage: this.changePage,
			setGeoFilter: this.setGeoFilter,
			deleteFilter: this.deleteFilter,
			deleteVis1Filter: this.deleteVis1Filter,
			multipleWellSelect: this.multipleWellSelect,
			filterToNewWells: this.filterToNewWells,
		};

		return (
			<Dialog
				id='well-filter-dialog'
				fullScreen
				onClose={this.handleClose}
				open={visible}
				PaperProps={{ style: { overflowY: 'hidden' } }} // HACK for the table it is messing up the layout it should be fine to remove this once we change it to ag grid or another component
			>
				{applyingFilters && <Doggo overlay underDog='Applying Filters' />}
				<div
					css={`
						width: 100%;
						height: 100%;
						display: flex;
						flex-direction: row;
						gap: ${({ theme }) => theme.spacing(1)}px;
						padding: ${({ theme }) => theme.spacing(1)}px;
					`}
				>
					{visible && (
						<>
							<WellFilterSideBar
								{...this.props}
								{...this.state}
								project={project}
								filters={savedFilters}
								wellHeaders={allHeaders}
								wellHeaderTypes={wellHeaderTypes}
								selectedWellHeaders={selectedWellHeaders}
								projectHeaders={projectHeaders}
								projectHeaderTypes={projectHeaderTypes}
								selectedProjectHeaders={selectedProjectHeaders}
								selectedSavedFilter={selectedSavedFilter}
								excludeMode={isExcluding}
								allowsProjectHeaders={this.allowsProjectHeaders()}
								revert={this.clearFilters}
								onCancel={this.handleClose}
								confirm={this.confirm}
								saveFilter={this.saveFilter}
								deleteFilter={this.deleteFilter}
								changeSelectedWellHeaders={(headers) =>
									this.changeSelectedHeaders({ wellHeaders: headers })
								}
								changeSelectedProjectHeaders={(headers) =>
									this.changeSelectedHeaders({ projectHeaders: headers })
								}
								changeMainView={this.changeMainView}
								addSaveFilter={this.addSaveFilter}
								setExcludeMode={this.setExcludeMode}
							/>

							<AnimatedFlexItem
								component={Paper}
								visible={mainView === 'headers'}
								css={`
									flex: 1;
									min-width: 0;
								`}
							>
								<WellFilterHeadersView {...sharedProps} />
							</AnimatedFlexItem>

							<WellFilterWellView {...sharedProps} css={{ flex: 3 }} />
						</>
					)}
				</div>
			</Dialog>
		);
	}
}

export default subscribe(withRawProjectHeaders(WellFilterDialog), ['wellHeaders', 'project']);
