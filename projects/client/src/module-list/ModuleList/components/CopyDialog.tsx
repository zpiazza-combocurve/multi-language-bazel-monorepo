import { useCallback, useEffect, useState } from 'react';
import { useMutation } from 'react-query';

import {
	Box,
	Button,
	CheckboxField,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Typography,
	alerts,
} from '@/components/v2';
import { genericErrorAlert, useLoadingBar } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { DialogProps, useDialog } from '@/helpers/dialog';
import { postApi } from '@/helpers/routing';
import { CollisionsDialog } from '@/manage-wells/WellsPage/well-identifiers/CollisionsDialog';
import {
	disableValidationNotifications,
	getValidationResult,
} from '@/manage-wells/WellsPage/well-identifiers/editWellIdentifierApi';
import Notification, { NotificationType, TaskStatus } from '@/notifications/notification';
import { useNotifications } from '@/notifications/useNotifications';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';

type CopyDialogProps = DialogProps<boolean> & {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onCopy: (options?: any) => void | Promise<void>;
	name?: string;
	additionalParagraphs?: string[];
	feat?: string;
	title?: string;
	disableCompanyWellsToProject?: boolean;
	analyticsTagging?: Record<string, string>;
};

const LISTENED_OPERATION_TYPES = ['scopeToProject'];

function executeOperation({ operationType, projectId, validationDocId }) {
	switch (operationType) {
		case 'scopeToProject':
			postApi(`/projects/${projectId}/copy`, {
				scopeCompanyWellsToProject: true,
				validationDocId,
			}).catch((err) => {
				genericErrorAlert(err, 'Error occurred during copy');
			});
			break;
	}
}

async function showCollisionsPrompt(notification: Notification, promptCollisionsDialog) {
	const { result } = await getValidationResult(notification.extra.output.validationDocId);
	const { collisions } = result;
	const proceed = await promptCollisionsDialog({
		collisionsData: collisions,
		selectionNumber: notification.extra.body.selectedCount,
		operation: notification.extra.body.operationType,
	});
	if (!Object.keys(collisions).length && proceed) {
		const run = await alerts.prompt({
			title: `Are you sure you want to change the scope of ${notification.extra.body.selectedCount} wells?`,
			actions: [
				{ children: 'Cancel', value: false },
				{
					children: 'Change',
					value: true,
					color: 'primary',
				},
			],
		});
		if (run) {
			executeOperation({
				operationType: notification.extra.body.operationType,
				projectId: notification.extra.body.update.project,
				validationDocId: notification.extra.output.validationDocId,
			});
		}
	} else if (proceed === false) {
		disableValidationNotifications();
	}
}

export function useCheckCollisionNotificationCallback(currentProjectId, promptCollisionsDialog) {
	const checkCollisionNotificationCallback = useCallback(
		async (notification) => {
			if (
				notification.type === NotificationType.VALIDATE_CHANGE_WELL_IDENTIFIERS &&
				notification.status === TaskStatus.COMPLETED &&
				notification.extra.body.projectId === currentProjectId &&
				notification.actionPerformed === false &&
				LISTENED_OPERATION_TYPES.includes(notification.extra.body.operationType)
			) {
				showCollisionsPrompt(notification, promptCollisionsDialog);
			}
		},
		[currentProjectId, promptCollisionsDialog]
	);
	useUserNotificationCallback(NotificationType.VALIDATE_CHANGE_WELL_IDENTIFIERS, checkCollisionNotificationCallback);
}

function CopyDialog({
	resolve,
	name,
	additionalParagraphs,
	onHide,
	onCopy,
	feat,
	title = `Copy ${feat}?`,
	visible,
	disableCompanyWellsToProject = false,
	analyticsTagging = {},
	...props
}: CopyDialogProps) {
	const [scopeCompanyWellsToProject, setScopeWellsToProjectLevel] = useState<boolean>(false);
	const [collisionsDialog, promptCollisionsDialog] = useDialog(CollisionsDialog);
	const [operationInProgress, setOperationInProgress] = useState(false);
	const [didMountHook, setDidMountHook] = useState(false);
	const { notifications, isLoading: isLoadingNotifications } = useNotifications();
	const { project } = useAlfa(['project']);
	const { isLoading, mutateAsync: copy } = useMutation(
		async () => {
			if (feat === 'Project') {
				onCopy({ scopeCompanyWellsToProject });
			} else {
				await Promise.resolve(onCopy());
			}
			resolve(true);
		},
		{
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			onError: async (error: any) => {
				if (error?.name === 'OperationNotAllowed' && error?.details?.notificationId) {
					await alerts.confirm({
						title: 'Copy in progress',
						children: <Typography>There is a copy already in progress</Typography>,
						confirmText: 'Ok',
					});
				}
			},
		}
	);

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

	useLoadingBar(isLoading);
	useCheckCollisionNotificationCallback(project?._id, promptCollisionsDialog);
	useUserNotificationCallback(NotificationType.VALIDATE_CHANGE_WELL_IDENTIFIERS, checkWellValidationInProgress);

	useEffect(() => {
		async function checkInitialNotifications() {
			if (notifications?.length) {
				checkWellValidationInProgress();
				const notification = notifications.find(
					(notification) =>
						notification.type === NotificationType.VALIDATE_CHANGE_WELL_IDENTIFIERS &&
						notification.status === TaskStatus.COMPLETED &&
						notification.extra?.body?.projectId === project?._id &&
						notification.actionPerformed === false &&
						LISTENED_OPERATION_TYPES.includes(notification.extra?.body?.operationType)
				);
				if (notification) {
					showCollisionsPrompt(notification, promptCollisionsDialog);
				}
			}
		}
		if (!didMountHook && !isLoadingNotifications && notifications?.length) {
			setDidMountHook(true);
			checkInitialNotifications();
		}
	}, [
		didMountHook,
		project?._id,
		notifications,
		promptCollisionsDialog,
		isLoadingNotifications,
		checkWellValidationInProgress,
	]);

	useEffect(() => {
		if (!visible) {
			setScopeWellsToProjectLevel(false);
		}
	}, [visible]);

	return (
		<>
			{collisionsDialog}
			<Dialog onClose={onHide} open={visible} {...props}>
				<DialogTitle>{title}</DialogTitle>
				<DialogContent>
					<Typography variant='body1'>{name}</Typography>
					<Box my={1}>
						{additionalParagraphs &&
							additionalParagraphs.map((paragraphs, i) => (
								<Typography key={i} variant='subtitle1'>
									{paragraphs}
								</Typography>
							))}
						<Typography variant='subtitle1'>This operation could take some time to complete.</Typography>
					</Box>
					{feat === 'Project' && (
						<CheckboxField
							disabled={disableCompanyWellsToProject || operationInProgress}
							label={`Scope Wells to Project Level${
								disableCompanyWellsToProject || operationInProgress
									? ' (Another operation is already in progress, please wait)'
									: ''
							}`}
							checked={scopeCompanyWellsToProject}
							onChange={() => setScopeWellsToProjectLevel(!scopeCompanyWellsToProject)}
						/>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={onHide}>Cancel</Button>
					<Button color='primary' onClick={() => copy()} disabled={isLoading} {...analyticsTagging}>
						Copy
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}

export default CopyDialog;
