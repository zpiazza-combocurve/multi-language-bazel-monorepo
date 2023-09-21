import {
	faCheck,
	faCircle,
	faCircleNotch,
	faEllipsisH,
	faExclamationTriangle,
	faTimes,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Grid } from '@material-ui/core';
import classNames from 'classnames';
import { formatDuration, intervalToDuration } from 'date-fns';
import { formatDistanceToNow } from 'date-fns/esm';
import dompurify from 'dompurify';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Box, Divider, IconButton, ListItem, ListItemIcon, Menu, MenuItem, Tooltip, Typography } from '@/components/v2';
import { useAlfa } from '@/helpers/alfa';
import { toLocalDateTime } from '@/helpers/dates';
import { theme as styledTheme } from '@/helpers/styled';
import { URLS } from '@/urls';

import Notification, { NotificationType, TaskStatus } from './notification';
import styles from './notifications.module.scss';
import { NOTIFICATIONS_WITH_EXPORT } from './useNotificationDownloadActions';

const HIDE_DYNAMIC_IN_MILLISECONDS = 3000;

const getNotificationIcon = (status, progress) => {
	switch (status) {
		case TaskStatus.QUEUED:
			return (
				<FontAwesomeIcon
					icon={faCircle}
					className={classNames(styles[`status-icon`], styles[`color-${status}`])}
				/>
			);

		case TaskStatus.RUNNING:
			return (
				<span className={styles['running-icon']}>
					<FontAwesomeIcon
						spin
						icon={faCircleNotch}
						className={classNames(styles[`status-icon`], styles[`color-${status}`])}
					/>
					{(progress || progress === 0) && (
						<span className={`${styles.percents} ${styles[`color-${status}`]}`}>
							{progress.toFixed(0)}%
						</span>
					)}
				</span>
			);

		case TaskStatus.COMPLETED:
			return (
				<FontAwesomeIcon
					icon={faCheck}
					className={classNames(styles[`status-icon`], styles[`color-${status}`])}
				/>
			);

		case TaskStatus.FAILED:
			return (
				<FontAwesomeIcon
					icon={faExclamationTriangle}
					className={classNames(styles[`status-icon`], styles[`color-${status}`])}
				/>
			);

		default:
			return null;
	}
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const getBrowseLink = (body: any, output: any, type: NotificationType, actionPerformed?: boolean) => {
	switch (type) {
		case NotificationType.DIAGNOSTICS:
			if (body?.forecastId && body?.projectId) {
				return URLS.project(body.projectId).forecast(body.forecastId).diagnostics;
			}
			return null;

		case NotificationType.FORECAST:
		case NotificationType.MASS_SHIFT_SEGMENTS:
			if (body?.forecastId && body?.projectId) {
				return URLS.project(body.projectId).forecast(body.forecastId).view;
			}
			return null;

		case NotificationType.ROLL_UP:
			if (body?.projectId) {
				if (body?.forecastId) {
					return URLS.project(body.projectId).forecast(body.forecastId).view;
				}
				if (body?.scenarioId) {
					return URLS.project(body.projectId).scenario(body.scenarioId).view;
				}
			}
			return null;

		case NotificationType.COPY_SCENARIO:
		case NotificationType.MERGE_SCENARIOS:
			if (output?.createdScenarioId && body?.projectId) {
				return URLS.project(body.projectId).scenario(output.createdScenarioId).view;
			}
			return null;

		case NotificationType.COPY_FORECAST:
		case NotificationType.MERGE_FORECASTS: {
			const projectId = body?.projectId || output?.projectId;

			if (output?.createdForecastId && projectId) {
				return URLS.project(projectId).forecast(output.createdForecastId).view;
			}
			return null;
		}

		case NotificationType.COPY_LOOKUP_TABLE:
			if (output?.createdLookupTableId && output?.projectId) {
				return URLS.project(output.projectId).scenarioLookupTable(output.createdLookupTableId).edit;
			}
			return null;
		case NotificationType.COPY_EMBEDDED_LOOKUP_TABLE:
			if (output?.createdLookupTableId && output?.projectId) {
				return URLS.project(output.projectId).embeddedLookupTable(output.createdLookupTableId).edit;
			}
			return null;

		case NotificationType.COPY_PROJECT:
			if (output?.createdProjectId) {
				return URLS.project(output.createdProjectId).summaries;
			}
			return null;

		case NotificationType.COPY_SCHEDULE:
			if (output?.createdScheduleId && output?.projectId) {
				return URLS.project(output.projectId).schedule(output.createdScheduleId).view;
			}
			return null;

		case NotificationType.COPY_TYPE_CURVE:
			if (output?.createdTypeCurveId && output?.projectId) {
				return URLS.project(output.projectId).typeCurve(output.createdTypeCurveId).view;
			}
			return null;

		case NotificationType.COPY_FORECAST_LOOKUP_TABLE:
			if (output?.createdForecastLookupTableId && output?.projectId) {
				return URLS.project(output.projectId).forecastLookupTable(output.createdForecastLookupTableId).edit;
			}
			return null;

		case NotificationType.RESTORE_PROJECT:
			if (output?.id) {
				return URLS.project(output.id).summaries;
			}
			return null;

		case NotificationType.ECONOMICS:
			if (body?.scenarioId && body?.projectId) {
				return URLS.project(body.projectId).scenario(body.scenarioId).view;
			}
			return null;

		case NotificationType.FORECAST_CONVERT_TYPE:
			if (body?.newForecastId && body?.projectId) {
				return URLS.project(body.projectId).forecast(body.newForecastId).view;
			}
			return null;

		case NotificationType.SCHEDULE_ORDER_IMPORT:
			if (body?.scheduleId && body?.projectId) {
				return URLS.project(body.projectId).schedule(body.scheduleId).view;
			}
			return null;

		case NotificationType.SCHEDULE_RUN:
			if (body?.projectId) {
				if (body?.scheduleId) {
					return URLS.project(body.projectId).schedule(body.scheduleId).output;
				}
			}
			return null;

		case NotificationType.VALIDATE_CHANGE_WELL_IDENTIFIERS:
			if (body?.path && actionPerformed === false) {
				return body.path;
			}
			return null;

		default:
			return null;
	}
};

const humanDuration = (start, end) =>
	formatDuration(
		intervalToDuration({
			start,
			end,
		})
	);

const getTimestamp = (createdAt: Date, updatedAt?: Date) =>
	formatDistanceToNow(updatedAt || createdAt, { addSuffix: true });

const getDuration = (item: Notification) => {
	const duration = humanDuration(
		new Date(item.createdAt),
		item.status === TaskStatus.COMPLETED || item.status === TaskStatus.FAILED
			? item.updatedAt ?? new Date()
			: new Date()
	);

	//date-fns returns empty string if duration is less than a second
	return duration !== '' ? duration : 'less than a second';
};

const NotificationListItem = ({
	item,
	onToggleNotificationReadFlag,
	onHideDynamic,
	onDownloadOutput,
}: {
	item: Notification;
	onToggleNotificationReadFlag: (id: string) => void;
	onHideDynamic?: (id: string, close: boolean) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onDownloadOutput?: (type: NotificationType, extra: any) => any;
}) => {
	const navigate = useNavigate();
	const [anchorEl, setAnchorEl] = useState(null);
	const [faded, setFaded] = useState(false);
	const [duration, setDuration] = useState('');
	const { theme } = useAlfa();
	const optionsOpened = Boolean(anchorEl);

	const onOptionsClick = (e) => {
		e.skipBrowse = true;
		setAnchorEl(e.currentTarget);
	};

	const onCloseOptions = () => {
		setAnchorEl(null);
	};

	const onHideDynamicPopup = useCallback(
		(close = true) => {
			if (item.dynamic) {
				onHideDynamic?.(item.id, close);
			}
		},
		[item.dynamic, item.id, onHideDynamic]
	);

	const onCloseDynamic = useCallback(() => {
		onHideDynamicPopup(true);
	}, [onHideDynamicPopup]);

	const onTransitionEnd = useCallback(() => {
		setFaded(true);
	}, []);

	const browseLink =
		item.status === TaskStatus.COMPLETED
			? getBrowseLink(item.extra?.body, item.extra?.output, item.type, item.actionPerformed)
			: null;

	const browse = (e) => {
		// stopPropagation not working as expected
		if (!e.skipBrowse) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			navigate(browseLink!);
			onCloseOptions();
		}
	};

	let description = item.description;

	switch (item.status) {
		case TaskStatus.COMPLETED:
			if (item.extra?.output && typeof item.extra.output === 'string') {
				description = item.extra.output;
			}
			break;

		case TaskStatus.FAILED:
			if (item.extra?.error) {
				description = item.extra.error;
			}
			break;

		default:
			break;
	}

	const updateDuration = () => {
		setDuration(getDuration(item));
	};

	useEffect(() => {
		if (item.dynamic) {
			setTimeout(() => {
				onHideDynamicPopup(false);
			}, HIDE_DYNAMIC_IN_MILLISECONDS);
		}
	}, [onHideDynamicPopup, item.dynamic]);

	if (faded) {
		return null;
	}

	return (
		<ListItem
			id={item.id}
			key={item.id}
			className={classNames(
				styles['notification-list-item'],
				item.dynamic && item.hidden ? styles['dynamic-hidden'] : '',
				!item.read ? styles.unread : '',
				styles[`outline-color-${theme}`],
				browseLink ? styles.browseable : ''
			)}
			onClick={browseLink ? browse : undefined}
			onTransitionEnd={item.dynamic && item.hidden ? onTransitionEnd : undefined}
		>
			<ListItemIcon>{getNotificationIcon(item.status, item.progress)}</ListItemIcon>
			<Divider orientation='vertical' className={styles[`divider-color-${theme}`]} />
			<Box className={styles.details}>
				<div className={styles['details-row']}>
					<div className={styles.detail}>
						<Typography
							noWrap
							css={`
								font-weight: 500;
								max-width: 300px;
							`}
						>
							{item.title}
						</Typography>
					</div>
					<div className={classNames(styles.detail, styles.options)}>
						{item.dynamic && (
							<Typography className={styles.timestamp}>
								{getTimestamp(item.createdAt, item.updatedAt)}
							</Typography>
						)}
						{onHideDynamic && (
							<FontAwesomeIcon
								icon={faTimes}
								onClick={onCloseDynamic}
								className={styles['hide-dynamic']}
							/>
						)}
						{!item.dynamic && (
							<>
								<IconButton tooltipTitle='Options' id={`options-${item.id}`} onClick={onOptionsClick}>
									{faEllipsisH}
								</IconButton>
								<Menu
									id='notification-menu'
									anchorEl={anchorEl}
									open={optionsOpened}
									onClose={onCloseOptions}
								>
									<MenuItem
										key='state'
										onClick={(e) => {
											e.skipBrowse = true;
											onToggleNotificationReadFlag(item.id);
											onCloseOptions();
											onCloseDynamic();
										}}
									>
										Mark as {item.read ? 'Unread' : 'Read'}
									</MenuItem>
									{onDownloadOutput &&
										item.status === TaskStatus.COMPLETED &&
										NOTIFICATIONS_WITH_EXPORT.indexOf(item.type) > -1 && (
											<MenuItem
												key='download'
												onClick={(e) => {
													e.skipBrowse = true;
													onDownloadOutput(item.type, item.extra);
													onCloseOptions();
												}}
											>
												Download
											</MenuItem>
										)}
								</Menu>
							</>
						)}
					</div>
				</div>
				<div
					className={classNames(
						styles['details-row'],
						!item.dynamic ? styles['details-row-description-expanded'] : ''
					)}
				>
					<div className={classNames(styles.detail, item.dynamic ? styles['dynamic-description'] : '')}>
						<Typography
							css={`
								text-overflow: ellipsis;
								overflow: hidden;
								width: 300px;
								text-align: left;
							`}
							noWrap={item.dynamic}
						>
							{/* eslint-disable-next-line react/no-danger */}
							<div dangerouslySetInnerHTML={{ __html: dompurify.sanitize(description) }} />
						</Typography>
					</div>
					{!item.dynamic && (
						<Box mt={1} display='flex' justifyContent='flex-end'>
							<Tooltip
								onOpen={updateDuration}
								placement='left'
								enterDelay={0}
								title={
									<Grid
										container
										css={`
											width: 300px;
										`}
									>
										<Grid spacing={2} container item>
											<Grid item xs={4}>
												<Typography color='inherit' align='right'>
													Start Time:
												</Typography>
											</Grid>
											<Grid item xs={8}>
												<Typography color='inherit'>
													{toLocalDateTime(item.createdAt)}
												</Typography>
											</Grid>
										</Grid>
										{(item.status === TaskStatus.COMPLETED ||
											item.status === TaskStatus.FAILED) && (
											<Grid spacing={2} container item>
												<Grid item xs={4}>
													<Typography color='inherit' align='right'>
														End Time:
													</Typography>
												</Grid>
												<Grid item xs={8}>
													<Typography color='inherit'>
														{toLocalDateTime(item.updatedAt)}
													</Typography>
												</Grid>
											</Grid>
										)}

										<Grid spacing={2} container item>
											<Grid item xs={4}>
												<Typography color='inherit' align='right'>
													Duration:
												</Typography>
											</Grid>
											<Grid item xs={8}>
												<Typography color='inherit'>{duration}</Typography>
											</Grid>
										</Grid>
									</Grid>
								}
							>
								<Typography
									display='inline'
									css={{
										color: styledTheme.textColorOpaque,
									}}
								>
									{getTimestamp(item.createdAt, item.updatedAt)}
								</Typography>
							</Tooltip>
						</Box>
					)}
				</div>
			</Box>
		</ListItem>
	);
};

export default NotificationListItem;
