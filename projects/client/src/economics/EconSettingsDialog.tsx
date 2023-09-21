import { faTrash } from '@fortawesome/pro-regular-svg-icons';
import { isEqual, reduce } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

import { getTaggingProp } from '@/analytics/tagging';
import { Placeholder } from '@/components';
import { useLocalStorageState } from '@/components/hooks';
import { useBool } from '@/components/hooks/';
import {
	Button,
	CheckboxField,
	Dialog,
	DialogContent,
	DialogTitle,
	Divider,
	IconButton,
	List,
	ListItem,
	ListSubheader,
	TextField,
} from '@/components/v2';
import RadioGroupField from '@/components/v2/misc/RadioGroupField';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { useLoadingBar } from '@/helpers/alerts';
import { DialogProps, useDialog } from '@/helpers/dialog';
import { fullNameAndLocalDate } from '@/helpers/user';
import { filterSearch } from '@/helpers/utilities';
import {
	ECONOMICS_CARBON_MODELS as CARBON_MODELS,
	EconomicsRunModel as RunModel,
} from '@/inpt-shared/economics/constants';
import { Section, SectionContent, SectionHeader } from '@/layouts/Section';
import { Tab, TabsLayout } from '@/layouts/TabsLayout';
import { DeleteDialog } from '@/module-list/ModuleList/components';
import { showRequestCarbonDemoDialog } from '@/networks/carbon/RequestCarbonDemoDialog';

import { EconSettingsColumns } from './EconSettingsDialog/EconSettingsColumns';
import { EconSettingsReports } from './EconSettingsDialog/EconSettingsReports';
import { EconSettingsCombos } from './EconSettingsDialog/Sensitivity';
import { StyledListItem, StyledSidebar, useEconCombos, useReportSettings } from './EconSettingsDialog/shared';
import { useEconSettings } from './EconSettingsDialog/useEconSettings';
import { ECON_RUN_CHECKED_SETTINGS } from './shared/shared';

const COLUMNS = 'COLUMNS';
const COMBOS = 'COMBOS';
const REPORTS = 'REPORTS';

export const FAST = 'fast';
export const FULL = 'full';
export const MONTHLY = 'monthly';
export const DAILY = 'daily';

/**
 * @example
 * 	withCount('Run'); // 'Run'
 * 	withCount('Run', 10); // 'Run (10)'
 *
 * @param {string} text
 * @param {number} [length]
 */
const withCount = (text, length) => (Number.isFinite(length) ? `${text} (${length})` : text);

const SideBarActions = styled.div`
	display: flex;
	justify-content: space-evenly;
	flex-wrap: wrap;
	align-content: space-around;
	&,
	& > * {
		margin: 0.5rem;
	}
`;

export { RunModel };

const DISABLE_CARBON_RUN_NUM = 5000;
const DISABLE_CARBON_RUN_MESSAGE = `Carbon Runs limited to ${DISABLE_CARBON_RUN_NUM} wells`;
export function Sidebar({
	feat = 'Settings',
	loading,
	loadingSettings,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	settings = [] as any[],
	setCurrentSetting,
	handleDelete,
	lightRunEnabled,
	currentSetting,
	runModels,
	changeRunModels,
	onRun,
	onCancel,
	suggestedHeaders,
	handleChangeSuggestedHeaders,
	wellsAmount,
	hasGroups,
}) {
	const [search, setSearch] = useState('');

	const isCarbon = CARBON_MODELS.includes(runModels);
	const isOnlyCarbon = runModels === RunModel.carbonOnly;

	const [runMode, setRunMode] = useState(FULL);
	const [prodAnalyticsType, setProdAnalyticsType] = useState('calendar');

	const { isCarbonEnabled } = useLDFeatureFlags();

	const handleRun = () => {
		if (CARBON_MODELS.includes(runModels) && !isCarbonEnabled) {
			showRequestCarbonDemoDialog({});
			return;
		}
		onRun(runMode, prodAnalyticsType, runModels);
	};

	const [deleteDialog, promptDeleteDialog] = useDialog(DeleteDialog);

	const filteredSettings = filterSearch(settings, search, 'name');

	const currentCombos = currentSetting?.combos?.length ?? 1;
	const effectiveWells = currentCombos * wellsAmount;

	return (
		<>
			{deleteDialog}
			<Section as={StyledSidebar}>
				<SectionHeader>
					<SideBarActions>
						<Button variant='contained' onClick={onCancel}>
							Cancel
						</Button>
						<Button
							color='primary'
							variant='contained'
							onClick={handleRun}
							disabled={
								(isCarbon && effectiveWells > DISABLE_CARBON_RUN_NUM && DISABLE_CARBON_RUN_MESSAGE) ||
								(loadingSettings && 'Loading')
							}
							{...getTaggingProp('scenario', 'run')}
						>
							{withCount('Run', wellsAmount)}
						</Button>
					</SideBarActions>
				</SectionHeader>

				{lightRunEnabled && ( // lightRunEnabled is false for TC econ, which doesn't need run model select
					<SectionHeader
						css={`
							padding: ${({ theme }) => theme.spacing(2, 2)};
						`}
					>
						<RadioGroupField
							name='run-models-radio'
							value={runModels}
							css='margin-top: 1rem'
							options={[
								{
									label: 'Economics Only',
									value: RunModel.economicsOnly,
								},
								{
									label: 'Carbon And Economics',
									value: RunModel.carbonAndEconomics,
									disabled: hasGroups,
									tooltipInfo: {
										tooltipTitle:
											hasGroups && 'Econ Groups do not currently support Carbon functionality',
										placeIconAfter: true,
									},
								},
								{
									label: 'Carbon Only',
									value: RunModel.carbonOnly,
									disabled: hasGroups,
									tooltipInfo: {
										tooltipTitle:
											hasGroups && 'Econ Groups do not currently support Carbon functionality',
										placeIconAfter: true,
									},
								},
							]}
							label='Run Models'
							onChange={changeRunModels}
						/>
					</SectionHeader>
				)}

				{!isOnlyCarbon && (
					<SectionHeader
						css={`
							padding: ${({ theme }) => theme.spacing(2, 2)};
						`}
					>
						{lightRunEnabled && (
							<RadioGroupField
								name='aggregate-radio'
								value={runMode}
								options={[
									{
										label: 'Fast: Does not aggregate cash flow reports',
										value: FAST,
									},
									{
										label: 'Full: Aggregates cash flow reports',
										value: FULL,
									},
								]}
								label='Run Mode'
								onChange={(e) => setRunMode(e.target.value)}
							/>
						)}
						<CheckboxField
							name='include-recommended-headers-in-monthly-output'
							label='Include recommended headers in monthly output'
							checked={suggestedHeaders}
							aria-label='include-recommended-headers-in-monthly-output'
							id='recommended-headers-checkbox'
							onChange={(e) => handleChangeSuggestedHeaders(e.target.checked)}
						/>

						<RadioGroupField
							name='aggregate-radio'
							value={prodAnalyticsType}
							css='margin-top: 1rem'
							options={[
								{
									label: 'Calendar Date',
									value: 'calendar',
								},
								{
									label: 'Days On',
									value: 'daysOn',
								},
							]}
							label='Production Analytics Output'
							onChange={(e) => setProdAnalyticsType(e.target.value)}
						/>
					</SectionHeader>
				)}

				<Divider />
				<SectionContent>
					<Placeholder loading={loading} loadingText={`Loading ${feat}...`}>
						<List className='econ-setting-list'>
							<ListSubheader disableSticky>
								{filteredSettings.length === 0 ? `No Saved ${feat}` : `Saved ${feat}`}
							</ListSubheader>

							<ListItem disabled>
								<TextField
									type='text'
									fullWidth
									value={search}
									placeholder='Search'
									onChange={(e) => setSearch(e.target.value)}
								/>
							</ListItem>

							{filteredSettings.map((setting) => (
								<StyledListItem
									key={setting._id}
									onClick={() => setCurrentSetting(setting)}
									selected={setting._id === currentSetting._id}
									primaryText={setting.name}
									secondaryText={fullNameAndLocalDate(setting?.createdBy, setting.createdAt)}
								>
									<IconButton
										onClick={(ev) => {
											ev.stopPropagation();
											promptDeleteDialog({
												onDelete: () => handleDelete(setting),
												valueToConfirm: `Delete Setting`,
												title: `Delete Setting: ${setting?.name}?`,
												// @ts-expect-error // TODO check if this property exist in mui dialogs
												width: 'initial',
											});
										}}
										tooltipTitle='Delete'
										tooltipPlacement='left'
										color='warning'
									>
										{faTrash}
									</IconButton>
								</StyledListItem>
							))}
						</List>
					</Placeholder>
				</SectionContent>
			</Section>
		</>
	);
}

function getEconRunSettings(econSetting, comboSetting, reportSetting, suggestedHeaders) {
	const combos =
		comboSetting?.combos?.map(({ name, ...combo }, index) => {
			const prefix = index < 9 ? `0${index + 1}` : index + 1; // always 2 digits
			return { ...combo, name: `${prefix}-${name}` };
		}) || [];
	return {
		...econSetting,
		...(comboSetting ? { combos } : {}),
		suggestedHeaders,
		headersArr: reportSetting.headers,
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
type EconSettingsDialogProps = DialogProps<any> & {
	scenarioId: string;
	runText: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	maxCombos: any;
	wellsAmount: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	setShouldResetEconCache: any;
	hasGroups: boolean;
};

export function EconSettingsDialog({
	scenarioId,
	resolve,
	runText,
	wellsAmount,
	setShouldResetEconCache,
	hasGroups,
	maxCombos: _maxCombos,
	...props
}: EconSettingsDialogProps) {
	const combosEnabled = !!scenarioId;
	const lightRunEnabled = !!scenarioId;
	const econSettings = useEconSettings();
	const reportSettings = useReportSettings();
	const _comboSettings = useEconCombos(scenarioId);

	const [runModels, setRunModels] = useState(RunModel.economicsOnly);

	const maxCombos = runModels === RunModel.carbonOnly ? Math.floor(DISABLE_CARBON_RUN_NUM / wellsAmount) : _maxCombos;

	const comboSettings = useMemo(() => ({ ..._comboSettings, maxCombos }), [_comboSettings, maxCombos]);
	const { value: suggestedHeaders, toggle: handleChangeSuggestedHeaders } = useBool(false);

	const [active, setActive] = useState(COLUMNS);

	const [checkedOptions, setCheckedOptions] = useLocalStorageState(ECON_RUN_CHECKED_SETTINGS, []);

	useLoadingBar(econSettings.loading || comboSettings.loading || reportSettings.loading);

	const onRun = useCallback(
		(runMode = FULL, prodAnalyticsType = 'calendar', runModels = RunModel.economicsOnly) => {
			const econRunSettings = getEconRunSettings(
				econSettings.currentSetting,
				comboSettings.currentSetting,
				reportSettings.currentSetting,
				suggestedHeaders
			);

			const newCheckedOptions = econRunSettings.columns.filter((column) =>
				Object.values(column.selected_options).some((value) => value)
			);

			if (!isEqual(newCheckedOptions, checkedOptions)) {
				setCheckedOptions(newCheckedOptions);
				setShouldResetEconCache(true);
			}

			resolve({ ...econRunSettings, runMode, prodAnalyticsType, runModels });
		},
		[
			setShouldResetEconCache,
			econSettings.currentSetting,
			comboSettings.currentSetting,
			reportSettings.currentSetting,
			suggestedHeaders,
			resolve,
			checkedOptions,
			setCheckedOptions,
			// setOneLinerTableColumnOrderCache,
			// setOneLinerTableGroupCache,
			// setMonthlyTableColumnOrderCache,
			// setMonthlyTableGroupCache,
		]
	);

	const canDeselect = useMemo(() => {
		const { combos } = comboSettings.currentSetting;
		const selectedCombos = combos?.filter(({ selected }) => selected);
		return selectedCombos && selectedCombos.length > 1;
	}, [comboSettings.currentSetting]);

	const onCancel = useCallback(() => resolve(null), [resolve]);

	const sharedProps = {
		suggestedHeaders,
		handleChangeSuggestedHeaders,
		lightRunEnabled,
		onCancel,
		onRun,
		runText,
		runModels,
	};

	const econSidebarProps = {
		...sharedProps,
		...econSettings,
		feat: 'Settings',
		loading: econSettings.loadingSettings,
	};
	const reportSidebarProps = {
		...sharedProps,
		...reportSettings,
		feat: 'Reports',
		loading: reportSettings.loadingSettings,
	};
	const comboSidebarProps = {
		...sharedProps,
		...comboSettings,
		feat: 'Combos',
		loading: comboSettings.loadingQualifiers || comboSettings.loadingSettings,
	};

	const sidebarProps = (() => ({
		...{
			[active]: econSidebarProps,
			[COLUMNS]: econSidebarProps,
			[REPORTS]: reportSidebarProps,
			[COMBOS]: comboSidebarProps,
		}[active],
		loadingSettings: reduce(
			[econSidebarProps, reportSidebarProps, comboSidebarProps],
			(acc, props) => acc || props.loadingSettings,
			false
		),
	}))();

	const comboSettingNames = useMemo(() => comboSettings.settings?.map(({ name }) => name), [comboSettings.settings]);

	const tabsRender = useMemo(() => {
		const econColumns = <EconSettingsColumns {...econSettings} loading={econSettings.loadingSettings} />;

		if (combosEnabled) {
			const econReport = <EconSettingsReports {...reportSettings} loading={reportSettings.loadingSettings} />;

			return runModels !== RunModel.carbonOnly ? (
				<TabsLayout default={COLUMNS} active={active} onChange={setActive}>
					<Tab name={COLUMNS} label='Columns'>
						{econColumns}
					</Tab>
					<Tab name={REPORTS} label='Reports'>
						{econReport}
					</Tab>
					<Tab name={COMBOS} label='Combos'>
						<EconSettingsCombos
							{...comboSettings}
							canDeselect={canDeselect}
							comboSettingNames={comboSettingNames}
							loading={comboSettings.loadingQualifiers || comboSettings.loadingSettings}
						/>
					</Tab>
				</TabsLayout>
			) : (
				<TabsLayout default={COLUMNS} active={active} onChange={setActive}>
					<Tab name={COMBOS} label='Combos'>
						<EconSettingsCombos
							{...comboSettings}
							canDeselect={canDeselect}
							comboSettingNames={comboSettingNames}
							loading={comboSettings.loadingQualifiers || comboSettings.loadingSettings}
						/>
					</Tab>
				</TabsLayout>
			);
		}

		return econColumns;
	}, [active, canDeselect, comboSettingNames, comboSettings, combosEnabled, econSettings, reportSettings, runModels]);

	const changeRunModels = useCallback(
		(e) => {
			const newRunModels = e.target.value;
			if (runModels === newRunModels) {
				return;
			}
			setRunModels(newRunModels);
			if (runModels !== RunModel.carbonOnly && newRunModels === RunModel.carbonOnly) {
				setActive(COMBOS);
				return;
			}
			if (runModels === RunModel.carbonOnly && newRunModels !== RunModel.carbonOnly) {
				setActive(COLUMNS);
			}
		},
		[runModels]
	);

	return (
		<Dialog
			fullWidth
			open={props.visible}
			css={`
				.MuiDialog-paper {
					max-width: 100%;
					height: calc(100vh - 48px);
					width: calc(100vw - 80px);
				}
			`}
		>
			<DialogTitle
				css={`
					text-align: center;
					margin: 0.5rem;
				`}
			>
				{runText}
			</DialogTitle>
			<DialogContent
				css={`
					padding: 0;
					display: flex;
				`}
			>
				<Sidebar
					{...sidebarProps}
					wellsAmount={wellsAmount}
					changeRunModels={changeRunModels}
					hasGroups={hasGroups}
				/>
				{tabsRender}
			</DialogContent>
		</Dialog>
	);
}
