import { faChevronDown, faFileImport, faInfoCircle } from '@fortawesome/pro-regular-svg-icons';
import _ from 'lodash';
import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state';
import { useCallback } from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';

import { PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/access-policies/Can';
import usePermissions, { buildPermissions } from '@/access-policies/usePermissions';
import { Button, IconButton, Menu, MenuItem } from '@/components/v2';
import { confirmationAlert, failureAlert, genericErrorAlert, useLoadingBar, warningAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { useDialog, useVisibleDialog } from '@/helpers/dialog';
import { deleteApi, downloadFile, getApi, postApi, putApi } from '@/helpers/routing';
import { ADJUST_EXPORT_VISIBLE_SUBDOMAIN } from '@/inpt-shared/constants';
import { MassDeleteButton } from '@/module-list/ModuleList/components';
import ModuleList, { Fields, Filters, useModuleListRef } from '@/module-list/ModuleListV2';
import { FiltersContext } from '@/module-list/filters/shared';
import ImportDialog from '@/module-list/shared/ImportDialog';
import { FilterResult } from '@/module-list/types';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { useCurrentProject } from '@/projects/api';
import { URLS } from '@/urls';

import { CreateTypeCurveDialog } from './index/CreateTypeCurveDialog';
import { ImportFromCSVDialog } from './index/ImportFromCSVDialog';

const IMPORT_TYPE_CURVE_LIMIT = 50;

function useExportParameters({ runFilters = _.noop }) {
	const { project } = useAlfa();
	const { isLoading: exporting, mutateAsync: exportToCsv } = useMutation(
		async ({ adjust, typeCurveIds }: { adjust: boolean; typeCurveIds: string[] }) => {
			const body = {
				typeCurveIds,
				projectId: project?._id,
				adjust,
			};

			const {
				success,
				file_id: fileId,
				error_info: errorInfo,
			} = await postApi('/type-curve/export-fit-parameters', body);

			if (success) {
				downloadFile(fileId);
			} else {
				failureAlert(errorInfo.message);
			}
		}
	);

	useLoadingBar(exporting);

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	const [dialogs, importToCsv] = useVisibleDialog(ImportFromCSVDialog, { runFilters });

	return { loading: exporting, exportToCsv, dialogs, importToCsv };
}

type TypeCurveItem = Pick<Inpt.TypeCurve, '_id' | 'name' | 'createdAt' | 'updatedAt'> & {
	createdBy: Inpt.User;
	project: Inpt.Project;
	forecast: Inpt.Forecast;
	wellsLength: number;
};

export default function TypeCurvesMod() {
	const [importDialog, promptImportDialog] = useDialog(ImportDialog);
	const { subdomain } = useAlfa();
	const { project, updateProject } = useCurrentProject();
	const navigate = useNavigate();

	const onCopy = ({ _id: typeCurveId }) => postApi(`/type-curve/${typeCurveId}/copy`);

	const workMe = (typecurve: TypeCurveItem) =>
		navigate(URLS.project(typecurve.project._id).typeCurve(typecurve._id).view);

	const { ability, canCreate: canCreateTypeCurve } = usePermissions(SUBJECTS.TypeCurves, project?._id);

	const { runFilters, moduleListProps } = useModuleListRef({
		createdBy: '',
		dateMax: '',
		dateMin: '',
		project: project?.name ?? '',
		projectExactMatch: !!project?.name,
		search: '',
		sort: 'updatedAt',
		sortDir: -1,
		tags: [],
		wellsMax: '',
		wellsMin: '',
	});

	const { exportToCsv, importToCsv, dialogs } = useExportParameters({ runFilters });

	const importTypeCurveNotificationCallback = useCallback(
		async (notification) => {
			if (
				notification.status === TaskStatus.COMPLETED &&
				notification.extra?.body?.targetProjectId === project?._id
			) {
				const wellIds = await getApi(`/projects/getProjectWellIds/${project?._id}`);
				const newProject = { ...project, wells: wellIds };
				updateProject(newProject);
				runFilters?.();
			}
		},
		[runFilters, updateProject, project]
	);
	useUserNotificationCallback(NotificationType.IMPORT_TYPE_CURVE, importTypeCurveNotificationCallback);

	const importTypecurve = async (typeCurve) => {
		const data = await promptImportDialog({ feat: 'Type Curve', isTypecurve: true });
		if (!data) {
			return;
		}
		const { id, updateOnly, bringAssociatedForecast: importAssociatedForecast } = data;
		try {
			await postApi('/forecast/import-type-curve', {
				sourceProjectId: typeCurve.project._id,
				targetProjectId: project?._id,
				typeCurveIds: [typeCurve._id],
				wellIdentifier: id,
				importOverlappingWellsOnly: updateOnly,
				importAssociatedForecast,
			});
		} catch (err) {
			genericErrorAlert(err);
		}
	};

	const massImportTypeCurves = async (typeCurveIds) => {
		const total = typeCurveIds.length;
		if (total > IMPORT_TYPE_CURVE_LIMIT) {
			warningAlert(
				`You are trying to import ${total} type curves. Cannot import over ${IMPORT_TYPE_CURVE_LIMIT} type curves`,
				10000
			);
			return;
		}

		const data = await promptImportDialog({ feat: 'Type Curve', isTypecurve: true });

		if (data) {
			const { id, updateOnly, bringAssociatedForecast: importAssociatedForecast } = data;
			try {
				await postApi('/forecast/import-type-curve', {
					targetProjectId: project?._id,
					typeCurveIds,
					wellIdentifier: id,
					importOverlappingWellsOnly: updateOnly,
					importAssociatedForecast,
				});
			} catch (error) {
				genericErrorAlert(error);
			}
		}
	};

	const [createDialog, showCreateDialog] = useDialog(CreateTypeCurveDialog);
	const { canCreate, canUpdate } = buildPermissions(ability, SUBJECTS.TypeCurves, project?._id);
	const canManage = canCreate || canUpdate;

	return (
		<>
			{createDialog}
			{importDialog}
			{dialogs}
			<ModuleList
				{...moduleListProps}
				feat='Type Curve'
				useTags='typeCurve'
				fetch={(body) => getApi('/type-curve', body) as Promise<FilterResult<TypeCurveItem>>}
				onCreate={async () => {
					const tcId = await showCreateDialog();

					if (tcId) {
						navigate(`${tcId}/view`);
					}
				}}
				canCreate={canCreateTypeCurve && !!project}
				requireNameToDelete
				globalActions={
					<>
						<PopupState variant='popover' popupId='demo-popup-menu'>
							{(popupState) => {
								const menuOptions = bindMenu(popupState);
								const { anchorEl } = menuOptions;
								return (
									<FiltersContext.Consumer>
										{({ selection }) => (
											<>
												<Button endIcon={faChevronDown} {...bindTrigger(popupState)}>
													CSV
												</Button>
												<Menu
													style={{
														transform: `translateY(calc(${anchorEl?.clientHeight}px + 0.5rem))`,
													}}
													{...menuOptions}
												>
													<MenuItem
														onClick={() => {
															importToCsv();
															menuOptions.onClose();
														}}
														tooltipTitle='Import Fit Parameters from CSV'
														disabled={!canManage}
														tooltipPlacement='right'
													>
														CSV Import
													</MenuItem>
													<MenuItem
														onClick={() => {
															exportToCsv({
																adjust: false,
																// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
																typeCurveIds: [...selection!.selectedSet],
															});
															menuOptions.onClose();
														}}
														tooltipTitle='Export Fit Parameters to CSV'
														tooltipPlacement='right'
														disabled={
															// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
															(selection!.selectedSet?.size === 0 &&
																'Need to select at least one Type Curve') ||
															(!project?._id && 'Need to select a Project')
														}
													>
														CSV Export
													</MenuItem>
													{ADJUST_EXPORT_VISIBLE_SUBDOMAIN.includes(subdomain) && (
														<MenuItem
															onClick={() => {
																exportToCsv({
																	adjust: true,
																	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
																	typeCurveIds: [...selection!.selectedSet],
																});
																menuOptions.onClose();
															}}
															tooltipTitle='(Adjusted) Export Fit Parameters to CSV'
															tooltipPlacement='right'
															disabled={
																// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
																(selection!.selectedSet?.size === 0 &&
																	'Need to select at least one Type Curve') ||
																(!project?._id && 'Need to select a Project')
															}
														>
															CSV Export (Adjusted)
														</MenuItem>
													)}
												</Menu>
											</>
										)}
									</FiltersContext.Consumer>
								);
							}}
						</PopupState>
						<IconButton
							// @ts-expect-error HACK: check types later
							as='a'
							size='small'
							href='https://bit.ly/3ftwtMO'
							target='_blank'
							tooltipTitle='How to Import/Export Type Curve'
							tooltipPlacement='top'
						>
							{faInfoCircle}
						</IconButton>
					</>
				}
				itemDetails={[
					{
						...Fields.name,
						canRename: (item) =>
							buildPermissions(ability, SUBJECTS.TypeCurves, item?.project?._id).canUpdate,
						onRename: (value, item) =>
							putApi(`/type-curve/${item._id}/updateTypeCurveName`, { name: value }),
					},
					Fields.createdBy,
					Fields.createdAt,
					Fields.updatedAt,
					Fields.wells,
					Fields.project,
					{ key: 'forecast', label: 'Forecast', value: ({ forecast }) => forecast?.name ?? 'N/A' },
					Fields.tags,
				]}
				copyNotification={NotificationType.COPY_TYPE_CURVE}
				onCopy={onCopy}
				canCopy={(item) => buildPermissions(ability, SUBJECTS.TypeCurves, item?.project?._id).canCreate}
				onDelete={(item) => deleteApi(`/type-curve/${item._id}`)}
				canDelete={(item) => buildPermissions(ability, SUBJECTS.TypeCurves, item?.project?._id).canDelete}
				itemActions={(item) => [
					{
						label: 'Import to Current Project',
						onClick: () => importTypecurve(item),
						disabled:
							(!canCreateTypeCurve && PERMISSIONS_TOOLTIP_MESSAGE) || project?._id === item.project?._id,
						icon: faFileImport,
					},
				]}
				filters={
					<>
						<Filters.Title />
						<Filters.NameFilter />
						<Filters.CreatedRangeFilter />
						<Filters.WellsRangeFilter />
						<Filters.ProjectNameFilter />
						<Filters.CreatedByFilter />
						<Filters.TagsFilter />
					</>
				}
				workMe={workMe}
				selectionActions={
					<FiltersContext.Consumer>
						{({ selection }) => (
							<>
								<Button
									tooltipTitle={
										// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
										selection!.selectedSet?.size > IMPORT_TYPE_CURVE_LIMIT
											? `Cannot import over ${IMPORT_TYPE_CURVE_LIMIT} type curves`
											: 'Import to Current Project'
									}
									disabled={
										(!canCreateTypeCurve && PERMISSIONS_TOOLTIP_MESSAGE) ||
										// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
										selection!.selectedSet?.size === 0 ||
										// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
										selection!.selectedSet?.size > IMPORT_TYPE_CURVE_LIMIT
									}
									// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
									onClick={() => massImportTypeCurves([...selection!.selectedSet])}
									startIcon={faFileImport}
								>
									Import to Project
								</Button>
								<MassDeleteButton
									disabled={!selection?.selectedSet.size}
									feat='Type Curve'
									feats='Type Curves'
									length={selection?.selectedSet.size || 0}
									requireName
									onDelete={() =>
										postApi('/type-curve/deleteTypeCurves', {
											// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
											typeCurveIds: [...selection!.selectedSet],
										}).then(({ total, deleted }) => {
											if (total !== deleted) {
												confirmationAlert(`${deleted} out of ${total} type curves deleted`);
											} else {
												confirmationAlert(`${deleted} type curves deleted`);
											}
										})
									}
									refresh={() => runFilters()}
								/>
							</>
						)}
					</FiltersContext.Consumer>
				}
			/>
		</>
	);
}
