import { faChevronDown, faUserCog } from '@fortawesome/pro-regular-svg-icons';
import styled from 'styled-components';

import { Button, ButtonItem, Divider, IconButton, MenuButton, RadioItem } from '@/components/v2';
import SelectChartHeadersDialog from '@/forecasts/charts/components/chart-header-selection/SelectChartHeadersDialog';
import { generateConfigBody } from '@/forecasts/charts/components/deterministic/grid-chart/shared';
import { ListItem } from '@/forecasts/charts/components/graphProperties';
import { ChartSettings } from '@/forecasts/charts/useChartSettings';
import { useKeyboardTooltipFloater } from '@/forecasts/manual/shared';
import { ManualSpeedMenuBtn, StreamsMenuBtn } from '@/forecasts/shared';
import { SpeedState } from '@/forecasts/shared/useKeyboardForecast';
import { useDialog } from '@/helpers/dialog';

import { ControlsContainer, ForecastToolbarTheme, ForecastViewButton, GridControlLayout } from '../layout';
import ManualChartOptionsSubMenuItem from './ManualChartOptionsSubMenuItem';
import { ManualMode } from './ManualChartProps';

const RightActionsContainer = styled.div`
	display: flex;
	align-items: center;
	& > * {
		margin: 0 0.25rem;
		&:first-child {
			margin-left: 0;
		}
		&:last-child {
			margin-right: 0;
		}
	}
`;

const VerticalDivider = () => <Divider style={{ height: '1.75rem' }} orientation='vertical' />;

const ManualChartControls = ({
	comparisonProps,
	dataSettings,
	editingChartSettings,
	editingChartXAxisItems,
	mode,
	onMenuClose,
	onMenuOpen,
	previewChartSettings,
	previewChartXAxisItems,
	proximityOptionsRender,
	setDataSettings,
	setEditingChartSettings,
	setIsComparisonDialogVisible,
	setPreviewChartSettings,
	setSpeedState,
	showConfigDialog,
	speedState,
	toggleComparison,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	comparisonProps: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	dataSettings: any;
	editingChartSettings: ChartSettings;
	editingChartXAxisItems: Array<ListItem>;
	mode: ManualMode;
	onMenuClose?: () => void;
	onMenuOpen?: () => void;
	previewChartSettings: ChartSettings;
	previewChartXAxisItems: Array<ListItem>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	proximityOptionsRender: any;
	setDataSettings: (value) => void;
	setEditingChartSettings: (value) => void;
	setIsComparisonDialogVisible: (value) => void;
	setPreviewChartSettings: (value) => void;
	setSpeedState: (value) => void;
	showConfigDialog: (...args) => void;
	speedState: SpeedState;
	toggleComparison: (boolean) => void;
}) => {
	const { keyboardTooltipButton, keyboardTooltipFloater } = useKeyboardTooltipFloater({
		color: 'default',
		mode,
		size: 'small',
		tooltipPlacement: 'bottom',
		disabled: mode === 'typecurve' && 'Unavailable for this mode',
	});

	const [selectHeadersDialog, openSelectHeaders] = useDialog(SelectChartHeadersDialog);

	const { enablePll } = previewChartSettings;
	const { monthly, daily, forecast } = dataSettings;

	const isComparisonActive = comparisonProps?.enabled;

	return (
		<GridControlLayout>
			<ForecastToolbarTheme>
				<ControlsContainer>
					<MenuButton
						endIcon={faChevronDown}
						label='Chart Options'
						onClick={onMenuOpen}
						onClose={onMenuClose}
					>
						<ButtonItem label='Select Chart Headers' onClick={() => openSelectHeaders()} />

						<ManualChartOptionsSubMenuItem
							label='Preview Chart (Top)'
							chartSettings={previewChartSettings}
							enableUnitResolution
							setChartSettings={setPreviewChartSettings}
							xAxisItems={previewChartXAxisItems}
						/>

						<ManualChartOptionsSubMenuItem
							label='Editing Chart (Bottom)'
							chartSettings={editingChartSettings}
							enableUnitResolution={mode === 'auto'}
							setChartSettings={setEditingChartSettings}
							xAxisItems={editingChartXAxisItems}
						/>
					</MenuButton>

					<StreamsMenuBtn
						daily={daily}
						endIcon={faChevronDown}
						forecast={forecast}
						infoText='Streams are Only Available for Preview Chart (Top Chart)'
						monthly={monthly}
						onChangeDaily={(newSet) => setDataSettings({ daily: newSet })}
						onChangeForecast={(newSet) => setDataSettings({ forecast: newSet })}
						onChangeMonthly={(newSet) => setDataSettings({ monthly: newSet })}
					/>

					<MenuButton label='Normalize' endIcon={faChevronDown} className='forecast-toolbar-menu-button'>
						<RadioItem
							value={!enablePll}
							label='None'
							onChange={() => setPreviewChartSettings({ enablePll: false })}
						/>
						<RadioItem
							value={Boolean(enablePll)}
							label='Perf Lateral Length'
							onChange={() => setPreviewChartSettings({ enablePll: true })}
						/>
					</MenuButton>

					{isComparisonActive ? (
						<ForecastViewButton onClick={() => toggleComparison(!isComparisonActive)}>
							Forecast View
						</ForecastViewButton>
					) : (
						<Button onClick={() => toggleComparison(!isComparisonActive)}>Compare Forecast</Button>
					)}

					{isComparisonActive && (
						<Button onClick={() => setIsComparisonDialogVisible(true)}>Select Forecast</Button>
					)}
					{/* Place mode actions here (proximity, speed controls etc.) */}
					{/* TODO: consider moving these to memoized render */}
					{['auto', 'manual'].includes(mode) && proximityOptionsRender}
					{mode === 'manual' && (
						<>
							<VerticalDivider />
							<ManualSpeedMenuBtn
								endIcon={faChevronDown}
								speedState={speedState}
								setSpeedState={setSpeedState}
							/>
						</>
					)}
				</ControlsContainer>
			</ForecastToolbarTheme>

			<RightActionsContainer>
				{keyboardTooltipButton}

				<IconButton
					onClick={() => showConfigDialog(generateConfigBody(dataSettings, previewChartSettings))}
					tooltipTitle='Preview Chart (Top) Configurations'
					size='small'
				>
					{faUserCog}
				</IconButton>
			</RightActionsContainer>

			{keyboardTooltipFloater}
			{selectHeadersDialog}
		</GridControlLayout>
	);
};

export default ManualChartControls;
