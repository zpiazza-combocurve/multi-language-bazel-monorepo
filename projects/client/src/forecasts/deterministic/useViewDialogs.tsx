import DownloadParametersDialog from '@/forecasts/view/DownloadParametersDialog';
import ExportToAriesDialog from '@/forecasts/view/ExportToAriesDialog';
import { ExportChartsDialog, ExportToCSVDialog } from '@/forecasts/view/ExportToCSVDialog';
import { MassAdjustTerminalDeclineDialog } from '@/forecasts/view/MassAdjustTerminalDeclineDialog';
import { MassModifiyWellLifeDialog } from '@/forecasts/view/MassModifyWellLifeDialog';
import { MassShiftSegmentsDialog } from '@/forecasts/view/MassShiftSegmentsDialog';
import ApplyLastSegmentForm from '@/forecasts/view/apply-last-segment-form/ApplyLastSegmentForm';
import ApplyTCForm from '@/forecasts/view/apply-tc-form/ApplyTCForm';
import ImportForecastDialogV2 from '@/forecasts/view/import-forecast/ImportForecastDialogV2';
import ReplaceFitParametersDialog from '@/forecasts/view/replace-fit-parameters/ReplaceFitParametersDialog';
import ResetWellForecastDialog from '@/forecasts/view/reset-well-forecasts/ResetWellForecastDialog';
import { useDialog } from '@/helpers/dialog';

function useViewDialogs({
	forecast,
	singleWellForecastId,
	wells,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	forecast: Record<string, any>;
	singleWellForecastId?: string | null;
	wells: Array<string>;
}) {
	const { _id: forecastId, type: forecastType } = forecast;

	const [addLastSegmentDialog, openAddLastSegmentDialog] = useDialog(ApplyLastSegmentForm, {
		forecastId,
		forecastType,
		parentResolution: 'monthly',
		wells,
	});

	// @todo: convert ApplyTCForm to functional component
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	const [applyTcDialog, openApplyTcDialog] = useDialog(ApplyTCForm, {
		forecastId,
		forecastType,
		parentResolution: 'monthly',
		wells,
	});

	const [exportChartsDialog, exportCharts] = useDialog(ExportChartsDialog, { forecast });

	const [exportToCSVDialog, exportToCSV] = useDialog(ExportToCSVDialog, { forecast, wells });

	const [exportToAriesDialog, exportToAries] = useDialog(ExportToAriesDialog, { forecast, wells });

	const [forecastParametersDialog, openForecastParametersDialog] = useDialog(DownloadParametersDialog, {
		forecast,
		phdWinExport: false,
		wells,
	});

	const [importForecastDialog, openImportForecastDialog] = useDialog(ImportForecastDialogV2, { forecast });

	const [massAdjustTerminalDeclineDialog, massAdjustTerminalDecline] = useDialog(MassAdjustTerminalDeclineDialog, {
		wells,
		forecastId,
	});

	const [massBackcastSegmentsDialog, openMassBackcastSegmentsDialog] = useDialog(MassShiftSegmentsDialog, {
		adjustmentType: 'backcast',
		wells,
	});

	const [massModifyWellLifeDialog, massModifyWellLife] = useDialog(MassModifiyWellLifeDialog, {
		forecastId,
		wells,
	});

	const [massShiftSegmentsDialog, openMassShiftSegmentsDialog] = useDialog(MassShiftSegmentsDialog, {
		adjustmentType: 'shift',
		wells,
	});

	const [phdParametersDialog, openPhdParametersDialog] = useDialog(DownloadParametersDialog, {
		forecast,
		phdWinExport: true,
		wells,
	});

	const [mosaicParametersDialog, openMosaicParametersDialog] = useDialog(DownloadParametersDialog, {
		forecast,
		phdwinExport: false,
		wells,
		mosaicExport: true,
	});

	const [replaceFitParametersDialog, openReplaceFitParametersDialog] = useDialog(ReplaceFitParametersDialog, {
		forecastId: forecast._id,
		wellIds: wells,
	});

	const [resetWellForecastDialog, openResetWellForecastDialog] = useDialog(ResetWellForecastDialog, {
		forecastId: forecast._id,
		wellIds: singleWellForecastId ? [singleWellForecastId] : wells,
	});

	return {
		addLastSegmentDialog,
		applyTcDialog,
		exportCharts,
		exportChartsDialog,
		exportToAries,
		exportToAriesDialog,
		exportToCSV,
		exportToCSVDialog,
		forecastParametersDialog,
		importForecastDialog,
		massAdjustTerminalDecline,
		massAdjustTerminalDeclineDialog,
		massBackcastSegmentsDialog,
		massModifyWellLife,
		massModifyWellLifeDialog,
		massShiftSegmentsDialog,
		mosaicParametersDialog,
		openAddLastSegmentDialog,
		openApplyTcDialog,
		openForecastParametersDialog,
		openImportForecastDialog,
		openMassBackcastSegmentsDialog,
		openMassShiftSegmentsDialog,
		openMosaicParametersDialog,
		openPhdParametersDialog,
		openReplaceFitParametersDialog,
		openResetWellForecastDialog,
		phdParametersDialog,
		replaceFitParametersDialog,
		resetWellForecastDialog,
	};
}

export default useViewDialogs;
