import { faDownload } from '@fortawesome/pro-regular-svg-icons';
import { omit, pick } from 'lodash-es';
import { useCallback, useState } from 'react';

import { useCallbackRef } from '@/components/hooks';
import { ButtonItem, MenuButton } from '@/components/v2';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { confirmationAlert, genericErrorAlert, infoAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { useProgressBar } from '@/helpers/progress';
import { postApi } from '@/helpers/routing';
import { NotificationType } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { generateXlsx } from '@/scenarios/Scenario/ScenarioPage/exports/scenario-table-xlsx';
import { useCurrentScenario } from '@/scenarios/api';
import { ASSUMPTION_KEYS, ASSUMPTION_NAMES_BY_KEY, NON_SCENARIO_ASSUMPTION_KEYS } from '@/scenarios/shared';

import {
	CCImportDialog,
	ExportProbabilisticDialog,
	ExportToAriesDialog,
	ExportToCsvDialog,
	ExportToPhdwinDialog,
	useCCExport,
} from './exports/index';

const INITIAL_PROGRESS = 1;

export function useExportDialogProps() {
	const [visible, setVisible] = useState(false);
	const close = () => setVisible(false);
	const open = () => setVisible(true);
	return { close, open, visible };
}

export function useXLSXDownload({ headers }) {
	const { wellHeaders } = useAlfa();
	const { scenario } = useCurrentScenario();
	const [progress, updateProgress] = useState<null | number>(null);
	useProgressBar(progress);
	const download = async () => {
		infoAlert('Export started. Please, do not close your browser.');
		updateProgress(INITIAL_PROGRESS);

		generateXlsx({
			assumptionKeysList: ASSUMPTION_KEYS.filter((e) => !NON_SCENARIO_ASSUMPTION_KEYS.includes(e)),
			scenario, // TODO receive from props
			wellHeaders,
			tableHeaders: headers,
			assumptionNamesByKey: omit(ASSUMPTION_NAMES_BY_KEY, NON_SCENARIO_ASSUMPTION_KEYS),
			updateProgress,
		});
	};
	return { download };
}

export function useTableWithLookupDownload({ scenarioId, headers, assignments }) {
	const {
		wellHeaders,
		user: { _id: userId },
	} = useAlfa();
	const download = async () => {
		const tableWellHeaders = {
			...pick(wellHeaders, headers),
			well_name: 'Well',
		};
		const finalAssumptionKeys = omit(ASSUMPTION_NAMES_BY_KEY, NON_SCENARIO_ASSUMPTION_KEYS);
		const body = {
			user: userId,
			selectedAssignmentIds: assignments,
			assumptionKeys: finalAssumptionKeys,
			wellHeaders: tableWellHeaders,
		};

		try {
			await postApi(`/scenarios/${scenarioId}/scenarioTableWithLookup`, body);
		} catch (err) {
			genericErrorAlert(err);
		}
	};
	return { download };
}

export function useExportOptions({
	scenarioId,
	scenarioName,
	selectedHeaders,
	selectedAssignmentIds,
	sortedFilteredAssignmentIds,
}) {
	const { Pusher } = useAlfa();
	const sharedExportDialogProps = {
		Pusher,
		scenarioId,
		scenarioName,
		headers: selectedHeaders,
		selectedAssignmentIds,
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	};

	const sharedDownloadProps = {
		scenarioId,
		headers: selectedHeaders,
		assignments: sortedFilteredAssignmentIds,
	};

	const { open: openCsvExportDialog, ...csvExportProps } = useExportDialogProps();
	const { open: openAriesExportDialog, ...ariesExportProps } = useExportDialogProps();
	const { open: openPhdwinExportDialog, ...phdwinExportProps } = useExportDialogProps();
	const { open: openExportProbabilisticDialog, ...exportProbabilisticProps } = useExportDialogProps();
	const { download: downloadXlsx } = useXLSXDownload(sharedDownloadProps);
	const { download: exportWithLookup } = useTableWithLookupDownload(sharedDownloadProps);

	const { isProbabilisticCapexEnabled } = useLDFeatureFlags();

	const menuItems = [
		{
			primaryText: 'Mass Export Assumptions',
			onClick: openCsvExportDialog,
			disabled: !selectedAssignmentIds.length,
		},
		{
			primaryText: 'Export Model Names To Excel',
			onClick: downloadXlsx,
		},
		{
			primaryText: 'Export Rendered Lookup Tables to CSV',
			onClick: exportWithLookup,
		},
		{
			primaryText: 'Export Scenario To ARIES',
			onClick: openAriesExportDialog,
		},
		{
			primaryText: 'Export Assumptions To PHDWIN',
			onClick: openPhdwinExportDialog,
		},
	];

	if (isProbabilisticCapexEnabled) {
		menuItems.push({
			primaryText: 'Generate Probabilistic Inputs',
			onClick: openExportProbabilisticDialog,
		});
	}

	const exportMenu = (
		<MenuButton label='EXPORTS' startIcon={faDownload}>
			{menuItems.map(({ primaryText, onClick, disabled }) => (
				<ButtonItem label={primaryText} onClick={onClick} disabled={disabled} key={primaryText} />
			))}
		</MenuButton>
	);

	const exportToCsvDialog = (
		<ExportToCsvDialog {...sharedExportDialogProps} tableHeaders={selectedHeaders} {...csvExportProps} />
	);
	const exportToAriesDialog = <ExportToAriesDialog {...sharedExportDialogProps} {...ariesExportProps} />;
	const exportToPhdwinDialog = <ExportToPhdwinDialog {...sharedExportDialogProps} {...phdwinExportProps} />;
	const exportProbabilisticDialog = (
		<ExportProbabilisticDialog {...sharedExportDialogProps} {...exportProbabilisticProps} />
	);

	return { exportMenu, exportToCsvDialog, exportToAriesDialog, exportToPhdwinDialog, exportProbabilisticDialog };
}

export function useColumnExports({ selectedAssignmentIds, scenarioId, scenarioName, selectedHeaders, refetch }) {
	const { scenario, update: updateScenario } = useCurrentScenario();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const [ccImportDialog, setCCImportDialog] = useState<any>({ visible: false });
	const [exportDialog, promptExportDialog] = useCCExport();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const [importCSVNotificationCallback, setImportCSVNotificationCallback] = useState<any>(null);

	useUserNotificationCallback(NotificationType.CC_CC_IMPORT, importCSVNotificationCallback);

	const exportCSV = useCallbackRef(async ({ assumptionKey }) => {
		const assumptionName = ASSUMPTION_NAMES_BY_KEY[assumptionKey];
		promptExportDialog({
			scenarioId,
			scenarioName,
			selectedAssignmentIds,
			tableHeaders: selectedHeaders,
			assumptionKey,
			assumptionName,
		});
	});
	const importCSV = useCallback(async ({ assumptionKey }) => {
		const assumptionName = ASSUMPTION_NAMES_BY_KEY[assumptionKey];
		setCCImportDialog({ visible: true, assumptionKey, assumptionName });
	}, []);

	const handleChangeQualifier = useCallback(
		async (column, key) => {
			const newScenario = await postApi(`/scenarios/${scenarioId}/activateQualifier`, { column, key });
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			updateScenario({ ...scenario, columns: newScenario.columns } as any);
			confirmationAlert(`Qualifier applied successfully.`);
			refetch();
		},
		[refetch, scenario, scenarioId, updateScenario]
	);
	const importDialog = (
		<CCImportDialog
			{...{
				ccImportDialog,
				scenarioId,
				hideDialog: () => setCCImportDialog({ visible: false }),
				buildCurrent: refetch,
				handleChangeQualifier,
				refetch,
				setCallback: setImportCSVNotificationCallback,
			}}
		/>
	);
	const dialogs = (
		<>
			{exportDialog}
			{importDialog}
		</>
	);
	return { importCSV, exportCSV, dialogs };
}
