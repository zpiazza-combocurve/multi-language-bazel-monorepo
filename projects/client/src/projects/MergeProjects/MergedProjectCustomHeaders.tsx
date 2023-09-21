import { Button, List, Typography } from '@/components/v2';
import { ProjectCustomHeader as PCHModel } from '@/helpers/project-custom-headers';
import { pluralize } from '@/helpers/text';

import CreateMergedCustomHeaderDropPlaceholder from './CreateMergedCustomHeaderDropPlaceholder';
import MergedProjectCustomHeader from './MergedProjectCustomHeader';
import styles from './merge-projects.module.scss';
import { MergeProjectsModel, MergedProjectCustomHeaderModel } from './models';

const MergedProjectCustomHeaders = ({
	mergedModel,
	isMergeByNameAndTypeEnabled,
	isCreateByDropEnabled,
	updateCustomHeader,
	deleteCustomHeader,
	onAddCustomHeaderToMerged,
	onAddMergedCustomHeaders,
	onMergeCustomHeadersByNameAndType,
	onMergedCustomHeaderMouseEnter,
	onMergedCustomHeaderMouseLeave,
}: {
	mergedModel: MergeProjectsModel;
	isMergeByNameAndTypeEnabled: boolean;
	isCreateByDropEnabled: boolean;
	updateCustomHeader: (updatedHeader: MergedProjectCustomHeaderModel) => void;
	deleteCustomHeader: (key: string) => void;
	onAddCustomHeaderToMerged: (mergedCustomHeader: MergedProjectCustomHeaderModel, header: PCHModel) => void;
	onAddMergedCustomHeaders: (projectId: string, header: PCHModel | null) => void;
	onMergeCustomHeadersByNameAndType: () => void;
	onMergedCustomHeaderMouseEnter: (usedCustomHeaders: string[]) => void;
	onMergedCustomHeaderMouseLeave: () => void;
}) => {
	const onChangeName = (key: string, name: string) => {
		const header = mergedModel.customHeaders.find((h) => h.key === key);

		if (header) {
			updateCustomHeader({
				...header,
				name,
			});
		}
	};

	return (
		<>
			<div className={`${styles['header-header']} ${styles['merged-headers-header']}`}>
				<Typography css='font-weight: bold; font-size: 14px;'>
					{mergedModel.name} ({pluralize(mergedModel.customHeaders.length, 'header', 'headers')})
				</Typography>
				<Button
					onClick={onMergeCustomHeadersByNameAndType}
					disabled={
						!isMergeByNameAndTypeEnabled && 'No available headers left that can be merged by name and type'
					}
				>
					Merge by Name And Type
				</Button>
			</div>
			<List>
				{mergedModel.customHeaders.map((h) => {
					const hasUniqueName = !mergedModel.customHeaders.find((x) => x.key !== h.key && x.name === h.name);

					return (
						<MergedProjectCustomHeader
							key={h.key}
							header={h}
							onChangeName={onChangeName}
							onDelete={deleteCustomHeader}
							onUpdate={updateCustomHeader}
							onAddToMerged={onAddCustomHeaderToMerged}
							onMouseEnter={onMergedCustomHeaderMouseEnter}
							onMouseLeave={onMergedCustomHeaderMouseLeave}
							hasUniqueName={hasUniqueName}
						/>
					);
				})}
				{isCreateByDropEnabled && (
					<CreateMergedCustomHeaderDropPlaceholder onAddMergedCustomHeaders={onAddMergedCustomHeaders} />
				)}
			</List>
		</>
	);
};

export default MergedProjectCustomHeaders;
