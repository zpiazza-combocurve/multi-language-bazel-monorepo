import { faQuestion } from '@fortawesome/pro-regular-svg-icons';
import { clamp } from 'lodash-es';
import { useQuery } from 'react-query';

import ErrorBoundary from '@/components/ErrorBoundary';
import { useDerivedState } from '@/components/hooks';
import { IconButton, Tab, Tabs } from '@/components/v2';
import FullScreenDialog from '@/components/v2/misc/FullScreenDialog';
import PricingAdapter from '@/cost-model/detail-components/pricing/PricingAdapter';
import StreamPropertiesAdapter from '@/cost-model/detail-components/stream_properties/StreamPropertiesAdapter';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { putApi, redirectToZoho } from '@/helpers/routing';
import { unsavedWorkContinue } from '@/helpers/unsaved-work';
import { ASSUMPTION_LABELS, AssumptionKey } from '@/inpt-shared/constants';
import { showRequestCarbonDemoDialog } from '@/networks/carbon/RequestCarbonDemoDialog';
import { QUALIFIER_FIELDS } from '@/qualifiers/fields';

import Capex from '../detail-components/capex/CapexAdapter';
import Dates from '../detail-components/dates/dates';
import Depreciation from '../detail-components/depreciation/depreciation';
import DifferentialsAdapter from '../detail-components/differentials/DifferentialsAdapter';
import { EconRunContext, useEconRun } from '../detail-components/econ-run';
import Emission from '../detail-components/emission/Emission';
import Escalation from '../detail-components/escalation/escalation';
import Expenses from '../detail-components/expenses/ExpensesAdapter';
import FluidModel from '../detail-components/fluid_models/FluidModel';
import GeneralOptions from '../detail-components/general_options/general_options';
import OwnershipReversion from '../detail-components/ownership_reversion/ownership_reversion';
import ProductionTaxes from '../detail-components/production_taxes/production_taxes';
import ProductionVsFit from '../detail-components/production_vs_fit/production_vs_fit';
import ReservesCategory from '../detail-components/reserves_category/reserves_category';
import Risking from '../detail-components/risking/risking';

import './grid-item-dialog.scss';

import { AssignmentsApi } from '@/scheduling/ScheduleLandingPage/WellTable/api/AssignmentsApi';

/** @returns Well assignments and helpers for navigating and selecting wells from the well list */
function useWellAssignmentsList({
	allAssignmentIds,
	initialAssignmentId,
	scenarioId,
	scheduleId,
}: {
	allAssignmentIds?: string[];
	initialAssignmentId?: string;
	scenarioId?: Inpt.ObjectId<'scenario'>;
	scheduleId?: Inpt.ObjectId<'schedule'>;
}) {
	const [currentWellId, setCurrentWellId] = useDerivedState(initialAssignmentId);

	const wellAssignmentQuery = useQuery(
		['scen-well-assignment-build', { wellId: currentWellId, scenarioId }],
		() =>
			putApi(`/scenarios/${scenarioId}/build`, {
				scenarioWellAssignmentIds: [currentWellId],
				scenarioId,
				headers: ['well_name', 'well_number'],
				assumptions: Object.keys(QUALIFIER_FIELDS), // TODO Check with David and Daniel if we need to pass all the assumptions
			}) as Promise<Inpt.Api.Scenario.WellAssignmentBuild[]>,
		{
			enabled: !!currentWellId && !!scenarioId,
			select: (allData) => allData[0],
			keepPreviousData: true,
		}
	);

	const assignmentsApi = new AssignmentsApi(scheduleId as Inpt.ObjectId<'schedule'>);
	const scheduleWellAssignmentQuery = useQuery(
		['schedule-well-assignment-build', { wellId: currentWellId, scheduleId }],
		() =>
			assignmentsApi.get({
				wellIds: [currentWellId as string],
				headers: ['well_name', 'well_number'],
			}),
		{
			enabled: !!currentWellId && !!scheduleId,
			select: (allData) => allData[0],
			keepPreviousData: true,
		}
	);

	const move = async (dir = 1, onSuccess?: () => void) => {
		if (!allAssignmentIds || !currentWellId) {
			return;
		}
		if (await unsavedWorkContinue()) {
			const nextIndex = clamp(allAssignmentIds.indexOf(currentWellId) + dir, 0, allAssignmentIds.length);
			setCurrentWellId(allAssignmentIds[nextIndex]);
			if (onSuccess) onSuccess();
		}
	};

	const wellAssignment = scenarioId ? wellAssignmentQuery.data : scheduleWellAssignmentQuery.data;

	if (!allAssignmentIds || !currentWellId) {
		return { onNextWell: undefined, onPrevWell: undefined, wellAssignment };
	}

	const index = allAssignmentIds.indexOf(currentWellId);

	const onPrevWell = index > 0 ? ({ onSuccess }: { onSuccess?: () => void }) => move(-1, onSuccess) : undefined;
	const onNextWell =
		index < allAssignmentIds.length - 1
			? ({ onSuccess }: { onSuccess?: () => void }) => move(1, onSuccess)
			: undefined;

	return { onNextWell, onPrevWell, wellAssignment };
}

const KEY_COMPONENT_MAP = {
	[AssumptionKey.generalOptions]: GeneralOptions,
	[AssumptionKey.reservesCategory]: ReservesCategory,
	[AssumptionKey.ownershipReversion]: OwnershipReversion,
	[AssumptionKey.dates]: Dates,
	[AssumptionKey.capex]: Capex,
	[AssumptionKey.pricing]: PricingAdapter,
	[AssumptionKey.differentials]: DifferentialsAdapter,
	[AssumptionKey.streamProperties]: StreamPropertiesAdapter,
	[AssumptionKey.expenses]: Expenses,
	[AssumptionKey.productionTaxes]: ProductionTaxes,
	[AssumptionKey.productionVsFit]: ProductionVsFit,
	[AssumptionKey.risking]: Risking,
	[AssumptionKey.depreciation]: Depreciation,
	[AssumptionKey.escalation]: Escalation,
	[AssumptionKey.fluidModel]: FluidModel,
	[AssumptionKey.emission]: Emission,
};

export interface TabInfo {
	key: string;
	canUse: boolean;
}

const DEFAULT_TABS: TabInfo[] = [
	{ key: AssumptionKey.reservesCategory, canUse: true },
	{ key: AssumptionKey.ownershipReversion, canUse: true },
	{ key: AssumptionKey.dates, canUse: true },
	{ key: AssumptionKey.capex, canUse: true },
	{ key: AssumptionKey.pricing, canUse: true },
	{ key: AssumptionKey.differentials, canUse: true },
	{ key: AssumptionKey.streamProperties, canUse: true },
	{ key: AssumptionKey.expenses, canUse: true },
	{ key: AssumptionKey.productionTaxes, canUse: true },
	{ key: AssumptionKey.productionVsFit, canUse: true },
	{ key: AssumptionKey.risking, canUse: true },
	{ key: AssumptionKey.depreciation, canUse: false },
	{ key: AssumptionKey.escalation, canUse: false },
	{ key: AssumptionKey.fluidModel, canUse: false },
	{ key: AssumptionKey.emission, canUse: true },
];

const GROUP_CASE_TABS: TabInfo[] = [
	{ key: AssumptionKey.ownershipReversion, canUse: true },
	{ key: AssumptionKey.dates, canUse: true },
	{ key: AssumptionKey.capex, canUse: true },
	{ key: AssumptionKey.expenses, canUse: true },
	{ key: AssumptionKey.productionTaxes, canUse: true },
];

const GENERAL_OPTIONS_TABS: TabInfo[] = [{ key: AssumptionKey.generalOptions, canUse: true }];

const defaultTabsGenerator = (key, isGroupCase) => {
	if (isGroupCase) return GROUP_CASE_TABS;
	if (key === AssumptionKey.generalOptions) return GENERAL_OPTIONS_TABS;
	return DEFAULT_TABS;
};

interface EconModelsTabsProps {
	activeKey: string;
	onChangeActiveKey: (newActiveKey: string) => void;
	tabs: TabInfo[];
}

function EconModelsTabs({ activeKey, onChangeActiveKey, tabs }: EconModelsTabsProps) {
	return (
		<Tabs
			indicatorColor='primary'
			textColor='primary'
			variant='scrollable'
			value={activeKey}
			onChange={async (_ev, newValue) => {
				if (await unsavedWorkContinue()) {
					onChangeActiveKey(newValue);
				}
			}}
		>
			{tabs.map(({ key }) => (
				<Tab
					css={`
						text-transform: none;
						min-width: inherit;
					`}
					key={key}
					value={key}
					label={ASSUMPTION_LABELS[key] ?? key}
				/>
			))}
		</Tabs>
	);
}

function EconModelsPage({
	selectedModels,
	onUseModel,
	onModelUpdated,
	unique,
	initialAssignmentId,
	allAssignmentIds,
	activeKey,
	scenarioId,
	scheduleId,
	isModularScenario,
	useModelTaggingProp = {},
}) {
	const { onNextWell, onPrevWell, wellAssignment } = useWellAssignmentsList({
		allAssignmentIds,
		initialAssignmentId,
		scenarioId,
		scheduleId,
	});

	const initialModelId = wellAssignment?.[activeKey]?.model?._id ?? selectedModels?.[activeKey];

	const sharedProps = {
		allAssignmentIds,
		initialModelId,
		isModularScenario,
		onModelUpdated,
		onNextWell,
		onPrevWell,
		onUseModel,
		unique,
		wellAssignment,
		useModelTaggingProp,
	};

	const Component = KEY_COMPONENT_MAP[activeKey as keyof typeof KEY_COMPONENT_MAP];

	const econRunContext = useEconRun();

	return (
		<EconRunContext.Provider value={econRunContext}>
			{Component && (
				<ErrorBoundary>
					<Component {...sharedProps} />
				</ErrorBoundary>
			)}
		</EconRunContext.Provider>
	);
}

export type GridItemDialogData = {
	// TODO findout what properties are required
	key?;
	selectedModels?;
	initialAssignmentId?;
	allAssignmentIds?;
	unique?: boolean;
	chooseModel?: (model) => void;
	isModularScenario?: boolean;
	onModelUpdated?: ({ assumptionKey }: { assumptionKey: string }) => void;
	isGroupCase?: boolean;
};

interface GridItemDialogProps {
	visible?: boolean;
	hideDialog?: () => void;
	scenarioId?: Inpt.ObjectId<'scenario'>;
	scheduleId?: Inpt.ObjectId<'schedule'>;
	data: GridItemDialogData;
	tabs?: TabInfo[];
	useModelTaggingProp?: Record<string, string>;
}

function GridItemDialog(props: GridItemDialogProps) {
	const {
		visible,
		hideDialog,
		data: {
			allAssignmentIds,
			chooseModel,
			initialAssignmentId,
			isModularScenario,
			key,
			onModelUpdated,
			selectedModels,
			unique,
			isGroupCase,
		},
		scenarioId,
		scheduleId,
		tabs = defaultTabsGenerator(key, isGroupCase),
		useModelTaggingProp = {},
	} = props;

	const [activeKey, setActiveKey] = useDerivedState(key);

	const activeTab = tabs.find(({ key }) => key === activeKey);

	const handleZohoRedirect = () => {
		redirectToZoho('https://support.combocurve.com/portal/en/kb/articles/tooltip-overview-article');
	};

	const { isCarbonEnabled } = useLDFeatureFlags();

	const handleChangeActiveKey = (newActiveTabKey: string) => {
		if (newActiveTabKey === AssumptionKey.emission && !isCarbonEnabled) {
			showRequestCarbonDemoDialog({});
			return;
		}
		setActiveKey(newActiveTabKey);
	};

	return (
		<FullScreenDialog
			css={{
				position: 'relative', // needed to show the "open economics card" icon in the right position
			}}
			disableEscapeKeyDown
			disableMaxWidth
			open={!!visible}
			onClose={hideDialog}
			topbar={<EconModelsTabs activeKey={activeKey} onChangeActiveKey={handleChangeActiveKey} tabs={tabs} />}
			topbarRight={<IconButton onClick={handleZohoRedirect}>{faQuestion}</IconButton>}
		>
			<EconModelsPage
				activeKey={activeKey}
				allAssignmentIds={allAssignmentIds}
				initialAssignmentId={initialAssignmentId}
				isModularScenario={isModularScenario}
				onModelUpdated={onModelUpdated}
				onUseModel={activeTab?.canUse ? chooseModel : undefined}
				scenarioId={scenarioId}
				scheduleId={scheduleId}
				selectedModels={selectedModels}
				unique={unique}
				useModelTaggingProp={useModelTaggingProp}
			/>
		</FullScreenDialog>
	);
}

export default GridItemDialog;
