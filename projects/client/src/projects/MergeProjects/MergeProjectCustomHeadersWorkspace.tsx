import classNames from 'classnames';
import { useCallback, useMemo, useState } from 'react';

import { Divider, Typography } from '@/components/v2';
import { ProjectCustomHeader } from '@/helpers/project-custom-headers';

import ExpandableHeaderSection from './ExpandableHeaderSection';
import MergedProjectCustomHeaders from './MergedProjectCustomHeaders';
import ProjectCustomHeaders from './ProjectCustomHeaders';
import { MAX_NUMBER_OF_MERGED_PROJECT_CUSTOM_HEADERS } from './constants';
import {
	createMergedCustomHeaderFromSingleCustomHeader,
	createMergedCustomHeaderPart,
	getMergedCustomHeaderPartUniqueKey,
} from './helpers';
import styles from './merge-projects.module.scss';
import { MergeProjectsModel, MergedProjectCustomHeaderModel, ProjectToMergeModel } from './models';

const MergeProjectCustomHeadersWorkspace = ({
	expanded,
	onToggle,
	mergedModel,
	firstProject,
	secondProject,
	addCustomHeaders,
	updateCustomHeader,
	deleteCustomHeader,
	warning,
}: {
	expanded: boolean;
	onToggle: () => void;
	mergedModel: MergeProjectsModel;
	firstProject: ProjectToMergeModel;
	secondProject: ProjectToMergeModel;
	addCustomHeaders: (headersToAdd: MergedProjectCustomHeaderModel[]) => void;
	updateCustomHeader: (updatedHeader: MergedProjectCustomHeaderModel) => void;
	deleteCustomHeader: (key: string) => void;
	warning: string;
}) => {
	const [customHeaderKeysToHighlight, setCustomHeaderKeysToHighlight] = useState<string[]>([]);

	const usedInMergeHeaders = useMemo(() => {
		const headers: { key: string; color: string }[] = [];

		mergedModel.customHeaders.forEach((h) => {
			h.headers.forEach((hh) => {
				headers.push({
					key: hh.key,
					color: h.color,
				});
			});
		});

		return headers;
	}, [mergedModel.customHeaders]);

	const usedInMergeHeaderKeys = useMemo(() => {
		return usedInMergeHeaders.map((h) => h.key);
	}, [usedInMergeHeaders]);

	const onAddMergedCustomHeaders = useCallback(
		(projectId: string, header: ProjectCustomHeader | null = null) => {
			const project = firstProject.project._id === projectId ? firstProject : secondProject;

			if (header) {
				addCustomHeaders([createMergedCustomHeaderFromSingleCustomHeader(project.project, header)]);
			} else {
				const headersToAdd: MergedProjectCustomHeaderModel[] = [];

				project.customHeaders.forEach((h) => {
					if (
						usedInMergeHeaderKeys.indexOf(getMergedCustomHeaderPartUniqueKey(project.project._id, h.name)) <
						0
					) {
						headersToAdd.push(createMergedCustomHeaderFromSingleCustomHeader(project.project, h));
					}
				});

				if (headersToAdd.length > 0) {
					addCustomHeaders(headersToAdd);
				}
			}
		},
		[addCustomHeaders, firstProject, secondProject, usedInMergeHeaderKeys]
	);

	const onMergeCustomHeadersByNameAndType = useCallback(() => {
		const headersToAdd: MergedProjectCustomHeaderModel[] = [];

		firstProject.customHeaders.forEach((h1) => {
			secondProject.customHeaders.forEach((h2) => {
				if (h1.label === h2.label && h1.headerType.type === h2.headerType.type) {
					const headerPart1 = createMergedCustomHeaderPart(h1, firstProject.project, true);
					const headerPart2 = createMergedCustomHeaderPart(h2, secondProject.project, false);

					if (
						usedInMergeHeaderKeys.indexOf(headerPart1.key) < 0 &&
						usedInMergeHeaderKeys.indexOf(headerPart2.key) < 0
					) {
						headersToAdd.push({
							key: `${headerPart1.key}-${headerPart2.key}_${Date.now()}`,
							name: h1.label,
							color: '',
							headers: [headerPart1, headerPart2],
						});
					}
				}
			});
		});

		if (headersToAdd.length > 0) {
			addCustomHeaders(headersToAdd);
		}
	}, [addCustomHeaders, firstProject, secondProject, usedInMergeHeaderKeys]);

	const onMergedCustomHeaderMouseEnter = (usedCustomHeaders: string[]) => {
		setCustomHeaderKeysToHighlight(usedCustomHeaders);
	};

	const onMergedCustomHeaderMouseLeave = () => {
		setCustomHeaderKeysToHighlight([]);
	};

	const onAddCustomHeaderToMerged = useCallback(
		(mergedCustomHeader: MergedProjectCustomHeaderModel, header: ProjectCustomHeader) => {
			const project =
				mergedCustomHeader.headers[0].projectId === firstProject.project._id ? firstProject : secondProject;

			const headerPart = createMergedCustomHeaderPart(header, project.project, false);

			const newCustomHeaderParts = [...mergedCustomHeader.headers];
			newCustomHeaderParts.push(headerPart);

			updateCustomHeader({ ...mergedCustomHeader, headers: newCustomHeaderParts });
		},
		[firstProject, secondProject, updateCustomHeader]
	);

	const isMergeByNameAndTypeEnabled = useMemo(() => {
		for (let i = 0; i < firstProject.customHeaders.length; ++i) {
			const h1 = firstProject.customHeaders[i];

			for (let j = 0; j < secondProject.customHeaders.length; ++j) {
				const h2 = secondProject.customHeaders[j];

				if (h1.label === h2.label && h1.headerType.type === h2.headerType.type) {
					const h1Key = getMergedCustomHeaderPartUniqueKey(firstProject.project._id, h1.name);
					const h2Key = getMergedCustomHeaderPartUniqueKey(secondProject.project._id, h2.name);

					if (usedInMergeHeaderKeys.indexOf(h1Key) < 0 && usedInMergeHeaderKeys.indexOf(h2Key) < 0) {
						return true;
					}
				}
			}
		}

		return false;
	}, [firstProject, secondProject, usedInMergeHeaderKeys]);

	const isCreateByDropEnabled = useMemo(() => {
		for (let i = 0; i < firstProject.customHeaders.length; ++i) {
			const h1 = firstProject.customHeaders[i];

			const h1Key = getMergedCustomHeaderPartUniqueKey(firstProject.project._id, h1.name);

			if (usedInMergeHeaderKeys.indexOf(h1Key) < 0) {
				return true;
			}
		}

		for (let j = 0; j < secondProject.customHeaders.length; ++j) {
			const h2 = secondProject.customHeaders[j];

			const h2Key = getMergedCustomHeaderPartUniqueKey(secondProject.project._id, h2.name);

			if (usedInMergeHeaderKeys.indexOf(h2Key) < 0) {
				return true;
			}
		}

		return false;
	}, [firstProject, secondProject, usedInMergeHeaderKeys]);

	return (
		<ExpandableHeaderSection
			expanded={expanded}
			onToggle={onToggle}
			title='Project Custom Headers'
			warning={warning}
			beforeToggle={
				<Typography className={styles['info-p']}>
					{mergedModel.customHeaders.length}/{MAX_NUMBER_OF_MERGED_PROJECT_CUSTOM_HEADERS} Custom Headers
				</Typography>
			}
		>
			<div className={styles['custom-headers-merge']}>
				<div className={styles.columns}>
					<div className={styles['headers-list-wrapper']}>
						<ProjectCustomHeaders
							project={firstProject}
							onAddMergedCustomHeaders={onAddMergedCustomHeaders}
							usedInMergeHeaders={usedInMergeHeaders}
							headerKeysToHighlight={customHeaderKeysToHighlight}
						/>
						<Divider orientation='vertical' />
					</div>
					<div className={styles['headers-list-wrapper']}>
						<ProjectCustomHeaders
							project={secondProject}
							onAddMergedCustomHeaders={onAddMergedCustomHeaders}
							usedInMergeHeaders={usedInMergeHeaders}
							headerKeysToHighlight={customHeaderKeysToHighlight}
						/>
						<Divider orientation='vertical' />
					</div>
					<div className={classNames(styles['headers-list-wrapper'], styles['merged-headers-wrapper'])}>
						<MergedProjectCustomHeaders
							mergedModel={mergedModel}
							isMergeByNameAndTypeEnabled={isMergeByNameAndTypeEnabled}
							isCreateByDropEnabled={isCreateByDropEnabled}
							updateCustomHeader={updateCustomHeader}
							deleteCustomHeader={deleteCustomHeader}
							onAddCustomHeaderToMerged={onAddCustomHeaderToMerged}
							onAddMergedCustomHeaders={onAddMergedCustomHeaders}
							onMergeCustomHeadersByNameAndType={onMergeCustomHeadersByNameAndType}
							onMergedCustomHeaderMouseEnter={onMergedCustomHeaderMouseEnter}
							onMergedCustomHeaderMouseLeave={onMergedCustomHeaderMouseLeave}
						/>
					</div>
				</div>
			</div>
		</ExpandableHeaderSection>
	);
};

export default MergeProjectCustomHeadersWorkspace;
