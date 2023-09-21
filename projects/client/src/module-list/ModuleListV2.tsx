import { faCopy, faTrashAlt } from '@fortawesome/pro-regular-svg-icons';
import { useCallback, useEffect, useState } from 'react';
import * as React from 'react';

import { PERMISSIONS_TOOLTIP_MESSAGE } from '@/access-policies/Can';
import { getTaggingProp } from '@/analytics/tagging';
import { useCallbackRef } from '@/components/hooks';
import { Selection } from '@/components/hooks/useSelection';
import { Separator, withCallbacksRef } from '@/components/shared';
import { Project } from '@/forecasts/types';
import { confirmationAlert, genericErrorAlert } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { useCollisionReportNotificationCallback } from '@/manage-wells/WellsPage/well-identifiers/ChangeIdentifiersMenu';
import { validateScopeToProject } from '@/manage-wells/WellsPage/well-identifiers/editWellIdentifierApi';
import { CopyDialog, DeleteDialog } from '@/module-list/ModuleList/components';
import { useItemsSelection } from '@/module-list/shared';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { ModuleListTagsMenu } from '@/tags/useModuleListTagsButtons';
import { URLS } from '@/urls';

import ModuleList from './ModuleList';
import { Item, ItemDetail, ItemIdsFetcher, ItemsFetcher } from './types';

export { Fields, Filters } from './ModuleList';

interface ModuleListV2Props<T extends Item, F> {
	hideActions?: boolean;
	canCopy?: (item: T) => boolean;
	canCreate?: boolean;
	canDelete?: (item: T) => boolean;
	currentItem?: Project;
	onTagsChange?: () => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	extraDeleteOptions?: any;
	feat: string;
	fetch: ItemsFetcher<F & { page; limit; getAll }, T>;
	fetchIds?: ItemIdsFetcher<F>;
	onRowClicked?: () => void;

	paginationPosition?: 'bottom' | 'top';

	filters?: React.ReactNode; // sidebar filters
	globalActions?: React.ReactNode;
	initialFilters: F; // body filter object
	itemDetails?: ItemDetail[];
	copyNotification?: NotificationType;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onCopy?: (item: T, options?: any) => Promise<string | undefined | void>;
	additionalCopyDialogParagraphs?: string[];
	onCreate?: () => Promise<string | undefined | void>;
	createButton?: React.ReactNode;
	onDelete?: (item: T, ...extra) => Promise<string | undefined | void>;
	requireNameToDelete?: boolean;
	selectionActions?: React.ReactNode;
	useSelection?: boolean;
	useTags?: string;
	analyticsTagging?: Record<string, string>;

	// eslint-disable-next-line @typescript-eslint/ban-types -- TODO eslint fix later
	itemActions?(item: T): {}[];

	workMe?(item: T): void;
	workMeName?: string;
	setModuleListRef?: (m: ModuleListV2Ref<F>) => void; // HACK;
	title?: React.ReactNode;
	labels?: React.ReactNode;
}

interface ModuleListV2Ref<F> {
	runFilters: () => void;
	apply?: () => void;
	clear?: () => void;
	ids: string[];
	filters: F;
	totalItems: number;
	selection: Selection;
}
const ModuleListV2 = function ModuleListV2<T extends Item, F>({
	hideActions,
	canCopy,
	canCreate,
	canDelete,
	createButton,
	currentItem,
	extraDeleteOptions,
	feat,
	fetch,
	fetchIds,
	filters,
	globalActions,
	paginationPosition,
	initialFilters,
	itemActions,
	itemDetails,
	copyNotification,
	onCopy,
	additionalCopyDialogParagraphs,
	onCreate,
	onDelete,
	onTagsChange,
	requireNameToDelete,
	selectionActions,
	useSelection,
	useTags,
	analyticsTagging = {},
	title,
	labels,
	workMe,
	workMeName,
	onRowClicked,
	setModuleListRef,
}: ModuleListV2Props<T, F>) {
	const moduleList = ModuleList.useModuleList<T, F>(
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		fetch,
		initialFilters,
		fetchIds
	);
	const [copyDialog, promptCopyDialog] = useDialog(CopyDialog);
	const [deleteDialog, promptDeleteDialog] = useDialog(DeleteDialog);

	useCollisionReportNotificationCallback();

	const selection = useItemsSelection(moduleList.ids);

	const { runFilters, ids, filters: modListFilters, totalItems } = moduleList;

	const copyNotificationCallback = useCallback(
		(notificationUpdate) => {
			if (notificationUpdate.status === TaskStatus.COMPLETED) {
				runFilters();
			}
		},
		[runFilters]
	);
	useUserNotificationCallback(copyNotification as NotificationType, copyNotificationCallback); // TODO findout how to avoid the casting to NotificationType

	const modSelection = useSelection || useTags || selectionActions ? selection : undefined;

	useEffect(() => {
		setModuleListRef?.({
			runFilters,
			ids,
			selection,
			filters: modListFilters,
			totalItems,
		});
	}, [runFilters, ids, selection, modListFilters, totalItems, setModuleListRef]);
	const workMeRef = useCallbackRef(workMe);
	const itemActionBtns = useCallback(
		(item) => [
			...(onCopy
				? [
						{
							icon: faCopy,
							label: 'Copy',
							onClick: () =>
								promptCopyDialog({
									feat,
									name: item.name,
									additionalParagraphs: additionalCopyDialogParagraphs,
									onCopy: async (options = {}) => {
										try {
											if (options.scopeCompanyWellsToProject) {
												validateScopeToProject({
													operationType: 'scopeToProject',
													projectId: item._id,
													project: item._id,
													// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
													path: URLS.project(item._id as any).settings,
												});
											} else {
												await onCopy(item, options);
											}
										} catch (err) {
											genericErrorAlert(err, 'Error occured on copy start');
										}
									},
									analyticsTagging: analyticsTagging?.copy
										? getTaggingProp(analyticsTagging.copy as never, 'copy') ?? undefined
										: undefined,
								}),
							disabled: !(canCopy?.(item) ?? true) && PERMISSIONS_TOOLTIP_MESSAGE,
						},
				  ]
				: []),
			...(itemActions?.(item) ?? []),
			...(onDelete
				? [
						{
							icon: faTrashAlt,
							label: 'Delete',
							onClick: () =>
								promptDeleteDialog({
									feat,
									name: item.name,
									extraOption: extraDeleteOptions,
									onDelete: async (extra) => {
										await onDelete(item, extra);
										runFilters();
										confirmationAlert(`${feat} ${item.name} deleted successfully`);
									},
									requireName: requireNameToDelete,
								}),
							disabled: !(canDelete?.(item) ?? true) && PERMISSIONS_TOOLTIP_MESSAGE,
							color: 'warning',
						},
				  ]
				: []),
		],
		[
			additionalCopyDialogParagraphs,
			analyticsTagging.copy,
			canCopy,
			canDelete,
			extraDeleteOptions,
			feat,
			itemActions,
			onCopy,
			onDelete,
			promptCopyDialog,
			promptDeleteDialog,
			requireNameToDelete,
			runFilters,
		]
	);
	return (
		<>
			{copyDialog}
			{deleteDialog}
			<ModuleList
				moduleList={moduleList}
				title={title}
				paginationPosition={paginationPosition}
				feat={feat}
				selection={modSelection}
				currentItem={currentItem}
				labels={labels}
				filters={filters}
				globalActions={globalActions}
				itemActionBtns={itemActionBtns}
				hideActions={hideActions}
				itemDetails={itemDetails}
				onRowClicked={onRowClicked}
				selectionActions={
					<>
						{createButton ??
							(onCreate ? (
								<ModuleList.CreateButton
									onClick={async () => {
										await onCreate();
										runFilters();
									}}
									feat={feat}
									tooltipTitle={!canCreate && PERMISSIONS_TOOLTIP_MESSAGE}
									disabled={!canCreate}
								/>
							) : null)}
						{(selectionActions || useTags) && ( // only show separator if there are selection actions
							<>
								<Separator />
								{selectionActions}
								{useTags ? (
									<ModuleListTagsMenu
										refresh={() => {
											onTagsChange?.();
											runFilters();
										}}
										selection={selection}
										feat={useTags || feat}
									/>
								) : null}
							</>
						)}
					</>
				}
				workMe={workMe && workMeRef}
				workMeName={workMeName}
			/>
		</>
	);
};

export function useModuleListRef<F, T extends Item>(
	initialFilters: F
): ModuleListV2Ref<F> & { moduleListProps: Pick<ModuleListV2Props<T, F>, 'initialFilters' | 'setModuleListRef'> } {
	const [moduleList, setModuleListRef] = useState({ filters: initialFilters } as ModuleListV2Ref<F>);
	return {
		...moduleList,
		moduleListProps: { setModuleListRef, initialFilters },
	};
}

export default withCallbacksRef(ModuleListV2, ['onCopy', 'onDelete', 'onCreate']) as <T extends Item, F>(
	props: ModuleListV2Props<T, F> & { ref?: React.RefObject<ModuleListV2Ref<F>> }
) => JSX.Element;
