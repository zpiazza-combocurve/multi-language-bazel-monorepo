import { useCallback, useEffect, useState } from 'react';

import { withLoadingBar } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { getAllPolygonsCoordinates } from '@/helpers/map/helpers';
import { postApi } from '@/helpers/routing';
import MapLayers from '@/map/MapLayers';

type ReportMapProps = {
	wells: string[];
	updateReportWells: (wells: string[], reset: boolean) => void;
};

export const ReportMap = ({ wells, updateReportWells }: ReportMapProps) => {
	const { project } = useAlfa(['project']);
	const [polygons, setPolygons] = useState([]);

	const getFilters = useCallback(() => {
		const wellListFilter = {
			include: wells,
			excludeAll: true,
		};
		const geoFilterPolygons = getAllPolygonsCoordinates(polygons);
		const geoFilter = { geo: geoFilterPolygons };

		return [wellListFilter, geoFilter];
	}, [wells, polygons]);

	useEffect(() => {
		const getFilteredWells = async (filters) => {
			const { viewPage = [] } =
				(await withLoadingBar(
					postApi('/filters/lightFilterWells', {
						project: project?._id,
						filters,
						selectedProjectHeaders: [],
						selectedWellHeaders: ['_id'],
					})
				)) ?? {};

			const wellList = viewPage.map((well) => well._id);

			// if the selection has been cleared or an empty space has been selected, then there are no polygons selected
			const unselectedPolygons = polygons.length === 0 || wellList.length === 0;
			updateReportWells(wellList, unselectedPolygons);
		};

		const appliedFilters = getFilters();
		getFilteredWells(appliedFilters);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [polygons]);

	return (
		<MapLayers
			css={{
				height: '100%',
			}}
			setGeoFilter={(polygons) => {
				setPolygons(polygons);
			}}
			appliedFilters={getFilters()}
			polygons={polygons}
			mapVisible
			allowShowingMapSettings
			showDraw
		/>
	);
};
