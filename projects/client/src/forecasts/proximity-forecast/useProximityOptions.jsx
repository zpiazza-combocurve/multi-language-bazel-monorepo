import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import { useCallback, useMemo, useState } from 'react';

import { getTaggingProp } from '@/analytics/tagging';
import { useHotkey } from '@/components/hooks';
import { ButtonItem, CheckboxSelectSubMenuItem, Divider, MenuButton, SwitchItem } from '@/components/v2';
import { ForecastViewButton } from '@/forecasts/deterministic/layout';
import { ExportProximityToCSVDialog } from '@/forecasts/view/ExportToCSVDialog';

import DownloadParamsDiag from '../view/DownloadParametersDialog';

const VerticalDivider = () => <Divider css='height: 1.75rem; margin-right:0.25rem;' orientation='vertical' />;

const PROXIMITY_SERIES_OPTIONS = {
	backgroundWells: {
		label: 'Background Wells',
		additionalInfo: {
			manual: 'Performance in manual mode may be impacted by toggling on background wells',
		},
	},
	average: { label: 'Wells Average' },
	aveNoFst: { label: 'Wells Average No Forecast' },
	p10: { label: 'Wells P10' },
	p50: { label: 'Wells P50' },
	p90: { label: 'Wells P90' },
	p50NoFst: { label: 'Wells P50 No Forecast' },
	count: { label: 'Well Count' },
};

const useProximityOptions = ({
	mode,
	setProximityMergedStates,
	proximityMergedStates: { proximityActive, proximityForm },
	proximityVisible,
	hideProximity,
	confirmProximityForecastDialog,
	proximityQuery,
	forecastId,
	proximitySeriesSelections,
	setProximitySeriesSelections,
	disabled,
}) => {
	const [isParamDownloadVisible, setIsParamDownloadVisible] = useState(false);
	const [isCsvDownloadVisible, setIsCsvDownloadVisible] = useState(false);

	const openProximityDialog = useCallback(async () => {
		await confirmProximityForecastDialog();
		return null;
	}, [confirmProximityForecastDialog]);

	const forecastsWellsMap = useMemo(() => {
		if (proximityQuery.isSuccess && proximityQuery?.data?.wells?.length > 0) {
			return Object.entries(proximityQuery?.data?.wellForecastMap).reduce((acc, [well, forecast]) => {
				if (acc[forecast]) {
					acc[forecast].push(well);
				} else {
					acc[forecast] = [well];
				}
				return acc;
			}, {});
		}
		return null;
	}, [proximityQuery?.data?.wellForecastMap, proximityQuery?.data?.wells?.length, proximityQuery.isSuccess]);

	useHotkey('p', () => {
		if (mode === 'auto') {
			if (proximityVisible) hideProximity();
			else openProximityDialog();
		}
	});
	useHotkey('alt+p', () => {
		if (mode === 'auto') {
			setProximityMergedStates((v) => {
				if (v.proximityForm) {
					return {
						proximityActive: !v.proximityActive,
					};
				}
			});
		}
	});

	const dialogs = useMemo(
		() => (
			<>
				<DownloadParamsDiag
					resolve={() => setIsParamDownloadVisible(false)}
					forecastsWellsMap={forecastsWellsMap}
					visible={isParamDownloadVisible}
					forecast={{ type: 'deterministic' }}
				/>
				<ExportProximityToCSVDialog
					forecast={{ _id: forecastId }}
					forecastsWellsMap={forecastsWellsMap}
					wells={proximityQuery?.data?.wells}
					visible={isCsvDownloadVisible}
					onHide={() => setIsCsvDownloadVisible(false)}
					isProximity
				/>
			</>
		),
		[forecastsWellsMap, isParamDownloadVisible, forecastId, proximityQuery?.data?.wells, isCsvDownloadVisible]
	);

	const buttons = useMemo(
		() => (
			<>
				<VerticalDivider />
				<ForecastViewButton
					onClick={openProximityDialog}
					disabled={disabled}
					{...getTaggingProp('forecast', 'proximity')}
				>
					Run Proximity
				</ForecastViewButton>
				<MenuButton label='Proximity Options' endIcon={faChevronDown} className='forecast-toolbar-menu-button'>
					<SwitchItem
						disabled={!proximityForm}
						label='Enable Proximity'
						onChange={(checked) =>
							setProximityMergedStates({
								proximityActive: checked,
							})
						}
						value={proximityActive}
					/>
					<ButtonItem
						disabled={!forecastsWellsMap}
						label='Export Proximity Wells Parameter(CSV)'
						onClick={() => setIsParamDownloadVisible(true)}
					/>
					<ButtonItem
						disabled={!forecastsWellsMap}
						label='Export Proximity Wells Volumes(CSV)'
						onClick={() => setIsCsvDownloadVisible(true)}
					/>
					<Divider />
					<CheckboxSelectSubMenuItem
						disabled={!proximityForm}
						label='Proximity Series'
						items={Object.keys(PROXIMITY_SERIES_OPTIONS).map((series) => {
							const seriesData = PROXIMITY_SERIES_OPTIONS[series];
							return {
								label: seriesData.label,
								value: series,
								additionalInfo: seriesData.additionalInfo?.[mode],
							};
						})}
						value={proximitySeriesSelections}
						onChange={(values) => {
							setProximitySeriesSelections(values);
						}}
					/>
				</MenuButton>
			</>
		),
		[
			disabled,
			forecastsWellsMap,
			mode,
			openProximityDialog,
			proximityActive,
			proximityForm,
			proximitySeriesSelections,
			setProximityMergedStates,
			setProximitySeriesSelections,
		]
	);

	return {
		dialogs,
		buttons,
	};
};

export default useProximityOptions;
