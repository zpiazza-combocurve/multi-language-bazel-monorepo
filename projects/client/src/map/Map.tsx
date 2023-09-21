import { Feature } from 'geojson';
import _ from 'lodash';
import geohash from 'ngeohash';
import { Component } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';

import { withZustandStore } from '@/components/shared';
import { genericErrorAlert, warningAlert, withAsync, withLoadingBar } from '@/helpers/alerts';
import { AlfaStore, subscribe } from '@/helpers/alfa';
import { withDialog } from '@/helpers/dialog';
import { areFilterObjectsEqual } from '@/helpers/filters';
import { getHeaderValueDisplay } from '@/helpers/headers';
import { useMapStore } from '@/helpers/map/draw/mapPortals';
import mapper, { Mapper } from '@/helpers/map/mapper';
import { WithProgress } from '@/helpers/progress';
import { getApi, postApi } from '@/helpers/routing';
import { Filter } from '@/inpt-shared/filters/shared';
import { SingleWellViewDialog } from '@/manage-wells/shared/SingleWellViewDialog';

import { MapWellsLoader } from './MapWellsCache';
import { TileRequestBody, filtersWithoutGeo, getMapTilesGeohashPrecision, shouldShowDimmedWells } from './helpers';
import { withMapHeaderSettings, withMapboxToken } from './hooks';
import { MAP_POPUP_WELL_DATA_HEADERS } from './shared';
import { HeaderSettingsMapData } from './types';

import './map.scss';

// TODO improve types
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const showSingleWellViewDialog = withDialog((props: any) => (
	<WithProgress>
		<SingleWellViewDialog {...props} />
	</WithProgress>
));

interface MapProps extends Pick<AlfaStore, 'theme' | 'project' | 'wellHeaders'>, HeaderSettingsMapData {
	id: string;
	className?: string;

	mapVisible;
	useSatellite: boolean;
	layersToShow;
	wellDisplay;
	showDraw;
	mapFeatures?: Feature[];
	appliedFilters;
	showDirectionalSurvey: boolean;

	expanded;
	filterCount;
	heatmap;
	isShowingLegend;
	setHeatmapStatus;
	setHeatmapLegend;
	altProject;

	setGeoFilter;
	setFilteringLayer;
	getShape;

	mapPortals: React.ReactNode[];

	mapboxToken: string;
}

interface MapState {
	countedFilter?: Filter;
	center;
	mapstyle;
	zoom: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	layers: any[];
	upToDate: boolean;
	filterCountNoGeo?: number;
	geohashes?: string[];
	allWellsBody?: TileRequestBody;
	selectedWellsBody?: TileRequestBody | null;
	startCentered: boolean;
}

const initState = (props): MapState => {
	const { center, style } = props;
	return {
		center,
		mapstyle: style,
		zoom: 5,
		layers: [],
		upToDate: true,
		startCentered: false,
	};
};

export class Map extends Component<MapProps, MapState> {
	static defaultProps = {
		wells: [],
		id: 'mapbox',
		center: {
			lat: 48.12070191689921,
			lon: -102.46419114173229,
		},
		appliedFilters: [],
	};

	state = initState(this.props);

	_isMounted = false;

	cardStyle = { visibility: 'hidden' };

	map?: Mapper;

	async componentDidMount() {
		const { mapboxToken } = this.props;

		this._isMounted = true;

		if (mapboxToken) {
			this.initMap();
		}
	}

	initMap() {
		const {
			id,
			theme,
			useSatellite,
			mapVisible,
			layersToShow,
			wellDisplay,
			showDraw,
			mapboxToken,
			colorBy,
			headerColors,
			wellLabel,
			sizeBy,
		} = this.props;
		const { center, zoom, startCentered } = this.state;

		if (!mapboxToken) {
			return;
		}

		const project = this.getProject();

		this.map = mapper({
			mapboxToken,
			id,
			center,
			zoom,
			theme,
			useSatellite,
			mapHeaderSettings: { colorBy, headerColors, wellLabel, sizeBy },
			showDraw,
			getWellData: this.getWellData,
			showWellDialog: (wellId) =>
				showSingleWellViewDialog({ wellId, context: project ? { projectId: project._id } : {} }),
			getShape: this.getShapeData,
		});

		this.map.addMapListener('dragend', () => this.setClusters());
		this.map.addMapListener('zoomend', () =>
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			this.SetState({ zoom: this.map?.getZoom() ?? zoom }).then(() => this.setClusters())
		);

		this.map.addMapListener('draw.create', this.setFilterFromDrawings);
		this.map.addMapListener('draw.update', this.setFilterFromDrawings);
		this.map.addMapListener('draw.delete', this.setFilterFromDrawings);
		this.map.addMapListener('draw.modechange', this.handleDrawModeChange);

		if (!mapVisible) {
			return;
		}

		if (layersToShow) {
			this.map.loadLayers(layersToShow);
		}

		this.map.setWellsEnabled(wellDisplay);

		this.setDraws();

		if (startCentered) {
			this.centerMap();
		}
	}

	async componentDidUpdate(prevProps) {
		const {
			appliedFilters,
			expanded,
			filterCount,
			layersToShow,
			mapFeatures,
			theme,
			useSatellite,
			wellDisplay,
			heatmap,
			isShowingLegend,
			setHeatmapStatus,
			setHeatmapLegend,
			mapboxToken,
			showDirectionalSurvey,
			colorBy,
			headerColors,
			wellLabel,
			sizeBy,
		} = this.props;
		const { upToDate } = this.state;

		let shouldSetClusters = false;
		let overrideDisplay = false;

		if (mapboxToken !== prevProps.mapboxToken) {
			this.initMap();
		}

		if (!this.map) {
			return;
		}

		if (filterCount !== prevProps.filterCount) {
			shouldSetClusters = true;
		}

		const mapHeaderSettings = { colorBy, headerColors, wellLabel, sizeBy };
		const prevMapHeaderSettings = _.pick(prevProps, ['colorBy', 'headerColors', 'wellLabel', 'sizeBy']);
		if (headerColors && !_.isEqual(mapHeaderSettings, prevMapHeaderSettings)) {
			this.map.styleWells(mapHeaderSettings);
			shouldSetClusters = true;
		}

		if ((this.map && theme !== prevProps.theme) || useSatellite !== prevProps.useSatellite) {
			this.map.changeTheme(theme, useSatellite);
		}

		if (wellDisplay && !prevProps.wellDisplay && !upToDate) {
			shouldSetClusters = true;
		}

		if (showDirectionalSurvey !== prevProps.showDirectionalSurvey) {
			shouldSetClusters = true;
		}

		if (!_.isEqual(prevProps.mapFeatures, mapFeatures)) {
			this.setDraws();
		}

		if (!_.isEqual(prevProps.appliedFilters, appliedFilters)) {
			if (
				!areFilterObjectsEqual(filtersWithoutGeo(prevProps.appliedFilters), filtersWithoutGeo(appliedFilters))
			) {
				this.map.forgetBounds();
			}
			shouldSetClusters = true;
		}

		if (shouldShowDimmedWells(appliedFilters)) {
			await this.updateFilterCount();
		}

		if (!_.isEqual(layersToShow, prevProps.layersToShow)) {
			this.map.loadLayers(layersToShow);
			if (layersToShow.some(({ filtering }) => filtering)) {
				this.map.getDraw()?.resetMode();
			}
		}

		this.map.setWellsEnabled(wellDisplay);

		if (prevProps.expanded !== expanded || isShowingLegend !== prevProps.isShowingLegend) {
			shouldSetClusters = true;
		}

		if (prevProps.wellLabel !== wellLabel) {
			shouldSetClusters = true;
		}

		const heatmapHeaderChanged = prevProps.heatmap?.options?.header !== heatmap?.options?.header;
		const heatmapAndWellsOutdated = heatmap?.status === 'requested' && !upToDate;
		if (heatmapHeaderChanged || heatmapAndWellsOutdated) {
			shouldSetClusters = true;
			overrideDisplay = true;
			setHeatmapStatus(`${heatmap.status}+fetching-data`);
		}

		if (shouldSetClusters) {
			this.setClusters(overrideDisplay);
			return;
		}

		if (heatmap?.status === 'requested') {
			setHeatmapStatus('generating');
			try {
				const { error, legend } = await withAsync(this.map.addHeatmap(heatmap.options));
				if (error) {
					warningAlert(error);
					setHeatmapStatus('hide');
				} else {
					setHeatmapLegend(legend);
					setHeatmapStatus('show');
				}
			} catch (e) {
				genericErrorAlert(e);
				setHeatmapStatus('hide');
			}
		} else if (heatmap?.status === 'hide') {
			this.map.hideHeatmap();
		}
	}

	// @ts-expect-error check type later
	// eslint-disable-next-line no-promise-executor-return -- TODO eslint fix later
	SetState = (obj) => new Promise((r) => (!this._isMounted ? r('not mounted') : this.setState(obj, r)));

	getProject = () => {
		const { project, altProject } = this.props;
		return altProject === undefined ? project : altProject;
	};

	setDraws = () => {
		const { mapFeatures } = this.props;

		const drawControl = this.map?.getDraw();
		if (!drawControl) {
			return;
		}

		if (!_.isEqual(mapFeatures, drawControl.getAll())) {
			this.map?.setDraws(mapFeatures ?? []);
		}
	};

	updateFilterCount = async () => {
		const { appliedFilters, filterCount } = this.props;
		const { countedFilter } = this.state;

		const baseFilter = filtersWithoutGeo(appliedFilters);
		if (countedFilter && areFilterObjectsEqual(baseFilter, countedFilter)) {
			return;
		}

		if ((filterCount || filterCount === 0) && areFilterObjectsEqual(baseFilter, appliedFilters)) {
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			await this.SetState({ filterCountNoGeo: filterCount, countedFilter: baseFilter });
			return;
		}

		const { count } = await withLoadingBar(
			postApi('/filters/lightFilterWellsCount', {
				project: this.getProject()?._id,
				filters: filtersWithoutGeo(appliedFilters),
			})
		);

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		await this.SetState({ filterCountNoGeo: count, countedFilter: baseFilter });
	};

	setFilterFromDrawings = () => {
		const { setGeoFilter } = this.props;

		if (!this.map || !setGeoFilter) {
			return;
		}

		setGeoFilter(this.map.getDraw()?.getAll()?.features);
	};

	handleDrawModeChange = ({ mode }) => {
		const { setFilteringLayer } = this.props;

		if (mode !== 'simple_select') {
			setFilteringLayer(null);
		}
	};

	getExtraHeaders = () => {
		const { heatmap, sizeBy } = this.props;

		return [heatmap?.options?.header, sizeBy?.header].filter((h) => h);
	};

	setClusters = _.debounce(async (overrideDisplay = false) => {
		const {
			mapVisible,
			wellDisplay,
			appliedFilters: filters,
			filterCount,
			showDirectionalSurvey,
			colorBy,
			wellLabel,
		} = this.props;
		const { zoom, filterCountNoGeo } = this.state;
		const project = this.getProject();

		if (!this.map) {
			return;
		}

		if (!wellDisplay && !overrideDisplay) {
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			this.SetState({ upToDate: false });
			return;
		}

		if (!mapVisible) {
			return;
		}

		const [minLon, minLat, maxLon, maxLat] = this.map.getMapBounds();
		const geohashPrecision = getMapTilesGeohashPrecision(zoom);
		const geohashes = geohash.bboxes(minLat, minLon, maxLat, maxLon, geohashPrecision);

		const baseBody = {
			filters,
			headerParam: colorBy ?? undefined,
			project: project?._id,
			wellLabel: wellLabel ?? undefined,
			extraHeaders: this.getExtraHeaders(),
			showDirectionalSurvey,
		};

		let allWellsBody: TileRequestBody;
		let selectedWellsBody: TileRequestBody | null = null;
		if (!shouldShowDimmedWells(filters)) {
			allWellsBody = { ...baseBody, filterCount };
		} else {
			selectedWellsBody = { ...baseBody, filterCount: filterCountNoGeo };
			allWellsBody = { ...selectedWellsBody, filters: filtersWithoutGeo(filters) };
		}

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ geohashes, allWellsBody, selectedWellsBody });
	}, 350);

	getMapBounds = () => {
		const { appliedFilters } = this.props;
		const filters = filtersWithoutGeo(appliedFilters);
		const project = this.getProject();
		const body = {
			filters,
			project: project?._id,
			ignore00: true,
		};
		return withLoadingBar(postApi('/map/getBounds', body));
	};

	centerMap = async () => {
		if (!this.map) {
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			this.SetState({ startCentered: true });
			return;
		}

		if (!this.map.hasBounds()) {
			const bounds = await this.getMapBounds();
			this.map.setBounds(bounds);
		}
		this.map.goToWells();
	};

	getWellData = async (wellId) => {
		const { wellHeaders, heatmap } = this.props;

		const wellData = await getApi(`/well/getWell/${wellId}`);

		let headersToShow = MAP_POPUP_WELL_DATA_HEADERS;
		const heatmapHeader = heatmap?.options?.header;
		if (heatmapHeader && !MAP_POPUP_WELL_DATA_HEADERS.includes(heatmapHeader)) {
			headersToShow = [...headersToShow, heatmapHeader];
		}

		return headersToShow.map((h) => ({
			label: wellHeaders[h],
			value: getHeaderValueDisplay(wellData, h),
		}));
	};

	getShapeData = async (shapeFileId, featureId) => {
		const { getShape } = this.props;

		if ((!featureId && featureId !== 0) || !getShape) {
			return;
		}
		return getShape(shapeFileId, featureId);
	};

	handleOnResize = _.debounce(() => {
		this.map?.getMap()?.resize();
	}, 50);

	handleTileLoaded = (allWells: Feature[], selectedWells?: Feature[]) => {
		this.map?.setClusters(allWells, selectedWells);
	};

	handleFinishLoadingWells = () => {
		const { heatmap, setHeatmapStatus } = this.props;

		if (heatmap?.status.endsWith('+fetching-data')) {
			setHeatmapStatus(heatmap.status.substr(0, heatmap.status.length - '+fetching-data'.length));
		}

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ upToDate: true });
	};

	render() {
		const { id, className, mapPortals } = this.props;
		const { geohashes, allWellsBody, selectedWellsBody } = this.state;

		return (
			<div
				className='map-container'
				css={`
					.custom-draw-controls {
						display: flex;
						flex-direction: row-reverse;
						position: absolute;
						right: 40px;
					}
				`}
			>
				{mapPortals}
				<section id={id} className={className}>
					{/* eslint-disable-next-line react/jsx-no-useless-fragment -- TODO eslint fix later */}
					<AutoSizer onResize={this.handleOnResize}>{() => <></>}</AutoSizer>
					{geohashes && allWellsBody && (
						<MapWellsLoader
							geohashes={geohashes}
							allWellsBody={allWellsBody}
							selectedWellsBody={selectedWellsBody ?? undefined}
							onTileLoaded={this.handleTileLoaded}
							onFinishLoading={this.handleFinishLoadingWells}
						/>
					)}
				</section>
			</div>
		);
	}
}

export default subscribe(
	withMapHeaderSettings(
		withZustandStore(withMapboxToken(Map), useMapStore, (state) => ({ mapPortals: state.mapPortals }))
	),
	['theme', 'project', 'wellHeaders']
);
