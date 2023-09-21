import { faFileImport } from '@fortawesome/pro-regular-svg-icons';
import { noop } from 'lodash';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { ACTIONS, PERMISSIONS_TOOLTIP_MESSAGE, ability, subject } from '@/access-policies/Can';
import usePermissions, { SUBJECTS, buildPermissions } from '@/access-policies/usePermissions';
import { Button, alerts } from '@/components/v2';
import { confirmationAlert, customErrorAlert, warningAlert } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { pluralize } from '@/helpers/text';
import { assert } from '@/helpers/utilities';
import { ASSUMPTION_LABELS, AssumptionKey } from '@/inpt-shared/constants';
import { MassDeleteButton } from '@/module-list/ModuleList/components';
import ModuleList, { Fields, Filters, useModuleListRef } from '@/module-list/ModuleListV2';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { useCurrentProject } from '@/projects/api';
import { URLS } from '@/urls';

import { NewEmbeddedLookupTableDialog } from './NewEmbeddedLookupTableDialog';
import { deleteEmbeddedLookupTable, deleteEmbeddedLookupTables, getEmbeddedLookupTables } from './api';
import {
	useCopyEmbeddedLookupTableMutation,
	useCreateEmbeddedLookupTableMutation,
	useImportEmbeddedLookupTableMutation,
	useMassImportEmbeddedLookupTablesMutation,
	useUpdateEmbeddedLookupTableMutation,
} from './mutations';

const MAX_COPYABLE_MODELS = 1000;

export const EmbeddedLookupTablesModuleList = () => {
	const { project } = useCurrentProject();
	const navigate = useNavigate();

	const getRoutes = (projectId, id) => URLS.project(projectId).embeddedLookupTable(id);

	const createEmbeddedLookupTableMutation = useCreateEmbeddedLookupTableMutation({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		onSuccess: (data: any) => {
			confirmationAlert('Embedded Lookup Table Created');
			navigate(getRoutes(data?.project, data?._id).edit);
		},
	});

	const updateEmbeddedLookupTableMutation = useUpdateEmbeddedLookupTableMutation({
		// Rewrite onError to prevent an actual throw Error, but keep the error toast message
		// triggered inside ModulesTable
		onError: noop,
	});
	const copyEmbeddedLookupTableMutation = useCopyEmbeddedLookupTableMutation();
	const importEmbeddedLookupTableMutation = useImportEmbeddedLookupTableMutation();
	const massImportEmbeddedLookupTablesMutation = useMassImportEmbeddedLookupTablesMutation();

	const [newEmbeddedLookupTableDialog, showNewEmbeddedLookupTableDialog] = useDialog(NewEmbeddedLookupTableDialog);

	const handleShowNewEmbeddedLookupTableDialog = async () => {
		if (!project?._id) {
			customErrorAlert('Error', 'Project should be selected');
			return;
		}

		const result = await showNewEmbeddedLookupTableDialog();

		if (!result) {
			return;
		}

		return createEmbeddedLookupTableMutation.mutate({
			...result,
			project: project._id,
			rules: [],
			lines: [],
		});
	};

	const { runFilters, moduleListProps, selection } = useModuleListRef({
		createdBy: '',
		dateMax: '',
		dateMin: '',
		project: project?.name ?? '',
		projectExactMatch: !!project?.name,
		search: '',
		sort: 'createdAt',
		sortDir: -1,
		tags: [],
	});

	const handleDeleteEmbeddedLookupTable = (embeddedLookupTableId) => deleteEmbeddedLookupTable(embeddedLookupTableId);

	const handleDeleteEmbeddedLookupTables = (embeddedLookupTableIds) =>
		deleteEmbeddedLookupTables(embeddedLookupTableIds);

	const { canCreate: canCreateEmbeddedLookupTables } = usePermissions(SUBJECTS.EmbeddedLookupTables, project?._id);

	const handleCopyEmbeddedLookupTable = async (item) => {
		await copyEmbeddedLookupTableMutation.mutateAsync({
			eltId: item._id as Inpt.ObjectId<'embedded-lookup-table'>,
		});
	};

	const handleImport = async (eltId: Inpt.ObjectId<'embedded-lookup-table'>) => {
		assert(project, 'Expected project to be in the context.');

		const confirmed = await alerts.confirm({
			title: 'Import Embedded Lookup Table',
			children: 'Are you sure you want to import this embedded lookup table?',
			confirmText: 'Import',
		});

		if (!confirmed) {
			return;
		}

		await importEmbeddedLookupTableMutation.mutateAsync({
			eltId,
			targetProjectId: project._id,
		});
	};

	const importELTsNotificationCallback = useCallback(
		(notification) => {
			if (
				notification.status === TaskStatus.COMPLETED &&
				notification.extra?.body?.targetProjectId === project?._id
			) {
				runFilters();
			}
		},
		[runFilters, project]
	);
	useUserNotificationCallback(NotificationType.IMPORT_EMBEDDED_LOOKUP_TABLE, importELTsNotificationCallback);

	const handleMassImport = async (ids: Inpt.ObjectId<'embedded-lookup-table'>[]) => {
		assert(project, 'Expected project to be in the context.');

		const modelsCount = ids.length;

		if (modelsCount > MAX_COPYABLE_MODELS) {
			warningAlert(
				`You are trying to import ${modelsCount} embedded lookup tables. Cannot import over ${MAX_COPYABLE_MODELS} embedded lookup tables. Use the filters to lower the number of models imported.`,
				2000
			);

			return;
		}

		const confirmed = await alerts.confirm({
			title: 'Import Embedded Lookup Tables',
			children: 'Are you sure you want to import the selected embedded lookup tables?',
			confirmText: 'Import',
		});

		if (!confirmed) {
			return;
		}

		await massImportEmbeddedLookupTablesMutation.mutateAsync({
			ids,
			targetProjectId: project._id,
		});
	};

	return (
		<>
			{newEmbeddedLookupTableDialog}
			<ModuleList
				{...moduleListProps}
				copyNotification={NotificationType.COPY_EMBEDDED_LOOKUP_TABLE}
				feat='Embedded Lookup Table'
				fetch={getEmbeddedLookupTables}
				useTags='embeddedLookupTable'
				onCreate={handleShowNewEmbeddedLookupTableDialog}
				canCreate={canCreateEmbeddedLookupTables && !!project}
				filters={
					<>
						<Filters.Title />
						<Filters.NameFilter />
						<Filters.AssumptionKeyFilter
							menuItems={[
								{ label: ASSUMPTION_LABELS[AssumptionKey.expenses], value: AssumptionKey.expenses },
								{ label: ASSUMPTION_LABELS[AssumptionKey.capex], value: AssumptionKey.capex },
							]}
						/>
						<Filters.CreatedRangeFilter />
						<Filters.ProjectNameFilter />
						<Filters.CreatedByFilter />
						<Filters.TagsFilter />
					</>
				}
				onCopy={handleCopyEmbeddedLookupTable}
				canCopy={(item) =>
					buildPermissions(ability, SUBJECTS.EmbeddedLookupTables, item?.project?._id).canCreate
				}
				onDelete={(item) => handleDeleteEmbeddedLookupTable(item?._id)}
				canDelete={(item) =>
					buildPermissions(ability, SUBJECTS.EmbeddedLookupTables, item?.project?._id).canDelete
				}
				itemDetails={[
					{
						...Fields.name,
						canRename: (item) =>
							ability.can(
								ACTIONS.Update,
								subject(SUBJECTS.EmbeddedLookupTables, { project: item?.project?._id })
							),
						onRename: async (value, item) => {
							await updateEmbeddedLookupTableMutation.mutateAsync({
								eltId: item._id as Inpt.ObjectId<'embedded-lookup-table'>,
								data: {
									name: value,
								},
							});
						},
					},
					Fields.createdBy,
					Fields.assumptionType,
					Fields.createdAt,
					Fields.project,
					Fields.tags,
				]}
				itemActions={(item) => [
					{
						label: 'Import to Current Project',
						icon: faFileImport,
						onClick: async () => await handleImport(item._id),
						disabled:
							(!canCreateEmbeddedLookupTables && PERMISSIONS_TOOLTIP_MESSAGE) ||
							project?._id === item?.project?._id ||
							(!project && 'Select a project first'),
					},
				]}
				workMe={(item) => {
					navigate(getRoutes(item?.project?._id, item._id).edit);
				}}
				selectionActions={
					<>
						<Button
							tooltipTitle={
								selection?.selectedSet?.size > MAX_COPYABLE_MODELS
									? `Cannot import over ${MAX_COPYABLE_MODELS} lookup tables`
									: 'Import to Current Project'
							}
							disabled={
								selection?.selectedSet?.size === 0 ||
								selection?.selectedSet?.size > MAX_COPYABLE_MODELS ||
								(!canCreateEmbeddedLookupTables && PERMISSIONS_TOOLTIP_MESSAGE) ||
								(!project && 'Select a project first')
							}
							onClick={() =>
								handleMassImport([
									...(selection?.selectedSet ?? []),
								] as Inpt.ObjectId<'embedded-lookup-table'>[])
							}
							startIcon={faFileImport}
						>
							Import to Project
						</Button>
						<MassDeleteButton
							disabled={!selection?.selectedSet?.size}
							feat='Lookup Table'
							feats='Lookup Tables'
							length={selection?.selectedSet?.size}
							requireName
							onDelete={async () => {
								const ids = [...(selection?.selectedSet || [])];
								const deleted = await handleDeleteEmbeddedLookupTables(ids);

								if (ids.length !== deleted) {
									confirmationAlert(`${deleted} out of ${ids.length} Lookup Tables deleted`);
								} else {
									confirmationAlert(
										`${pluralize(ids.length, 'Lookup Table', 'Lookup Tables')} deleted`
									);
								}
							}}
							refresh={runFilters}
						/>
					</>
				}
			/>
		</>
	);
};

export default EmbeddedLookupTablesModuleList;
