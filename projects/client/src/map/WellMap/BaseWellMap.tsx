import 'mapbox-gl/dist/mapbox-gl.css';

import { faLocation, faPrint } from '@fortawesome/pro-regular-svg-icons';
import { Feature } from 'geojson';
import mapboxgl from 'mapbox-gl';
import {
	ElementRef,
	ForwardedRef,
	ReactNode,
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';

import { alerts } from '@/components/v2';
import { useAlfa } from '@/helpers/alfa';
import { postApi } from '@/helpers/routing';

import MapboxGL from '../MapboxGL';
import { DrawingCustomControls } from '../MapboxGL/DrawingCustomControls';
import MapNativeControl from '../MapboxGL/MapNativeControl';
import { MapControlIconButton } from '../MapboxGL/controls';
import ShapefileSource, { ShapefileFiltering } from '../WellMap/ShapefileSource';
import { MapShapefileListItem, StyledSwitchField } from '../components/MapShapefileListItem';
import { WellsToggle } from '../components/WellsToggle';
import { useColorBy, useHeaderColors, useWellLabel } from '../hooks';
import { Bound, INITIAL_PRESET_LAYERS_STATE, getBoundCenter, getVisibleLayers } from '../shared';
import { Layer, Shapefile } from '../types';
import Heatmap from './Heatmap/Heatmap';
import LayersMenu from './LayersMenu';
import PresetLayerSource from './PresetLayersSource';
import WellsSource, { WellGeoJson, WellLayersOptions } from './WellsSource';
import { useExportMap } from './useExportMap';

const EMPTY_ARRAY = [];
function noop() {
	// do nothing
}
export interface WellMapProps {
	children?: React.ReactNode;
	wellsGeoJson?: WellGeoJson[];
	className?: string;
	sourceLayerOptions?: Partial<WellLayersOptions>;
	/** See @/components/v2/menu/index.tsx file for menu items */
	mapSettingsMenuItem?: React.ReactNode;
	mapMenuItems?: React.ReactNode;
	bounds?: Bound;
	boundsPadding?: number;
	showDrawingControl?: boolean;
	persistDrawings?: boolean;
	showDirectionalSurvey: boolean;
	onDrawingChange?: (draws: Feature[]) => void;
	onWellClick?: (feature: WellGeoJson) => void;
	onShowDirectionalSurvey: (showDirectionalSurvey: boolean) => void;
	mapLayers?: Array<{ key: string; label: string; color: string; tooltip: string }>;
	sizeBy;
}

/**
 * Base component for a map that shows wells. Has all the common functionality for all maps. Supports:
 *
 * - Scale and zoom controls, and Mapbox attribution (currently no compass).
 * - Toggle for satellite view.
 * - Showing well surface and horizontals.
 * - Showing well labels based on configuration.
 * - Showing well sizes based on configuration.
 * - Ability to fully customize the layout and paint properties of the wells layers.
 * - Showing well layers based on configuration and allowing to switch them on and off (currently doesn't show special
 *   layers, like PLSS and Texas Land Survey).
 * - Ability to add additional items for the layers menu.
 * - Basic drawing functionality with customizable effect.
 * - Button for centering on specified bounds (as well as centering triggereable by parent component).
 * - Show well information on hover.
 * - Ability to set custom functionality for well click.
 * - Ability to add custom MapboxGL controls to the map.
 */
function BaseWellMap(props: WellMapProps, ref: ForwardedRef<{ center: () => void } | undefined>) {
	const {
		className,
		children,
		wellsGeoJson = EMPTY_ARRAY,
		sourceLayerOptions,
		mapSettingsMenuItem,
		mapMenuItems,
		bounds,
		boundsPadding,
		persistDrawings = true,
		showDrawingControl,
		onDrawingChange,
		onShowDirectionalSurvey,
		showDirectionalSurvey,
		onWellClick = noop,
		mapLayers = [],
		sizeBy,
	} = props;
	const { project, theme } = useAlfa();

	const { wellLabel } = useWellLabel(project ?? null);
	const [presetLayers, setPresetLayers] = useState(INITIAL_PRESET_LAYERS_STATE);
	const { colorBy } = useColorBy(project ?? null);
	const { headerColors } = useHeaderColors(project ?? null);
	const [mapPortals, setMapPortals] = useState<ReactNode[]>([]);
	const [satelliteView, setSatelliteView] = useState(false);
	const [heatmapData, setHeatmapData] = useState();
	const [layerData, setLayerData] = useState<ShapefileFiltering[]>([]);
	const [filterByLayer, setFilterByLayer] = useState();
	const [showWells, setShowWells] = useState(true);
	const drawRef = useRef<MapboxDraw | undefined>();

	const mapRef = useRef<ElementRef<typeof MapboxGL> | undefined>();

	const queryClient = useQueryClient();

	const layersQueryKey = ['wells-map-layers', project?._id];

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const { data: layerQueryData } = useQuery(layersQueryKey, () => getVisibleLayers(project!._id), {
		enabled: !!project,
	});

	const activeLayersMutation = useMutation(
		async ({ shapefileId, active }: { shapefileId: string; active: boolean }) => {
			queryClient.setQueryData(
				layersQueryKey,
				(data: Shapefile[] | undefined) =>
					data?.map((shapefile) => (shapefile._id === shapefileId ? { ...shapefile, active } : shapefile)) ??
					[]
			);
			await postApi(`/shapefiles/${shapefileId}/setActive`, { active });
			queryClient.invalidateQueries(layersQueryKey);
			return 1;
		}
	);

	const center = useCallback(() => {
		if (mapRef.current && bounds) {
			mapRef.current.fitBounds(bounds, { padding: boundsPadding ?? 0 });
		}
	}, [bounds, boundsPadding]);

	useImperativeHandle(ref, () => ({ center }));

	const mapCenter = useMemo(() => getBoundCenter(bounds), [bounds]);
	const togglePresetActiveFromIndex = async (i: number) => {
		const selectedLayer = presetLayers[i];

		if (
			!selectedLayer.active &&
			!(await alerts.confirm({
				title: 'This might cause the map to run slower',
				confirmText: 'Ok',
			}))
		) {
			return;
		}

		setPresetLayers((layers) => {
			return [...layers.slice(0, i), { ...selectedLayer, active: !selectedLayer.active }, ...layers.slice(i + 1)];
		});
	};

	const toggleFilterByLayer = (layer) => {
		const newLayers =
			layerQueryData?.map((layerData) => {
				return { ...layerData, filtering: false };
			}) || [];
		if (layer === filterByLayer) {
			setFilterByLayer(undefined);
			setLayerData(newLayers);
			return;
		}
		setLayerData(
			newLayers.map((layerData) => {
				return { ...layerData, filtering: layerData._id === layer };
			})
		);
		setFilterByLayer(layer);
	};

	const { exportMapDialog, openExportMapDialog } = useExportMap(
		mapRef.current,
		heatmapData,
		mapLayers,
		sizeBy,
		colorBy,
		headerColors
	);

	const handleDrawModeChange = (mode) => {
		if (mode !== 'simple_select') {
			setFilterByLayer(undefined);
		}
	};

	useEffect(() => {
		setLayerData(
			layerQueryData?.map((layerData) => {
				return { ...layerData, filtering: layerData._id === filterByLayer };
			}) || []
		);
	}, [layerQueryData, setLayerData, filterByLayer]);

	return (
		<>
			{mapPortals}
			{exportMapDialog}
			<MapboxGL
				ref={mapRef}
				css={`
					width: 100%;
					height: 100%;
					overflow: hidden;
					position: relative;
					.mapboxgl-popup {
						color: black;
					}
					.custom-draw-controls {
						display: flex;
						flex-direction: row-reverse;
						position: absolute;
						right: 40px;
					}
				`}
				className={className}
				center={mapCenter}
				satelliteView={satelliteView}
			>
				<MapNativeControl control={mapboxgl.ScaleControl} unit='imperial' position='bottom-left' />
				<MapNativeControl
					control={mapboxgl.NavigationControl}
					showCompass
					showZoom
					position='top-right'
					visualizePitch
				/>
				<DrawingCustomControls
					drawRef={drawRef}
					setMapPortals={setMapPortals}
					theme={satelliteView ? 'dark' : theme}
					showDrawingControl={showDrawingControl}
					persistDrawings={persistDrawings}
					onDrawingChange={onDrawingChange}
					onDrawModeChange={handleDrawModeChange}
				/>
				<MapControlIconButton onClick={center} tooltipTitle='Center on wells' mapControlPosition='top-right'>
					{faLocation}
				</MapControlIconButton>
				<MapControlIconButton
					onClick={openExportMapDialog}
					tooltipTitle='Export Map'
					mapControlPosition='top-right'
				>
					{faPrint}
				</MapControlIconButton>
				{showWells && (
					<WellsSource
						wells={wellsGeoJson}
						wellLabel={wellLabel}
						sizeBy={sizeBy}
						headerColors={headerColors}
						onClick={onWellClick}
						sourceLayerOptions={sourceLayerOptions}
						preventDefaultOnClick
					/>
				)}
				<LayersMenu>
					{mapSettingsMenuItem}
					<StyledSwitchField
						key='satellite'
						label='Satellite View'
						checked={satelliteView}
						onChange={(ev) => setSatelliteView(ev.target.checked)}
					/>
					<WellsToggle
						onWellToggleChange={() => setShowWells((prev) => !prev)}
						onDirectionalSurveyChange={onShowDirectionalSurvey}
						wellsChecked={showWells}
						showDirectionalSurvey={showDirectionalSurvey}
					/>
					{mapMenuItems}
					{presetLayers.map(({ name, active }, i) => (
						<StyledSwitchField
							key={name}
							label={name}
							checked={active}
							onChange={() => togglePresetActiveFromIndex(i)}
						/>
					))}
					{layerData?.map((l) => (
						<MapShapefileListItem
							key={l._id || l.name}
							shapefile={l as Layer}
							onToggleShow={(event) =>
								activeLayersMutation.mutateAsync({
									shapefileId: l._id,
									active: event.target.checked,
								})
							}
							onToggleFilter={() => toggleFilterByLayer(l._id)}
						/>
					))}
				</LayersMenu>
				<Heatmap wells={wellsGeoJson} onHeatmapDataChange={setHeatmapData} />
				{layerData
					?.filter((shapefile) => !!shapefile.active)
					.map((shapefile) => (
						<ShapefileSource key={shapefile.idShapefile} shapefile={shapefile} customDrawRef={drawRef} />
					))}
				{presetLayers.map((layer) => (
					<PresetLayerSource key={layer.name} presetLayer={layer} visible={!!layer.active} />
				))}
				{children}
			</MapboxGL>
		</>
	);
}

export default forwardRef(BaseWellMap);
