import { NodeModel } from '@combocurve/types/client';

import { ACTIONS, SUBJECTS, ability, subject } from '@/access-policies/Can';
import { getTaggingProp } from '@/analytics/tagging';
import { useDialog } from '@/helpers/dialog';
import { localize } from '@/helpers/i18n';
import ModuleList, { Fields, Filters, useModuleListRef } from '@/module-list/ModuleListV2';
import NodeDialog from '@/networks/carbon/NodeDialog/NodeDialog';
import { NodeDialogMode } from '@/networks/carbon/NodeDialog/NodeDialog.types';
import { useCurrentProject } from '@/projects/api';

import { deleteNodeModel, getNodeModels, updateNodeModel } from '../api';

function NodeModelsModuleList() {
	// const navigate = useNavigate();
	const { project } = useCurrentProject();

	const { moduleListProps, runFilters } = useModuleListRef({
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
	const [dialog, showNodeDialog] = useDialog(NodeDialog);

	async function handleCreate() {
		await showNodeDialog({
			mode: NodeDialogMode.model,
			taggingProp: getTaggingProp('carbonNetwork', 'createNodeModel'),
		});
		runFilters();
	}

	return (
		<>
			{dialog}
			<ModuleList
				{...moduleListProps}
				feat={localize.nodeModel.singular()}
				fetch={getNodeModels}
				canCreate={!!project}
				onCreate={handleCreate}
				onDelete={(item) => deleteNodeModel(item._id)}
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
						onRename: (value, item) => updateNodeModel({ _id: item._id, name: value }),
					},
					Fields.createdBy,
					Fields.createdAt,
					Fields.updatedAt,
					Fields.project,
				]}
				workMe={(item) => {
					showNodeDialog({ mode: NodeDialogMode.model, nodeModel: item as unknown as NodeModel });
					runFilters();
				}}
			/>
		</>
	);
}

export default NodeModelsModuleList;
