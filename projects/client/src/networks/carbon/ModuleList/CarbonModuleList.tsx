import { faDownload, faUpload } from '@fortawesome/pro-regular-svg-icons';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';

import { ACTIONS, SUBJECTS, ability, subject } from '@/access-policies/Can';
import { getTaggingProp } from '@/analytics/tagging';
import { Button } from '@/components/v2';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { failureAlert } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { localize } from '@/helpers/i18n';
import { downloadFile } from '@/helpers/routing';
import { assert } from '@/helpers/utilities';
import ModuleList, { Fields, Filters, useModuleListRef } from '@/module-list/ModuleListV2';
import { FiltersContext } from '@/module-list/filters';
import { useCurrentProject } from '@/projects/api';
import { URLS } from '@/urls';

import {
	changeFacilityName,
	changeNetworkName,
	deleteFacility,
	deleteNetworkModel,
	exportNetworkCSV,
	getNetworkModelFacilitiesModuleList,
	getNetworkModelsModuleList,
} from '../api';
import { FacilityModuleListItem, NetworkModelModuleListItem } from '../types';
import CreateFacilityDialog from './CreateFacilityDialog';
import CreateNetworkModelDialog from './CreateNetworkDialog';
import ImportCSVDialog from './ImportCSVDialog';

export interface NetworkModel {
	_id: string;
	name: string;
}

export function NetworkModelsModuleList() {
	const navigate = useNavigate();
	const { project } = useCurrentProject();

	const { moduleListProps } = useModuleListRef({
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
	const [dialog, showCreateNetworkModelDialog] = useDialog(CreateNetworkModelDialog);
	const [importDialog, showImportDialog] = useDialog(ImportCSVDialog);

	const { isLoading: isExportingCSV, mutate: handleExport } = useMutation(
		async ({ networkIds }: { networkIds: string[] }) => {
			assert(project, 'expected project');
			const response = await exportNetworkCSV({ networkIds, project: project._id });
			if (response.success) {
				await downloadFile(response.fileId);
			} else {
				failureAlert(response.message);
			}
		}
	);

	async function handleImport() {
		await showImportDialog();
	}

	const { isWellsCollectionsEnabled } = useLDFeatureFlags();

	return (
		<>
			{dialog}
			{importDialog}
			<ModuleList
				{...moduleListProps}
				feat={localize.network.singular()}
				fetch={getNetworkModelsModuleList}
				canCreate={!!project}
				useSelection
				onCreate={async () => {
					await showCreateNetworkModelDialog({
						taggingProp: getTaggingProp('carbonNetwork', 'createNetwork'),
					});
				}}
				onDelete={(item) => deleteNetworkModel(item._id)}
				filters={
					<>
						<Filters.Title />
						<Filters.NameFilter />
						<Filters.CreatedRangeFilter />
						<Filters.ProjectNameFilter />
						<Filters.CreatedByFilter />
					</>
				}
				globalActions={
					<>
						<Button onClick={handleImport} startIcon={faUpload}>
							Import
						</Button>
						<FiltersContext.Consumer>
							{({ selection }) => (
								<Button
									disabled={
										// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
										(selection!.selectedSet?.size === 0 && 'Need to select at least one Network') ||
										(!project?._id && 'Need to select a Project') ||
										(isExportingCSV && 'Exporting Carbon Network(s)')
									}
									// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
									onClick={() => handleExport({ networkIds: [...selection!.selectedSet] })}
									startIcon={faDownload}
								>
									Export
								</Button>
							)}
						</FiltersContext.Consumer>
					</>
				}
				itemDetails={[
					{
						...Fields.name,
						canRename: (item) =>
							ability.can(ACTIONS.Update, subject(SUBJECTS.Scenarios, { project: item?.project?._id })),
						onRename: (value, item) => changeNetworkName(item._id, value),
					},
					Fields.createdBy,
					Fields.createdAt,
					Fields.updatedAt,
					Fields.wells,
					...(isWellsCollectionsEnabled ? [Fields.wellCollections] : []),
					{
						key: 'nodesLength',
						label: 'Nodes',
						value: (item) => item.nodesLength,
						type: 'number',
						width: 100,
					},
					{
						key: 'edgesLength',
						label: 'Edges',
						value: (item) => item.edgesLength,
						type: 'number',
						width: 100,
					},
					Fields.project,
				]}
				workMe={(item: NetworkModelModuleListItem) =>
					navigate(URLS.project(item.project._id).networkModel(item._id).root)
				}
			/>
		</>
	);
}

export function FacilitiesModuleList() {
	const navigate = useNavigate();
	const { project } = useCurrentProject();

	const { moduleListProps } = useModuleListRef({
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
	const [dialog, showCreateDialog] = useDialog(CreateFacilityDialog);

	return (
		<>
			{dialog}
			<ModuleList
				{...moduleListProps}
				feat={localize.facility.singular()}
				fetch={getNetworkModelFacilitiesModuleList}
				canCreate={!!project}
				onCreate={async () => {
					await showCreateDialog({ taggingProp: getTaggingProp('carbonNetwork', 'createFacility') });
				}}
				onDelete={(item) => deleteFacility(item._id)}
				filters={
					<>
						<Filters.Title />
						<Filters.NameFilter />
						<Filters.CreatedRangeFilter />
						<Filters.ProjectNameFilter />
						<Filters.CreatedByFilter />
					</>
				}
				itemDetails={[
					{
						...Fields.name,
						canRename: (item) =>
							ability.can(ACTIONS.Update, subject(SUBJECTS.Networks, { project: item?.project?._id })),
						onRename: (value, item) => changeFacilityName(item._id, value),
					},
					Fields.createdBy,
					Fields.createdAt,
					Fields.updatedAt,
					{
						key: 'nodesLength',
						label: 'Nodes',
						value: (item) => item.nodesLength,
						type: 'number',
						width: 100,
					},
					{
						key: 'edgesLength',
						label: 'Edges',
						value: (item) => item.edgesLength,
						type: 'number',
						width: 100,
					},
					Fields.project,
				]}
				workMe={(item: FacilityModuleListItem) =>
					navigate(URLS.project(item.project._id).facility(item._id).root)
				}
			/>
		</>
	);
}
