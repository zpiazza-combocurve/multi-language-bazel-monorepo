import {
	faBezierCurve,
	faCalendarAlt,
	faCloudMoon,
	faCloudSun,
	faFileUpload,
	faGlobe,
	faMoneyCheckAlt,
	faSigma,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	Divider,
	Drawer,
	Link,
	List,
	ListItem,
	ListItemIconProps,
	ListItemText,
	ListItemIcon as MuiListItemIcon,
	SvgIcon,
	useTheme,
} from '@material-ui/core';
import { forwardRef, useContext, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, LinkProps as RouterLinkProps, useMatch, useNavigate } from 'react-router-dom';

import { ACTIONS, AbilityContext, SUBJECTS } from '@/access-policies/Can';
import usePermissions from '@/access-policies/usePermissions';
import { getTaggingProp } from '@/analytics/tagging';
import { Icon } from '@/components/v2';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { useAlfa } from '@/helpers/alfa';
import { FeatureIcons } from '@/helpers/features';
import { useFilesUploadStore } from '@/helpers/files-upload';
import { localize } from '@/helpers/i18n';
import { Theme, toggleTheme } from '@/helpers/theme';
import { showRequestCarbonDemoDialog } from '@/networks/carbon/RequestCarbonDemoDialog';
import { URLS, getModuleListRoute } from '@/urls';

import { AppVersionWithSSO } from './AppVersionWithSSO';
import ComboCurveLogo from './ComboCurveLogo';
import { useSidebarVisibleStore } from './sidebar-visible-store';

export { useSidebarVisibleStore };

type Item =
	| {
			divider?: never | false;
			icon: React.ReactNode;
			link: string;
			title: string;
			custom?: boolean;
			onClick?: () => void;
	  }
	| { divider: true };

function NavFooter() {
	return (
		<div
			css={`
				padding: ${({ theme }) => theme.spacing(1)}px;
				text-align: center;
			`}
		>
			<Link href='https://www.combocurve.com/' target='_blank' rel='noreferrer'>
				© ComboCurve, Inc. {new Date().getFullYear()}
			</Link>
		</div>
	);
}

function NavHeader() {
	const { filesUploading, removeFile } = useFilesUploadStore();
	const { setNavVisible } = useSidebarVisibleStore();
	const navigate = useNavigate();

	const handleFileClick = ({ gcpName, link }) => {
		navigate(link);
		setNavVisible(false);
		removeFile(gcpName);
	};

	if (filesUploading.length === 0) return null;

	return (
		<div
			css={`
				margin-top: 10px;
				margin-bottom: 15px;

				.file-uploading-container {
					width: 100%;
					height: 30px;
					display: flex;
					flex-wrap: wrap;
					padding-left: 15px;

					.top {
						min-width: 100%;
					}

					.file-uploading-progress {
						height: 3px;
						background: ${({ theme }) => theme.palette.secondary.main};
					}
				}
			`}
		>
			{filesUploading.map((f) => {
				const { gcpName, name, progress, link } = f;
				const width = Number(progress || 0);

				return (
					<div
						id={gcpName}
						key={gcpName}
						role='button'
						onClick={link ? () => handleFileClick({ gcpName, link }) : undefined}
						className={`file-uploading-container ${link ? 'finger' : ''}`}
					>
						<div className='top text-ellip'>
							<FontAwesomeIcon className='secondary-icon' icon={faFileUpload} />
							<span className='file-uploading-name md-text'>{`${width}%  ${name}`}</span>
						</div>
						<div className='file-uploading-progress' style={{ width: `${width}%` }} />
					</div>
				);
			})}
		</div>
	);
}

interface ListItemLinkProps {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	icon?: any;
	primary: string;
	to?: string;
	onClick?: () => void;
	className?: string;
	level?: number;
	custom?: boolean;
}

function ListItemIcon({
	color,
	children,
	custom,
	...props
}: ListItemIconProps & {
	custom?: boolean;
}) {
	return (
		<MuiListItemIcon {...props}>
			{custom ? (
				<SvgIcon>{children}</SvgIcon>
			) : (
				<Icon
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					color={color ?? ('default' as any)}
					css={`
						overflow: visible;
					`}
				>
					{children}
				</Icon>
			)}
		</MuiListItemIcon>
	);
}

// https://v4.mui.com/guides/composition/#list
function ListItemLink(props: ListItemLinkProps) {
	const theme = useTheme();
	const { icon, primary, to, onClick, level = 0, custom, ...rest } = props;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const isRouteMatch = !!useMatch<any, any>(to ?? '')?.pattern.end;

	const renderLink = useMemo(
		() =>
			to
				? // eslint-disable-next-line react/no-unstable-nested-components, @typescript-eslint/no-explicit-any -- TODO eslint fix later
				  forwardRef<any, Omit<RouterLinkProps, 'to'>>((itemProps, ref) => (
						<RouterLink to={to} ref={ref} {...itemProps} />
				  ))
				: undefined,
		[to]
	);

	return (
		<ListItem
			button
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
			// @ts-expect-error
			component={renderLink}
			onClick={onClick}
			selected={isRouteMatch}
			css={`
				& > *:first-child {
					margin-left: ${theme.spacing(level) * 4}px;
				}
			`}
			{...rest}
		>
			{icon ? (
				<ListItemIcon color={isRouteMatch ? 'primary' : 'default'} custom={custom}>
					{icon}
				</ListItemIcon>
			) : null}
			<ListItemText
				primary={primary}
				css={`
					margin-right: ${({ theme }) => theme.spacing(4)}px;
				`}
			/>
		</ListItem>
	);
}

const useShowCompanyPage = () => {
	const { canView: canViewAPISync } = usePermissions(SUBJECTS.API, null);
	const { canView: canViewCompanyWells } = usePermissions(SUBJECTS.CompanyWells, null);
	const { canView: canViewCompanyCustomFields } = usePermissions(SUBJECTS.CustomHeaderConfigurations, null);
	const { canView: canViewForecastConfigurations } = usePermissions(SUBJECTS.CompanyForecastSettings, null);
	const { canView: canViewCompanyAccess } = usePermissions(SUBJECTS.CompanyAccessPolicies, null);
	const { canView: canViewCompanyTags } = usePermissions(SUBJECTS.Tags, null);

	return (
		canViewAPISync ||
		canViewCompanyWells ||
		canViewCompanyCustomFields ||
		canViewForecastConfigurations ||
		canViewCompanyAccess ||
		canViewCompanyTags
	);
};

function NavDrawer() {
	const { theme, project } = useAlfa(['theme', 'project']);
	const { navVisible, setNavVisible } = useSidebarVisibleStore();
	const [analyticsThemeId, setAnalyticsThemeId] = useState<Record<string, string>>();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const match = useMatch<any, any>(URLS.project(':id').root);
	const projectId = match?.params?.id ?? project?._id;

	const ability = useContext(AbilityContext);

	const { isCarbonEnabled, isDataSyncEnabled } = useLDFeatureFlags();

	const canSeeCompanyPage = useShowCompanyPage();
	const canSeeDataSync = isDataSyncEnabled && ability.can(ACTIONS.View, SUBJECTS.DataSync);

	const navListItems = useMemo(
		() =>
			[
				...(canSeeCompanyPage
					? [
							{
								icon: FeatureIcons.company,
								link: URLS.company,
								title: 'Company',
							},
					  ]
					: []),
				...(canSeeCompanyPage ? [{ divider: true }] : []),
				{
					icon: FeatureIcons.projects,
					link: URLS.projects,
					title: 'Projects',
				},
				[
					{
						icon: faBezierCurve,
						link: getModuleListRoute('scenarios', projectId),
						title: 'Scenarios',
					},
					{
						icon: faMoneyCheckAlt,
						link: getModuleListRoute('assumptions', projectId),
						title: 'Econ Models',
					},
					{
						icon: FeatureIcons.forecasts,
						link: getModuleListRoute('forecasts', projectId),
						title: 'Forecasts',
					},
					{
						icon: faSigma,
						link: getModuleListRoute('typeCurves', projectId),
						title: 'Type Curves',
					},
					{
						icon: faCalendarAlt,
						link: getModuleListRoute('schedules', projectId),
						title: 'Scheduling',
					},
					{
						icon: FeatureIcons.lookupTable,
						link: getModuleListRoute('lookupTables', projectId),
						title: 'Lookup Tables',
					},
					{
						icon:
							theme === Theme.dark ? (
								<FeatureIcons.networkModel.dark />
							) : (
								<FeatureIcons.networkModel.light />
							),
						link: isCarbonEnabled ? getModuleListRoute('networkModels', projectId) : undefined,
						onClick: isCarbonEnabled
							? undefined
							: () => {
									showRequestCarbonDemoDialog({});
							  },
						title: localize.network.drawer.label(),
						custom: true,
					},
				],
				{
					divider: true,
				},
				{
					icon: faGlobe,
					link: getModuleListRoute('map', projectId),
					title: 'Map Settings',
				},

				{
					icon: FeatureIcons.dataImport,
					link: getModuleListRoute('dataImports', projectId),
					title: 'Data Import',
				},
				{
					divider: true,
				},

				...(canSeeDataSync
					? [
							{
								icon: FeatureIcons.dataSync,
								link: URLS.dataSyncRoot,
								title: 'Data Sync',
							},
							[
								{
									icon: FeatureIcons.dataSyncAgentInstances,
									link: URLS.agentInstances,
									title: 'Agent Instances',
								},

								{
									icon: FeatureIcons.dataSyncDataFlows,
									link: URLS.dataFlow,
									title: 'Data Flows',
								},

								{
									icon: FeatureIcons.dataSyncDataSecrets,
									link: URLS.dataSecrets,
									title: 'Data Secrets',
								},
							],
					  ]
					: []),
			].filter(Boolean) as (Item | Item[])[],
		[canSeeCompanyPage, projectId, theme, isCarbonEnabled, canSeeDataSync]
	);

	useEffect(() => {
		const themeTaggingProp =
			theme === Theme.dark ? getTaggingProp('general', 'light') : getTaggingProp('general', 'dark');
		setAnalyticsThemeId(themeTaggingProp);
	}, [theme]);

	const getTaggingPropByModuleTitle = (title: string) => {
		if (title === localize.network.drawer.label()) {
			return getTaggingProp('carbonNetwork', 'module');
		}

		return {};
	};

	return (
		<Drawer
			disableEnforceFocus
			anchor='left'
			open={navVisible}
			onClose={() => setNavVisible(false)}
			css={`
				.MuiDrawer-paper {
					display: flex;
					flex-direction: column;
				}
			`}
		>
			<ComboCurveLogo />
			<NavHeader />
			<List>
				{navListItems
					.flatMap((item) =>
						Array.isArray(item) ? item.map((subItem) => ({ ...subItem, level: 1 })) : { ...item, level: 0 }
					)
					.map((item, i) =>
						item.divider ? (
							<Divider key={i} />
						) : (
							<ListItemLink
								key={i}
								primary={item.title}
								to={item.link}
								level={item.level}
								icon={item.icon}
								custom={item.custom}
								onClick={() => {
									item.onClick?.();
									setNavVisible(false);
								}}
								{...getTaggingPropByModuleTitle(item.title)}
							/>
						)
					)}
				<Divider />
				<ListItem button onClick={() => toggleTheme()} {...analyticsThemeId}>
					<ListItemIcon>{theme === Theme.dark ? faCloudSun : faCloudMoon}</ListItemIcon>
					<ListItemText primary={theme === Theme.dark ? 'Light Theme' : 'Dark Theme'} />
				</ListItem>
			</List>
			<div css={{ flex: 1 }} />
			<AppVersionWithSSO />
			<Divider />
			<NavFooter />
		</Drawer>
	);
}

export default NavDrawer;
