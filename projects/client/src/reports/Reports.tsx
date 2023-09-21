import { faInfoCircle } from '@fortawesome/pro-regular-svg-icons';
import { Route, Routes, useMatch } from 'react-router-dom';

import { FontIcon, Placeholder } from '@/components';
import { WarnBanner } from '@/components/banners';
import { useUserRun } from '@/economics/Economics/shared/api';
import { LastGhgRunQuery } from '@/economics/shared/queries';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { useAlfa } from '@/helpers/alfa';
import { assert } from '@/helpers/utilities';
import { PowerBITemplate } from '@/inpt-shared/powerbi';
import { Section, SectionContent, SectionHeader } from '@/layouts/Section';
import { projectRoutes } from '@/projects/routes';
import { useCurrentScenario } from '@/scenarios/api';

import { ReportView, THEMES } from './Reports/ReportView';
import { ReportsList } from './Reports/ReportsList';
import { ReportConfigQuery, useReportAvailabilityQuery } from './Reports/api';

const REPORT_NAME = 'reportName';

export const ReportsBanner = (props) => {
	const { featureEnabled } = props;
	if (featureEnabled) {
		return null;
	}
	return (
		<WarnBanner>
			<FontIcon>{faInfoCircle}</FontIcon>
			<span>This feature is not enabled for your organization</span>
		</WarnBanner>
	);
};

const ALL_TEMPLATES = Object.values(PowerBITemplate);

function isPBITemplate(template: string): template is PowerBITemplate {
	return ALL_TEMPLATES.indexOf(template as PowerBITemplate) !== -1;
}

function RoutedReportView() {
	const {
		params: { [REPORT_NAME]: reportName },
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any -- TODO eslint fix later
	} = useMatch<any, any>(`${projectRoutes.project(':projectId').scenario(':scenarioId').reports}/:${REPORT_NAME}`)!;

	assert(reportName, 'Expected reportName');

	const template = reportName;
	assert(isPBITemplate(template), 'reportName must be a valid Template');

	const { scenario } = useCurrentScenario();

	assert(scenario, 'Expected scenario');

	const isGhg = template === PowerBITemplate.ghg;
	const ghgRunQuery = LastGhgRunQuery.useQuery(scenario._id, { enabled: template === PowerBITemplate.ghg });
	const { run: econRun, loading } = useUserRun(); // econ run will always try to load, need to pass enabled option similar to ghg run query

	const econRunHasLoaded = isGhg ? ghgRunQuery.isSuccess : !loading;
	const run = template === PowerBITemplate.ghg ? ghgRunQuery.data : econRun;

	const reportConfigQuery = ReportConfigQuery.useQuery(run?._id as string, template, {
		enabled: econRunHasLoaded,
	});

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const reportConfig = reportConfigQuery.data!;

	return (
		<Placeholder loading={ghgRunQuery.isLoading || reportConfigQuery.isLoading} loadingText='Loading report ...'>
			{reportConfig && (
				<ReportView
					config={reportConfig}
					reportTemplate={template}
					reportTheme={isGhg ? THEMES.ghg : THEMES.default}
				/>
			)}
		</Placeholder>
	);
}

function ReportWithBanner({ children, featureEnabled }) {
	const { isCarbonEnabled } = useLDFeatureFlags();

	return (
		<Section>
			<SectionHeader>
				<ReportsBanner
					featureEnabled={
						featureEnabled ||
						isCarbonEnabled /* Temp fix: featureEnabled value should come from a single source of truth */
					}
				/>
			</SectionHeader>
			<SectionContent>{children}</SectionContent>
		</Section>
	);
}

export function Reports() {
	const { project } = useAlfa();
	const { scenario } = useCurrentScenario();
	const { isLoading: loadingReports, data: reports } = useReportAvailabilityQuery();
	const featureEnabled = !!reports?.length;

	if (!(project && scenario)) {
		return <h3>Please select a Project AND a Scenario.</h3>;
	}

	return (
		<Placeholder loading={loadingReports}>
			<Routes>
				<Route
					path='/'
					element={
						<ReportWithBanner featureEnabled={featureEnabled}>
							<ReportsList />
						</ReportWithBanner>
					}
				/>
				<Route
					path={`/:${REPORT_NAME}/*`}
					element={
						<ReportWithBanner featureEnabled={featureEnabled}>
							<RoutedReportView />
						</ReportWithBanner>
					}
				/>
			</Routes>
		</Placeholder>
	);
}
