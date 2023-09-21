import usePermissions, { SUBJECTS } from '@/access-policies/usePermissions';
import { APISync } from '@/api-sync/APISync';
import { CompanyAccess } from '@/company/CompanyAccess';
import { ModuleNavigation } from '@/helpers/Navigation';
import { useAlfa } from '@/helpers/alfa';
import { usePagePath } from '@/helpers/routing';
import { titleize } from '@/helpers/text';
import { Breadcrumb } from '@/navigation/Breadcrumbs';
import { ROUTES } from '@/routes/routes';
import { Tags } from '@/tags/Tags';

import { CustomColumnsRename } from './CustomColumnsRename';
import { ForecastConfiguration } from './ForecastConfiguration';
import { ManageWells } from './ManageWells';

export function Company() {
	const { subdomain } = useAlfa(['subdomain']);
	const { canView: canViewAPISync } = usePermissions(SUBJECTS.API, null);
	const { canView: canViewCompanyWells } = usePermissions(SUBJECTS.CompanyWells, null);
	const { canView: canViewCompanyCustomFields } = usePermissions(SUBJECTS.CustomHeaderConfigurations, null);
	const { canView: canViewForecastConfigurations } = usePermissions(SUBJECTS.CompanyForecastSettings, null);
	const { canView: canViewCompanyAccess } = usePermissions(SUBJECTS.CompanyAccessPolicies, null);
	const { canView: canViewCompanyTags } = usePermissions(SUBJECTS.Tags, null);
	const companyText = titleize(subdomain);
	const { pageTabPath } = usePagePath(ROUTES.company);

	const pages = [
		...(canViewCompanyWells ? [{ component: ManageWells, path: pageTabPath('manage-well'), label: 'Wells' }] : []),

		...(canViewCompanyCustomFields
			? [{ component: CustomColumnsRename, path: pageTabPath('custom-columns'), label: 'Custom Columns' }]
			: []),

		...(canViewForecastConfigurations
			? [
					{
						component: ForecastConfiguration,
						path: pageTabPath('forecast-configuration'),
						label: 'Forecast Configuration',
					},
			  ]
			: []),

		...(canViewCompanyAccess
			? [
					{
						component: CompanyAccess,
						path: pageTabPath('access'),
						label: 'Access & Roles',
					},
			  ]
			: []),

		...(canViewCompanyTags
			? [
					{
						component: Tags,
						path: pageTabPath('tags'),
						label: 'Tags Configuration',
					},
			  ]
			: []),
		...(canViewAPISync
			? [
					{
						component: APISync,
						path: pageTabPath('api-sync'),
						label: 'API & Sync',
					},
			  ]
			: []),
	].filter(Boolean);

	const defaultPage = pages[0]?.path ?? pageTabPath('manage-well');

	return (
		<>
			<Breadcrumb url={ROUTES.company} label={companyText} />

			<ModuleNavigation default={defaultPage} pages={pages} />
		</>
	);
}

export default Company;
