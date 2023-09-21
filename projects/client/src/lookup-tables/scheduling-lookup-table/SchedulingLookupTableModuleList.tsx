import { SUBJECTS } from '@/access-policies/Can';
import usePermissions from '@/access-policies/usePermissions';
import { alerts } from '@/components/v2';
import { genericErrorAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import SharedLookupTable from '@/lookup-tables/components/standard-lookup-table/StandardLookupTableMod';
import { CreateSchedulingLookupTableDialog } from '@/lookup-tables/scheduling-lookup-table/CreateSchedulingLookupTableDialog';
import {
	copyLookupTable,
	deleteLookupTable,
	deleteLookupTables,
	getSchedulingLookupTables,
	importLookupTable,
	massImportLookupTables,
} from '@/lookup-tables/scheduling-lookup-table/api';
import { NotificationType } from '@/notifications/notification';
import { selectByProject } from '@/projects/selectByProject';
import { URLS } from '@/urls';

export default function SchedulingLookupTableModuleList() {
	const { project, user } = useAlfa();

	const { canCreate: canCreateSchedulingLookupTables } = usePermissions(SUBJECTS.ScheduleLookupTables, project?._id);

	const handleImport = async ({ lookupTableId }) => {
		let id = lookupTableId;

		if (!id) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
			// @ts-expect-error
			id = await selectByProject('lookup-table-model', {
				userId: user?._id,
				projectId: project?._id,
			});
		}

		if (!id) {
			return;
		}

		const confirmed = await alerts.confirm({
			title: 'Import Lookup Table',
			children: 'Are you sure you want to import this lookup table? Project Custom Headers will be ignored.',
			confirmText: 'Import',
		});

		if (!confirmed) {
			return;
		}

		try {
			await importLookupTable(id, {
				project: project?._id,
			});
		} catch (err) {
			genericErrorAlert(err, 'Failed to start import');
		}
	};

	const handleMassImport = async (body) => {
		const confirmed = await alerts.confirm({
			title: 'Import Lookup Tables',
			children: 'Are you sure you want to import the selected lookup tables?',
			confirmText: 'Import',
		});

		if (!confirmed) {
			return;
		}

		await massImportLookupTables(body);
	};

	return (
		<SharedLookupTable
			featureName='Scheduling Lookup Tables'
			deleteLookupTable={deleteLookupTable}
			massDeleteLookupTables={deleteLookupTables}
			getLookupTablesItems={getSchedulingLookupTables}
			copyLookupTable={copyLookupTable}
			importLookupTable={handleImport}
			massImportLookupTables={handleMassImport}
			copyNotification={NotificationType.COPY_SCHEDULING_LOOKUP_TABLE}
			importNotification={NotificationType.IMPORT_SCHEDULING_LOOKUP_TABLE}
			getRoutes={(projectId, id) => URLS.project(projectId).schedulingLookupTable(id)}
			createDialog={CreateSchedulingLookupTableDialog}
			canCreateLookupTable={canCreateSchedulingLookupTables}
			canImportLookupTable={canCreateSchedulingLookupTables}
		/>
	);
}
