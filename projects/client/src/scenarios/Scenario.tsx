import { Placeholder } from '@/components';
import { ModuleNavigation } from '@/helpers/Navigation';
import { FeatureIcons } from '@/helpers/features';
import { usePagePath } from '@/helpers/routing';
import { Breadcrumb } from '@/navigation/Breadcrumbs';
import { useCurrentProjectRoutes } from '@/projects/routes';
import { Reports } from '@/reports/Reports';
import { useCurrentScenario } from '@/scenarios/api';

import ScenarioPage from './Scenario/ScenarioPage';
import ScenarioSettings from './Scenario/ScenarioSettings';
import { ScenarioWells } from './Scenario/scenario-wells';

export default function Scenario() {
	const projectRoutes = useCurrentProjectRoutes();
	const { scenario, isLoading } = useCurrentScenario();
	const baseUrl = projectRoutes.scenario(scenario?._id).root;
	const { pageTabPath } = usePagePath(baseUrl);

	return (
		<>
			<Breadcrumb url={baseUrl} label={scenario?.name ?? 'Loading'} />
			<Placeholder loading={isLoading}>
				<ModuleNavigation
					default={pageTabPath('view')}
					pages={[
						{
							path: pageTabPath('settings'),
							icon: FeatureIcons.settings,
							component: ScenarioSettings,
							label: 'Settings',
							tooltipTitle: 'Navigate To Scenario Settings',
						},
						{
							path: pageTabPath('wells'),
							icon: FeatureIcons.wells,
							component: ScenarioWells,
							label: 'Scenario Wells',
							tooltipTitle: 'Navigate To Scenario Wells',
						},
						{
							path: pageTabPath('view'),
							icon: FeatureIcons.scenarios,
							component: ScenarioPage,
							label: 'Scenario Table',
							tooltipTitle: 'Navigate To Scenario Table',
						},
						{
							path: pageTabPath('reports'),
							icon: FeatureIcons.reports,
							component: Reports,
							label: 'Reports (Beta)',
							tooltipTitle: 'Navigate To Reports',
							checks: ['isLoggedIn', 'projectAccess', 'scenarioAccess'],
						},
					]}
				/>
			</Placeholder>
		</>
	);
}
