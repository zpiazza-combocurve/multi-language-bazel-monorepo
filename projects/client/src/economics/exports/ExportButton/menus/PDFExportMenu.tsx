import usePDFExportDialog from '@/economics/exports/PDFExportDialog';
import {
	isSuggestedTemplate,
	useCurrentProjectDefaultTemplate,
	useTemplates,
} from '@/economics/exports/PDFExportDialog/shared/helpers';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { useCurrentProjectId } from '@/projects/routes';

import { CustomMenuItem } from '../types';
import { Menu } from './Menu';
import {
	CCLogo,
	REQUIRE_ECON_RUN_TOOLTIP,
	REQUIRE_FULL_ECON_RUN_TOOLTIP,
	defaultTemplateFormatter,
	findDefault,
	typeToLabel,
} from './shared';

function usePDFTemplatesForType(type: 'cashflow-pdf' | 'cashflow-agg-pdf') {
	const currentProjectId = useCurrentProjectId();
	const { templates } = useTemplates(currentProjectId, type);
	const { defaultConfiguration } = useCurrentProjectDefaultTemplate(type);
	const suggestedTemplates = templates.filter((template) => isSuggestedTemplate(template) && template.type === type);
	const defaultTemplate = findDefault(defaultConfiguration, templates) ?? suggestedTemplates[0];
	return { defaultTemplate, suggestedTemplates };
}

function getPDFExportEditorMenuItem(
	econRunExists,
	isCustomPDFEditorNewTagEnabled,
	showCustomPDFReportDialog,
	handleExport
) {
	return {
		id: 'econ-pdf',
		label: 'Custom PDF Editor',
		disabled: !econRunExists && REQUIRE_ECON_RUN_TOOLTIP,
		isNew: isCustomPDFEditorNewTagEnabled,
		onClick: async () => {
			const reportResults = await showCustomPDFReportDialog({});
			if (reportResults) handleExport(reportResults);
		},
	};
}

export function usePDFMenuItems(props) {
	const { econRunExists, handleExport, hasOneLiner, hasReservesGroups } = props;

	const [customPDFReportDialog, showCustomPDFReportDialog] = usePDFExportDialog({});

	const PDFExportEditorMenuItem = getPDFExportEditorMenuItem(
		econRunExists,
		true,
		showCustomPDFReportDialog,
		handleExport
	);

	const [byWell, agg] = [usePDFTemplatesForType('cashflow-pdf'), usePDFTemplatesForType('cashflow-agg-pdf')];

	const defaultTemplatesMenuItems = [byWell, agg]
		.filter(({ defaultTemplate }) => defaultTemplate != null)
		.map(({ defaultTemplate: template }) => ({
			id: template._id ?? `${template.type}-${template.name}`,
			label: template.name,
			annotation: typeToLabel(template.type),
			onClick: () => handleExport(template),
		}));

	return {
		editor: {
			dialog: customPDFReportDialog,
			menuItem: PDFExportEditorMenuItem,
		},
		defaultTemplatesMenuItems,
		suggestedMenuItems: {
			byWell: {
				id: 'cashflow-pdf',
				disabled: !econRunExists && REQUIRE_ECON_RUN_TOOLTIP,
				onClick: () => handleExport({ type: 'cashflow-pdf' }),
			},
			agg: {
				id: 'cashflow-agg-pdf',
				disabled: !(hasOneLiner && hasReservesGroups) && REQUIRE_FULL_ECON_RUN_TOOLTIP,
				onClick: () => handleExport({ type: 'cashflow-agg-pdf', cashflowOptions: undefined }),
			},
		},
	};
}

export function useMenuItems(props) {
	const { economicsExportMenuItemsVariation } = useLDFeatureFlags();

	const pdf = usePDFMenuItems(props);

	const oldTemplates = [
		{ separator: 'Suggested Reports' },
		pdf.suggestedMenuItems.byWell,
		pdf.suggestedMenuItems.agg,
	];

	const variations: { [key in typeof economicsExportMenuItemsVariation]: CustomMenuItem[] } = {
		old: [pdf.editor.menuItem, ...oldTemplates],
		'suggested-and-defaults': [
			pdf.editor.menuItem,
			{ separator: 'ComboCurve CSV Templates' },
			...[pdf.suggestedMenuItems.byWell, pdf.suggestedMenuItems.agg].map((m) => ({ ...m, icon: <CCLogo /> })),
			...(pdf.defaultTemplatesMenuItems?.length
				? [
						{ separator: 'User Default CSV Templates' },
						...pdf.defaultTemplatesMenuItems.map(defaultTemplateFormatter),
				  ]
				: []),
		],

		'user-defaults': [pdf.editor.menuItem, { separator: 'Default Templates' }, ...pdf.defaultTemplatesMenuItems],
		'old-and-defaults': [pdf.editor.menuItem, ...pdf.defaultTemplatesMenuItems, ...oldTemplates],
	};

	const dialogs = pdf.editor.dialog;

	return {
		dialogs,
		menuItems: variations[economicsExportMenuItemsVariation],
	};
}

export function PDFExportMenu(props) {
	const { runningEconomics } = props;

	const { menuItems, dialogs } = useMenuItems(props);

	return (
		<>
			{dialogs}
			<Menu label='PDF Export' menuItems={menuItems} disabled={runningEconomics} />
		</>
	);
}
