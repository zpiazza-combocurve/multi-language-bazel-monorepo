import { faCircleNotch } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ClickAwayListener } from '@material-ui/core';
import classNames from 'classnames';
import { useCallback, useState } from 'react';

import { Button, Divider, IconButton, Paper, Typography } from '@/components/v2';
import { useAlfa } from '@/helpers/alfa';
import { FeatureIcons } from '@/helpers/features';

import NotificationsList from './NotificationsList';
import { TaskStatus } from './notification';
import styles from './notifications.module.scss';
import { useNotificationPanelNotifications } from './useNotificationPanelNotifications';

const Notifications = () => {
	const [opened, setOpened] = useState(false);
	const [viewAll, setViewAll] = useState(false);
	const { theme } = useAlfa();

	const {
		dynamicNotifications,
		todayNotifications,
		yesterdayNotifications,
		earlierNotifications,
		onMarkAllNotificationsAsRead,
		onToggleNotificationReadFlag,
		onHideDynamic,
		downloadForecastExportDialog,
		downloadIfExists,
	} = useNotificationPanelNotifications(opened);

	const onToggle = () => {
		if (dynamicNotifications.length > 0) {
			onHideDynamic();
		}
		setOpened(!opened);
	};

	const onClickAway = () => {
		if (opened && dynamicNotifications.length > 0) {
			onHideDynamic();
		}

		setOpened(false);
	};

	const onToggleViewAll = useCallback(() => {
		setViewAll((state) => !state);
	}, []);

	const shownNotifications = [
		...todayNotifications,
		...yesterdayNotifications,
		...(viewAll ? earlierNotifications : []),
	];
	const viewMoreEnabled = earlierNotifications.length > 0;
	const unreadCount = shownNotifications.filter((n) => !n.read).length;
	const anyRunning = !!shownNotifications.find((n) => n.status === TaskStatus.RUNNING);
	const markAllReadEnabled = !!shownNotifications.find((n) => !n.read);

	return (
		<div className={styles['notifications-wrapper']}>
			{downloadForecastExportDialog}
			<span className={styles['running-wrapper']}>
				<IconButton
					css={`
						padding: 8px;
					`}
					badgeProps={{
						color: 'primary',
						badgeContent: unreadCount,
						overlap: 'rectangular',
					}}
					onClick={onToggle}
					tooltipTitle='Notifications'
				>
					{FeatureIcons.notifications}
				</IconButton>
				{anyRunning && <FontAwesomeIcon className={styles.running} spin icon={faCircleNotch} />}
			</span>
			{dynamicNotifications.length > 0 && (
				<div className={styles['dynamic-notifications']}>
					<NotificationsList
						items={dynamicNotifications}
						onToggleNotificationReadFlag={onToggleNotificationReadFlag}
						onHideDynamic={onHideDynamic}
						onDownloadOutput={downloadIfExists}
					/>
				</div>
			)}
			{opened && (
				<ClickAwayListener onClickAway={onClickAway}>
					<Paper className={classNames(styles['notifications-content'], styles[`border-color-${theme}`])}>
						<div className={styles['notifications-header']}>
							<Typography>Notifications</Typography>
							<Button
								variant='text'
								disabled={!markAllReadEnabled}
								onClick={onMarkAllNotificationsAsRead}
							>
								Mark all as read
							</Button>
						</div>
						<Divider
							orientation='horizontal'
							className={classNames(styles['hr-divider'], styles[`divider-color-${theme}`])}
						/>
						<div className={styles['notifications-body']}>
							{todayNotifications.length > 0 && (
								<div className={styles['notifications-batch']}>
									<Typography className={styles['batch-label']}>Today</Typography>
									<NotificationsList
										items={todayNotifications}
										onToggleNotificationReadFlag={onToggleNotificationReadFlag}
										onDownloadOutput={downloadIfExists}
									/>
								</div>
							)}
							{yesterdayNotifications.length > 0 && (
								<div className={styles['notifications-batch']}>
									<Typography className={styles['batch-label']}>Yesterday</Typography>
									<NotificationsList
										items={yesterdayNotifications}
										onToggleNotificationReadFlag={onToggleNotificationReadFlag}
										onDownloadOutput={downloadIfExists}
									/>
								</div>
							)}
							{viewAll && earlierNotifications.length > 0 && (
								<div className={styles['notifications-batch']}>
									<Typography className={styles['batch-label']}>Earlier</Typography>
									<NotificationsList
										items={earlierNotifications}
										onToggleNotificationReadFlag={onToggleNotificationReadFlag}
										onDownloadOutput={downloadIfExists}
									/>
								</div>
							)}
							{(viewAll || !earlierNotifications.length) && (
								<Typography className={styles['all-shown']}>
									That&apos;s all your notifications from the last 14 days.
								</Typography>
							)}
						</div>
						<Divider
							orientation='horizontal'
							className={classNames(styles['hr-divider'], styles[`divider-color-${theme}`])}
						/>
						<div className={styles['notifications-footer']}>
							{viewMoreEnabled && (
								<Button variant='text' disabled={!viewMoreEnabled} onClick={onToggleViewAll}>
									View {viewAll ? 'Less' : 'More'}
								</Button>
							)}
						</div>
					</Paper>
				</ClickAwayListener>
			)}
		</div>
	);
};

export default Notifications;
