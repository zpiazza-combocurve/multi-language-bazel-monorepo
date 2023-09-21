import { sortBy } from 'lodash-es';
import { Component, ComponentType, createRef } from 'react';

import { Divider, List, Paper, Stack, Typography, alerts } from '@/components/v2';
import { infoAlert, withLoadingBar } from '@/helpers/alerts';
import { AlfaStore, subscribe } from '@/helpers/alfa';
import { deleteApi, getApi, postApi, putApi } from '@/helpers/routing';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { UserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { useCurrentProject } from '@/projects/api';

import MapHeaders, { MapHeadersComponent } from './MapSettings/MapHeaders';
import NewLayer from './MapSettings/NewLayer';
import UpdateLayer from './MapSettings/UpdateLayer';
import { LayerListItem } from './components/LayerListItem';
import { ShapefileListItem } from './components/ShapefileListItem';
import { INITIAL_PRESET_LAYERS_STATE } from './shared';
import { Layer, LayerExportFormat } from './types';

type MapSettingsProps = Pick<AlfaStore, 'user' | 'project'> & { isLoadingProject: boolean };
interface MapSettingsState {
	layersToShow: Layer[];
	selectedLayerId: string | null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	presetLayersState: any[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	allMyProjects: any[];
	showWells: boolean;
	/** Unsaved modifications to the selected layer */
	selectedLayerState: Partial<Layer> | null;
	centeredMap: boolean;
}

class MapSettings extends Component<MapSettingsProps, MapSettingsState> {
	mapHeadersRef = createRef<MapHeadersComponent>();

	state: MapSettingsState = {
		layersToShow: [],
		selectedLayerId: null,
		presetLayersState: INITIAL_PRESET_LAYERS_STATE,
		allMyProjects: [],
		showWells: true,
		selectedLayerState: null,
		centeredMap: false,
	};

	componentDidMount() {
		this.loadLayers();
		this.loadProjects();
	}

	componentDidUpdate() {
		const { isLoadingProject } = this.props;
		const { centeredMap } = this.state;

		if (!isLoadingProject && !centeredMap) {
			this.mapHeadersRef.current?.centerMap();
			this.setState({ centeredMap: true });
		}
	}

	loadProjects = async () => {
		const { user } = this.props;

		const { items: mine } = await getApi('/projects/withName', {
			limit: 100000,
			createdBy: user._id,
		});
		this.setState({ allMyProjects: mine });
	};

	loadLayers = async () => {
		const { project } = this.props;

		const shapefilesUrl = project ? `/shapefiles/allShapefiles/${project._id}` : '/shapefiles/companyShapefiles';
		const shapefilesDb = await withLoadingBar(getApi(shapefilesUrl));
		const layersPromises = shapefilesDb.map(async ({ idShapefile, ...rest }) => {
			return { idShapefile, ...rest, shSourceType: 'vector' };
		});
		const layers = await withLoadingBar(Promise.all(layersPromises));

		const layersToShow = sortBy(layers, 'position') as Layer[];
		this.setState({ layersToShow });
	};

	uploadCallback = async (notification) => {
		if (notification.status !== TaskStatus.COMPLETED) {
			return;
		}
		await this.loadLayers();
		this.selectLayerFromId(notification.extra.output.createdShapefile._id);
	};

	getSelectedlayer = () => {
		const { layersToShow, selectedLayerId } = this.state;
		return layersToShow?.find((l) => l._id === selectedLayerId);
	};

	handleLayerUpdate = async (layer: Layer) => {
		const { layersToShow } = this.state;

		const newLayersToShow =
			layersToShow?.map((currentLayer) => (currentLayer._id === layer._id ? layer : currentLayer)) ?? [];
		const sortedLayers = sortBy(newLayersToShow, 'position');

		this.setState({ layersToShow: sortedLayers });

		await withLoadingBar(putApi(`/shapefiles/${layer._id}`, layer));
	};

	togglePresetActiveFromIndex = async (i: number) => {
		const { presetLayersState } = this.state;

		const selectedLayer = presetLayersState[i];

		if (
			!selectedLayer.active &&
			!(await alerts.confirm({
				title: 'This might cause the map to run slower',
				confirmText: 'Ok',
			}))
		) {
			return;
		}

		this.setState({
			presetLayersState: [
				...presetLayersState.slice(0, i),
				{ ...selectedLayer, active: !selectedLayer.active },
				...presetLayersState.slice(i + 1),
			],
		});
	};

	togglePresetActive = (layer: Layer) => {
		const { presetLayersState } = this.state;
		const index = presetLayersState.findIndex((presetLayer) => presetLayer.name === layer.name);
		if (index >= 0) {
			this.togglePresetActiveFromIndex(index);
		}
	};

	removeLayer = async (layer: Layer) => {
		if (layer.active) {
			await this.handleLayerUpdate({ ...layer, active: false });
		}

		await withLoadingBar(deleteApi(`/shapefiles/${layer._id}`));
		await withLoadingBar(
			postApi('/shapefiles/shiftPositions', {
				startingPosition: layer.position,
			})
		);

		this.setState({ selectedLayerId: null });
		await this.loadLayers();

		infoAlert(`Layer ${layer.name} successfully deleted`);
	};

	exportLayer = (shapefileId: string, fileName: string, format: LayerExportFormat) => {
		return withLoadingBar(postApi(`/shapefiles/${shapefileId}/export`, { fileName, format }));
	};

	selectLayer = (selectedLayerId: string) => {
		this.setState({ selectedLayerId, selectedLayerState: null });
	};

	selectLayerFromId = (shapefileId: string) => {
		const { layersToShow } = this.state;
		const layer = layersToShow.find(({ _id }) => _id === shapefileId);
		if (layer) {
			this.selectLayer(layer._id);
		}
	};

	setWellsDisplay = (showWells: boolean) => {
		this.setState({ showWells });
	};

	handleSwapPosition = async (layer1: Layer, layer2: Layer) => {
		if (!layer1 || !layer2) {
			return;
		}

		const { layersToShow } = this.state;

		const rest = (layersToShow ?? []).filter(({ _id }) => _id !== layer1._id && _id !== layer2._id);

		const swapped1 = { ...layer1, position: layer2.position };
		const swapped2 = { ...layer2, position: layer1.position };

		const newLayersToShow = sortBy([swapped1, swapped2, ...rest], 'position');
		this.setState({ layersToShow: newLayersToShow });

		await withLoadingBar(
			postApi(`/shapefiles/swapPositions`, { shapefile1: swapped1._id, shapefile2: swapped2._id })
		);
	};

	toggleLayerActive = async (layer: Layer) => {
		const { layersToShow } = this.state;

		const active = !layer.active;

		const newLayersToShow =
			layersToShow?.map((currentLayer) =>
				currentLayer._id === layer._id ? { ...layer, active } : currentLayer
			) ?? [];

		this.setState({ layersToShow: newLayersToShow });

		withLoadingBar(postApi(`/shapefiles/${layer._id}/setActive`, { active }));
	};

	handleSelectedLayerChange = (layer: Partial<Layer>) => {
		this.setState({ selectedLayerState: layer });
	};

	getLayersToShow() {
		// returns the list of preset layers and user layers, also applies modifications to the current selected layer
		const { layersToShow, presetLayersState, selectedLayerId, selectedLayerState } = this.state;

		return [
			...presetLayersState,
			...layersToShow.map((layer) =>
				layer._id === selectedLayerId ? { ...layer, ...selectedLayerState } : layer
			),
		];
	}

	renderLayerList() {
		const { layersToShow, selectedLayerId, showWells, presetLayersState } = this.state;

		const currentLayers = [...presetLayersState, ...layersToShow].map((l) => l.name);

		return (
			<>
				<UserNotificationCallback type={NotificationType.UPLOAD_SHAPEFILE} callback={this.uploadCallback} />
				<Stack css={{ flex: '1 1 50%', overflowY: 'auto' }}>
					<Stack direction='row' justifyContent='space-between' alignItems='center' css={{ padding: '1rem' }}>
						<Typography variant='h5'>Layers</Typography>
						<NewLayer currentLayers={currentLayers} />
					</Stack>
					<List css={{ overflowY: 'auto', minHeight: '10rem', flex: '1 1 auto' }}>
						<LayerListItem
							name='Wells'
							active={showWells}
							onToggle={(value) => this.setWellsDisplay(value)}
						/>
						{presetLayersState.map(({ name, active }, i) => (
							<LayerListItem
								key={name}
								name={name}
								active={active}
								onToggle={() => this.togglePresetActiveFromIndex(i)}
							/>
						))}
						{layersToShow?.map((layerObj, i) => (
							<ShapefileListItem
								key={layerObj._id}
								shapefile={layerObj}
								first={i === 0}
								last={i === layersToShow.length - 1}
								selected={layerObj._id === selectedLayerId}
								onToggle={() => this.toggleLayerActive(layerObj)}
								onMoveUp={() => this.handleSwapPosition(layerObj, layersToShow[i - 1])}
								onMoveDown={() => this.handleSwapPosition(layerObj, layersToShow[i + 1])}
								onClick={() => this.selectLayer(layerObj._id)}
							/>
						))}
					</List>
				</Stack>
			</>
		);
	}

	render() {
		const { showWells } = this.state;

		const selectedLayer = this.getSelectedlayer();

		return (
			<Stack
				direction='row'
				css={{
					height: '100%',
					padding: '1rem',
				}}
				spacing='1rem'
			>
				<Paper css={{ display: 'flex', flexDirection: 'column', width: '300px' }}>
					{this.renderLayerList()}
					{selectedLayer && (
						<>
							<Divider />
							<UpdateLayer
								css={{ flex: '1 0 50%' }}
								layer={selectedLayer}
								exportLayer={this.exportLayer}
								removeLayer={this.removeLayer}
								// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
								updateLayer={this.handleLayerUpdate}
								onSelectedLayerChange={this.handleSelectedLayerChange}
							/>
						</>
					)}
				</Paper>

				<MapHeaders
					ref={this.mapHeadersRef}
					wellDisplay={showWells}
					setWellsDisplay={this.setWellsDisplay}
					layersToShow={this.getLayersToShow()}
					toggleLayerActive={(layer: Layer & { preset?: boolean }) =>
						layer.preset ? this.togglePresetActive(layer) : this.toggleLayerActive(layer)
					}
				/>
			</Stack>
		);
	}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
function withCurrentProject(Component: ComponentType<any>) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return function WrappedComponent(props: any) {
		const { isLoading, project } = useCurrentProject();
		return <Component {...props} project={project} isLoadingProject={isLoading} />;
	};
}

export default subscribe(withCurrentProject(MapSettings), ['user']);
