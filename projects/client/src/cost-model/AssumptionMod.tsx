import { faChevronDown, faFileImport } from '@fortawesome/pro-regular-svg-icons';
import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state';
import { useCallback, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/access-policies/Can';
import usePermissions, { buildPermissions } from '@/access-policies/usePermissions';
import { useCallbackRef } from '@/components/hooks';
import { Button, Menu, MenuItem, alerts } from '@/components/v2';
import { confirmationAlert, customErrorAlert, genericErrorAlert, warningAlert } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { postApi } from '@/helpers/routing';
import { ASSUMPTION_LABELS, AssumptionKey } from '@/inpt-shared/constants';
import { MassDeleteButton } from '@/module-list/ModuleList/components';
import ModuleList, { Fields, Filters, useModuleListRef } from '@/module-list/ModuleListV2';
import { FiltersContext } from '@/module-list/filters/shared';
import { FilterResult, Item } from '@/module-list/types';
import { useCurrentProject } from '@/projects/api';
import { URLS } from '@/urls';

import EconModelChooser from './AssumptionMod/EconModelChooser';
import { ExportToCsvDialog } from './AssumptionMod/ExportToCsvDialog';
import { ImportFromCSVDialog } from './AssumptionMod/ImportFromCSVDialog';
import GridItemDialog from './models/GridItemDialog';

const MAX_COPYABLE_MODELS = 1000;
const importNoteSingle = (name) => `This will import "${name}" to your current project`;
const IMPORT_NOTE = 'This will import all selected models to your current project';
const IMPORT_NOTE_2 = `If a model with the same name already exists in that category you can replace it with the imported model or create a duplicate with a new name`;

function EconModelChooserWrapper() {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const { filters, setFilters } = useContext(FiltersContext)!;

	return (
		<EconModelChooser value={filters?.assKeys || []} onChange={(newValues) => setFilters({ assKeys: newValues })} />
	);
}

const confirmImport = ({
	projectName,
	totalItems = 1,
	importMany = false,
	model,
}: {
	totalItems?: number;
	importMany?: boolean;
	model?: { name: string };
	projectName: string;
}): Promise<null | 'replace' | 'duplicate'> => {
	return alerts.prompt({
		title: 'Econ Model Import',
		children: (
			<ul>
				{/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later */}
				<li>{importMany ? IMPORT_NOTE : importNoteSingle(model!.name)}</li>
				<li>{IMPORT_NOTE_2}</li>
				{importMany && <li>Number of models: {totalItems}</li>}
				<li>Current project: {projectName}</li>
			</ul>
		),
		actions: [
			{ children: 'Cancel', value: null },
			{ children: 'Import (replace)', value: 'replace' as const, color: 'primary' },
			{ children: 'Import (duplicate)', value: 'duplicate' as const, color: 'primary' },
		],
	});
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
function AssumptionsDialog({ onHide, visible, ...rest }: any) {
	return <GridItemDialog visible={visible} hideDialog={onHide} {...rest} />;
}

const ALL_SIDE_BAR_KEYS = Object.keys(ASSUMPTION_LABELS);

type AssumptionItem = Assign<
	Assign<Item, Inpt.Assumption>,
	{ createdBy: Inpt.User; createdAt: Inpt.StringDate; project: Inpt.Project }
>;

export default function EconModelIndex() {
	const navigate = useNavigate();

	const { project } = useCurrentProject();
	const [assumptionsDialog, showAssumptionsDialog] = useDialog(AssumptionsDialog);
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	const [exportDialog, showExportDialog] = useDialog(ExportToCsvDialog);

	const createNew = async () => {
		await showAssumptionsDialog({ data: { key: AssumptionKey.pricing } });
	};

	const startImport = (url, body) => {
		postApi(url, body).catch((error) => {
			genericErrorAlert(error);
		});
	};

	const importSelectedModels = async (modelIds) => {
		if (!project) {
			// TODO show warning or something, but this check should appear before calling this function
			return;
		}

		const modelsCount = modelIds.length;

		if (modelsCount > MAX_COPYABLE_MODELS) {
			warningAlert(
				`You are trying to import ${modelsCount} models. Cannot import over ${MAX_COPYABLE_MODELS} models. Use the filters to lower the number of models imported.`,
				10000
			);
			return;
		}

		const confirmed = await confirmImport({
			projectName: project?.name,
			totalItems: modelsCount,
			importMany: true,
		});

		if (!confirmed) {
			return;
		}

		const body = {
			projectId: project._id,
			modelIds,
			replace: confirmed === 'replace',
		};

		startImport('/cost-model/importModels', body);
	};

	const { runFilters, selection, moduleListProps } = useModuleListRef({
		createdBy: '',
		assKeys: ALL_SIDE_BAR_KEYS,
		dateMax: '',
		dateMin: '',
		search: '',
		selectedProject: project,
		sort: 'createdAt',
		sortDir: -1,
		sortLabel: 'Created Date',
		tags: [],
	});

	const workMe = async (model: AssumptionItem) => {
		if (model.project._id !== project?._id) {
			navigate(URLS.project(model.project._id).assumption(model.assumptionKey).model(model._id));
		} else {
			await showAssumptionsDialog({
				data: {
					key: model.assumptionKey,
					selectedModels: { [model.assumptionKey]: model._id },
				},
			});
			runFilters();
		}
	};

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	const [importDialog, showImportDialog] = useDialog(ImportFromCSVDialog, { runFilters });

	const importModels = useCallbackRef(async (model) => {
		if (!model || !project) {
			return;
		}

		const confirmed = await confirmImport({ projectName: project.name, model });

		if (!confirmed) {
			return;
		}

		if (project._id === model.project._id) {
			customErrorAlert('Import Error', `Cannot import into the same project`);
			return;
		}

		const body = {
			projectId: project._id,
			modelIds: [model._id],
			replace: confirmed === 'replace',
		};

		startImport('/cost-model/importModels', body);
	});

	// Current project
	const { ability, canCreate: canCreateAssumption } = usePermissions(SUBJECTS.Assumptions, project?._id);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const assumptionId = params.get('m');
		const assumptionKey = params.get('a');

		if (!assumptionId || !assumptionKey) {
			return;
		}

		showAssumptionsDialog({
			data: {
				key: assumptionKey,
				selectedModels: { [assumptionKey]: assumptionId },
			},
		});
	}, [showAssumptionsDialog]);

	return (
		<>
			<ModuleList
				{...moduleListProps}
				feat='Model'
				useTags='assumption'
				fetch={({ selectedProject, tags, ...body }) =>
					postApi('/cost-model/getModels', {
						...body,
						project: selectedProject?._id,
						tags: tags?.length ? tags : null,
					}) as Promise<FilterResult<AssumptionItem>>
				}
				fetchIds={({ selectedProject, tags, ...body }) =>
					postApi('/cost-model/getModelIds', {
						...body,
						project: selectedProject?._id,
						tags: tags?.length ? tags : null,
					}) as Promise<string[]>
				}
				onCreate={createNew}
				canCreate={canCreateAssumption && !!project?._id}
				globalActions={
					<PopupState variant='popover' popupId='demo-popup-menu'>
						{(popupState) => {
							const menuOptions = bindMenu(popupState);
							const { anchorEl } = menuOptions;
							return (
								<>
									<Button
										endIcon={faChevronDown}
										disabled={!project && 'Select a Project first'}
										{...bindTrigger(popupState)}
									>
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
												showImportDialog();
												menuOptions.onClose();
											}}
											disabled={!canCreateAssumption}
											tooltipTitle='Import Econ Models from CSV'
											tooltipPlacement='right'
										>
											CSV Import
										</MenuItem>
										<MenuItem
											onClick={() => {
												showExportDialog();
												menuOptions.onClose();
											}}
											tooltipTitle='Export Econ Models to CSV'
											tooltipPlacement='right'
										>
											CSV Export
										</MenuItem>
									</Menu>
								</>
							);
						}}
					</PopupState>
				}
				filters={
					<>
						<Filters.Title />
						<EconModelChooserWrapper />
						<Filters.NameFilter />
						<Filters.CreatedRangeFilter />
						<Filters.CreatedByFilter />
						<Filters.ProjectIdFilter />
						<Filters.TagsFilter />
					</>
				}
				itemDetails={[
					{
						...Fields.name,
						canRename: (item) =>
							buildPermissions(ability, SUBJECTS.Assumptions, item?.project?._id).canUpdate,
						onRename: (value, item) =>
							postApi(`/cost-model/${item._id}/changeModelName`, {
								_id: item._id,
								name: value,
								project: item?.project?._id,
							}),
					},
					{ ...Fields.createdBy, sort: false },
					Fields.createdAt,
					{
						key: 'assumptionName',
						label: 'Econ Models',
						sort: true,
						value: ({ assumptionName }) => assumptionName,
					},
					{ ...Fields.project, sort: false },
					Fields.tags,
				]}
				onDelete={(item) =>
					postApi(`/projects/${project?._id}/deleteAssumption`, {
						assId: item._id,
						assType: item.assumptionKey,
						projId: project?._id,
					})
				}
				canDelete={(item) => buildPermissions(ability, SUBJECTS.Assumptions, item.project._id).canDelete}
				itemActions={useCallback(
					(item: AssumptionItem) => [
						{
							icon: faFileImport,
							label: 'Import to Current Project',
							disabled:
								(!canCreateAssumption && PERMISSIONS_TOOLTIP_MESSAGE) ||
								item.project._id === project?._id,
							onClick: () => importModels(item),
						},
					],
					[importModels, canCreateAssumption, project?._id]
				)}
				workMe={workMe}
				selectionActions={
					<>
						<Button
							tooltipTitle={
								selection?.selectedSet?.size > MAX_COPYABLE_MODELS
									? `Cannot import over ${MAX_COPYABLE_MODELS} econ models`
									: 'Import to Current Project'
							}
							disabled={
								selection?.selectedSet?.size === 0 ||
								selection?.selectedSet?.size > MAX_COPYABLE_MODELS ||
								(!canCreateAssumption && PERMISSIONS_TOOLTIP_MESSAGE)
							}
							onClick={() => importSelectedModels([...(selection?.selectedSet ?? {})])}
							startIcon={faFileImport}
						>
							Import to Project
						</Button>
						<MassDeleteButton
							disabled={selection?.selectedSet?.size === 0}
							feat='Econ Model'
							feats='Econ Models'
							length={selection?.selectedSet?.size}
							requireName
							onDelete={() =>
								postApi(`/projects/${project?._id}/deleteAssumptions`, {
									assumptionIds: [...(selection?.selectedSet || [])],
								}).then(({ deleted, total }) => {
									if (total !== deleted) {
										confirmationAlert(`${deleted} out of ${total} models deleted`);
									} else {
										confirmationAlert(`${deleted} models deleted`);
									}
								})
							}
							refresh={runFilters}
						/>
					</>
				}
			/>
			{assumptionsDialog}
			{exportDialog}
			{importDialog}
		</>
	);
}
