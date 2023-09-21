import {
	faCalendarAlt,
	faCalendarDay,
	faChartArea,
	faExclamation,
	faPercentage,
	faTimes,
} from '@fortawesome/pro-regular-svg-icons';
import _ from 'lodash';
import React, { useState } from 'react';

import { useCallbackRef } from '@/components/hooks';
import { withHook } from '@/components/shared';
import {
	Button,
	ButtonItem,
	Divider,
	IconButton,
	MenuButton,
	RadioSelectMenuButton,
	SwitchItem,
} from '@/components/v2';
import SelectChartHeadersDialog from '@/forecasts/charts/components/chart-header-selection/SelectChartHeadersDialog';
import { ControlsContainer, ForecastToolbarTheme } from '@/forecasts/deterministic/layout';
import ForecastRollup from '@/forecasts/forecast-rollup/ForecastRollup';
import {
	ChartResolutionSubMenu,
	SearchTextField,
	SelectItemsMenuButton,
	UpdateStatusMenuBtn,
	YMinSubMenu,
	YearsBeforeSubMenu,
	YearsPastSubMenu,
	forecastStatusItems,
	getItemsFromDt,
} from '@/forecasts/shared';
import { useDialog } from '@/helpers/dialog';
import { capitalize } from '@/helpers/text';
import { forecastSeries } from '@/helpers/zing';
import { fields as FORECAST_TYPES } from '@/inpt-shared/display-templates/forecast-data/forecast-types.json';
import { WellFilterButton } from '@/well-filter/WellFilterButton';
import { useSaveWellIdsAsFilter } from '@/well-filter/utils';
import { WellHeadersSort } from '@/well-sort/WellSort';

import { VALID_PHASES } from '../charts/components/graphProperties';

const DEFAULT_FILTER_TYPE = 'all';

function ViewForecastActions({
	adjustDisplay,
	bucket,
	changeFilter,
	clearFilter,
	curTask,
	disableClearFilter,
	filterByEdit,
	forecast,
	forecastDocType,
	forecastId,
	forecastType,
	graphSettings,
	onQuickWellFilter,
	onSort,
	phase,
	resolution,
	runForecast,
	runForecastDisabled,
	runForecastMenuActions,
	saveWellIdsAsFilter,
	setCurTask: setTask,
	setGraphSettings,
	setPhase,
	showWellFilter,
	sorting,
	status,
	toggleAll,
	toggleResolution,
	updateStatusOnComplete,
	wells,
}) {
	const { display } = graphSettings;

	const [nameSearch, setNameSearch] = useState<string>('');
	const [chartHeadersDialog, openChartHeadersDialog] = useDialog(SelectChartHeadersDialog);

	const register = useCallbackRef((key: string) => ({
		value: graphSettings[key],
		onChange: (value) => setGraphSettings({ [key]: value }),
	}));

	return (
		<ControlsContainer
			css={`
				column-gap: 0.5rem;
			`}
		>
			<ForecastToolbarTheme>
				<SearchTextField
					margin='dense'
					onApply={(value) => changeFilter({ key: 'wellName', val: value })}
					onChange={(value) => setNameSearch(value)}
					placeholder='Search By Well Name'
					value={nameSearch}
					variant='outlined'
				/>

				<Divider flexItem orientation='vertical' />

				<WellFilterButton
					onFilterWells={showWellFilter}
					onQuickFilter={onQuickWellFilter}
					purple
					small
					wellIds={wells}
				/>

				<WellHeadersSort onSorted={onSort} currentSorting={sorting} purple small />

				<IconButton
					color='warning'
					tooltipTitle='Show Wells With Warnings'
					onClick={() => changeFilter({ key: 'warning', val: true })}
				>
					{faExclamation}
				</IconButton>

				<Divider flexItem orientation='vertical' />

				<Button onClick={runForecast} disabled={runForecastDisabled} variant='outlined' color='secondary'>
					Run Forecast
				</Button>

				<MenuButton label='Forecast Options'>
					{runForecastMenuActions.map((propsOrElement, i) =>
						React.isValidElement(propsOrElement) ? (
							<React.Fragment key={`divider-${i}`}>{propsOrElement}</React.Fragment>
						) : (
							<ButtonItem
								key={propsOrElement.primaryText}
								disabled={propsOrElement.disabled}
								label={propsOrElement.primaryText}
								// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
								onClick={propsOrElement.onClick}
							/>
						)
					)}
				</MenuButton>

				<SelectItemsMenuButton
					color='purple'
					exclusive
					items={VALID_PHASES.map((value) => ({ label: _.capitalize(value), value }))}
					label='Phase'
					onChange={setPhase}
					tooltipTitle='Select Phase'
					value={phase}
				/>

				<SelectItemsMenuButton
					color='purple'
					exclusive
					items={forecastStatusItems}
					label='Status'
					onChange={(val) => changeFilter({ key: 'status', val })}
					tooltipTitle='Filter By Approval'
					value={status[0] ?? DEFAULT_FILTER_TYPE}
				/>

				<SelectItemsMenuButton
					color='purple'
					exclusive
					items={getItemsFromDt(FORECAST_TYPES)}
					label='Type'
					onChange={(val) => changeFilter({ key: 'forecastType', val })}
					tooltipTitle='Filter By Type'
					value={forecastType[0] ?? DEFAULT_FILTER_TYPE}
				/>

				<MenuButton label={`Edit (${bucket?.size})`} color='purple' tooltipTitle='Editing Options'>
					<ButtonItem label='Filter On Selected Wells' onClick={filterByEdit} />
					<ButtonItem
						label='Add All Wells To Editing'
						onClick={() => toggleAll({ checked: true, wellIds: forecast.wells })}
					/>
					<ButtonItem label='Remove All Wells From Editing' onClick={() => toggleAll({ checked: false })} />
					<ButtonItem
						label='Save Editing Bucket As Well Filter'
						onClick={() => saveWellIdsAsFilter([...bucket])}
					/>
				</MenuButton>

				{!disableClearFilter && (
					<IconButton onClick={clearFilter} tooltipTitle='Clear All Filters' color='error' size='medium'>
						{faTimes}
					</IconButton>
				)}

				<UpdateStatusMenuBtn
					forecastId={forecastId}
					onComplete={updateStatusOnComplete}
					phase={phase}
					wells={wells}
					project={forecast?.project}
				/>

				<Button
					onClick={toggleResolution}
					color='primary'
					startIcon={resolution === 'monthly' ? faCalendarAlt : faCalendarDay}
					tooltipTitle={`${capitalize(resolution)} Resolution`}
				>
					{resolution === 'monthly' ? 'M' : 'D'}
				</Button>

				<RadioSelectMenuButton
					label={display}
					value={display}
					onChange={adjustDisplay}
					items={[
						{ label: '1', value: 1 },
						{ label: '2', value: 2 },
						{ label: '4', value: 4 },
					]}
					startIcon={faChartArea}
					color='primary'
					tooltipTitle='# Of Charts'
				/>

				<ForecastRollup
					forecastId={forecastId}
					forecastType={forecastDocType}
					isTaskRunning={curTask}
					setTask={setTask}
					wells={wells}
				/>

				<MenuButton label='Chart Options' color='secondary'>
					<ButtonItem label='Select Chart Headers' onClick={() => openChartHeadersDialog()} />

					<Divider />

					<ChartResolutionSubMenu {...register('chartResolution')} />
					<YearsBeforeSubMenu {...register('yearsBefore')} />
					<YearsPastSubMenu {...register('yearsPast')} />
					<YMinSubMenu {...register('yMin')} />

					{/* disabled for now */}
					{/* <YMaxSubMenu {...register('yMax')} /> */}

					<Divider />

					<SwitchItem label='Toggle Production Line Plot' {...register('lineScatter')} />
					<SwitchItem label='Y-Axis Log Scale' {...register('logScale')} />
					<SwitchItem label='X-Axis Log Scale' {...register('xLogScale')} />

					<Divider />

					<SwitchItem label='Legend' {...register('enableLegend')} />
				</MenuButton>

				{phase === 'all' ? (
					<SelectItemsMenuButton
						color='secondary'
						exclusive
						includeAll={false}
						items={forecastSeries}
						label='Series'
						startIcon={faPercentage}
						{...register('allPName')}
					/>
				) : (
					<SelectItemsMenuButton
						color='secondary'
						items={forecastSeries}
						label='Series'
						startIcon={faPercentage}
						{...register('sNames')}
					/>
				)}
			</ForecastToolbarTheme>

			{chartHeadersDialog}
		</ControlsContainer>
	);
}

export default withHook(ViewForecastActions, useSaveWellIdsAsFilter, (saveWellIdsAsFilter) => ({
	saveWellIdsAsFilter,
}));
