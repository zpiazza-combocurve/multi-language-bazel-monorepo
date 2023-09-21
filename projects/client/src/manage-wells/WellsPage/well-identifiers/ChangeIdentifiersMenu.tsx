import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from 'react-query';

import { SUBJECTS } from '@/access-policies/Can';
import usePermissions from '@/access-policies/usePermissions';
import { Selection } from '@/components/hooks/useSelection';
import { ButtonItem, SubMenuItem } from '@/components/v2';
import { useAlfa } from '@/helpers/alfa';
import { useDialog } from '@/helpers/dialog';
import { downloadExport } from '@/helpers/routing';
import { invalidateQueries } from '@/manage-wells/shared/utils';
import Notification, { NotificationType, TaskStatus } from '@/notifications/notification';
import { useNotifications } from '@/notifications/useNotifications';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { URLS } from '@/urls';

import ChangeChosenIdDialog from './ChangeChosenIdDialog';
import ChangeWellsSourceDialog from './ChangeWellsSourceDialog';
import { CollisionsDialog } from './CollisionsDialog';
import {
	changeChosenId,
	changeDataSource,
	changeScopeFromProjectToCompany,
	disableValidationNotifications,
	getValidationResult,
	validateIdentifiersChange,
} from './editWellIdentifierApi';

interface ChangeIdentifiersMenuProps {
	selection: Selection<Inpt.ObjectId>;
	operationInProgress: boolean;
	scope?: boolean;
	dataSource?: boolean;
	chosenId?: boolean;
}

const LISTENED_OPERATION_TYPES = ['scopeToCompany', 'dataSource', 'chosenId'];
const CHANGE_IDENTIFIERS_WELL_LIMIT = 50_000;

export function useCollisionReportNotificationCallback() {
	const collisionReportNotificationCallback = useCallback((notification) => {
		if (notification.status === TaskStatus.COMPLETED) {
			const { gcpName, name } = notification.extra.output.file;
			downloadExport(gcpName, name);
		}
	}, []);

	useUserNotificationCallback(NotificationType.COLLISION_REPORT, collisionReportNotificationCallback);
}

export function useEditWellIdentifiersNotificationCallback() {
	const queryClient = useQueryClient();

	const editWellIdentifiersNotificationCallback = useCallback(
		(notification) => {
			if (notification.status === TaskStatus.COMPLETED) {
				invalidateQueries(queryClient);
			}
		},
		[queryClient]
	);

	useUserNotificationCallback(NotificationType.CHANGE_WELL_IDENTIFIERS, editWellIdentifiersNotificationCallback);
}

function executeOperation({ operationType, wells, chosenId, dataSource, validationDocId }) {
	switch (operationType) {
		case 'scopeToCompany':
			changeScopeFromProjectToCompany({ wells, validationDocId });
			break;
		case 'dataSource':
			changeDataSource({
				wells,
				dataSource,
				validationDocId,
			});
			break;
		case 'chosenId':
			changeChosenId({ wells, chosenID: chosenId, validationDocId });
			break;
	}
}

async function showCollisionsPrompt(notification: Notification, promptCollisionsDialog) {
	const { result, wells } = await getValidationResult(notification.extra.output.validationDocId);
	const { collisions, missingIdentifier: missingIds } = result;
	const proceed = await promptCollisionsDialog({
		collisionsData: collisions,
		selectionNumber: notification.extra.body.selectedCount,
		operation: notification.extra.body.operationType,
		missingIds,
	});

	if (proceed) {
		const operationType = notification.extra.body.operationType;
		const wellsToFilter = [...Object.keys(collisions), ...missingIds];
		const wellsToChange = wells.filter((well) => !wellsToFilter.includes(well));
		executeOperation({
			wells: wellsToChange,
			operationType,
			dataSource: notification.extra.body.update.dataSource,
			chosenId: notification.extra.body.update.chosenID,
			validationDocId: notification.extra.output.validationDocId,
		});
	} else if (proceed === false) {
		await disableValidationNotifications();
	}
}

export function useCheckCollisionNotificationCallback(currentProjectId, promptCollisionsDialog) {
	const checkCollisionNotificationCallback = useCallback(
		async (notification) => {
			if (
				notification.type === NotificationType.VALIDATE_CHANGE_WELL_IDENTIFIERS &&
				notification.extra.body.projectId === currentProjectId &&
				notification.actionPerformed === false &&
				LISTENED_OPERATION_TYPES.includes(notification.extra.body.operationType) &&
				notification.status === TaskStatus.COMPLETED
			) {
				showCollisionsPrompt(notification, promptCollisionsDialog);
			}
		},
		[currentProjectId, promptCollisionsDialog]
	);
	useUserNotificationCallback(NotificationType.VALIDATE_CHANGE_WELL_IDENTIFIERS, checkCollisionNotificationCallback);
}

export const useChangeIdentifiersMenuCallbacks = () => {
	const [operationInProgress, setOperationInProgress] = useState(false);
	const [didMountHook, setDidMountHook] = useState(false);
	const [collisionsDialog, promptCollisionsDialog] = useDialog(CollisionsDialog);
	const { project } = useAlfa(['project']);
	const { notifications, isLoading } = useNotifications();

	const checkWellValidationInProgress = useCallback(
		(notification?: Notification) => {
			const allNotifications = notification ? [...(notifications || []), notification] : notifications;
			if (allNotifications?.length && !isLoading) {
				const validationInProgress = allNotifications.some(
					(notification) =>
						(notification.status === TaskStatus.RUNNING || notification.status === TaskStatus.QUEUED) &&
						notification.type === NotificationType.VALIDATE_CHANGE_WELL_IDENTIFIERS
				);
				setOperationInProgress(validationInProgress);
			}
		},
		[notifications, isLoading]
	);

	useCollisionReportNotificationCallback();
	useEditWellIdentifiersNotificationCallback();
	useCheckCollisionNotificationCallback(project?._id, promptCollisionsDialog);
	useUserNotificationCallback(NotificationType.VALIDATE_CHANGE_WELL_IDENTIFIERS, checkWellValidationInProgress);

	useEffect(() => {
		async function checkCollisionNotifications() {
			if (notifications?.length) {
				checkWellValidationInProgress();
				const notification = notifications.find(
					(notification) =>
						notification.status === TaskStatus.COMPLETED &&
						notification.type === NotificationType.VALIDATE_CHANGE_WELL_IDENTIFIERS &&
						notification.extra.body.projectId === project?._id &&
						notification.actionPerformed === false &&
						LISTENED_OPERATION_TYPES.includes(notification.extra.body.operationType)
				);
				if (notification) {
					showCollisionsPrompt(notification, promptCollisionsDialog);
				}
			}
		}

		if (!isLoading && !didMountHook) {
			setDidMountHook(true);
			checkCollisionNotifications();
		}
	}, [didMountHook, isLoading, notifications, promptCollisionsDialog, project?._id, checkWellValidationInProgress]);

	return { operationInProgress, collisionsDialog };
};

function ChangeIdentifiersMenu({
	selection,
	operationInProgress,
	scope,
	dataSource,
	chosenId,
}: ChangeIdentifiersMenuProps) {
	const [changeChosenIdDialog, promptChangeChosenIdDialog] = useDialog(ChangeChosenIdDialog);
	const [changeWellsSourceDialog, promptChangeWellsSourceDialog] = useDialog(ChangeWellsSourceDialog);
	const { project } = useAlfa(['project']);

	const { canCreate: canChangeToCompany } = usePermissions(SUBJECTS.CompanyFileImports, null);

	const handleChangeWellsToCompanyScope = async () => {
		const wells = [...selection.selectedSet];
		if (project?._id) {
			validateIdentifiersChange({
				wells,
				update: {
					project: null,
				},
				path: URLS.project(project?._id).manageWells,
				selectionNumber: wells.length,
				operationType: 'scopeToCompany',
				projectId: project?._id,
			});
		}
	};

	const handleChangeChosenId = async () => {
		const wells = [...selection.selectedSet];
		const response = await promptChangeChosenIdDialog({
			selection: wells,
		});
		if (response?.identifier && project?._id) {
			validateIdentifiersChange({
				wells,
				update: {
					chosenID: response.identifier,
				},
				selectionNumber: wells.length,
				path: URLS.project(project?._id).manageWells,
				operationType: 'chosenId',
				projectId: project?._id,
				getWellsWithMissingIdentifier: true,
			});
		}
	};

	const handleChangeWellsDataSource = async () => {
		const wells = [...selection.selectedSet];
		const response = await promptChangeWellsSourceDialog({
			selection: wells,
		});

		if (response?.source && project?._id) {
			validateIdentifiersChange({
				wells,
				update: {
					dataSource: response.source,
				},
				path: URLS.project(project?._id).manageWells,
				selectionNumber: wells.length,
				operationType: 'dataSource',
				projectId: project?._id,
			});
		}
	};

	const isChangeIdentifiersMenuDisabled = useMemo(() => {
		if (selection.selectedSet.size === 0) {
			return 'Change Scope, Data Source or Chosen ID of wells';
		} else if (selection.selectedSet.size > CHANGE_IDENTIFIERS_WELL_LIMIT) {
			return `Too many wells selected. The limit is ${CHANGE_IDENTIFIERS_WELL_LIMIT}.`;
		} else if (operationInProgress) {
			return 'There is an operation in progress already.';
		}
		return false;
	}, [selection, operationInProgress]);

	return (
		<>
			{changeChosenIdDialog}
			{changeWellsSourceDialog}
			<SubMenuItem
				label='Edit Well Identifier'
				disabled={isChangeIdentifiersMenuDisabled}
				tooltipTitle={operationInProgress && 'There is an operation in progress already.'}
			>
				{scope && (
					<ButtonItem
						disabled={!canChangeToCompany}
						label='Change Wells to Company Scope'
						onClick={handleChangeWellsToCompanyScope}
					/>
				)}
				{dataSource && (
					<ButtonItem label='Change Wells Source' onClick={handleChangeWellsDataSource} hideOnClick={false} />
				)}
				{chosenId && (
					<ButtonItem label='Change Wells Chosen ID' onClick={handleChangeChosenId} hideOnClick={false} />
				)}
			</SubMenuItem>
		</>
	);
}

export default ChangeIdentifiersMenu;
