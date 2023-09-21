/* eslint react/jsx-key: warn */
import { faFileUpload, faInfoCircle, faTrash } from '@fortawesome/pro-light-svg-icons';
import { Box } from '@material-ui/core';
import _ from 'lodash-es';
import { useCallback, useState } from 'react';

import { useCallbackRef } from '@/components/hooks';
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	IconButton,
	List,
	ListItem,
	ListItemText,
	faIcon,
} from '@/components/v2';
import RadioGroupField from '@/components/v2/misc/RadioGroupField';
import { customErrorAlert, genericErrorAlert } from '@/helpers/alerts';
import { sanitizeFiles } from '@/helpers/fileHelper';
import { uploadFiles } from '@/helpers/files-upload';
import { postApi } from '@/helpers/routing';
import { NotificationType, TaskStatus } from '@/notifications/notification';
import { useUserNotificationCallback } from '@/notifications/useUserNotificationCallback';
import { useCurrentProject } from '@/projects/api';

const acceptable = new Set(['.csv', '.xls', '.xlsx']);

const dataFreqOptions = [
	{
		label: 'Monthly Data',
		value: 'monthly',
	},
	{
		label: 'Daily Data',
		value: 'daily',
	},
];

const ImportForecastDialog = ({ adjustData, clearStore, forecast, onHide, resolve, source, visible }) => {
	const { project } = useCurrentProject();
	const [file, setFile] = useState(null);
	const [dataFreq, setDataFreq] = useState('monthly');

	const handleClose = () => {
		setFile(null);
		onHide();
	};

	const handleDrop = useCallbackRef((attachments) => {
		const checkExtension = (ex) => !acceptable.has(ex.toLowerCase());
		try {
			const { sanitized } = sanitizeFiles([attachments], new Set(), false, true);

			const newFile = sanitized[0];
			newFile.extensionError = checkExtension(newFile.extension);

			setFile(newFile);
		} catch (error) {
			genericErrorAlert(error);
		}
	});

	const importForecastNotificationCallback = useCallback(
		(notification) => {
			if (notification.status === TaskStatus.COMPLETED && notification.extra?.body?.forecastId === forecast._id) {
				clearStore?.();
				adjustData?.();
				resolve(true);
			}
		},
		[adjustData, clearStore, forecast._id, resolve]
	);
	useUserNotificationCallback(NotificationType.FORECAST_IMPORT, importForecastNotificationCallback);

	const startImport = useCallbackRef(() => {
		if (!file) {
			return;
		}

		uploadFiles({
			files: [file],
			removeOnComplete: true,
			onSuccess: async ({ saved }) => {
				const fileId = saved[0]._id;
				postApi(`/forecast/import-cc-forecast/${forecast._id}`, {
					fileId,
					forecastName: forecast.name,
					dataFreq,
					source,
				})
					.then(() => {
						handleClose();
					})
					.catch((error) => {
						genericErrorAlert(error);
					});
			},
			onFailure: async ({ message }) => {
				customErrorAlert(message);
				return false;
			},
			project: project?._id,
		});
	});

	let fileSecondaryText = '';
	if (file) {
		fileSecondaryText = `${file.extension} (${file.mbSize}mb)`;
		if (file.extensionError) {
			fileSecondaryText = `acceptable file types: ${[...acceptable].join(', ')}`;
		}
	}

	const dialogHeader = source === 'cc' ? 'Arps Parameters' : 'PHDWin Parameters';

	return (
		<Dialog fullWidth maxWidth='sm' open={visible}>
			<DialogTitle>
				<Box alignItems='center' display='flex' justifyContent='space-between' flex='1 1 auto'>
					<div>{`Forecast Import - ${dialogHeader}`}</div>

					<IconButton
						as='a'
						href='https://bit.ly/37mhmjJ'
						target='_blank'
						tooltipTitle='How to Import/Export Forecast Parameters'
						tooltipPlacement='top'
					>
						{faInfoCircle}
					</IconButton>
				</Box>
			</DialogTitle>

			<DialogContent
				css={`
					display: flex;
					flex-direction: column;
					row-gap: 1rem;
				`}
			>
				<RadioGroupField
					label='Forecast Generated On:'
					row
					value={dataFreq}
					options={dataFreqOptions}
					onChange={(e) => setDataFreq(e.target.value)}
				/>

				<section>
					<input
						id='import-forecast-upload'
						accept='.xlsx, .xls, .csv'
						type='file'
						hidden
						onChange={(ev) => handleDrop(ev.target.files[0])}
					/>

					<label htmlFor='import-forecast-upload'>
						<Button color='secondary' component='span' size='small' variant='outlined'>
							<span css='display: flex; column-gap: 0.5rem; align-items: center;'>
								{faIcon(faFileUpload)}
								Choose File
							</span>
						</Button>
					</label>

					{file && (
						<div>
							<List>
								<ListItem>
									<ListItemText
										primary={_.truncate(file.name, { length: 43 })}
										secondary={fileSecondaryText}
										title={file.name}
									/>

									<div css='display: flex; column-gap: 1rem; padding-left: 0.5rem'>
										<Divider css='width: 2px;' flexItem orientation='vertical' />
										<IconButton
											color='warning'
											onClick={() => setFile(null)}
											tooltipPlacemen='left'
											tooltipTitle='Remove File'
										>
											{faTrash}
										</IconButton>
									</div>
								</ListItem>
							</List>
						</div>
					)}
				</section>
			</DialogContent>

			<DialogActions>
				<Button onClick={handleClose} size='small'>
					Close
				</Button>

				<Button
					color='secondary'
					disabled={!file || file.extensionError}
					onClick={startImport}
					size='small'
					variant='contained'
				>
					Start Import
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ImportForecastDialog;
