import { faChevronDown, faKeyboard } from '@fortawesome/pro-regular-svg-icons';
import { emphasize, useTheme } from '@material-ui/core';
import { FunctionComponent, useCallback, useMemo, useState } from 'react';
import { useMutation } from 'react-query';

import { getTaggingProp } from '@/analytics/tagging';
import { KeyboardShortcutsFloatingTooltip } from '@/components/KeyboardShortcutsButton';
import SelectedCount from '@/components/misc/SelectedCount';
import { Button, Divider, Icon, MenuButton, MenuItem, Typography } from '@/components/v2';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { genericErrorAlert, infoAlert, withLoadingBar } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { useDialog } from '@/helpers/dialog';
import { sanitizeFile } from '@/helpers/fileHelper';
import { useProgressBar } from '@/helpers/progress';
import { postApi, uploadFile } from '@/helpers/routing';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';

import { ToolbarPaper } from '../../components/ToolbarPaper';
import { SingleWellNpvDialog } from '../SingleWellNpvDialog';
import { showImportPriorityDialog } from '../WellTable/ImportPriorityDialog';
import { runDialog } from '../WellTable/RunDialog';
import { AssignmentsApi } from '../WellTable/api/AssignmentsApi';
import { useWellTableSelection } from '../WellTable/hooks/useWellTableSelection';
import { useExportWellTable } from '../hooks/useExportWellTable';
import { shortcutBlocks } from '../shared/hotkeys';

export const Toolbar = ({
	schedule,
	updateAssignments,
	wellIds,
	disabledMessage,
	methods,
	canUpdateSchedule,
	setCurrentSort,
}) => {
	const theme = useTheme();
	const { project } = useAlfa();
	const projectId = project?._id as Inpt.ObjectId;

	const selection = useWellTableSelection();

	const scheduleId = schedule?._id;
	const scheduleName = schedule?.name;

	const [isShortcutsVisible, setIsShortcutsVisible] = useState(false);
	const handleToggleShortcuts = () => setIsShortcutsVisible((prevState) => !prevState);

	const [progress, setProgress] = useState(0);
	const [importingCCSort, setImportingCCSort] = useState(false);
	const [uploadingCCSortFile, setUploadingCCSortFile] = useState(false);

	const { isSchedulingNPVEnabled } = useLDFeatureFlags();

	useProgressBar(uploadingCCSortFile && progress);

	const importOrderNotificationCallback = useCallback(
		(notification) => {
			if (notification.extra?.body?.scheduleId === scheduleId) {
				if (notification.status === TaskStatus.COMPLETED) {
					updateAssignments(undefined, ['priority']);
					setImportingCCSort(false);
				} else if (notification.status === TaskStatus.FAILED) {
					setImportingCCSort(false);
				}
			}
		},
		[updateAssignments, scheduleId]
	);
	useUserNotificationCallback(NotificationType.SCHEDULE_ORDER_IMPORT, importOrderNotificationCallback);

	const startPriorityDataImport = useCallback(
		({ fileId }) => postApi(`/schedules/${scheduleId}/order-import`, { fileId }),
		[scheduleId]
	);

	const importPriority = async (file) => {
		const sanitizedFile = sanitizeFile(file);

		setImportingCCSort(true);
		setUploadingCCSortFile(true);
		setProgress(2);
		infoAlert('File upload started', 2000);

		try {
			const { _id: fileId } = await uploadFile(sanitizedFile, { onProgress: setProgress }, projectId);
			setUploadingCCSortFile(false);
			setProgress(0);

			await startPriorityDataImport({ fileId });
		} catch (err) {
			genericErrorAlert(err);
			setImportingCCSort(false);
			setUploadingCCSortFile(false);
			setProgress(0);
		}
	};

	const { mutateAsync: handleImportPriority } = useMutation(async () => {
		const file = await showImportPriorityDialog({});
		if (!file) {
			return;
		}
		await importPriority(file);
	});

	const { exportingCCSort, handleExportSorting } = useExportWellTable({ scheduleId, scheduleName });

	const assignmentsApi = useMemo(() => new AssignmentsApi(scheduleId), [scheduleId]);
	const handleClearPriority = useCallback(
		async (wellIds) => {
			await withLoadingBar(assignmentsApi.update({ column: 'priority', wellIds, value: null }));
			updateAssignments(wellIds, ['priority']);
		},
		[assignmentsApi, updateAssignments]
	);

	const [npvDialog, showNpvDialog] = useDialog(SingleWellNpvDialog as FunctionComponent);

	return (
		<ToolbarPaper>
			{npvDialog}
			<div
				css={{
					paddingLeft: '8px',
				}}
			>
				<SelectedCount
					count={selection.selectedSet.size}
					total={wellIds.length}
					direction='row'
					itemName='Wells'
				/>
			</div>
			<Divider orientation='vertical' flexItem />
			<MenuButton
				label={
					<>
						<Typography variant='subtitle2'>Prioritization</Typography>
						<Icon css={{ paddingLeft: '8px' }} fontSize='small'>
							{faChevronDown}
						</Icon>
					</>
				}
			>
				{isSchedulingNPVEnabled && (
					<MenuItem
						disabled={!canUpdateSchedule || selection.selectedSet.size === 0}
						onClick={() =>
							showNpvDialog(({ onHide }) => ({
								scheduleName,
								projectId,
								scheduleId,
								wellIds: Array.from(selection.selectedSet),
								updateAssignments,
								setMainCurrentSort: setCurrentSort,
								onHide,
							}))
						}
					>
						<Typography variant='subtitle2'>Single Well NPV</Typography>
					</MenuItem>
				)}
				<MenuItem
					disabled={exportingCCSort || importingCCSort}
					onClick={() => withLoadingBar(handleExportSorting())}
				>
					<Typography variant='subtitle2'>Export</Typography>
				</MenuItem>
				<MenuItem disabled={!canUpdateSchedule || importingCCSort} onClick={() => handleImportPriority()}>
					<Typography variant='subtitle2'>Import</Typography>
				</MenuItem>
				<MenuItem disabled={!canUpdateSchedule} onClick={() => handleClearPriority(wellIds)}>
					<Typography variant='subtitle2'>Clear Priority</Typography>
				</MenuItem>
			</MenuButton>

			<Button
				color='secondary'
				variant='outlined'
				onClick={() =>
					runDialog({
						scheduleId,
						methods,
						runAnalyticsTagging: getTaggingProp('schedule', 'runSchedule'),
					})
				}
				disabled={disabledMessage}
			>
				Run Schedule
			</Button>

			<Button
				aria-label='Keyboard Shortcuts'
				css={`
					margin-left: auto;
					min-width: initial;
					padding: 6px;
					background-color: ${isShortcutsVisible
						? emphasize(theme.palette.background.default, 0.3)
						: undefined};
				`}
				onClick={handleToggleShortcuts}
			>
				<Icon>{faKeyboard}</Icon>
			</Button>

			<KeyboardShortcutsFloatingTooltip
				portal
				onToggle={handleToggleShortcuts}
				visible={isShortcutsVisible}
				blocks={shortcutBlocks}
			/>
		</ToolbarPaper>
	);
};
