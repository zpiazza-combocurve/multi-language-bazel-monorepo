import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';

import { useLoadingBar, withAsync } from '@/helpers/alerts';
import { getApi, postApi } from '@/helpers/routing';
import { stringToColor } from '@/helpers/utilities';
import { BLUE_2 } from '@/helpers/zing';

import { getProjectFilter } from './shared';
import { MapHeaderSettings } from './types';

const DEFAULT_HEADER_COLOR = BLUE_2;
const DEFAULT_WELL_LABEL = 'well_name_number';

interface UpdateHeaderSettingsParams {
	update: Partial<MapHeaderSettings>;
}

function useHeaderSettingsQuery(project: Pick<Inpt.Project, '_id'> | null) {
	return useQuery<MapHeaderSettings>(['map-headers', project?._id], () =>
		getApi('/headers/getHeader', { project: project?._id ?? '' })
	);
}

function useUpdateHeaderSettingsMutation(project: Pick<Inpt.Project, '_id'> | null) {
	const queryClient = useQueryClient();
	return useMutation(
		async ({ update }: UpdateHeaderSettingsParams) =>
			postApi('/headers/updateProjectMapHeaders', update) as Promise<MapHeaderSettings>,
		{
			onMutate: ({ update }) => {
				const prev = queryClient.getQueryData<Partial<MapHeaderSettings>>(['map-headers', project?._id]);
				if (prev) {
					queryClient.setQueryData(['map-headers', project?._id], { ...prev, ...update }); // optimistic update
				}
			},
			onSuccess: (newSettings) => {
				queryClient.setQueryData(['map-headers', project?._id], newSettings);
			},
		}
	);
}

function getDistinctHeaderValues(
	header: string,
	project: Pick<Inpt.Project, '_id' | 'wells'> | null,
	filters: unknown[]
) {
	return postApi('/filters/getDistinctWellHeaderValues', {
		project: project?._id,
		header,
		filters,
	}) as Promise<Array<string | null>>;
}

function getHeaderValuesRange(header: string, project: Pick<Inpt.Project, '_id' | 'wells'> | null, filters: unknown[]) {
	return postApi('/filters/getWellHeaderValuesRange', {
		project: project?._id,
		header,
		filters,
	}) as Promise<{ min?: number; max?: number }>;
}

/** Allows checking if a callback should be discarded */
function useCancelled() {
	const lastestRef = useRef<symbol>();
	return useCallback(() => {
		const current = Symbol('Latest Run');
		lastestRef.current = current;
		return () => lastestRef.current !== current;
	}, []);
}

export function useColorBy(project: Pick<Inpt.Project, '_id' | 'wells'> | null, filters: unknown[] = []) {
	const headerSettingsQuery = useHeaderSettingsQuery(project);

	const updateHeaderSettingsMutation = useUpdateHeaderSettingsMutation(project);

	const colorBy = headerSettingsQuery.data?.header ?? null;

	const cancelDistinctHeaderValues = useCancelled();

	const updateColorByMutation = useMutation(async ({ header }: { header: string | null }) => {
		// TODO check how this can be improved
		// updates the settings, and fetches distinct header values and updates the settings again
		const isCanceled = cancelDistinctHeaderValues(); // will cancel previus calls to setColorBy
		const distinctHeaderValuesPromise = header
			? getDistinctHeaderValues(header, project, filters)
			: Promise.resolve([]);
		await updateHeaderSettingsMutation.mutateAsync({
			update: { projectId: project?._id.toString(), header },
		});

		// checks if calls to setColorBy has been canceled
		if (isCanceled()) return;
		const distinctHeaderValues = await withAsync(distinctHeaderValuesPromise);
		const headerValues = [...distinctHeaderValues.filter((v) => v !== null), null];
		if (isCanceled()) return;
		await updateHeaderSettingsMutation.mutateAsync({
			update: {
				projectId: project?._id.toString(),
				header,
				headerValues,
				colors: headerValues.map((value) => (value != null ? stringToColor(value) : DEFAULT_HEADER_COLOR)),
			},
		});
	});

	const setColorBy = useCallback(
		(header: string | null) => {
			updateColorByMutation.mutate({ header });
		},
		[updateColorByMutation]
	);

	return {
		colorBy,
		setColorBy,
		isLoading: headerSettingsQuery.isLoading,
		isUpdating: updateHeaderSettingsMutation.isLoading || updateColorByMutation.isLoading,
	};
}

export function useHeaderColors(project: Pick<Inpt.Project, '_id'> | null) {
	const { data: mapHeaderSettings, isLoading: isLoadingSettings } = useHeaderSettingsQuery(project);
	const headerColors = useMemo(() => {
		if (!mapHeaderSettings?.headerValues || !mapHeaderSettings.colors) {
			return [];
		}
		const { headerValues, colors } = mapHeaderSettings;
		const res = headerValues.map((value, i) => ({ value, color: colors[i] }));
		if (headerValues.length && headerValues[headerValues.length - 1] === null) {
			return res;
		}
		return [...res, { value: null, color: DEFAULT_HEADER_COLOR }];
	}, [mapHeaderSettings]);

	const { mutateAsync: updateMapHeaderSettings, isLoading: isUpdating } = useUpdateHeaderSettingsMutation(project);

	const setColor = useCallback(
		(value, color) => {
			if (isLoadingSettings) {
				return;
			}
			updateMapHeaderSettings({
				update: {
					projectId: project?._id.toString(),
					headerValues: headerColors.map((hc) => hc.value),
					colors: headerColors.map((hc) => (hc.value === value ? color : hc.color)),
				},
			});
		},
		[isLoadingSettings, updateMapHeaderSettings, project, headerColors]
	);

	return {
		headerColors,
		setColor,
		isLoading: isLoadingSettings,
		isUpdating,
	};
}

export function useSizeBy(project: Pick<Inpt.Project, '_id' | 'wells'> | null, filters: unknown[] = []) {
	const [minMax, setMinMax] = useState<{ min?: number; max?: number }>({ min: undefined, max: undefined });
	const [isHeaderValueLoading, setIsHeaderValueLoading] = useState<boolean>(false);
	const filterJSON = JSON.stringify(filters);

	const headerSettingsQuery = useHeaderSettingsQuery(project);

	const updateHeaderSettingsMutation = useUpdateHeaderSettingsMutation(project);

	const { header = null } = headerSettingsQuery.data?.sizeBy ?? {};

	const updateSizeByMutation = useMutation(async ({ sizeByHeader }: { sizeByHeader: string | null }) => {
		await updateHeaderSettingsMutation.mutateAsync({
			update: { projectId: project?._id.toString(), sizeBy: { header: sizeByHeader } },
		});
	});

	const setSizeBy = useCallback(
		(sizeByHeader: string | null) => {
			updateSizeByMutation.mutate({ sizeByHeader });
		},
		[updateSizeByMutation]
	);

	useEffect(() => {
		const updateMaxMin = async () => {
			if (header) {
				setIsHeaderValueLoading(true);
				const { min, max } = await withAsync(getHeaderValuesRange(header, project, filters));
				setMinMax({ min, max });
				setIsHeaderValueLoading(false);
			}
		};
		updateMaxMin();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [header, project?._id, filterJSON]);

	return {
		header,
		max: minMax?.max,
		min: minMax?.min,
		setSizeBy,
		isLoading: headerSettingsQuery.isLoading,
		isUpdating: updateHeaderSettingsMutation.isLoading || updateSizeByMutation.isLoading || isHeaderValueLoading,
	};
}

export function useWellLabel(project: Pick<Inpt.Project, '_id'> | null) {
	const { data: mapHeaderSettings, isLoading } = useHeaderSettingsQuery(project);

	const { mutateAsync: updateMapHeaderSettings, isLoading: isUpdating } = useUpdateHeaderSettingsMutation(project);
	const setWellLabel = useCallback(
		(wellLabel) => {
			updateMapHeaderSettings({
				update: { projectId: project?._id.toString(), wellLabel },
			});
		},
		[updateMapHeaderSettings, project]
	);

	const wellLabel = isLoading ? null : mapHeaderSettings?.wellLabel;
	return {
		wellLabel: wellLabel === undefined ? DEFAULT_WELL_LABEL : wellLabel,
		setWellLabel,
		isLoading,
		isUpdating,
	};
}

export function useProjectScope(project: Pick<Inpt.Project, '_id'> | null) {
	const { data: mapHeaderSettings, isLoading } = useHeaderSettingsQuery(project);

	const { mutateAsync: updateMapHeaderSettings, isLoading: isUpdating } = useUpdateHeaderSettingsMutation(project);
	const setProjectScope = useCallback(
		(projectScope) => {
			updateMapHeaderSettings({
				update: { projectId: project?._id.toString(), projectScope },
			});
		},
		[updateMapHeaderSettings, project]
	);

	return { projectScope: mapHeaderSettings?.projectScope ?? !!project, setProjectScope, isLoading, isUpdating };
}

export function useMapHeaderSettings(project: Pick<Inpt.Project, '_id' | 'wells'> | null) {
	const {
		projectScope,
		setProjectScope,
		isLoading: isLoadingProjectScope,
		isUpdating: isUpdatingProjectScope,
	} = useProjectScope(project);
	const {
		colorBy,
		setColorBy,
		isLoading: isLoadingColorBy,
		isUpdating: isUpdatingColorBy,
	} = useColorBy(project, projectScope && project ? [getProjectFilter(project)] : []);
	const {
		headerColors,
		setColor,
		isLoading: isLoadingHeaderColors,
		isUpdating: isUpdatingHeaderColors,
	} = useHeaderColors(project);
	const {
		wellLabel,
		setWellLabel,
		isLoading: isLoadingWellLabel,
		isUpdating: isUpdatingWellLabel,
	} = useWellLabel(project);
	const {
		header: sizeByHeader,
		min: sizeByMin,
		max: sizeByMax,
		setSizeBy,
		isLoading: isLoadingSizeBy,
		isUpdating: isUpdatingSizeBy,
	} = useSizeBy(project, projectScope && project ? [getProjectFilter(project)] : []);

	return {
		colorBy,
		headerColors,
		wellLabel,
		projectScope,
		sizeBy: { header: sizeByHeader, min: sizeByMin, max: sizeByMax },
		setColorBy,
		setColor,
		setWellLabel,
		setProjectScope,
		setSizeBy,
		isLoading:
			isLoadingColorBy || isLoadingHeaderColors || isLoadingWellLabel || isLoadingProjectScope || isLoadingSizeBy,
		isUpdating:
			isUpdatingColorBy ||
			isUpdatingHeaderColors ||
			isUpdatingWellLabel ||
			isUpdatingProjectScope ||
			isUpdatingSizeBy,
	};
}

export function withMapHeaderSettings(
	Component,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	projectSelector: (props: any) => Pick<Inpt.Project, '_id' | 'wells'> | null = ({ project }) => project
) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	function MapHeaderSettingsWrapper(props: any, ref) {
		const project = projectSelector(props);

		const { isLoading, isUpdating, ...rest } = useMapHeaderSettings(project);
		useLoadingBar(isLoading || isUpdating);

		return <Component {...props} {...rest} ref={ref} />;
	}

	return forwardRef(MapHeaderSettingsWrapper);
}

export function useMapboxToken() {
	const { data: mapboxToken } = useQuery(['map', 'mapbox-token'], () => getApi<string>('/map/mapbox-token'), {
		staleTime: Infinity,
		cacheTime: Infinity,
	});
	return mapboxToken;
}

export function withMapboxToken(Component) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	function Wrapper(props: any, ref) {
		const mapboxToken = useMapboxToken();

		return <Component {...props} mapboxToken={mapboxToken} ref={ref} />;
	}

	return forwardRef(Wrapper);
}
