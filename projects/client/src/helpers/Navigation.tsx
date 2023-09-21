import { Route, Routes, useMatch } from 'react-router-dom';

import { Placeholder } from '@/components';
import { getNavigationCommand, useGlobalCommands } from '@/components/CommandLauncher';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useQueryStringState, useURLSearchParams } from '@/components/hooks/useQuery';
import { RouteGuard } from '@/helpers/guards';
import { usePagePath } from '@/helpers/routing';
import { useTabs } from '@/navigation/ContextTopNav';
import NotFound from '@/not-found/not-found';

/** @deprecated Use react-router handle */
export interface Page {
	label: string;
	path: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	component: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	icon?: any;
	hidden?: boolean;
	tooltipTitle?: string;
	checks?: string[];
	disabled?: boolean;
}

function useActiveTab(availableTabs) {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const match = useMatch<any, any>('*')!;
	const {
		pathname: currentPath,
		pattern: { end: currentExact },
	} = match;
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const submatch = useMatch<'action', string>(`${currentPath}/:action*(/*)?`)!;
	if (currentExact) {
		return undefined;
	}

	const {
		params: { action },
		pattern: { end: isExact },
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	} = submatch!;
	const tab = availableTabs.find(({ path }) => path === action);
	if (!tab) {
		return undefined;
	}
	if (tab.exact && !isExact) {
		return undefined;
	}
	return tab.path;
}

function renderOrComponent(render, Component, props) {
	if (render) {
		return render(props);
	}
	return <Component {...props} />;
}

/** @deprecated Use react-router handle */
function useModuleNavigationCommands(pages, queryKey = '', defaultPath = '') {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const { pathname } = useMatch<any, any>('*')!;
	const activeTab = useActiveTab(pages);

	const [query] = useQueryStringState(queryKey, defaultPath);

	useGlobalCommands(
		pages
			.filter(({ path }) => query !== path && activeTab !== path)
			.map(({ label, path }) => {
				return getNavigationCommand(label, queryKey ? `${pathname}?${queryKey}=${path}` : path);
			})
	);
}

interface ModuleNavigationProps {
	loading?: boolean;
	default?: string;
	pages: Page[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	sharedProps?: any;
}

/** @deprecated Use react-router handle */
export function ModuleNavigation(props: ModuleNavigationProps) {
	const { default: defaultPath, pages = [], sharedProps, loading } = props;
	const { pagePath } = usePagePath('');

	const activeTab = useActiveTab(pages);
	useModuleNavigationCommands(pages);
	useTabs(
		pages
			.filter(({ hidden, path }) => !hidden || activeTab === path)
			.map(({ label, path, icon, tooltipTitle, disabled }) => ({
				icon,
				path,
				label,
				tooltipTitle,
				disabled,
				isDefault: defaultPath === path,
			}))
	);

	const defaultPage = pages.find(({ path }) => path === defaultPath);
	const allPages = [...pages, ...(defaultPage ? [{ ...defaultPage, path: '' }] : [])];

	if (loading) {
		return <Placeholder loading main />;
	}

	return (
		<Routes>
			{allPages.map(
				(
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
					// @ts-expect-error
					{ path, render, component, ...page }
				) => (
					<Route
						key={path}
						path={pagePath(path)}
						element={
							//  {...page} contains label, tooltip etc. Not used so far
							<RouteGuard {...page}>
								<ErrorBoundary>
									{renderOrComponent(render, component, {
										...sharedProps,
									})}
								</ErrorBoundary>
							</RouteGuard>
						}
					/>
				)
			)}
			<Route
				element={
					<RouteGuard>
						<NotFound />
					</RouteGuard>
				}
			/>
		</Routes>
	);
}

/**
 * Like the ModuleNavigation component but uses querystring for navigation instead of url
 *
 * @deprecated Use react-router handle
 */
export function ModuleNavigationQuery({
	query: queryKey = 'path',
	default: defaultPath = '',
	pages = [],
	sharedProps,
	rootUrl,
}: {
	pages?: Page[];
	/** Querystring key to store path */
	query?: string;
	default: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	sharedProps?: any;
	rootUrl?: string;
}) {
	const [search] = useURLSearchParams();
	const query = search.get(queryKey) || defaultPath;
	useModuleNavigationCommands(pages, queryKey, defaultPath);

	useTabs(
		pages.map(({ label, path, icon, tooltipTitle, disabled }) => ({
			label,
			icon,
			path: `${rootUrl}/${path}`,
			to: { pathname: rootUrl, search: `?${queryKey}=${path}` },
			isActive: () => query === path,
			tooltipTitle,
			isDefault: defaultPath === path,
			disabled,
		}))
	);
	const Component = pages.find(({ path }) => path === query)?.component ?? NotFound;

	return (
		<ErrorBoundary>
			<Component {...sharedProps} />
		</ErrorBoundary>
	);
}
