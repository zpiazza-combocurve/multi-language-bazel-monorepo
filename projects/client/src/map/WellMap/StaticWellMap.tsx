import { ElementRef, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from 'react-query';

import { Selection } from '@/components/hooks/useSelection';
import { useAlfa } from '@/helpers/alfa';
import { postApi } from '@/helpers/routing';
import { createMap } from '@/helpers/utilities';

import { useColorBy, useSizeBy, useWellLabel } from '../hooks';
import { Bound, getBounds } from '../shared';
import BaseWellMap from './BaseWellMap';
import { WellGeoJson, WellLayersOptions } from './WellsSource';
import useStaticWellMapSelection from './useStaticWellMapSelection';

interface WellInformation {
	id: string;
	hidden?: boolean;
}

interface StaticWellMapProps {
	children?: React.ReactNode;
	/** Either well id or well information */
	wells?: (string | WellInformation)[];
	className?: string;
	sourceLayerOptions?: Partial<WellLayersOptions>;
	/** See @/components/v2/menu/index.tsx file for menu items */
	mapSettingsMenuItem?: React.ReactNode;
	mapMenuItems?: React.ReactNode;
	bounds?: Bound;
	boundsPadding?: number;
	autoCenter?: boolean;
	selection?: Selection;
	mapLayers?: Array<{ key: string; label: string; color: string; tooltip: string }>;
	shouldShowWellsColorHeader?: boolean;
}

function isDefined<T>(v: T | null | undefined): v is T {
	return !!v;
}

/**
 * Component for any map that shows a predetermined list of wells. Has all of the functionalities of the BaseMap.
 * Additionally supports:
 *
 * - Fetching any additional information required to show the wells (location and headers required for label and size).
 * - Building the GeoJSON data required by the BaseMap.
 * - Centering on wells by default, but custom bounds can be specified. Autocentering when wells change.
 * - Selecting wells on the map by clicking them or using polygon/freehand draw, if a Selection object is passed.
 */
function StaticWellMap({
	children,
	wells = [],
	className,
	sourceLayerOptions,
	mapSettingsMenuItem,
	mapMenuItems,
	bounds,
	boundsPadding,
	autoCenter = true,
	selection,
	mapLayers,
}: StaticWellMapProps) {
	const { project } = useAlfa(['project']);
	const [showDirectionalSurvey, setShowDirectionalSurvey] = useState(true);

	const { wellLabel, isLoading: isLoadingWellLabel } = useWellLabel(project ?? null);
	const { colorBy } = useColorBy(project ?? null);

	const wellIds = useMemo(() => wells.map((well) => (typeof well === 'string' ? well : well.id)), [wells]);

	const { isLoading: isLoadingSizeBy, ...sizeBy } = useSizeBy(project ?? null, [
		{ excludeAll: true, include: wellIds },
	]);

	const isLoading = isLoadingWellLabel || isLoadingSizeBy;

	const headersToFetch = [wellLabel, sizeBy.header, colorBy].filter((h) => h);

	const wellsCoordQuery = useQuery(
		['wells-map', wellIds, headersToFetch, project?._id, showDirectionalSurvey],
		() =>
			postApi('/map/wells', {
				wellIds,
				headers: headersToFetch,
				project: project?._id,
				showDirectionalSurvey,
			}) as Promise<(WellGeoJson | null)[]>,
		{ enabled: !isLoading }
	);

	const parsedWells = useMemo(() => {
		if (!wellsCoordQuery.data) {
			return [];
		}

		const wellsGeoJson = wellsCoordQuery.data;
		const normalizedWells = wells.map((well) => (typeof well === 'string' ? { id: well } : well));
		const wellGeoJsonMap = createMap(wellsGeoJson, 'properties.wellId');

		return normalizedWells
			.filter(({ hidden }) => !hidden)
			.map(({ id: wellId, ...propWellRest }) => {
				const geoJsonWell = wellGeoJsonMap.get(wellId);
				if (!geoJsonWell) {
					return null;
				}
				return {
					...geoJsonWell,
					properties: {
						...geoJsonWell.properties,
						...propWellRest,
						header: colorBy ? geoJsonWell?.properties?.[colorBy] : 'default',
					},
				};
			})
			.filter(isDefined);
	}, [wellsCoordQuery.data, wells, colorBy]);

	const { handleWellClick, handleSelectionFeaturesChange } = useStaticWellMapSelection({
		wells: parsedWells,
		selection,
	});

	const mapRef = useRef<ElementRef<typeof BaseWellMap>>();

	useEffect(() => {
		if (autoCenter) {
			setTimeout(() => mapRef.current?.center());
		}
	}, [wellsCoordQuery.data, autoCenter, bounds]);

	const actualBounds = useMemo(() => bounds ?? getBounds(parsedWells), [bounds, parsedWells]);
	const actualBoundsPadding = boundsPadding ?? 50;

	const handleShowDirectionalSurvey = () => {
		setShowDirectionalSurvey((prev) => !prev);
	};

	return (
		<BaseWellMap
			ref={mapRef}
			wellsGeoJson={parsedWells}
			className={className}
			sourceLayerOptions={sourceLayerOptions}
			mapSettingsMenuItem={mapSettingsMenuItem}
			mapMenuItems={mapMenuItems}
			bounds={actualBounds}
			boundsPadding={actualBoundsPadding}
			showDrawingControl={!!selection}
			onDrawingChange={handleSelectionFeaturesChange}
			onWellClick={handleWellClick}
			mapLayers={mapLayers}
			onShowDirectionalSurvey={handleShowDirectionalSurvey}
			showDirectionalSurvey={showDirectionalSurvey}
			sizeBy={sizeBy}
		>
			{children}
		</BaseWellMap>
	);
}

export default StaticWellMap;
