import { useEffect } from 'react';
import { useMatch } from 'react-router-dom';

import { Placeholder } from '@/components';
import { ModuleNavigation } from '@/helpers/Navigation';
import { genericErrorAlert } from '@/helpers/alerts';
import { EXPECTED_ERROR_NAMES } from '@/helpers/errors';
import { FeatureIcons } from '@/helpers/features';
import { queryClient } from '@/helpers/query-cache';
import { usePagePath } from '@/helpers/routing';
import { Breadcrumb } from '@/navigation/Breadcrumbs';
import WithNotFound from '@/not-found/WithNotFound';
import { projectRoutes as projectRoutesObj, useCurrentProjectRoutes } from '@/projects/routes';

import { EconTypeCurve } from './TypeCurveEcon';
import TypeCurveIndex from './TypeCurveIndex';
import { TypeCurveManageWells } from './TypeCurveManageWells';
import TypeCurveSettings from './TypeCurveSettings';
import { TC_QUERY_KEY_PREFIX, useTypeCurve } from './api';

export function TypeCurve() {
	const {
		params: { typeCurveId = '' },
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any -- TODO eslint fix later
	} = useMatch<any, any>(`${projectRoutesObj.project(':id').typeCurve(':typeCurveId').root}/*`)!;
	const typeCurveQuery = useTypeCurve(typeCurveId, {
		onError: (err) => {
			if (!(err?.expected && err?.name === EXPECTED_ERROR_NAMES.DOCUMENT_NOT_FOUND)) {
				genericErrorAlert(err as Error);
			}
		},
	});

	const projectRoutes = useCurrentProjectRoutes();
	const { pageTabPath } = usePagePath(projectRoutes.typeCurve(typeCurveQuery?.data?._id || '').root);

	useEffect(() => {
		return () => {
			// always remove all cached type curve queries; on module unmount
			queryClient.removeQueries(TC_QUERY_KEY_PREFIX);
		};
	}, []);

	if (typeCurveQuery.isLoading) {
		return <Placeholder main loading loadingText='Loading Type Curve' />;
	}

	const typeCurve = typeCurveQuery.data;

	return (
		<WithNotFound noData={!typeCurve}>
			<Breadcrumb url={projectRoutes.typeCurve(typeCurve?._id || '').view} label={typeCurve?.name ?? 'Loading'} />
			<ModuleNavigation
				sharedProps={{ typeCurveId, forecast: typeCurve?.forecast }}
				default={pageTabPath('settings')}
				pages={[
					{
						label: 'Settings',
						path: pageTabPath('settings'),
						icon: FeatureIcons.settings,
						tooltipTitle: 'Type Curve Settings',
						component: TypeCurveSettings,
						checks: ['isLoggedIn', 'projectAccess'],
					},
					{
						label: 'Wells',
						path: pageTabPath('manage-wells'),
						icon: FeatureIcons.wells,
						tooltipTitle: 'Type Curve Wells',
						component: TypeCurveManageWells,
						checks: ['isLoggedIn', 'projectAccess'],
					},
					{
						label: 'Type Curve',
						path: pageTabPath('view'),
						icon: FeatureIcons.wells,
						tooltipTitle: 'Type Curve View',
						component: TypeCurveIndex,
						checks: ['isLoggedIn', 'projectAccess'],
					},
					{
						label: 'Economics',
						path: pageTabPath('economics'),
						icon: FeatureIcons.economics,
						tooltipTitle: 'Economics',
						component: EconTypeCurve,
						checks: ['isLoggedIn', 'projectAccess'],
					},
				]}
			/>
		</WithNotFound>
	);
}
