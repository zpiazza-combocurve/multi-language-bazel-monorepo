import { faDownload } from '@fortawesome/pro-regular-svg-icons';
import { Tab, Tabs } from '@material-ui/core';
import _ from 'lodash';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'react-query';

import { useHotkey, useHotkeyScope } from '@/components/hooks/useHotkey';
import { Box, Button, ButtonItem, List, ListItem, ListItemText, MenuButton, Paper, Typography } from '@/components/v2';
import { useEconomicsDownload } from '@/cost-model/detail-components/EconModel/EconomicsRunCard';
import { useSingleWellEconRun } from '@/cost-model/detail-components/econ-run';
import EconOutputMonthlyTable from '@/economics/tables/EconOutputMonthlyTable';
import SingleOnelinerTable, { getOneLinerRows } from '@/economics/tables/SingleOnelinerTable';
import SingleChartControls from '@/forecasts/charts/components/deterministic/grid-chart/SingleChartControls';
import { confirmationAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { toLocalDate } from '@/helpers/dates';
import { FeatureIcons } from '@/helpers/features';
import { getApi, putApi } from '@/helpers/routing';
import { addDateTime } from '@/helpers/timestamp';
import { getFullName } from '@/helpers/user';
import { fields as econOutputColumns } from '@/inpt-shared/display-templates/general/economics_columns.json';
import { Section, SectionContent, SectionHeader } from '@/layouts/Section';
import { ModularScenarioPage } from '@/scenarios/Scenario/ModularScenarioPage';
import { api, useIncrementals } from '@/scenarios/Scenario/ScenarioPage/index';
import { useHeaderSelection } from '@/scenarios/Scenario/useHeaderSelection';
import { WarningIcon, allAssumptionKeys } from '@/scenarios/shared';

import FullScreenDialog from '../components/v2/misc/FullScreenDialog';
import { queryClient } from '../helpers/query-cache';
import { Collapsible } from './Collapsible';
import { Configuration } from './Configuration';
import { SearchableMenu } from './SearchableMenu';
import { saveDocument } from './docx-generator';

const MISSING_GENERAL_OPTIONS = 'No General Options Assigned';

function TabPanel({ currentTab, tabKey, children }) {
	const isVisible = currentTab === tabKey;
	return isVisible ? children : null;
}

const getIncrementalAssignment = (scenarioWellAssignments) => {
	return scenarioWellAssignments?.find(({ index }) => index >= 1);
};

const getWellAssignment = (scenarioWellAssignments) => {
	return scenarioWellAssignments?.find(({ index }) => !index);
};

const TABS = {
	main: 0,
	econ: 1,
};

const ECON_TABS = {
	summaryWell: 0,
	summaryIncremental: 1,
	oneliner: 2,
	monthly: 3,
};

const Item = ({ label, value }) => {
	return (
		<ListItem
			css={`
				padding: 0;
			`}
		>
			<ListItemText
				css={`
					display: flex;
					justify-content: space-between;
					align-items: center;
				`}
				primary={label}
				secondary={value ?? 'N/A'}
			/>
		</ListItem>
	);
};

const ItemList = ({ data }) => {
	return (
		<List
			css={`
				padding: 0;
			`}
		>
			{data.map((d) => {
				return <Item key={d.key} label={d.header} value={d.value} />;
			})}
		</List>
	);
};

const ListContainer = ({ title, data }) => {
	if (!data?.length) {
		return null;
	}

	return (
		<Box py={1}>
			{title && <Typography variant='h6'>{title}</Typography>}
			<Box
				css={`
					border-radius: 4px;
					background: ${({ theme }) => theme.palette.background.opaque};
				`}
				p={1}
				mb={2}
			>
				<ItemList data={data} />
			</Box>
		</Box>
	);
};

type ICollapsedState = Record<string, boolean>;

const CATEGORIES = [
	'Gross Volumes',
	'Ownership',
	'Carbon',
	'Net Volumes',
	'Stream Properties',
	'Price',
	'Revenue',
	'Expense',
	'Production Tax',
	'CAPEX',
	'Cash Flow',
	'AFIT Economics',
	'Additional Oneline Summary Options',
	'Production Analytics',
	'Forecast Parameters',
	'8/8ths EUR Econ Limit Applied',
];

const Summary = ({ scenarioId, projectId, forecastId, wellId, well, econRun, generalOptionsId }) => {
	const { monthly, oneLiner } = econRun;

	const outputColumns = Object.keys(oneLiner)
		.sort((a, b) => oneLiner[a].order - oneLiner[b].order)
		.map((key) => key);

	const existing = outputColumns.filter((key) => econOutputColumns[key]);

	const columnsByCategory = _.groupBy(existing, (key) => econOutputColumns[key]?.category ?? key);

	const sections = ['Description', ...Object.keys(columnsByCategory)];

	const allCollapsed = Object.values(sections).reduce((acc, key) => {
		acc[key] = true;
		return acc;
	}, {} as ICollapsedState);

	const allExpanded = Object.values(sections).reduce((acc, key) => {
		acc[key] = false;
		return acc;
	}, {} as ICollapsedState);

	const [collapsedLists, setCollapsedLists] = useState<ICollapsedState>(allExpanded);

	const expandAll = useCallback(() => {
		setCollapsedLists(allExpanded);
	}, [setCollapsedLists, allExpanded]);

	const collapseAll = useCallback(() => {
		setCollapsedLists(allCollapsed);
	}, [setCollapsedLists, allCollapsed]);

	const getCollapsedProps = (id) => ({
		collapsed: collapsedLists[id] ?? true,
		onCollapsed: (collapsed: boolean) => setCollapsedLists((prevState) => ({ ...prevState, [id]: collapsed })),
	});

	const { handleDownload, handleDownloadPDF } = useEconomicsDownload({
		scenarioId,
		projectId,
		monthly,
		oneLiner,
		wellName: well.well_name,
		wellId: well._id,
	});

	const { user } = useAlfa();

	const parsed = getOneLinerRows(oneLiner);
	const parsedOneLiner = _.keyBy(parsed, 'key');

	const sortedColumns = Object.keys(columnsByCategory).sort((a, b) => {
		return CATEGORIES.indexOf(a) - CATEGORIES.indexOf(b);
	});

	const data = {
		reportDetails: [
			{ key: 'reportDate', header: 'Report Date', value: toLocalDate(new Date()) },
			{ key: 'preparedBy', header: 'Prepared By', value: getFullName(user) },
			{ key: 'wellName', header: 'Well Name', value: well.well_name },
			{ key: 'wellNumber', header: 'Well Number', value: well.well_number },
			{ key: 'api', header: 'API', value: well.chosenID },
		],
		projectInputs: _.values(
			_.pick(parsedOneLiner, ['as_of_date', 'econ_first_production_date', 'total_gross_capex', 'well_life'])
		),
		economics: _.values(
			_.pick(parsedOneLiner, [
				'first_discount_cash_flow',
				'first_discount_roi',
				'irr',
				'first_discount_payout_duration',
			])
		),

		econGroups: sortedColumns.map((category) => ({
			category,
			data: columnsByCategory[category].map((key) => parsedOneLiner[key]),
		})),
	};

	const chartRef = useRef<HTMLDivElement>(null);

	const generateDocument = async () => {
		await saveDocument(data, chartRef, `${addDateTime(well.well_name)}.docx`);
		confirmationAlert('Document created successfully');
	};

	return (
		<div
			css={`
				height: 100%;
				display: flex;
			`}
		>
			<div
				css={`
					width: 50rem;
				`}
			>
				<ListContainer title='Report Details' data={data.reportDetails} />
				<ListContainer title='Project' data={data.projectInputs} />
				<ListContainer title='Key Economic Outputs' data={data.economics} />
			</div>
			<Section
				css={`
					width: 100%;
					margin-left: 1rem;
				`}
			>
				<SectionHeader
					css={`
						display: flex;
						z-index: 10000000;
						margin-bottom: 2px;
					`}
				>
					<Typography
						css={`
							flex: 1 1 0;
						`}
						variant='h6'
					>
						Economics
					</Typography>
					<div
						css={`
							flex: 0 0 auto;
							display: flex;
						`}
					>
						<Button onClick={expandAll} color='secondary'>
							Expand All
						</Button>
						<Button onClick={collapseAll} color='secondary'>
							Collapse All
						</Button>

						<MenuButton label='Download' startIcon={faDownload} list>
							<ButtonItem onClick={handleDownload} label='One Liner and Monthly' />
							<ButtonItem onClick={() => handleDownloadPDF(generalOptionsId)} label='PDF Report' />
							<ButtonItem onClick={generateDocument} label='Word Document' />
						</MenuButton>
					</div>
				</SectionHeader>
				<SectionContent
					css={`
						& > *:not(:first-child) {
							margin-top: 0.5rem;
						}
					`}
				>
					{forecastId && (
						<Collapsible title='Description' {...getCollapsedProps('Description')}>
							<div ref={chartRef}>
								<Box
									css={`
										height: 400px;
									`}
								>
									<SingleChartControls
										chartId='modular-economics-chart'
										disableControls
										disableStatusButtons
										enableComparisonSelection={false}
										enableMaximize={false}
										forecastId={forecastId}
										nested
										isModularEconomics
										selectable={false}
										wellId={wellId}
									/>
								</Box>
							</div>
						</Collapsible>
					)}

					{data.econGroups.map(({ category, data }) => (
						<Collapsible key={category} title={category} {...getCollapsedProps(category)}>
							<ItemList data={data} />
						</Collapsible>
					))}
				</SectionContent>
			</Section>
		</div>
	);
};

const EconomicsTab = ({ econResults, scenarioId, projectId, wellId, well, scenario }) => {
	const { well: wellEcon, incremental: incrementalEcon } = econResults;

	const wellAssignment = getWellAssignment(scenario.scenarioWellAssignments);
	const incrementalAssignment = getIncrementalAssignment(scenario.scenarioWellAssignments);

	const [currentTab, setCurrentTab] = useState(ECON_TABS.summaryWell);

	return (
		<Box
			css={`
				height: 100%;
			`}
			display='flex'
			p={2}
		>
			<Box px={1}>
				<Tabs
					value={currentTab}
					onChange={(_ev, newTab) => setCurrentTab(newTab)}
					orientation='vertical'
					variant='scrollable'
				>
					<Tab label='Summary' value={ECON_TABS.summaryWell} />
					{incrementalEcon && <Tab label='Summary (Inc)' value={ECON_TABS.summaryIncremental} />}
					<Tab label='One-Liner' value={ECON_TABS.oneliner} />
					<Tab label='Monthly' value={ECON_TABS.monthly} />
				</Tabs>
			</Box>

			<Box
				css={`
					padding: 0.5rem;
					height: 100%;
					width: 100%;
				`}
			>
				<TabPanel currentTab={currentTab} tabKey={ECON_TABS.summaryWell}>
					<Summary
						generalOptionsId={wellAssignment.general_options}
						scenarioId={scenarioId}
						projectId={projectId}
						well={well}
						wellId={wellId}
						forecastId={wellEcon.assignments?.[0].forecast?.model?._id}
						econRun={wellEcon}
					/>
				</TabPanel>

				{incrementalEcon && (
					<TabPanel currentTab={currentTab} tabKey={ECON_TABS.summaryIncremental}>
						<Summary
							scenarioId={scenarioId}
							generalOptionsId={incrementalAssignment.general_options}
							projectId={projectId}
							well={well}
							wellId={wellId}
							forecastId={incrementalEcon.assignments?.[0].forecast?.model?._id}
							econRun={incrementalEcon}
						/>
					</TabPanel>
				)}

				<TabPanel currentTab={currentTab} tabKey={ECON_TABS.oneliner}>
					<Box
						css={`
							height: 100%;
						`}
						display='flex'
						p={2}
					>
						<Box flexGrow={1} px={1}>
							{incrementalEcon && <Typography>Base</Typography>}
							<SingleOnelinerTable oneLiner={wellEcon.oneLiner} />
						</Box>
						{incrementalEcon && (
							<Box flexGrow={1} px={1}>
								<Typography>Incremental</Typography>
								<SingleOnelinerTable oneLiner={incrementalEcon.oneLiner} />
							</Box>
						)}
					</Box>
				</TabPanel>

				<TabPanel currentTab={currentTab} tabKey={ECON_TABS.monthly}>
					<Box
						css={`
							height: 100%;
						`}
						display='flex'
						p={2}
					>
						<Box flexGrow={1} px={1}>
							{incrementalEcon && <Typography>Base</Typography>}
							<EconOutputMonthlyTable output={wellEcon.monthly} />
						</Box>
						{incrementalEcon && (
							<Box flexGrow={1} px={1}>
								<Typography>Incremental</Typography>
								<EconOutputMonthlyTable output={incrementalEcon.monthly} />
							</Box>
						)}
					</Box>
				</TabPanel>
			</Box>
		</Box>
	);
};

export const ModEconPage = ({
	onHide,
	wellId,
	well,
	visible,
	forecastId,
	generalOptions,
	handleSelectGeneralOptions,
	handleSelectReferenceScenario: _handleSelectReferenceScenario,
	referenceScenarios,
	scenario,
}) => {
	const [currentTab, setCurrentTab] = useState(TABS.main);

	const wellAssignment = getWellAssignment(scenario.scenarioWellAssignments);
	const incrementalAssignment = getIncrementalAssignment(scenario.scenarioWellAssignments);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const [econResults, setEconResults] = useState<any>();
	const [econRan, setEconRan] = useState(false);
	const [econLoading, setEconLoading] = useState(false);

	const { runEconomics, settings, loading } = useSingleWellEconRun({ scenarioId: scenario._id });

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const [selectedSetting, setSelectedSetting] = useState<any>();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const [selectedReferenceScenario, setSelectedReferenceScenario] = useState<any>();

	const { _id: scenarioId } = scenario;

	const { assignments, updateLocalAssignments } = api.useScenarioWellAssignements(scenarioId);

	const handleSelectSettings = (setting) => {
		setSelectedSetting(setting);
		confirmationAlert(`"${setting.name} selected`);
	};

	const selectedAssignment = scenario.scenarioWellAssignments?.length > 1 ? incrementalAssignment : wellAssignment;

	const invalidateScenario = useCallback(
		(scenarioId) => {
			queryClient.setQueryData(['scenario', scenarioId], undefined);
			queryClient.invalidateQueries(['modular-economics', forecastId, wellId]);
			queryClient.invalidateQueries(['scenario', scenarioId]);
			setEconRan(false);
		},
		[forecastId, wellId]
	);

	const { createIncrementalDialog, createIncrementalButton, deleteIncrementalButton } = useIncrementals({
		allAssignments: assignments,
		canUpdateScenario: true,
		scenarioId,
		selectedAssignmentIds: [selectedAssignment?._id],
		updateAssignments: useCallback(
			(props) => {
				updateLocalAssignments(props);
				// invalidateAssignments();
				invalidateScenario(scenarioId);
			},
			[updateLocalAssignments, invalidateScenario, scenarioId]
		),
	});

	const handleRunEconomics = async () => {
		setEconLoading(true);
		try {
			const wellResults = await runEconomics([wellAssignment], selectedSetting, true);

			const incrementalResults = incrementalAssignment
				? await runEconomics([incrementalAssignment], selectedSetting, true)
				: undefined;

			confirmationAlert('Economics successfully ran');

			setEconResults({
				well: wellResults,
				incremental: incrementalResults,
			});

			queryClient.removeQueries(['forecast', 'detChartData', forecastId, wellId]);

			setCurrentTab(TABS.econ);
			setEconRan(true);
		} finally {
			setEconLoading(false);
		}
	};

	useHotkey('shift+enter', 'scenario', () => {
		handleRunEconomics();
	});

	const selectedGeneralOption = generalOptions?.find(({ _id }) => _id === wellAssignment?.general_options);

	const refresh = () => {
		queryClient.setQueryData(['scenario', scenario._id, 'assignments'], []);
		queryClient.invalidateQueries(['scenario']);
	};

	const handleSelectReferenceScenario = async (referenceScenarioId) => {
		const newReferenceScenario = referenceScenarios?.find(({ _id }) => _id === referenceScenarioId);
		setSelectedReferenceScenario(newReferenceScenario);

		await _handleSelectReferenceScenario({
			scenarioId: scenario._id,
			referenceScenarioId,
		});
		refresh();
	};

	const headers = useMemo(() => [...allAssumptionKeys, 'well_name', 'well_number'], []);
	const headerSelection = useHeaderSelection(headers, undefined, ['well_name', 'well_number']);

	return (
		<FullScreenDialog
			open={visible}
			onClose={onHide}
			topbar={
				<Tabs value={currentTab} onChange={(_ev, newTab) => setCurrentTab(newTab)}>
					<Tab label='Modular Economics' />
					<Tab label='Show Economics' disabled={!econRan} />
				</Tabs>
			}
		>
			{createIncrementalDialog}
			<TabPanel currentTab={currentTab} tabKey={TABS.main}>
				<Section
					css={`
						padding: 0.5rem;
						height: 100%;
						width: 100%;
					`}
					fullPage
				>
					<SectionHeader
						as={Paper}
						css={`
							padding: 0.5rem;
							display: flex;
							justify-content: space-between;
							align-items: center;
							z-index: 10000;
							& > *:not(:first-child) {
								margin-left: 0.5rem;
							}
						`}
					>
						<Box display='flex'>
							<SearchableMenu
								title='General Options'
								onSelectOption={(selectedGeneralOptionsId) => {
									handleSelectGeneralOptions({
										scenarioId: scenario._id,
										wellId,
										generalOptionsId: selectedGeneralOptionsId,
									});
								}}
								selectedOption={selectedGeneralOption?._id}
								options={generalOptions?.map(({ _id, name }) => ({
									key: _id,
									label: name,
								}))}
								startIcon={
									!selectedGeneralOption ? (
										<WarningIcon tooltipTitle={MISSING_GENERAL_OPTIONS} />
									) : undefined
								}
							/>

							<SearchableMenu
								title='Econ Outputs'
								onSelectOption={(settingId) => {
									handleSelectSettings(settings?.find(({ _id }) => _id === settingId));
								}}
								selectedOption={selectedSetting?._id}
								options={settings?.map(({ _id, name }) => ({
									key: _id,
									label: name,
								}))}
							/>

							<SearchableMenu
								title='Reference Scenario'
								onSelectOption={async (referenceScenarioId) => {
									handleSelectReferenceScenario(referenceScenarioId);
								}}
								selectedOption={selectedReferenceScenario?._id}
								options={referenceScenarios?.map(({ _id, name }) => ({
									key: _id,
									label: name,
								}))}
							/>

							{scenario.scenarioWellAssignments?.length === 1
								? createIncrementalButton
								: deleteIncrementalButton}

							<Button
								color='secondary'
								disabled={loading || econLoading}
								onClick={handleRunEconomics}
								startIcon={FeatureIcons.economics}
								variant='outlined'
							>
								{econLoading ? 'Loading...' : 'Run Economics'}
							</Button>
						</Box>
						<Box>
							<Configuration
								scenarioId={scenario._id}
								wellId={wellId}
								projectId={scenario.project}
								configurationToSave={{
									generalOptions: selectedGeneralOption?._id,
									setting: selectedSetting?._id,
									referenceScenario: selectedReferenceScenario?._id,
								}}
								onApplyConfiguration={(configuration) => {
									if (configuration?.configuration) {
										const { referenceScenario, setting } = configuration?.configuration ?? {};

										if (setting) {
											// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
											const newSetting = settings?.find(({ _id }: any) => _id === setting);

											if (newSetting) {
												setSelectedSetting(newSetting);
											}
										}

										if (referenceScenario) {
											const newSelectedReferenceScenario = referenceScenarios?.find(
												// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
												({ _id }: any) => _id === referenceScenario
											);

											if (newSelectedReferenceScenario) {
												setSelectedReferenceScenario(newSelectedReferenceScenario);
											}
										}
									}
									invalidateScenario(scenarioId);
								}}
							/>
						</Box>
					</SectionHeader>
					<SectionContent
						css={`
							margin-top: 0.5rem;
						`}
					>
						<ModularScenarioPage
							scenarioId={scenario._id}
							wellId={wellId}
							headerSelection={headerSelection}
						/>
					</SectionContent>
				</Section>
			</TabPanel>

			<TabPanel currentTab={currentTab} tabKey={TABS.econ}>
				<EconomicsTab
					well={well}
					econResults={econResults}
					wellId={wellId}
					scenario={scenario}
					scenarioId={scenario._id}
					projectId={scenario.project}
				/>
			</TabPanel>
		</FullScreenDialog>
	);
};

export const ModularScenarioDialog = ({ forecastId, wellId, onHide, visible }) => {
	const { data } = useQuery(['modular-economics', forecastId, wellId], () =>
		getApi(`/scenarios/modular/${forecastId}/${wellId}`)
	);

	const { data: well } = useQuery(
		['well-headers', { wellId }],
		() => getApi(`/well/getWell/${wellId}`) as Promise<Inpt.Well>
	);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const selectGeneralOptionsMutation = useMutation(async ({ scenarioId, generalOptionsId }: any) => {
		return putApi(`/scenarios/modular/general-options/${scenarioId}/${wellId}/${generalOptionsId}`);
	});

	const invalidateScenario = (scenarioId) => {
		queryClient.setQueryData(['scenario', scenarioId], undefined);
		queryClient.invalidateQueries(['modular-economics', forecastId, wellId]);
		queryClient.invalidateQueries(['scenario', scenarioId]);
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const selectReferenceScenarioMutation = useMutation(async ({ scenarioId, referenceScenarioId }: any) => {
		invalidateScenario(scenarioId);
		return putApi(`/scenarios/modular/reference-scenario/${scenarioId}/${wellId}/${referenceScenarioId}`);
	});

	const handleSelectGeneralOptions = async ({ scenarioId, generalOptionsId }) => {
		await selectGeneralOptionsMutation.mutateAsync({ scenarioId, wellId, generalOptionsId });
		invalidateScenario(scenarioId);

		const generalOptions = data.generalOptions.find(({ _id }) => generalOptionsId === _id);

		confirmationAlert(`"${generalOptions.name}" applied`);
	};

	const handleSelectReferenceScenario = async ({ scenarioId, referenceScenarioId }) => {
		await selectReferenceScenarioMutation.mutateAsync({ scenarioId, wellId, referenceScenarioId });

		const referenceScenario = data.referenceScenarios.find(({ _id }) => referenceScenarioId === _id);

		confirmationAlert(`"${referenceScenario.name}" applied`);
	};

	useHotkeyScope('modular-economics');

	if (!data || !well) {
		return null;
	}

	const { scenario, generalOptions, referenceScenarios } = data;

	return (
		<ModEconPage
			generalOptions={generalOptions}
			handleSelectGeneralOptions={handleSelectGeneralOptions}
			handleSelectReferenceScenario={handleSelectReferenceScenario}
			referenceScenarios={referenceScenarios}
			wellId={wellId}
			well={well}
			forecastId={forecastId}
			onHide={onHide}
			visible={visible}
			scenario={scenario}
		/>
	);
};
