import {
	faChartBar,
	faCheckSquare,
	faFilter,
	faGlobeAmericas,
	faList,
	faSearch,
	faSort,
	faSquare,
	faTrash,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Paper, Typography } from '@material-ui/core';
import classNames from 'classnames';
import _ from 'lodash';
import { Component } from 'react';
import { Collapse } from 'react-md';
import styled, { css } from 'styled-components';

import { usePermissionsBuilder } from '@/access-policies/usePermissions';
import ColoredCircle from '@/components/misc/ColoredCircle';
import {
	Button,
	Divider,
	InfoIcon,
	List,
	ListItemButton as ListItem,
	ListItemText,
	ListSubheader,
	SwitchField,
	Tab,
	Tabs,
	TextField,
	Tooltip,
} from '@/components/v2';
import { FeatureFlags, withLDFeatureFlags } from '@/feature-flags/useLDFeatureFlags';
import { Hook } from '@/helpers/hooks';
import { SUBJECTS } from '@/inpt-shared/access-policies/shared';
import { projectCustomHeaderColor } from '@/manage-wells/WellsPage/TableView/CollectionTable/HeadersTable.module.scss';

import wellFilterTypes from './well-filter-types';

const initState = () => ({
	search: '',
	sort: 'asc',
	headersCollapse: false,
	filterByCollapse: false,
	filtersListCollapse: true,
	headersSearch: '',
	headersKind: 'well-headers',
});

let cacheState = false;

const WellFilterTitle = styled.h2`
	${({ color }) =>
		color &&
		css`
			color: ${color} !important;
		`}
`;

const ActionsGroup = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	grid-auto-rows: auto;
	gap: 0.5rem;
`;

type WellFilterSideBarProps = {
	allowsProjectHeaders?: boolean;
	selectedWellHeaders: string[];
	selectedProjectHeaders: string[];
	changeSelectedWellHeaders: (header) => void;
	changeSelectedProjectHeaders: (header) => void;
	wellHeaders: Record<string, string>;
	wellHeaderTypes;
	projectHeaders;
	projectHeaderTypes;
	confirm: () => void;
	addSaveFilter: (x) => void;
	applyingFilters: boolean;
	onCancel: () => void;
	changeMainView: (view) => void;
	deleteFilter: (x) => void;
	filterResult;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	filters: any[];
	mainView: string;
	project;
	revert: () => void;
	saveFilter: () => void;
	totalWells: number;
	type;
	selectedSavedFilter;
	excludeMode?: boolean;
	setExcludeMode: (isExcluding) => void;
} & FeatureFlags;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
class WellFilterSideBar extends Component<WellFilterSideBarProps, any> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	state: any = cacheState || initState();

	_isMounted = false;

	componentDidMount() {
		this._isMounted = true;
	}

	componentDidUpdate() {
		const { allowsProjectHeaders, filterResult, mainView, changeMainView } = this.props;
		const { headersKind } = this.state;

		if (!allowsProjectHeaders && headersKind === 'project-headers') {
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			this.SetState({ headersKind: 'well-headers' });
		}

		if ((filterResult.totalCount > 2000 || !filterResult.totalCount) && mainView === 'vis1') {
			changeMainView('headers');
		}
	}

	componentWillUnmount() {
		cacheState = this.state;
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

	headerClicked = async (key) => {
		const { selectedWellHeaders, selectedProjectHeaders, changeSelectedWellHeaders, changeSelectedProjectHeaders } =
			this.props;
		const { headersKind } = this.state;

		const [selectedHeaders, changeHeaders] =
			headersKind === 'project-headers'
				? [selectedProjectHeaders, changeSelectedProjectHeaders]
				: [selectedWellHeaders, changeSelectedWellHeaders];

		changeHeaders(
			selectedHeaders.includes(key) ? selectedHeaders.filter((h) => h !== key) : [...selectedHeaders, key]
		);
	};

	setCollapsed = (collapse) => {
		if (collapse) {
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			this.SetState(collapse);
		}
	};

	getFilteredHeaders = () => {
		const { headersSearch, sort } = this.state;

		const { headers, selectedHeaders } = this.getHeaders();

		// filter
		const reg = new RegExp(_.escapeRegExp(headersSearch.toLowerCase()));
		const selectedHeadersSet = new Set(selectedHeaders);
		const filteredHeaders = Object.entries(headers)
			.filter(([key, display]) => {
				if (typeof display === 'string') {
					return reg.test(display.toLowerCase()) || selectedHeadersSet.has(key);
				}
				return false;
			})
			.map(([key]) => key);

		// sort
		if (sort === 'selected') {
			const selectedSet = new Set(selectedHeaders);
			const notSelected = filteredHeaders.filter((h) => !selectedSet.has(h));
			return [...selectedHeaders, ...notSelected];
		}

		return [...filteredHeaders].sort((k1, k2) => {
			const value1 = headers[k1];
			const value2 = headers[k2];
			if (value1 < value2) {
				return sort === 'asc' ? -1 : 1;
			}
			if (value1 > value2) {
				return sort === 'asc' ? 1 : -1;
			}
			return 0;
		});
	};

	getHeaders = () => {
		const {
			wellHeaders,
			selectedWellHeaders,
			wellHeaderTypes,
			projectHeaders,
			selectedProjectHeaders,
			projectHeaderTypes,
		} = this.props;
		const { headersKind } = this.state;

		const [headers, selectedHeaders, headerTypes] =
			headersKind === 'project-headers'
				? [projectHeaders, selectedProjectHeaders, projectHeaderTypes]
				: [wellHeaders, selectedWellHeaders, wellHeaderTypes];

		return { headers, selectedHeaders, headerTypes };
	};

	setHeadersFilter = (search) => {
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ headersSearch: search });
	};

	handleSetHeadersSort = () => {
		const { sort } = this.state;
		const nextSort = { asc: 'dsc', selected: 'asc', dsc: 'selected' };
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ sort: nextSort[sort] });
	};

	handleApplyClose = () => {
		const { confirm } = this.props;
		confirm();
	};

	selectFilter = (filter) => {
		const { addSaveFilter } = this.props;
		addSaveFilter(filter);
	};

	changeHeadersKind = (headersKind) => {
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ headersKind });
	};

	render() {
		const { headersSearch, filterByCollapse, filtersListCollapse, headersCollapse, sort, headersKind } = this.state;
		const {
			applyingFilters,
			onCancel,
			changeMainView,
			deleteFilter,
			filterResult: { totalCount = 0 } = {},
			filters,
			mainView,
			project,
			revert,
			saveFilter,
			totalWells,
			type,
			selectedSavedFilter,
			excludeMode,
			setExcludeMode,
			allowsProjectHeaders,
			isWellsCollectionsEnabled,
		} = this.props;

		const { headers, selectedHeaders, headerTypes } = this.getHeaders();

		const filtersToShow = filters.filter((f) => f._id !== 0);
		const wellFilterType = wellFilterTypes[type] || wellFilterTypes.filter;
		const filteredHeaders = this.getFilteredHeaders();

		const allowedHeaders = isWellsCollectionsEnabled
			? filteredHeaders
			: filteredHeaders.filter((header) => header !== 'wells_collection');

		return (
			<Paper id='well-filter-side-bar'>
				<div id='well-filter-side-bar-header'>
					<WellFilterTitle id='well-filter-title' className='md-text' color={wellFilterType.color}>
						{`${wellFilterType.label} Wells`}
					</WellFilterTitle>
					<h4 className='md-text well-filter-sub-title'>{totalWells}</h4>
					<ActionsGroup>
						<Button
							variant='outlined'
							color='secondary'
							size='small'
							disabled={applyingFilters}
							onClick={this.handleApplyClose}
							data-cy='apply'
						>
							APPLY
						</Button>
						<Button variant='outlined' color='secondary' size='small' onClick={onCancel}>
							CLOSE
						</Button>
						<Hook hook={usePermissionsBuilder} props={[SUBJECTS.Filters]}>
							{({ canCreate, permissionTooltip }) => (
								<Button
									variant='outlined'
									color='secondary'
									size='small'
									disabled={!project || (!canCreate({ projectId: project._id }) && permissionTooltip)}
									onClick={saveFilter}
									data-cy='save'
								>
									SAVE
								</Button>
							)}
						</Hook>
						<Button
							variant='outlined'
							color='secondary'
							size='small'
							disabled={mainView === 'vis1'}
							onClick={revert}
						>
							CLEAR
						</Button>
					</ActionsGroup>
					<div
						css={`
							display: flex;
						`}
					>
						<SwitchField
							css={`
								display: flex;
								margin: 0.75rem 0;
								justify-content: space-between;
								width: 100%;
							`}
							labelPlacement='start'
							label={
								<Box display='inline-flex'>
									<Typography
										css={`
											margin-right: 0.5rem;
										`}
									>
										Exclude Mode
									</Typography>
									<InfoIcon
										withRightMargin
										tooltipTitle='Toggling this on will select all of the wells that do not meet the current filtering schema'
									/>
								</Box>
							}
							name='excludeMode'
							onChange={(ev) => setExcludeMode(ev.target.checked)}
							checked={!!excludeMode}
						/>
					</div>
				</div>
				<Divider />
				<List id='well-filter-side-bar-list-container'>
					<ListSubheader
						className='well-filter-side-bar-subheader on-hover-background-primary-opaque'
						onClick={() =>
							filtersToShow.length > 0 && this.handleChange({ filtersListCollapse: !filtersListCollapse })
						}
					>
						<div id='filters-subheader' className={selectedSavedFilter ? 'has-sub' : ''}>
							<span className='md-text primary-subheader'>{`Filters (${filtersToShow.length})`}</span>
							{selectedSavedFilter && (
								<Tooltip title={selectedSavedFilter.name}>
									<span className='secondary-subheader primary-icon'>{selectedSavedFilter.name}</span>
								</Tooltip>
							)}
						</div>
					</ListSubheader>
					<Collapse collapsed={filtersListCollapse}>
						<List className='nested-list saved-filters-list'>
							<Hook hook={usePermissionsBuilder} props={[SUBJECTS.Filters]}>
								{({ canDelete }) =>
									filtersToShow.map((filt) => (
										<ListItem
											key={filt._id}
											className={classNames(
												'list-item on-hover-background-primary-opaque',
												selectedSavedFilter &&
													selectedSavedFilter._id === filt._id &&
													'active-item'
											)}
											css={`
												align-items: center;
												cursor: pointer;
												display: flex;
											`}
											onClick={() => this.selectFilter(filt)}
										>
											<FontAwesomeIcon
												className='list-left-icon'
												icon={faFilter}
												css={`
													margin-right: 0.5rem;
												`}
											/>
											<ListItemText primary={filt.name} disableTypography />
											<Button
												className='list-right-icon-btn warn-btn-icon'
												disabled={!canDelete({ projectId: project._id })}
												onClick={(e) => {
													e.stopPropagation();
													deleteFilter(filt);
												}}
											>
												<FontAwesomeIcon className='list-right-icon warn-icon' icon={faTrash} />
											</Button>
										</ListItem>
									))
								}
							</Hook>
							<Divider />
						</List>
					</Collapse>

					<ListSubheader
						className='well-filter-side-bar-subheader on-hover-background-primary-opaque'
						onClick={() => this.handleChange({ filterByCollapse: !filterByCollapse })}
					>
						Filter View
					</ListSubheader>
					<Collapse collapsed={filterByCollapse}>
						<List className='nested-list'>
							<ListItem
								className={classNames(
									'list-item on-hover-background-primary-opaque filter-view-btn',
									mainView === 'headers' && 'active-item'
								)}
								onClick={() => changeMainView('headers')}
							>
								<FontAwesomeIcon className='list-left-icon' icon={faList} />
								<ListItemText disableTypography primary='Headers' />
							</ListItem>
							<ListItem
								className={classNames(
									'list-item on-hover-background-primary-opaque filter-view-btn',
									mainView === 'map' && 'active-item'
								)}
								onClick={() => changeMainView('map')}
							>
								<FontAwesomeIcon className='list-left-icon' icon={faGlobeAmericas} />{' '}
								<ListItemText disableTypography primary='Map' />
							</ListItem>
							<ListItem
								className={classNames(
									'list-item on-hover-background-primary-opaque filter-view-btn',
									mainView === 'vis1' && 'active-item'
								)}
								disabled={!totalCount || totalCount > 2000}
								onClick={() => changeMainView('vis1')}
							>
								<FontAwesomeIcon className='list-left-icon' icon={faChartBar} />
								<ListItemText disableTypography primary='Bar Chart (≤ 2000 wells)' />
							</ListItem>
							<Divider />
						</List>
					</Collapse>

					{allowsProjectHeaders && (
						<Tabs
							value={headersKind}
							variant='fullWidth'
							onChange={(_ev, newTab) => this.changeHeadersKind(newTab)}
						>
							<Tab
								label='Well Headers'
								value='well-headers'
								css={{ 'min-width': 'unset', padding: '6px' }}
							/>
							<Tab
								label='Project Headers'
								value='project-headers'
								disabled={!allowsProjectHeaders}
								css={{ 'min-width': 'unset', padding: '6px' }}
							/>
						</Tabs>
					)}
					<Collapse collapsed={headersCollapse}>
						<List id='filter-headers-list-and-search' className='nested-list'>
							<ListItem className='list-item search-list-item'>
								<FontAwesomeIcon className='list-left-icon themeMe' icon={faSearch} />
								<TextField
									fullWidth
									type='text'
									value={headersSearch}
									id='well-header-search-field'
									placeholder='Search Header Names'
									onChange={(ev) => this.setHeadersFilter(ev.target.value)}
								/>
							</ListItem>
							<ListItem
								className='list-item sort-list-item on-hover-background-primary-opaque'
								onClick={this.handleSetHeadersSort}
							>
								<FontAwesomeIcon className='list-left-icon themeMe' icon={faSort} />
								<ListItemText
									primary='Sort List '
									secondary={`Current Sort: ${sort[0].toUpperCase() + sort.slice(1)}`}
									primaryTypographyProps={{
										style: { fontSize: '.75rem' },
									}}
									secondaryTypographyProps={{
										style: { opacity: '.5', fontSize: '.75rem' },
									}}
								/>
							</ListItem>
							<List id='filter-headers-list'>
								{allowedHeaders.map((key) => {
									const value = headers[key];
									const { projectHeader } = headerTypes?.[key] ?? {};
									return (
										<ListItem
											key={key}
											className={classNames('list-item', 'on-hover-background-primary-opaque')}
											onClick={() => this.headerClicked(key)}
										>
											{selectedHeaders.includes(key) ? (
												<FontAwesomeIcon
													className='list-left-icon checked'
													icon={faCheckSquare}
												/>
											) : (
												<FontAwesomeIcon className='list-left-icon' icon={faSquare} />
											)}
											<ListItemText
												disableTypography
												primary={
													<>
														{projectHeader && (
															<ColoredCircle $color={projectCustomHeaderColor} />
														)}
														{value}
													</>
												}
											/>
										</ListItem>
									);
								})}
							</List>
						</List>
					</Collapse>
				</List>
			</Paper>
		);
	}
}

export default withLDFeatureFlags(WellFilterSideBar);
