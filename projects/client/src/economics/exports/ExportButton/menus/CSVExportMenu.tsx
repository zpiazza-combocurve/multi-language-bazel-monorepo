import produce from 'immer';
import { find } from 'lodash';

import useCSVExportDialog from '@/economics/exports/CSVExportDialog';
import { isSuggestedTemplate } from '@/economics/exports/CSVExportDialog/Sidebar/helpers';
import { useCurrentProjectDefaultTemplate, useTemplates } from '@/economics/exports/CSVExportDialog/index';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { assert } from '@/helpers/utilities';
import { useCurrentProjectId } from '@/projects/routes';

import { CustomMenuItem } from '../types';
import { Menu } from './Menu';
import {
	CCLogo,
	REQUIRE_ECON_RUN_TOOLTIP,
	REQUIRE_FULL_ECON_RUN_TOOLTIP,
	REQUIRE_GHG_RUN_TOOLTIP,
	defaultTemplateFormatter,
	findDefault,
	typeToLabel,
} from './shared';

function useCSVTemplatesForType(type: 'oneLiner' | 'cashflow-csv' | 'cashflow-agg-csv', props) {
	const { runId, scenarioTableHeaders } = props;
	const currentProjectId = useCurrentProjectId();
	const { templates } = useTemplates(currentProjectId, runId, scenarioTableHeaders, type);
	const { defaultConfiguration } = useCurrentProjectDefaultTemplate(type);
	const suggestedTemplates = templates.filter((template) => isSuggestedTemplate(template) && template.type === type);
	const defaultTemplate = findDefault(defaultConfiguration, templates) ?? suggestedTemplates[0];
	return { defaultTemplate, suggestedTemplates };
}

function getCSVExportEditorMenuItem(
	econRunExists,
	isCustomCSVEditorNewTagEnabled,
	showCustomCSVReportDialog,
	handleExport
) {
	return {
		id: 'econ-csv',
		disabled: !econRunExists && REQUIRE_ECON_RUN_TOOLTIP,
		isNew: isCustomCSVEditorNewTagEnabled,
		onClick: async () => {
			const reportResults = await showCustomCSVReportDialog({});
			if (reportResults) handleExport(reportResults);
		},
	};
}

export function useCSVMenuItems(props) {
	const { runId, handleExport, scenarioTableHeaders, hasReservesGroups, econRunExists, ghgRunExists } = props;
	const { isCustomCSVEditorNewTagEnabled } = useLDFeatureFlags();

	const [customCSVReportDialog, showCustomCSVReportDialog] = useCSVExportDialog({
		runId,
		scenarioTableHeaders,
		hasReservesGroups,
	});

	const CSVExportEditorMenuItem = getCSVExportEditorMenuItem(
		econRunExists,
		isCustomCSVEditorNewTagEnabled,
		showCustomCSVReportDialog,
		handleExport
	);

	const [oneline, byWell, agg] = [
		useCSVTemplatesForType('oneLiner', props),
		useCSVTemplatesForType('cashflow-csv', props),
		useCSVTemplatesForType('cashflow-agg-csv', props),
	];

	const defaultTemplatesMenuItems = [oneline, byWell, agg]
		.filter(({ defaultTemplate }) => defaultTemplate != null)
		.map(({ defaultTemplate: template }) => ({
			id: template._id ?? `${template.type}-${template.name}`,
			label: template.name,
			annotation: typeToLabel(template.type),
			onClick: () => handleExport(template),
		}));

	return {
		editor: {
			dialog: customCSVReportDialog,
			menuItem: CSVExportEditorMenuItem,
		},
		defaultTemplatesMenuItems,
		suggestedMenuItems: {
			oneLiner: {
				id: 'oneLiner',
				disabled: !econRunExists && REQUIRE_ECON_RUN_TOOLTIP,
				onClick: () => handleExport(oneline.suggestedTemplates[0]),
			},
			byWellMonthly: {
				id: 'cashflow-csv-monthly',
				disabled: !econRunExists && REQUIRE_ECON_RUN_TOOLTIP,
				onClick: () => handleExport(find(byWell.suggestedTemplates, { cashflowOptions: { type: 'monthly' } })),
			},
			byWellYearly: {
				id: 'cashflow-csv-yearly',
				disabled: !econRunExists && REQUIRE_ECON_RUN_TOOLTIP,
				onClick: () =>
					handleExport(
						produce(find(byWell.suggestedTemplates, { cashflowOptions: { type: 'monthly' } }), (draft) => {
							assert(draft?.cashflowOptions);
							draft.cashflowOptions.type = 'yearly';
							draft.name = 'By Well (Yearly)';
						})
					),
			},
			ghg: {
				id: 'ghg',
				disabled: !ghgRunExists && REQUIRE_GHG_RUN_TOOLTIP,
				onClick: () => handleExport({ type: 'ghg' }),
			},
			aggMonthly: {
				id: 'cashflow-agg-csv-monthly',
				disabled: !(econRunExists && hasReservesGroups) && REQUIRE_FULL_ECON_RUN_TOOLTIP,
				onClick: () => handleExport(find(agg.suggestedTemplates, { cashflowOptions: { type: 'monthly' } })),
			},
			aggYearly: {
				id: 'cashflow-agg-csv-yearly',
				disabled: !(econRunExists && hasReservesGroups) && REQUIRE_FULL_ECON_RUN_TOOLTIP,
				onClick: () => handleExport(find(agg.suggestedTemplates, { cashflowOptions: { type: 'yearly' } })),
			},
		},
	};
}

function useMenuItems(props) {
	const { economicsExportMenuItemsVariation } = useLDFeatureFlags();

	const csv = useCSVMenuItems(props);

	const oldTemplates = [
		{ separator: 'Well Reports' },
		csv.suggestedMenuItems.oneLiner,
		csv.suggestedMenuItems.byWellMonthly,
		csv.suggestedMenuItems.byWellYearly,
		csv.suggestedMenuItems.ghg,
		{ separator: 'Aggregate Reports' },
		csv.suggestedMenuItems.aggMonthly,
		csv.suggestedMenuItems.aggYearly,
	];

	const variations: { [key in typeof economicsExportMenuItemsVariation]: CustomMenuItem[] } = {
		old: [csv.editor.menuItem, ...oldTemplates],
		'suggested-and-defaults': [
			csv.editor.menuItem,
			{ separator: 'ComboCurve CSV Templates' },
			...[
				csv.suggestedMenuItems.oneLiner,
				csv.suggestedMenuItems.byWellMonthly,
				csv.suggestedMenuItems.byWellYearly,
				csv.suggestedMenuItems.aggMonthly,
				csv.suggestedMenuItems.aggYearly,
			].map((m) => ({ ...m, icon: <CCLogo /> })),
			csv.suggestedMenuItems.ghg,
			...(csv.defaultTemplatesMenuItems?.length
				? [
						{ separator: 'User Default CSV Templates' },
						...csv.defaultTemplatesMenuItems.map(defaultTemplateFormatter),
				  ]
				: []),
		],
		'user-defaults': [
			csv.editor.menuItem,
			{ separator: 'Default Templates' },
			...csv.defaultTemplatesMenuItems,
			csv.suggestedMenuItems.ghg,
		],
		'old-and-defaults': [csv.editor.menuItem, ...csv.defaultTemplatesMenuItems, ...oldTemplates],
	};

	const dialogs = csv.editor.dialog;

	return {
		dialogs,
		menuItems: variations[economicsExportMenuItemsVariation],
	};
}

export function CSVExportMenu(props) {
	const { runningEconomics } = props;

	const { menuItems, dialogs } = useMenuItems(props);

	return (
		<>
			{dialogs}
			<Menu label='CSV Export' menuItems={menuItems} disabled={runningEconomics} />
		</>
	);
}
