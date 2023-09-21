import { CSVExportTemplateBase } from '@/economics/exports/CSVExportDialog/types';
import { PDFExportTemplateBase } from '@/economics/exports/PDFExportDialog/shared/types';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';

import { CustomMenuItem } from '../types';
import { useCSVMenuItems } from './CSVExportMenu';
import { Menu } from './Menu';
import { usePDFMenuItems } from './PDFExportMenu';
import { CCLogo, defaultTemplateFormatter } from './shared';

function useMenuItems(props) {
	const pdf = usePDFMenuItems(props);
	const csv = useCSVMenuItems(props);

	const { economicsExportMenuItemsVariation, isCustomPDFEditorEnabled } = useLDFeatureFlags();
	const customPDFEditorMenuItem = isCustomPDFEditorEnabled ? [pdf.editor.menuItem] : [];

	const oldTemplateMenuItems = [
		{ separator: 'Well Reports' },
		csv.suggestedMenuItems.oneLiner,
		csv.suggestedMenuItems.byWellMonthly,
		csv.suggestedMenuItems.byWellYearly,
		csv.suggestedMenuItems.ghg,
		pdf.suggestedMenuItems.byWell,
		{ separator: 'Aggregate Reports' },
		csv.suggestedMenuItems.aggMonthly,
		csv.suggestedMenuItems.aggYearly,
		pdf.suggestedMenuItems.agg,
	];

	const variations: { [key in typeof economicsExportMenuItemsVariation]: CustomMenuItem[] } = {
		old: [csv.editor.menuItem, ...customPDFEditorMenuItem, ...oldTemplateMenuItems],
		'suggested-and-defaults': [
			csv.editor.menuItem,
			...customPDFEditorMenuItem,
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
			{ separator: 'PDF Exports' },
			pdf.suggestedMenuItems.byWell,
			pdf.suggestedMenuItems.agg,
		],
		'user-defaults': [
			csv.editor.menuItem,
			...customPDFEditorMenuItem,
			{ separator: 'CSV Templates' },
			...csv.defaultTemplatesMenuItems,
			csv.suggestedMenuItems.ghg,
			{ separator: 'PDF Exports' },
			pdf.suggestedMenuItems.byWell,
			pdf.suggestedMenuItems.agg,
		],
		'old-and-defaults': [
			csv.editor.menuItem,
			...customPDFEditorMenuItem,
			...csv.defaultTemplatesMenuItems,
			...oldTemplateMenuItems,
		],
	};

	const dialogs = (
		<>
			{pdf.editor.dialog}
			{csv.editor.dialog}
		</>
	);

	return {
		dialogs,
		menuItems: variations[economicsExportMenuItemsVariation],
	};
}

export function AllExportMenu(props: {
	runId: string;
	handleExport: (template: PDFExportTemplateBase | CSVExportTemplateBase) => void;
	scenarioTableHeaders;
	hasReservesGroups;
	runningEconomics;
	econRunExists: boolean;
}) {
	const { runningEconomics } = props;

	const { menuItems, dialogs } = useMenuItems(props);

	return (
		<>
			{dialogs}
			<Menu label='Export' menuItems={menuItems} disabled={runningEconomics} />
		</>
	);
}
