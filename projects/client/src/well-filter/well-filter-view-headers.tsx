import { faTimes } from '@fortawesome/pro-regular-svg-icons';
import { isEqual } from 'lodash-es';
import { Component } from 'react';
import styled from 'styled-components';

import ColoredCircle from '@/components/misc/ColoredCircle';
import { IconButton } from '@/components/v2';
import { warningAlert, withLoadingBar } from '@/helpers/alerts';
import { debounce } from '@/helpers/debounce';
import { postApi } from '@/helpers/routing';
import { theme } from '@/helpers/styled';
import { projectCustomHeaderColor } from '@/manage-wells/WellsPage/TableView/CollectionTable/HeadersTable.module.scss';

import { getHeaderState, getInitialHeaderState, initHeaderState } from './shared';
import {
	FilterBoolean,
	FilterDateRange,
	FilterMultiCheckbox,
	FilterMultiSelect,
	FilterNumber,
	FilterPercent,
	FilterString,
} from './well-header-input-types';

const DISTINCT_VALUES_LIMIT = 5000;

const Centered = styled.div`
	display: flex;
	align-items: center;
`;
const DeleteButton = styled(IconButton)`
	margin-right: 1rem;
`;

const Separator = styled.div`
	margin: 0.5rem 0;
	border-top: 1px solid ${theme.borderColor};
`;

type WellFilterHeadersViewProps = {
	wellHeaderTypes;
	projectHeaderTypes;
	selectedWellHeaders: string[];
	selectedProjectHeaders: string[];
	headersFilter;
	projectHeadersFilter?;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	appliedFilters: any[];
	project;
	changeSelectedWellHeaders: (headers) => void;
	changeSelectedProjectHeaders: (headers) => void;
	wellHeaders;
	projectHeaders;
	setWellHeadersFilter: (x) => void;
	setProjectHeadersFilter: (x) => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
class WellFilterHeadersView extends Component<WellFilterHeadersViewProps, any> {
	state = initHeaderState({ ...this.props.wellHeaderTypes, ...this.props.projectHeaderTypes });

	_isMounted = false;

	delayedSetWellHeadersFilter = debounce(this.props.setWellHeadersFilter, 1000);

	delayedSetProjectHeadersFilter = debounce(this.props.setProjectHeadersFilter, 1000);

	componentDidMount() {
		this._isMounted = true;
	}

	componentDidUpdate(prevProps) {
		const {
			selectedWellHeaders,
			selectedProjectHeaders,
			headersFilter,
			projectHeadersFilter,
			wellHeaderTypes,
			projectHeaderTypes,
		} = this.props;
		const {
			headersFilter: prevHeadersFilter,
			projectHeadersFilter: prevProjectHeadersFilter,
			wellHeaderTypes: prevWellHeaderTypes,
			projectHeaderTypes: prevProjectHeaderTypes,
		} = prevProps;

		const { headerState } = this.state;
		let newHeaderState = headerState;

		if (!isEqual(wellHeaderTypes, prevWellHeaderTypes) || !isEqual(projectHeaderTypes, prevProjectHeaderTypes)) {
			newHeaderState = getHeaderState({ ...wellHeaderTypes, ...projectHeaderTypes });
		}

		if (!isEqual(headersFilter, prevHeadersFilter)) {
			newHeaderState = {
				...newHeaderState,
				...this.getStateChangeFromFilter(headersFilter, selectedWellHeaders),
			};
		}
		if (!isEqual(projectHeadersFilter, prevProjectHeadersFilter)) {
			newHeaderState = {
				...newHeaderState,
				...this.getStateChangeFromFilter(projectHeadersFilter, selectedProjectHeaders),
			};
		}

		// reference comparison works here
		if (newHeaderState !== headerState) {
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			this.SetState({ headerState: newHeaderState });
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

	onChange = async (value, key, projectHeader = false) => {
		const { selectedWellHeaders, selectedProjectHeaders } = this.props;

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		await this.SetState(({ headerState }) => ({
			headerState: { ...headerState, [key]: { ...headerState[key], value } },
		}));

		if (projectHeader) {
			this.delayedSetProjectHeadersFilter(this.getFilter(selectedProjectHeaders));
		} else {
			this.delayedSetWellHeadersFilter(this.getFilter(selectedWellHeaders));
		}
	};

	getFilter = (selectedHeaders) => {
		const { headerState } = this.state;

		const getRangeFilter = (h, type, value) => {
			const { start, end, exclude, showNull } = value;
			return { type, key: h, filter: { start, end }, exclude, showNull };
		};

		const getMultiFilter = (h, type, value) => {
			const { values, exclude, showNull } = value;
			return { type, key: h, filter: [...values], exclude, showNull };
		};

		const getBooleanFilter = (h, type, value) => ({ type, key: h, filter: value.value, showNull: value.showNull });

		const getStringFilter = (h, type, value) => {
			const { value: filterValue, exact, exclude, showNull } = value;
			return { type, key: h, filter: filterValue, exact, exclude, showNull };
		};

		const headers = selectedHeaders
			.map((h) => {
				const { type, value } = headerState[h] ?? {};

				switch (type) {
					case 'number':
					case 'integer':
					case 'date':
					case 'percent':
						return getRangeFilter(h, type, value);
					case 'multi-checkbox':
					case 'multi-select':
						return getMultiFilter(h, type, value);
					case 'boolean':
						return getBooleanFilter(h, type, value);
					case 'string':
						return getStringFilter(h, type, value);
					default:
						return undefined;
				}
			})
			.filter((f) => f !== undefined);

		return { headers };
	};

	getHeaderStateValue = (stateHeader, filterHeader) => {
		switch (stateHeader.type) {
			case 'multi-checkbox':
			case 'multi-select':
				return {
					values: new Set(filterHeader?.filter || []),
					exclude: filterHeader?.exclude ?? false,
				};
			case 'number':
			case 'integer':
			case 'date':
			case 'percent':
				return filterHeader
					? {
							...filterHeader.filter,
							exclude: filterHeader.exclude,
					  }
					: { start: '', end: '', exclude: false };
			case 'boolean':
				return {
					value: filterHeader?.filter ?? 'both',
				};
			default:
				return filterHeader
					? {
							value: filterHeader.filter,
							exact: filterHeader.exact,
							exclude: filterHeader.exclude,
					  }
					: { value: '', exact: false, exclude: false };
		}
	};

	getStateChangeFromFilter = ({ headers } = { headers: [] }, selectedHeaders) => {
		const { headerState } = this.state;

		const headerStateChanges = {};

		selectedHeaders.forEach((h) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			const filterHeader: any = headers.find(({ key: headerKey }) => headerKey === h);
			const stateHeader = headerState[h];

			if (!stateHeader) {
				return;
			}

			const showNull = stateHeader.value.neverNull ? undefined : filterHeader?.showNull ?? true;

			headerStateChanges[h] = {
				...stateHeader,
				value: { ...stateHeader.value, showNull, ...this.getHeaderStateValue(stateHeader, filterHeader) },
			};
		});

		return headerStateChanges;
	};

	searchMultiSelect = async (key, search, autoSelect = false, projectHeader = false) => {
		const { appliedFilters, project } = this.props;

		const stateVal = this.state.headerState[key].value;

		const filtersWithoutThisHeader = appliedFilters.map(({ headers, ...rest }) => ({
			...(headers && {
				headers: { ...headers, headers: headers.headers?.filter(({ key: filterKey }) => filterKey !== key) },
			}),
			...rest,
		}));

		const results = await withLoadingBar(
			postApi('/filters/getDistinctWellHeaderValues', {
				search,
				header: key,
				filters: filtersWithoutThisHeader,
				project: project?._id,
				isProjectHeader: projectHeader,
			})
		);

		if (results.length === DISTINCT_VALUES_LIMIT) {
			warningAlert(`Limited to only ${DISTINCT_VALUES_LIMIT} distinct values.`);
		}

		const newStateVal = { ...stateVal, collapsed: false, results: { search, results } };
		if (autoSelect) {
			newStateVal.values = new Set(results);
		}
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState(({ headerState }) => ({
			headerState: { ...headerState, [key]: { ...headerState[key], value: newStateVal } },
		}));
	};

	deselectHeader = (header, projectHeader = false) => {
		const {
			changeSelectedWellHeaders,
			changeSelectedProjectHeaders,
			selectedWellHeaders,
			selectedProjectHeaders,
			wellHeaderTypes,
			projectHeaderTypes,
		} = this.props;
		const { headerState } = this.state;

		const [changeSelectedHeaders, selectedHeaders, headerTypes] = projectHeader
			? [changeSelectedProjectHeaders, selectedProjectHeaders, projectHeaderTypes]
			: [changeSelectedWellHeaders, selectedWellHeaders, wellHeaderTypes];

		const { type, options, neverNull } = headerTypes[header];

		const newState = {
			...headerState,
			[header]: getInitialHeaderState(type, options, neverNull),
		};

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ headerState: newState });

		changeSelectedHeaders(selectedHeaders.filter((h) => h !== header));
	};

	renderHeader(header, headerNames, headerTypes) {
		const { headerState } = this.state;

		const headerType = headerTypes[header];
		const { type, projectHeader } = headerType;
		const stateValue = headerState[header]?.value;

		return (
			<div key={header} className='single-header-filter'>
				<div className='md-text header-name'>
					<Centered className='header-name-left'>
						<DeleteButton
							iconSize='small'
							size='small'
							color='error'
							onClick={() => this.deselectHeader(header, projectHeader)}
						>
							{faTimes}
						</DeleteButton>
						<span className='header-span'>
							{projectHeader && <ColoredCircle $color={projectCustomHeaderColor} />}
							{headerNames[header]}
						</span>
					</Centered>
					<div className='header-name-right' />
				</div>
				{['number', 'integer'].includes(type) && (
					<FilterNumber
						inputName={header}
						minValue={stateValue.start}
						maxValue={stateValue.end}
						exclude={stateValue.exclude}
						showNull={stateValue.showNull}
						neverNull={stateValue.neverNull}
						onChange={(value, key) => this.onChange(value, key, projectHeader)}
					/>
				)}
				{type === 'percent' && (
					<FilterPercent
						inputName={header}
						minValue={stateValue.start}
						maxValue={stateValue.end}
						exclude={stateValue.exclude}
						showNull={stateValue.showNull}
						neverNull={stateValue.neverNull}
						onChange={(value, key) => this.onChange(value, key, projectHeader)}
					/>
				)}
				{type === 'string' && (
					<FilterString
						inputName={header}
						value={stateValue.value}
						exclude={stateValue.exclude}
						exact={stateValue.exact}
						showNull={stateValue.showNull}
						neverNull={stateValue.neverNull}
						onChange={(value, key) => this.onChange(value, key, projectHeader)}
					/>
				)}
				{type === 'date' && (
					<FilterDateRange
						dateName={header}
						start_date={stateValue.start}
						end_date={stateValue.end}
						exclude={stateValue.exclude}
						showNull={stateValue.showNull}
						neverNull={stateValue.neverNull}
						onChange={(value, key) => this.onChange(value, key, projectHeader)}
					/>
				)}
				{type === 'multi-select' && (
					<FilterMultiSelect
						inputName={header}
						inputValue={stateValue.value}
						values={stateValue.values}
						results={stateValue.results}
						collapsed={stateValue.collapsed}
						exclude={stateValue.exclude}
						showNull={stateValue.showNull}
						neverNull={stateValue.neverNull}
						onChange={(value, key) => this.onChange(value, key, projectHeader)}
						searchMultiSelect={(key, search, autoSelect) => {
							this.searchMultiSelect(key, search, autoSelect, projectHeader);
						}}
					/>
				)}
				{type === 'multi-checkbox' && (
					<FilterMultiCheckbox
						inputName={header}
						values={stateValue.values}
						options={stateValue.options}
						exclude={stateValue.exclude}
						showNull={stateValue.showNull}
						neverNull={stateValue.neverNull}
						onChange={(value, key) => this.onChange(value, key, projectHeader)}
					/>
				)}
				{type === 'boolean' && (
					<FilterBoolean
						inputName={header}
						value={stateValue.value}
						options={headerType.options}
						showNull={stateValue.showNull}
						neverNull={stateValue.neverNull}
						onChange={(value, key) => this.onChange(value, key, projectHeader)}
					/>
				)}
			</div>
		);
	}

	render() {
		const {
			wellHeaders,
			projectHeaders,
			wellHeaderTypes,
			projectHeaderTypes,
			selectedWellHeaders,
			selectedProjectHeaders,
		} = this.props;

		const showSeparator = !!(
			wellHeaderTypes &&
			selectedWellHeaders?.length &&
			projectHeaderTypes &&
			selectedProjectHeaders?.length
		);

		return (
			<div id='well-filter-headers-view'>
				<h2 className='md-text'>Filter By Headers</h2>
				{wellHeaderTypes && selectedWellHeaders.map((h) => this.renderHeader(h, wellHeaders, wellHeaderTypes))}
				{showSeparator && <Separator />}
				{projectHeaderTypes &&
					selectedProjectHeaders?.map((h) => this.renderHeader(h, projectHeaders, projectHeaderTypes))}
			</div>
		);
	}
}

export default WellFilterHeadersView;
