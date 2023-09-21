import {
	faChartArea,
	faChevronDown,
	faChevronLeft,
	faChevronRight,
	faUndo,
	faUserCog,
} from '@fortawesome/pro-regular-svg-icons';
import { capitalize } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { PageField, XLogScaleSwitch } from '@/components';
import { useHotkey, useHotkeyScope } from '@/components/hooks/useHotkey';
import {
	Button,
	ButtonItem,
	Divider,
	IconButton,
	MenuButton,
	RadioSelectSubMenuItem,
	SwitchItem,
} from '@/components/v2';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import SelectChartHeadersDialog from '@/forecasts/charts/components/chart-header-selection/SelectChartHeadersDialog';
import { VALID_CUMS } from '@/forecasts/charts/components/graphProperties';
import QuickEditButton from '@/forecasts/forecast-form/QuickEditButton';
import ForecastRollup from '@/forecasts/forecast-rollup/ForecastRollup';
import {
	CumMaxAxisControlSelection,
	CumMinAxisControlSelection,
	FilterChartsMenuBtn,
	SearchTextField,
	StreamsMenuBtn,
	TimeXAxisSubMenu,
	UpdateStatusMenuBtn,
	XAxisSubMenu,
	YMaxAxisControlSelection,
	YMinAxisControlSelection,
	YearsBeforeAxisControlSelection,
	YearsPastAxisControlSelection,
	numberOfChartsItems,
	timeXAxisItems,
	xAxisItems,
} from '@/forecasts/shared';
import { useAlfa } from '@/helpers/alfa';
import { useDialog } from '@/helpers/dialog';
import { WellFilterButton } from '@/well-filter/WellFilterButton';
import { useSaveWellIdsAsFilter } from '@/well-filter/utils';
import { useHeadersSort, useWellColumns, useWellSort } from '@/well-sort/WellSort';

import ActionMenuButton from './ActionMenuButton';
import {
	ControlButtonContainer,
	ControlsContainer,
	ControlsToolbar,
	FiltersRow,
	ForecastToolbarTheme,
	ForecastViewButton,
	GridControlLayout,
	PaginationControlsContainer,
	PaginationText,
} from './layout';

const GridControls = ({
	applyEditBucketFilter,
	applyForecastSubType,
	applyForecastType,
	applyPhases,
	applyStatuses,
	applyWarningFilter,
	applyWellNameFilter,
	canMovePage,
	clearFilters,
	comparisonIds,
	curPage,
	curTask,
	dataLength,
	disableForecastTasks,
	disableWarningFilter,
	editBucket,
	enableDateBarItems,
	enableQuickEdit,
	filterActive,
	forecastDoc,
	forecastOptions,
	forecastSubTypes,
	forecastTypes,
	graphSettings,
	isComparisonActive,
	loadingWells,
	lowerIndex,
	movePage,
	onQuickWellFilter,
	openVerticalDateBarDialog,
	pageTotal,
	refreshCharts,
	runForecastStatus,
	selectedPhases,
	setDataSettings,
	setEnableDateBarItems,
	setEnableQuickEdit,
	setGraphSettings,
	setIsComparisonActive,
	setIsComparisonDialogVisible,
	setIsConfigDialogVisible,
	setIsForecastFormVisible,
	setPage,
	setSingleWellForecastId,
	setSorting,
	setTask,
	showWellFilter,
	sorting,
	statuses,
	streamDataSettings,
	toggleAllEditBucket,
	unitResolution,
	upperIndex,
	warningStatus,
	wellIds,
}) => {
	const { project } = useAlfa();
	const { isVerticalDateBarsEnabled } = useLDFeatureFlags();

	const [wellNameSearch, setWellNameSearch] = useState('');

	const wellSortProps = useHeadersSort({ onSorted: setSorting, currentSorting: sorting });
	const wellColumns = useWellColumns();

	const { wellSortingDialog, saveWellSortingDialog, manageSortingsDialogRender, wellSortingButtonRender } =
		useWellSort({ columns: wellColumns, ...wellSortProps, size: 'small' });

	const [chartHeadersDialog, openChartHeadersDialog] = useDialog(SelectChartHeadersDialog);

	const forecastId = forecastDoc?._id;

	const saveWellIdsAsFilter = useSaveWellIdsAsFilter();

	const { numOfCharts, xAxis } = graphSettings;
	const register = useCallback(
		(key) => ({ value: graphSettings[key], onChange: (value) => setGraphSettings({ [key]: value }) }),
		[graphSettings, setGraphSettings]
	);

	const [xAxisLogScaleRegister, yAxisLogScaleRegister] = useMemo(
		() => [register('xLogScale'), register('yLogScale')],
		[register]
	);

	const xAxisRegister = useMemo(() => {
		const registerObj = register('xAxis');
		const originalOnChange = registerObj.onChange;

		return {
			...registerObj,
			onChange: (value) => {
				originalOnChange(value);
				if (value.includes('mbt')) {
					if (!xAxisLogScaleRegister.value) {
						xAxisLogScaleRegister.onChange(true);
					}
					if (!yAxisLogScaleRegister.value) {
						yAxisLogScaleRegister.onChange(true);
					}
				}
			},
		};
	}, [register, xAxisLogScaleRegister, yAxisLogScaleRegister]);

	useEffect(() => {
		const xAxisKey = 'xAxis';
		const candidates = (isComparisonActive ? timeXAxisItems : xAxisItems).map((v) => v.value);

		if (graphSettings[xAxisKey] && !candidates.includes(graphSettings[xAxisKey])) {
			xAxisRegister.onChange(candidates[0]);
		}
	}, [graphSettings, isComparisonActive, xAxisRegister]);

	useHotkeyScope('gridControls');

	useHotkey('left', 'gridControls', () => {
		movePage(-1);
	});

	useHotkey('right', 'gridControls', () => {
		movePage(1);
	});

	return (
		<ControlsToolbar>
			<GridControlLayout>
				<ForecastToolbarTheme>
					<ControlsContainer>
						{/* Filter Fields */}

						<SearchTextField
							margin='dense'
							onApply={applyWellNameFilter}
							onChange={setWellNameSearch}
							placeholder='Search By Well Name'
							style={{ marginRight: '10px' }}
							value={wellNameSearch}
							variant='outlined'
						/>

						<FiltersRow>
							<WellFilterButton
								onFilterWells={showWellFilter}
								onQuickFilter={onQuickWellFilter}
								small
								wellIds={wellIds}
							/>

							{wellSortingButtonRender}

							<FilterChartsMenuBtn
								className='forecast-toolbar-menu-button'
								applyForecastSubType={applyForecastSubType}
								applyForecastType={applyForecastType}
								applyPhases={applyPhases}
								applyStatuses={applyStatuses}
								applyWarningFilter={applyWarningFilter}
								disabled={loadingWells}
								disableWarningFilter={disableWarningFilter}
								endIcon={faChevronDown}
								forecastSubTypes={forecastSubTypes}
								forecastTypes={forecastTypes}
								selectedPhases={selectedPhases}
								statuses={statuses}
								warningStatus={warningStatus}
							/>

							<MenuButton
								label={`Edit (${editBucket?.size ?? 0})`}
								tooltipTitle='Editing Options'
								endIcon={faChevronDown}
								className='forecast-toolbar-menu-button'
							>
								<ButtonItem label='Filter On Selected Wells' onClick={applyEditBucketFilter} />
								<ButtonItem
									label='Add All Wells To Editing'
									onClick={() => toggleAllEditBucket(true)}
								/>
								<ButtonItem
									label='Remove All Wells From Editing'
									onClick={() => toggleAllEditBucket(false)}
								/>
								<ButtonItem
									label='Save Editing Bucket As Well Filter'
									onClick={() => saveWellIdsAsFilter([...editBucket])}
								/>
							</MenuButton>
						</FiltersRow>
						{filterActive && (
							<IconButton
								color='secondary'
								onClick={() => {
									setWellNameSearch('');
									clearFilters();
								}}
								size='small'
								tooltipTitle='Clear All Filters'
							>
								{faUndo}
							</IconButton>
						)}

						<Divider orientation='vertical' css='margin: 0 0.25rem;' flexItem />

						<ForecastViewButton
							onClick={() => {
								setSingleWellForecastId(null);
								setIsForecastFormVisible(true);
							}}
							disabled={!runForecastStatus || disableForecastTasks}
						>
							Run Forecast
						</ForecastViewButton>

						<MenuButton
							label='Forecast Options'
							endIcon={faChevronDown}
							className='forecast-toolbar-menu-button forecast-toolbar-menu--options'
							hideMenuOnClick
						>
							{forecastOptions.map(
								({ additionalInfo, disabled, onClick, primaryText, taggingProp = {} }, i) =>
									primaryText ? (
										// eslint-disable-next-line react/jsx-handler-names
										<ButtonItem
											key={i.toString()}
											additionalInfo={additionalInfo}
											disabled={disabled}
											label={primaryText}
											onClick={onClick}
											placeInfoAfter
											{...taggingProp}
										/>
									) : (
										<Divider key={i.toString()} />
									)
							)}
						</MenuButton>

						<UpdateStatusMenuBtn
							forecastId={forecastId}
							onComplete={refreshCharts}
							phase='all'
							project={project}
							wells={wellIds}
							endIcon={faChevronDown}
							className='forecast-toolbar-menu-button'
						/>

						<StreamsMenuBtn
							{...streamDataSettings}
							endIcon={faChevronDown}
							className='forecast-toolbar-menu-button'
							onChangeDaily={(newSet) => setDataSettings({ daily: newSet })}
							onChangeMonthly={(newSet) => setDataSettings({ monthly: newSet })}
							onChangeForecast={(newSet) => setDataSettings({ forecast: newSet })}
						/>

						<ControlButtonContainer>
							<MenuButton
								label='Chart Options'
								endIcon={faChevronDown}
								className='forecast-toolbar-menu-button'
							>
								<ButtonItem label='Select Chart Headers' onClick={() => openChartHeadersDialog()} />

								<Divider />

								{[...VALID_CUMS, 'mbt', 'mbt_filtered'].includes(xAxis) ? (
									<>
										<CumMinAxisControlSelection {...register('cumMin')} />
										<CumMaxAxisControlSelection {...register('cumMax')} />
									</>
								) : (
									<>
										<YearsBeforeAxisControlSelection {...register('yearsBefore')} />
										<YearsPastAxisControlSelection {...register('yearsPast')} />
									</>
								)}

								<YMaxAxisControlSelection {...register('yMax')} />
								<YMinAxisControlSelection {...register('yMin')} />

								<Divider />

								{isComparisonActive ? (
									<TimeXAxisSubMenu {...xAxisRegister} />
								) : (
									<XAxisSubMenu {...xAxisRegister} />
								)}

								<RadioSelectSubMenuItem
									label='Normalize'
									items={[
										{ label: 'None', value: false },
										{ label: 'Perf Lateral Length', value: true },
									]}
									{...register('enablePll')}
								/>

								{isVerticalDateBarsEnabled && (
									<>
										<Divider />

										<SwitchItem
											label='Vertical Date Bar'
											onChange={(value) => setEnableDateBarItems(value)}
											value={enableDateBarItems}
										/>

										<ButtonItem
											disabled={!enableDateBarItems}
											label='Date Bar Settings'
											onClick={() => openVerticalDateBarDialog()}
										/>
									</>
								)}

								<Divider />

								<SwitchItem label='Y-Axis Log Scale' {...register('yLogScale')} />

								<XLogScaleSwitch xAxis={xAxis} {...register('xLogScale')} />

								<SwitchItem label='Legend' {...register('enableLegend')} />

								<SwitchItem label='Production Line Scatter' {...register('lineScatter')} />

								<SwitchItem
									label={`Unit Resolution (${capitalize(unitResolution)})`}
									onChange={(checked) =>
										setGraphSettings({ unitResolution: checked ? 'daily' : 'monthly' })
									}
									value={unitResolution === 'daily'}
								/>

								<SwitchItem
									label='Enable Monthly Operations'
									{...register('enableMonthlyOperations')}
								/>

								<SwitchItem label='Enable Daily Operations' {...register('enableDailyOperations')} />

								{isComparisonActive && (
									<SwitchItem label='Align Fcst Start Dates' {...register('enableAlign')} />
								)}
							</MenuButton>
						</ControlButtonContainer>

						<ActionMenuButton
							className='forecast-toolbar-number-of-charts'
							curSelection={numOfCharts}
							faIcon={faChartArea}
							idLabel='numOfCharts'
							items={numberOfChartsItems}
							onClick={(val) => setGraphSettings({ numOfCharts: val })}
							tooltipTitle='# Of Charts'
						/>

						<Divider orientation='vertical' css='margin: 0 0.25rem;' flexItem />

						<ForecastRollup
							className='forecast-toolbar-menu-button'
							comparisonIds={comparisonIds}
							disableForecastTasks={disableForecastTasks}
							endIcon={faChevronDown}
							forecastId={forecastId}
							forecastType={forecastDoc?.type ?? 'probabilistic'}
							isTaskRunning={curTask}
							setTask={setTask}
							small
							wells={wellIds}
						/>
						{isComparisonActive ? (
							<>
								<ForecastViewButton
									className='forecast-toolbar-menu-button forecast-toolbar-view-button'
									onClick={() => setIsComparisonActive(false)}
								>
									Forecast View
								</ForecastViewButton>

								<Button
									className='forecast-toolbar-menu-button'
									onClick={() => setIsComparisonDialogVisible(true)}
								>
									Select Forecast
								</Button>
							</>
						) : (
							<Button
								className='forecast-toolbar-menu-button'
								onClick={() => setIsComparisonActive(true)}
							>
								Compare Forecast
							</Button>
						)}
					</ControlsContainer>

					<PaginationControlsContainer hidden={dataLength < 1}>
						<QuickEditButton enableQuickEdit={enableQuickEdit} setEnableQuickEdit={setEnableQuickEdit} />

						<IconButton
							onClick={() => setIsConfigDialogVisible(true)}
							size='small'
							tooltipTitle='Configurations'
							className='forecast-toolbar-configurations'
						>
							{faUserCog}
						</IconButton>

						<Divider orientation='vertical' css='margin: 0 0.25rem;' flexItem />

						<PaginationText>
							{lowerIndex} &mdash; {upperIndex} of {dataLength}
						</PaginationText>

						<IconButton
							className='pagination-control-button'
							color='secondary'
							disabled={!canMovePage(-1)}
							onClick={() => movePage(-1)}
							size='small'
							tooltipTitle='Previous Page'
						>
							{faChevronLeft}
						</IconButton>

						<PageField
							onChange={(pageNumber) => setPage(pageNumber - 1)}
							page={curPage}
							maxPage={pageTotal}
							fieldSize={3}
						/>

						<IconButton
							className='pagination-control-button'
							color='secondary'
							disabled={!canMovePage(1)}
							onClick={() => movePage(1)}
							size='small'
							tooltipTitle='Next Page'
						>
							{faChevronRight}
						</IconButton>
					</PaginationControlsContainer>
				</ForecastToolbarTheme>
			</GridControlLayout>

			{chartHeadersDialog}
			{manageSortingsDialogRender}
			{saveWellSortingDialog}
			{wellSortingDialog}
		</ControlsToolbar>
	);
};

export default GridControls;
