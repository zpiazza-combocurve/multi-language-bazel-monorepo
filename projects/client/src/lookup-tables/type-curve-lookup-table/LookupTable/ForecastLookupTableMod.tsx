import usePermissions from '@/access-policies/usePermissions';
import { genericErrorAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { useDialog } from '@/helpers/dialog';
import { SUBJECTS } from '@/inpt-shared/access-policies/shared';
import SharedLookupTable from '@/lookup-tables/components/standard-lookup-table/StandardLookupTableMod';
import { CreateForecastLookupTableDialog } from '@/lookup-tables/type-curve-lookup-table/LookupTable/CreateForecastLookupTableDialog';
import ForecastLookupTableImportDialog from '@/lookup-tables/type-curve-lookup-table/LookupTable/ForecastLookupTableImportDialog';
import {
	copyLookupTable,
	deleteLookupTable,
	deleteLookupTables,
	getLookupTablesItems,
	importLookupTable,
	massImportLookupTables,
} from '@/lookup-tables/type-curve-lookup-table/api';
import { NotificationType } from '@/notifications/notification';
import { selectByProject } from '@/projects/selectByProject';
import { URLS } from '@/urls';

export default function LookupTableMod() {
	const { project, user } = useAlfa();

	const { canCreate: canCreateForecastLookupTable } = usePermissions(SUBJECTS.ForecastLookupTables, project?._id);

	const [importDialog, promptImportDialog] = useDialog(ForecastLookupTableImportDialog);

	const handleImport = async ({ lookupTableId }) => {
		let lookupId = lookupTableId;

		if (!lookupId) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
			// @ts-expect-error
			lookupId = await selectByProject('forecast-lookup-table-model', {
				userId: user?._id,
				projectId: project?._id,
			});
		}

		if (!lookupId) {
			return;
		}

		const data = await promptImportDialog({});

		if (data) {
			const { id: wellIdentifier, importOverlapOnly, importForecasts, importTypeCurves } = data;

			try {
				await importLookupTable(lookupId, {
					project: project?._id,
					wellIdentifier,
					importOverlappingWellsOnly: importOverlapOnly,
					importTypeCurves,
					importAssociatedForecast: importForecasts,
				});
			} catch (err) {
				genericErrorAlert(err, 'Failed to start import');
			}
		}
	};

	const handleMassImport = async (body) => {
		const data = await promptImportDialog({});

		if (data) {
			const { id: wellIdentifier, importOverlapOnly, importForecasts, importTypeCurves } = data;

			try {
				await massImportLookupTables({
					...body,
					project: project?._id,
					wellIdentifier,
					importOverlappingWellsOnly: importOverlapOnly,
					importTypeCurves,
					importAssociatedForecast: importForecasts,
				});
			} catch (err) {
				genericErrorAlert(err, 'Failed to start import');
			}
		}
	};

	return (
		<>
			{importDialog}
			<SharedLookupTable
				featureName='Type Curve Lookup Tables'
				deleteLookupTable={deleteLookupTable}
				massDeleteLookupTables={deleteLookupTables}
				getLookupTablesItems={getLookupTablesItems}
				copyLookupTable={copyLookupTable}
				importLookupTable={handleImport}
				massImportLookupTables={handleMassImport}
				copyNotification={NotificationType.COPY_FORECAST_LOOKUP_TABLE}
				importNotification={NotificationType.IMPORT_FORECAST_LOOKUP_TABLE}
				getRoutes={(projectId, id) => URLS.project(projectId).forecastLookupTable(id)}
				createDialog={CreateForecastLookupTableDialog}
				canCreateLookupTable={canCreateForecastLookupTable}
				canImportLookupTable={canCreateForecastLookupTable}
			/>
		</>
	);
}
