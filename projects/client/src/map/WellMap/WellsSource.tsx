/* eslint react/jsx-key: warn */
import { Feature, GeoJsonProperties, LineString, Point } from 'geojson';
import { CircleLayout, CirclePaint, LineLayout, LinePaint, SymbolLayout, SymbolPaint } from 'mapbox-gl';
import { useCallback, useMemo, useState } from 'react';
import { useQuery } from 'react-query';

import { useAlfa } from '@/helpers/alfa';
import { getHeaderValueDisplay, useWellHeaders } from '@/helpers/headers';
import { getColorExpression, isSinglePointGeometry, toPointFeature } from '@/helpers/map/helpers';
import { DEFAULT_WELLS_SIZE, getWellRadiusExpression } from '@/helpers/map/well-size';
import { getApi } from '@/helpers/routing';
import { BLUE_2 } from '@/helpers/zing';
import Layer from '@/map/MapboxGL/Layer';
import Popup, { PopupProps } from '@/map/MapboxGL/Popup';
import Source from '@/map/MapboxGL/Source';
import { MAP_POPUP_WELL_DATA_HEADERS } from '@/map/shared';
import { HeaderSettingsMapData } from '@/map/types';

const WELLS_LINE_MIN_ZOOM = 9;
export const WHITE = '#fff';
export const BLACK = '#000';
export const DARK_GRAY = '#222';

export const WELL_COLOR = BLUE_2;

export type WellGeoJson = Feature<Point | LineString, GeoJsonProperties & { wellId: string }>;

export interface WellLayersOptions {
	surfaceLayout: CircleLayout;
	surfacePaint: CirclePaint;
	horizontalLayout: LineLayout;
	horizontalPaint: LinePaint;
	labelOnSurfaceLayout: SymbolLayout;
	labelOnHorizontalLayout: SymbolLayout;
	labelPaint: SymbolPaint;
}

// TODO get theme from local store
const getDefaultLayerOptions = (theme: string, options: Partial<WellLayersOptions> | undefined): WellLayersOptions => {
	const {
		surfaceLayout = {},
		surfacePaint = {},
		horizontalLayout = {},
		horizontalPaint = {},
		labelOnSurfaceLayout = {},
		labelOnHorizontalLayout = {},
		labelPaint = {},
	} = options ?? {};

	const textColor = theme === 'dark' ? WHITE : BLACK;
	const labelLayoutCommon = { 'text-size': 12 };

	return {
		surfaceLayout: { ...surfaceLayout },
		surfacePaint: {
			'circle-color': WELL_COLOR,
			'circle-stroke-color': textColor,
			'circle-stroke-width': 1,
			'circle-radius': DEFAULT_WELLS_SIZE,
			...surfacePaint,
		},
		horizontalLayout: { ...horizontalLayout },
		horizontalPaint: { 'line-color': WELL_COLOR, 'line-width': 2, ...horizontalPaint },
		labelOnSurfaceLayout: {
			'symbol-placement': 'point',
			'text-padding': 5,
			'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
			'text-justify': 'auto',
			'text-radial-offset': 1,
			...labelLayoutCommon,
			...labelOnSurfaceLayout,
		},
		labelOnHorizontalLayout: {
			'symbol-placement': 'line',
			'text-padding': 0,
			...labelLayoutCommon,
			...labelOnHorizontalLayout,
		},
		labelPaint: {
			'text-color': textColor,
			'text-halo-color': theme === 'dark' ? DARK_GRAY : WHITE,
			'text-halo-width': 1,
			'text-halo-blur': 1,
			'text-opacity': 0.9,
			...labelPaint,
		},
	};
};

function WellInfoPopup(props: Pick<PopupProps, 'lnglat'> & { wellId: string; wellRadius?: number }) {
	const { wellId, wellRadius, ...popupProps } = props;
	const { wellHeadersLabels } = useWellHeaders();

	const wellDataQuery = useQuery(
		['well-headers', { wellId }],
		() => getApi(`/well/getWell/${wellId}`) as Promise<Inpt.Well>
	);
	if (!wellDataQuery.data) {
		return null;
	}

	return (
		<Popup
			{...popupProps}
			closeButton={false}
			offset={[0, -(wellRadius ?? 0)]}
			css={`
				display: flex;
				flex-direction: column;
				margin-top: 1em;
				line-height: 1.6em;
				font-size: 80%;
			`}
		>
			{MAP_POPUP_WELL_DATA_HEADERS.map((key) => (
				<div key={key}>
					<span>
						<strong>{wellHeadersLabels[key]}: </strong>{' '}
					</span>{' '}
					{getHeaderValueDisplay(wellDataQuery.data, key)}
				</div>
			))}
		</Popup>
	);
}

/** Source and Layers for the wells in the map */
const WellsSource = ({
	wells,
	wellLabel,
	sizeBy,
	onClick,
	preventDefaultOnClick,
	headerColors,
	sourceLayerOptions = {}, // added so as not to affect defaults for every map in the app
}: {
	wells: WellGeoJson[];
	wellLabel?: string | null;
	sizeBy: HeaderSettingsMapData['sizeBy'];
	onClick: (feature: WellGeoJson) => void;
	preventDefaultOnClick?: boolean;
	sourceLayerOptions?: Partial<WellLayersOptions>;
	headerColors;
}) => {
	const { theme } = useAlfa();

	const {
		surfaceLayout,
		surfacePaint,
		horizontalLayout,
		horizontalPaint,
		labelOnSurfaceLayout,
		labelOnHorizontalLayout,
		labelPaint,
	} = getDefaultLayerOptions(theme, sourceLayerOptions);

	const pointsGeoJson = useMemo(
		() => ({ type: 'FeatureCollection' as const, features: wells.map(toPointFeature) }),
		[wells]
	);
	const linesGeoJson = useMemo(() => ({ type: 'FeatureCollection' as const, features: wells }), [wells]);
	const pointsOnlyGeoJson = useMemo(
		() => ({
			type: 'FeatureCollection' as const,
			features: wells.filter(isSinglePointGeometry).map(toPointFeature),
		}),
		[wells]
	);
	const getCustomColor = useCallback(
		(property) =>
			// use colorBy colors if sourceLayerOptions color configuration is not passed
			!Object.keys(sourceLayerOptions).length
				? { [property]: getColorExpression(headerColors, theme, true) }
				: {},
		[headerColors, theme, sourceLayerOptions]
	);

	const [{ hovered, hoverLngLat, wellId, wellRadius }, setHoveredState] = useState<{
		hovered?: boolean;
		hoverLngLat?: [number, number];
		wellId?: string;
		wellRadius?: number;
	}>({ hovered: false });

	const handleOnClick = (event) => {
		if (!onClick || !event.features || event.features.length === 0) {
			return;
		}
		onClick(event.features[0]);
		if (preventDefaultOnClick) {
			event.preventDefault();
		}
	};

	const handleOnHover = (event) => {
		if (!event.features || event.features.length === 0) {
			return;
		}

		const feature = event.features[0];
		const coords = feature.geometry.coordinates;

		if (feature.properties.wellId) {
			setHoveredState({
				hovered: true,
				hoverLngLat: coords,
				wellId: feature.properties.wellId,
				wellRadius: feature.layer?.paint?.['circle-radius'] ?? 0,
			});
		}
	};

	const handleOnLeave = () => {
		if (hovered) {
			setHoveredState({ hovered: false });
		}
	};

	return (
		<>
			<Source type='geojson' data={linesGeoJson}>
				<Layer
					type='line'
					minzoom={WELLS_LINE_MIN_ZOOM}
					layout={horizontalLayout}
					paint={{ ...horizontalPaint, ...getCustomColor('line-color') }}
					id='wells-line-layers'
				/>
				{wellLabel && (
					<Layer
						id='line-labels-layer'
						type='symbol'
						minzoom={WELLS_LINE_MIN_ZOOM}
						layout={{
							...labelOnHorizontalLayout,
							'text-field': `{${wellLabel}}`,
						}}
						paint={labelPaint}
					/>
				)}
			</Source>
			{/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later */}
			<Source type='geojson' data={pointsGeoJson as any}>
				<Layer
					id='wells-layer'
					type='circle'
					layout={surfaceLayout}
					paint={{
						...surfacePaint,
						...getCustomColor('circle-color'),
						'circle-radius': getWellRadiusExpression(sizeBy),
					}}
					onMouseEnter={handleOnHover}
					onMouseLeave={handleOnLeave}
					onClick={handleOnClick}
					beforeLayer='wells-line-layers'
				/>
			</Source>
			{/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later */}
			<Source type='geojson' data={pointsOnlyGeoJson as any}>
				{wellLabel && (
					<Layer
						id='point-labels-layer'
						type='symbol'
						minzoom={WELLS_LINE_MIN_ZOOM}
						layout={{
							...labelOnSurfaceLayout,
							'text-field': `{${wellLabel}}`,
						}}
						paint={labelPaint}
					/>
				)}
			</Source>
			{hovered && wellId && <WellInfoPopup wellId={wellId} lnglat={hoverLngLat} wellRadius={wellRadius} />}
		</>
	);
};

export default WellsSource;
