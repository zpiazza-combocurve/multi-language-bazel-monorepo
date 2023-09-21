import { faFileUpload, faTrash } from '@fortawesome/pro-regular-svg-icons';
import { Component } from 'react';
import { FileInput } from 'react-md';

import { FontIcon } from '@/components';
import {
	Button,
	CheckboxField,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormGroup,
	IconButton,
	List,
	ListItem,
	ListItemSecondaryAction,
	ListItemText,
} from '@/components/v2';
import { genericErrorAlert } from '@/helpers/alerts';
import { sanitizeFiles } from '@/helpers/fileHelper';
import { uploadFiles } from '@/helpers/files-upload';
import { postApi } from '@/helpers/routing';
import { TaskStatus } from '@/notifications/notification';
import { withCurrentProject } from '@/projects/api';

const acceptable = new Set(['.csv', '.xls', '.xlsx']);

class CCImportDialog extends Component {
	state = {
		file: false,
		newQualifier: false,
		allUnique: true,
	};

	_isMounted = false;

	componentDidMount() {
		this._isMounted = true;
	}

	componentWillUnmount() {
		this._isMounted = false;
	}

	// eslint-disable-next-line no-promise-executor-return -- TODO eslint fix later
	SetState = (obj) => new Promise((r) => (!this._isMounted ? r('not mounted') : this.setState(obj, r)));

	onHide = async () => {
		const { hideDialog } = this.props;

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		await this.SetState({ file: false });
		hideDialog();
	};

	toggleQualifier = () => {
		const { newQualifier } = this.state;
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ newQualifier: !newQualifier });
	};

	toggleAllUnique = () => {
		const { allUnique } = this.state;
		// eslint-disable-next-line new-cap -- TODO eslint fix later
		this.SetState({ allUnique: !allUnique });
	};

	handleDrop = async (attachments) => {
		const checkExtension = (ex) => !acceptable.has(ex.toLowerCase());

		try {
			const { sanitized } = sanitizeFiles([attachments], new Set(), false, true);

			const file = sanitized[0];
			file.extensionError = checkExtension(file.extension);

			// eslint-disable-next-line new-cap -- TODO eslint fix later
			await this.SetState({ file });
		} catch (e) {
			genericErrorAlert(e);
		}
	};

	startImport = () => {
		const { ccImportDialog, scenarioId, refetch, handleChangeQualifier, buildCurrent, setCallback, project } =
			this.props;
		const { assumptionKey, assumptionName } = ccImportDialog;
		const { file, newQualifier, allUnique } = this.state;

		if (!file) {
			return;
		}

		uploadFiles({
			files: [file],
			removeOnComplete: true,
			project: project?._id,
			onSuccess: async ({ saved }) => {
				const fileId = saved[0]._id;

				const importScenarioNotificationNewCallback = () => (notification) => {
					if (
						notification.status === TaskStatus.COMPLETED &&
						notification.extra?.body?.scenarioId === scenarioId &&
						notification.extra?.body?.fileId === fileId
					) {
						if (newQualifier) {
							handleChangeQualifier(assumptionKey, notification.extra.body.qualifierKey);
						} else {
							buildCurrent();
						}
					}
				};

				setCallback(importScenarioNotificationNewCallback);

				postApi('/file-imports/cc-cc-import', {
					fileId,
					scenarioId,
					newQualifier,
					allUnique,
					assumptionKey,
					assumptionName,
					// eslint-disable-next-line new-cap -- TODO eslint fix later
					timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				})
					.then(async () => {
						// eslint-disable-next-line new-cap -- TODO eslint fix later
						await this.SetState({ assumptionKey });
					})
					.catch((error) => {
						genericErrorAlert(error);
					})
					.finally(() => {
						this.onHide();
						refetch();
					});
			},
			onFailure: () => {
				genericErrorAlert({});
				return false;
			},
		});
	};

	render() {
		const { ccImportDialog } = this.props;
		const { newQualifier, allUnique, file } = this.state;
		const { visible, assumptionName } = ccImportDialog;
		let fileSecondaryText = '';

		if (file) {
			fileSecondaryText = `${file.extension} (${file.mbSize}mb)`;
			if (file.extensionError) {
				fileSecondaryText = `acceptable file types: ${[...acceptable].join(', ')}`;
			}
		}

		return (
			// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
			<Dialog open={visible} onClose={this.onHide}>
				<DialogTitle>CSV/Excel Import - {assumptionName}</DialogTitle>
				<DialogContent>
					<FormGroup>
						<CheckboxField
							label='New Qualifier'
							checked={newQualifier}
							// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
							onChange={this.toggleQualifier}
							fullWidth
						/>

						<CheckboxField
							label='Generate All Unique Assumptions'
							checked={allUnique}
							// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
							onChange={this.toggleAllUnique}
							fullWidth
						/>
					</FormGroup>

					<FileInput
						flat
						primary
						iconBefore
						allowDuplicates
						label='Choose File'
						onChange={this.handleDrop}
						labelClassName='unset-text-transform'
						id='cc-import-select-file'
						className='file-input-btn on-hover-paper-1 primary-bot-border'
						icon={<FontIcon>{faFileUpload}</FontIcon>}
					/>

					{file && (
						<List>
							<ListItem>
								<ListItemText
									css={`
										word-break: break-all;
									`}
									primary={file.name}
									secondary={fileSecondaryText}
								/>
								<ListItemSecondaryAction>
									<IconButton
										edge='end'
										tooltipTitle='Remove File'
										// eslint-disable-next-line new-cap -- TODO eslint fix later
										onClick={() => this.SetState({ file: false })}
										color='error'
									>
										{faTrash}
									</IconButton>
								</ListItemSecondaryAction>
							</ListItem>
						</List>
					)}
				</DialogContent>
				<DialogActions>
					{/* eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later */}
					<Button onClick={this.onHide}>Cancel</Button>
					{/* eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later */}
					<Button color='primary' onClick={this.startImport} disabled={!file || file.extensionError}>
						Start Import
					</Button>
				</DialogActions>
			</Dialog>
		);
	}
}

export default withCurrentProject(CCImportDialog);
