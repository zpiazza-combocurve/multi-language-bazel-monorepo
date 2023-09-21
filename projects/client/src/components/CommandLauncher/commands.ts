import { faArrowAltCircleRight, faPalette, faSearch } from '@fortawesome/pro-regular-svg-icons';

import { navigate } from '@/helpers/history';
import { getApi } from '@/helpers/routing';
import { Theme, setTheme } from '@/helpers/theme';
import { URLS } from '@/urls';

import { useCommandsStore } from './global-commands-store';
import { showAsyncLauncher } from './shared';

function getThemeCommand(label: string, themeMode: string, theme: Theme) {
	return {
		icon: faPalette,
		label: `Switch Theme: ${label}`,
		action: () => setTheme({ theme, themeMode }),
	};
}

const routes = [
	{
		label: 'Projects List',
		route: URLS.projects,
	},
	{
		label: 'Scenarios List',
		route: URLS.scenarios,
	},
	{
		label: 'Econ Models List',
		route: URLS.assumptions,
	},
	{
		label: 'Forecasts List',
		route: URLS.forecasts,
	},
	{
		label: 'Type Curves List',
		route: URLS.typeCurves,
	},
	{
		label: 'Schedule List',
		route: URLS.schedules,
	},
	{
		label: 'Lookup Tables List',
		route: URLS.lookupTables,
	},
	{
		label: 'Map Settings',
		route: URLS.map,
	},
	{
		label: 'Data Import',
		route: URLS.dataImports,
	},
];

export function getNavigationCommand(label: string, route: string) {
	return {
		icon: faArrowAltCircleRight,
		label: `Go to: ${label}`,
		action: () => {
			navigate(route);
		},
	};
}

function searchItem(feat: string, search: string) {
	return getApi('/search', { feat, name: search });
}

const showItemsSearchLauncher = ({
	feat,
	label,
	getUrl,
	getLabel,
}: {
	feat: string;
	label: string;
	getUrl: (item) => string;
	getLabel?: (item) => string;
}) => {
	showAsyncLauncher({
		commandGetter: async (value) => {
			const items = await searchItem(feat, value);
			return items.map((item) => ({
				label: getLabel?.(item) ?? item.name,
				action: () => {
					navigate(getUrl(item));
				},
			}));
		},
		placeholder: `${label} name`,
		noOptionsText: 'Start typing to see results',
	});
};

export const ThemeCommands = [
	getThemeCommand('Classic Light', 'classic', Theme.light),
	getThemeCommand('Classic Dark', 'classic', Theme.dark),
];

export const RoutesCommands = routes.map(({ route, label }) => getNavigationCommand(label, route));

export const getGlobalCommands = () => [...useCommandsStore.getState().entries.entries()].flatMap(([, value]) => value);

export const ModulesSearchCommands = [
	{ feat: 'project', label: 'Project', getUrl: ({ _id }) => URLS.project(_id).root },
	{
		feat: 'scenario',
		label: 'Scenario',
		getUrl: ({ _id, project }) => URLS.project(project).scenario(_id).root,
	},
	{
		feat: 'typeCurve',
		label: 'Type Curve',
		getUrl: ({ _id, project }) => URLS.project(project).typeCurve(_id).root,
	},
	{ feat: 'schedule', label: 'Schedule', getUrl: ({ _id, project }) => URLS.project(project).schedule(_id).root },
	{
		feat: 'forecast',
		label: 'Forecast',
		getUrl: ({ _id, project }) => URLS.project(project).forecast(_id).root,
		getLabel: ({ type, name }) => `${type === 'determinstic' ? 'Deterministic' : 'Probabilistic'}: ${name}`,
	},
	{
		feat: 'assumption',
		label: 'Econ Model',
		getUrl: ({ _id, assumptionKey, project }) => URLS.project(project).assumption(assumptionKey).model(_id),
		getLabel: ({ assumptionName, name }) => `${assumptionName}: ${name}`,
	},
	{
		feat: 'scenarioLookupTable',
		label: 'Scenario Lookup Table',
		getUrl: ({ _id, project }) => URLS.project(project).scenarioLookupTable(_id).edit,
	},
	{
		feat: 'forecastLookupTable',
		label: 'Forecast Lookup Table',
		getUrl: ({ _id, project }) => URLS.project(project).forecastLookupTable(_id).edit,
	},
].map(({ label, feat, getUrl, getLabel }) => ({
	icon: faSearch,
	label: `Search ${label ?? feat}`,
	action: () => showItemsSearchLauncher({ feat, label, getUrl, getLabel }),
}));
