/* eslint react/jsx-key: warn */
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { sortBy } from 'lodash-es';
import { Component, createRef } from 'react';

import { alerts } from '@/components/v2';
import { confirmationAlert, customErrorAlert, withLoadingBar } from '@/helpers/alerts';
import { subscribe } from '@/helpers/alfa';
import { FeatureIcons } from '@/helpers/features';
import { withWellHeaders } from '@/helpers/headers';
import { getApi, postApi } from '@/helpers/routing';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { UserNotificationCallback } from '@/notifications/useUserNotificationCallback';

import Map from './Map';
import { MapInlineSettingsPanel } from './MapSettings/MapInlineSettingsPanel';
import { MapContainer, WellMapTheme } from './MapboxGL';
import { DEFAULT_HEATMAP_OPTIONS, sanitizeHeatmapOptions } from './WellMap/Heatmap/shared';
import presetLayers from './data/presetLayers.json';
import { HeatmapLegendOverlay, HeatmapMapOverlay } from './heatmap';
import { withMapHeaderSettings } from './hooks';
import { MapOverlayMenuButton } from './map-overlay';

import './map.scss';

import { LayerTogglesContainer, MapShapefileListItem, StyledSwitchField } from './components/MapShapefileListItem';
import { WellsToggle } from './components/WellsToggle';

const projectSelector = ({ project, altProject }) => (altProject === undefined ? project : altProject);

const initState = ({ layersToShow }: MapLayersProps) => ({
	layers: layersToShow ? null : presetLayers.map((l) => ({ ...l, active: false, preset: true })),
	showWells: true,
	showDirectionalSurvey: true,
	useSatellite: false,
	distinticHeadersValues: null,
	colorsHeader: null,
	showHeaderLegend: false,
	colorBy: null,
	wellLabel: null,
	heatmap: {
		status: 'hide',
		options: DEFAULT_HEATMAP_OPTIONS,
		legend: null,
	},
	filteringLayerId: null,
	lastCompletedNotification: null,
});

interface MapLayersProps {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	layersToShow?: any[];
	wellDisplay;
	showDraw;
	allowShowingMapSettings;
	className?: string;
	project;
	altProject;
	toggleLayerActive;
	setWellsDisplay;
	colorBy;
	headerColors;
	wellLabel;
	wellHeadersLabels: Record<string, string>;
	wellHeadersTypes: Record<string, { type: string }>;
	appliedFilters;
	sizeBy?: { header: string | null; min?: number; max?: number };
}

interface MapLayersState {
	layers;
	showWells: boolean;
	showDirectionalSurvey: boolean;
	useSatellite: boolean;
	distinticHeadersValues;
	colorsHeader;
	showHeaderLegend: boolean;
	colorBy: string | null;
	wellLabel: string | null;
	heatmap: {
		status;
		options;
		legend;
	};
	filteringLayerId;
	lastCompletedNotification: string | null;
}

export class MapLayers extends Component<MapLayersProps, MapLayersState> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	mapRef = createRef<any>();

	state = initState(this.props) as MapLayersState;

	componentDidMount() {
		const { layersToShow } = this.props;

		this._isMounted = true;
		if (!layersToShow) {
			this.loadLayers();
		}
		this.loadHeatmapOptions();
	}

	componentDidUpdate() {
		const { layersToShow } = this.props;
		const { filteringLayerId } = this.state;

		if (filteringLayerId) {
			const filteringLayer = layersToShow?.find(({ _id }) => _id === filteringLayerId);
			if (filteringLayer && !filteringLayer.active) {
				// eslint-disable-next-line new-cap -- TODO eslint fix later
				this.SetState({ filteringLayerId: null });
			}
		}
	}

	_isMounted = false;

	getProject = () => projectSelector(this.props);

	loadLayers = async () => {
		const project = this.getProject();

		const shapefilesDb = await getApi(`/shapefiles/allShapefiles/${project?._id}`);
		const layers = shapefilesDb.map((shapeFile) => ({
			...shapeFile,
			shSourceType: 'vector',
		}));

		const sortedLayers = sortBy(layers, 'position');

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({
			layers: [...presetLayers.map((l) => ({ ...l, active: false, preset: true })), ...sortedLayers],
		});
	};

	toggleShowLayer = async (index) => {
		const { layersToShow, toggleLayerActive } = this.props;
		const { layers, filteringLayerId } = this.state;

		if (layersToShow) {
			if (toggleLayerActive) {
				const toggledLayer = layersToShow[index];
				toggleLayerActive(toggledLayer);
				if (filteringLayerId && toggledLayer._id === filteringLayerId) {
					this.setState({ filteringLayerId: null });
				}
			}
			return;
		}

		const layer = layers[index];

		if (layer.preset && !layer.active) {
			const confirmed = await alerts.confirm({
				title: 'This might cause the map to run slower',
				confirmText: 'Ok',
			});

			if (!confirmed) {
				return;
			}
		}

		if (!layer.preset) {
			const active = !layer.active;
			const body = { ...layer, active };
			postApi(`/shapefiles/${body._id}/setActive`, { active });
		}

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState(({ layers: prevLayers }) => {
			const toggledLayer = prevLayers[index];
			const newLayers = [
				...prevLayers.slice(0, index),
				{ ...toggledLayer, active: !toggledLayer.active },
				...prevLayers.slice(index + 1),
			];
			return {
				layers: newLayers,
				filteringLayerId: filteringLayerId && toggledLayer._id === filteringLayerId ? null : filteringLayerId,
			};
		});
	};

	toggleLayerFiltering = (layerId) => {
		const { filteringLayerId } = this.state;

		if (layerId === filteringLayerId) {
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			this.SetState({ filteringLayerId: null });
			return;
		}

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ filteringLayerId: layerId });
	};

	setFilteringLayer = (filteringLayerId) => {
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ filteringLayerId });
	};

	getShape = (shapefileId, index) => withLoadingBar(getApi(`/shapefiles/${shapefileId}/shapes/${index}`));

	permissionError = () => {
		customErrorAlert('You can not disable this layer ', 'Need a Admin permission');
	};

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	// eslint-disable-next-line no-promise-executor-return -- TODO eslint fix later
	SetState = (obj) => new Promise((r) => (!this._isMounted ? r('not mounted') : this.setState(obj, r)));

	handleWellsDisplay = (showWells) => {
		const { wellDisplay, setWellsDisplay } = this.props;

		if (wellDisplay !== undefined) {
			if (!setWellsDisplay) {
				return;
			}
			setWellsDisplay(showWells);
		} else {
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			this.SetState({ showWells });
		}
	};

	handleHeadersDisplay = async () => {
		const { showHeaderLegend } = this.state;

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ showHeaderLegend: !showHeaderLegend });
	};

	setHeatmapStatus = (status) => {
		const { heatmap } = this.state;
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ heatmap: { ...heatmap, status } });
	};

	setHeatmapOptions = (options, status?) => {
		const { heatmap } = this.state;
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ heatmap: { ...heatmap, options, status: status ?? heatmap.status } });
	};

	setHeatmapLegend = (legend) => {
		const { heatmap } = this.state;
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ heatmap: { ...heatmap, legend } });
	};

	loadHeatmapOptions = async () => {
		const { wellHeadersLabels, wellHeadersTypes } = this.props;

		const heatmapSettings = (await getApi('/map/heatmap-settings')) ?? DEFAULT_HEATMAP_OPTIONS;

		if (heatmapSettings) {
			const sanitized = sanitizeHeatmapOptions(heatmapSettings, Object.keys(wellHeadersLabels), wellHeadersTypes);
			this.setHeatmapOptions(sanitized);
		}
	};

	uploadCallback = async (notification) => {
		if (
			notification.status !== TaskStatus.COMPLETED ||
			this.props.layersToShow ||
			this.state.lastCompletedNotification === notification.id
		) {
			return;
		}
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		await this.SetState({ lastCompletedNotification: notification.id });
		await this.loadLayers();
		confirmationAlert(notification.description);
	};

	render() {
		const { wellDisplay, layersToShow, showDraw, allowShowingMapSettings, className, appliedFilters } = this.props;
		const { layers, showWells, useSatellite, showHeaderLegend, heatmap, filteringLayerId, showDirectionalSurvey } =
			this.state;

		const { status: heatmapStatus, options: heatmapOptions, legend: heatmapLegend } = heatmap;
		const showHeatmapLegend = ['show', 'show+fetching-data'].includes(heatmapStatus) && !!heatmapLegend;

		const finalWellDisplay = wellDisplay ?? showWells;
		const finalLayers = (layersToShow ?? layers).map((l) =>
			filteringLayerId && l._id === filteringLayerId ? { ...l, filtering: true } : l
		);

		return (
			<>
				<UserNotificationCallback type={NotificationType.UPLOAD_SHAPEFILE} callback={this.uploadCallback} />

				<div
					className={className}
					css={`
						display: flex;
						flex-direction: row;
						overflow-x: hidden;
						overflow-y: auto;
					`}
				>
					{showHeaderLegend && (
						<MapInlineSettingsPanel
							project={this.getProject()}
							filters={appliedFilters}
							shouldShowWellsColorHeader
						/>
					)}

					<div
						css={`
							flex: 1;
							position: relative;
						`}
					>
						<WellMapTheme>
							<MapContainer>
								<MapOverlayMenuButton
									mapOverlayPosition={0}
									title='Layers'
									menuWidth='18rem'
									menuItems={[
										allowShowingMapSettings && (
											<LayerTogglesContainer key='well-color-legend'>
												<StyledSwitchField
													label='Map Settings'
													name='legendLayer'
													checked={showHeaderLegend}
													onChange={() => this.handleHeadersDisplay()}
												/>
											</LayerTogglesContainer>
										),

										<LayerTogglesContainer key='satellite'>
											<StyledSwitchField
												label='Satellite View'
												name='satellite'
												checked={useSatellite}
												// eslint-disable-next-line new-cap -- TODO eslint fix later
												onChange={(ev) => this.SetState({ useSatellite: ev.target.checked })}
											/>
										</LayerTogglesContainer>,
										<WellsToggle
											key='wells'
											onWellToggleChange={(ev) => this.handleWellsDisplay(ev.target.checked)}
											onDirectionalSurveyChange={() =>
												// eslint-disable-next-line new-cap -- TODO eslint fix later
												this.SetState({
													showDirectionalSurvey: !showDirectionalSurvey,
												})
											}
											wellsChecked={finalWellDisplay}
											showDirectionalSurvey={showDirectionalSurvey}
										/>,
										...finalLayers.map((l, i) => (
											<MapShapefileListItem
												key={l._id || l.name}
												shapefile={l}
												onToggleShow={() => this.toggleShowLayer(i)}
												onToggleFilter={() => this.toggleLayerFiltering(l._id || null)}
											/>
										)),
									].filter(Boolean)}
								>
									<FontAwesomeIcon
										className={classNames('primary-icon')}
										icon={FeatureIcons.layers}
									/>
								</MapOverlayMenuButton>

								<HeatmapMapOverlay
									status={heatmapStatus}
									options={heatmapOptions}
									setStatus={this.setHeatmapStatus}
									setOptions={this.setHeatmapOptions}
								/>
							</MapContainer>
						</WellMapTheme>

						{showHeatmapLegend && <HeatmapLegendOverlay options={heatmapOptions} legend={heatmapLegend} />}

						<Map
							// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
							{...(this.props as any)}
							className={undefined} // exclude className from the props
							ref={this.mapRef}
							wellDisplay={finalWellDisplay}
							showDirectionalSurvey={showDirectionalSurvey}
							useSatellite={useSatellite}
							layersToShow={finalLayers}
							heatmap={heatmap}
							showDraw={showDraw}
							isShowingLegend={showHeaderLegend}
							setHeatmapStatus={this.setHeatmapStatus}
							setHeatmapLegend={this.setHeatmapLegend}
							getShape={this.getShape}
							setFilteringLayer={this.setFilteringLayer}
						/>
					</div>
				</div>
			</>
		);
	}
}

export default subscribe(withMapHeaderSettings(withWellHeaders(MapLayers), projectSelector), ['project']);
