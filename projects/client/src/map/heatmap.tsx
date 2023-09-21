/* eslint react/jsx-key: warn */
import { Button, Divider, Typography } from '@material-ui/core';
import { useState } from 'react';
import { useTheme } from 'styled-components';

import { FontAwesomeIcon } from '@/components/FontAwesomeIcon';
import { genericErrorAlert, useLoadingBar } from '@/helpers/alerts';
import { FeatureIcons } from '@/helpers/features';
import { postApi } from '@/helpers/routing';

import { HeatmapLegend, HeatmapLegendProps } from './WellMap/Heatmap/HeatmapLegend';
import showSettingsDialog from './WellMap/Heatmap/HeatmapSettingsDialog';
import { HeatmapOptions } from './WellMap/Heatmap/shared';
import { BottomMapOverlay, MapOverlayMenuButton } from './map-overlay';

const HEATMAP_OVERLAY_POSITION = 1;

type HeatmapStatus =
	| 'show'
	| 'hide'
	| 'requested'
	| 'generating'
	| 'show+fetching-data'
	| 'hide+fetching-data'
	| 'requested+fetching-data';

interface HeatmapMenuProps {
	status: HeatmapStatus;
	options: HeatmapOptions;
	setStatus: (newStatus: HeatmapStatus) => void;
	setOptions: (newOptions: HeatmapOptions, newStatus?: HeatmapStatus) => void;
}

// visually similar to HeatmapMenu from @/map/WellMap/Heatmap/HeatmapControl, but works differently
function HeatmapMenu({ status, options, setStatus, setOptions }: HeatmapMenuProps) {
	const theme = useTheme();

	const [saving, setSaving] = useState(false);
	useLoadingBar(saving);

	const handleSettings = async () => {
		const settingsDialogResult = await showSettingsDialog({ options });

		if (!settingsDialogResult) {
			return;
		}

		const { generate, ...newOptions } = settingsDialogResult;

		setOptions(newOptions, generate ? 'requested' : undefined);

		setSaving(true);
		try {
			await postApi('/map/heatmap-settings', newOptions);
		} catch (e) {
			genericErrorAlert(e);
		} finally {
			setSaving(false);
		}
	};

	return (
		<>
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
			<Button
				onClick={() => setStatus('requested')}
				disabled={[
					'requested',
					'generating',
					'show+fetching-data',
					'hide+fetching-data',
					'requested+fetching-data',
				].includes(status)}
			>
				Generate
			</Button>
			<Button
				onClick={() => setStatus(status === 'show+fetching-data' ? 'hide+fetching-data' : 'hide')}
				disabled={['requested', 'generating', 'hide', 'hide+fetching-data', 'requested+fetching-data'].includes(
					status
				)}
			>
				Clear
			</Button>
			<Divider />
			<Button
				onClick={handleSettings}
				disabled={[
					'requested',
					'generating',
					'show+fetching-data',
					'hide+fetching-data',
					'requested+fetching-data',
				].includes(status)}
			>
				Settings
			</Button>
		</>
	);
}

export function HeatmapMapOverlay(props: HeatmapMenuProps) {
	return (
		<MapOverlayMenuButton
			mapOverlayPosition={HEATMAP_OVERLAY_POSITION}
			title='Heatmap'
			menuItems={[<HeatmapMenu key='heatmap-menu' {...props} />]}
		>
			<FontAwesomeIcon icon={FeatureIcons.heatmap} />
		</MapOverlayMenuButton>
	);
}

export function HeatmapLegendOverlay(props: HeatmapLegendProps) {
	return (
		<BottomMapOverlay>
			<HeatmapLegend {...props} />
		</BottomMapOverlay>
	);
}
