import { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useTheme } from 'styled-components';

import { Box, Button, Divider, Typography } from '@/components/v2';
import { genericErrorAlert, useLoadingBar } from '@/helpers/alerts';
import { FeatureIcons } from '@/helpers/features';
import { useWellHeaders } from '@/helpers/headers';
import { getApi, postApi } from '@/helpers/routing';
import { MapControlMenuIconButton } from '@/map/MapboxGL/controls';

import showSettingsDialog from './HeatmapSettingsDialog';
import { DEFAULT_HEATMAP_OPTIONS, HeatmapOptions, sanitizeHeatmapOptions } from './shared';

interface HeatmapMenuProps {
	disabled: boolean;
	clearable: boolean;
	onGenerate: (options: HeatmapOptions) => void;
	onClear: () => void;
}

const HEATMAP_SETTINGS_QUERY_KEY = 'heatmap-settings';

function HeatmapMenu({ disabled, clearable: heatmapShowing, onGenerate, onClear }: HeatmapMenuProps) {
	const theme = useTheme();

	const { wellHeadersLabels, wellHeadersTypes } = useWellHeaders({ enableProjectCustomHeaders: true });

	const { data: options, isLoading } = useQuery(
		[HEATMAP_SETTINGS_QUERY_KEY],
		async () =>
			sanitizeHeatmapOptions(
				(await getApi('/map/heatmap-settings')) ?? DEFAULT_HEATMAP_OPTIONS,
				Object.keys(wellHeadersLabels),
				wellHeadersTypes
			),
		{
			placeholderData: DEFAULT_HEATMAP_OPTIONS,
		}
	);
	const queryClient = useQueryClient();

	const [saving, setSaving] = useState(false);

	useLoadingBar(saving || isLoading);

	const handleSettings = async () => {
		const settingsDialogResult = await showSettingsDialog({ options: options ?? DEFAULT_HEATMAP_OPTIONS });

		if (!settingsDialogResult) {
			return;
		}

		const { generate: dialogGenerate, ...newOptions } = settingsDialogResult;

		queryClient.setQueryData([HEATMAP_SETTINGS_QUERY_KEY], newOptions); // optimistic update

		if (dialogGenerate) {
			onGenerate(newOptions);
		}

		setSaving(true);
		try {
			await postApi('/map/heatmap-settings', newOptions);
		} catch (e) {
			queryClient.setQueryData([HEATMAP_SETTINGS_QUERY_KEY], options); // revert optimistic update
			genericErrorAlert(e);
		} finally {
			setSaving(false);
		}
	};

	return (
		<MapControlMenuIconButton tooltipTitle='Heatmap' icon={FeatureIcons.heatmap} mapControlPosition='top-left'>
			<Box css={{ display: 'flex', flexDirection: 'column', padding: '0.25rem 1rem;' }}>
				<Typography
					variant='h5'
					css={{
						color: `${theme.palette.text.primary} !important`, // HACK because there's a react-md style overwriting this
						marginBottom: '0.5rem',
					}}
				>
					Heatmap
				</Typography>
				<Divider />
				<Button onClick={() => onGenerate(options ?? DEFAULT_HEATMAP_OPTIONS)} disabled={disabled}>
					Generate
				</Button>
				<Button onClick={onClear} disabled={!heatmapShowing}>
					Clear
				</Button>
				<Divider />
				<Button onClick={handleSettings} disabled={disabled}>
					Settings
				</Button>
			</Box>
		</MapControlMenuIconButton>
	);
}

export default HeatmapMenu;
