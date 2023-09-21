/* eslint react/jsx-key: warn */
import { faEllipsisV, faInfo, faTrash } from '@fortawesome/pro-regular-svg-icons';
import {
	CardContent,
	DialogContent,
	Divider,
	ListItemIcon,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	useTheme,
} from '@material-ui/core';
import produce from 'immer';
import { Fragment, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from 'react-query';
import { CSSProp } from 'styled-components';

import { usePermissionsBuilder } from '@/access-policies/usePermissions';
import { getTaggingProp } from '@/analytics/tagging';
import {
	Button,
	Card,
	Dialog,
	DialogActions,
	DialogTitle,
	Icon,
	List,
	ListItem,
	ListItemText,
	MenuIconButton,
	MenuItem,
	RHFRadioGroupField,
	RHFReactDatePicker,
	RHFSelectField,
	Switch,
	Typography,
} from '@/components/v2';
import { confirmationAlert, genericErrorAlert, useLoadingBar } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { useDialog } from '@/helpers/dialog';
import { getNameOrEmail } from '@/helpers/user';
import { PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/inpt-shared/access-policies/shared';
import restoreDialogAPI from '@/projects/RestoreAPI';

import shareableCodesApi from './api';

const humanDate = (dateStr) => new Date(dateStr).toLocaleDateString();
const humanTime = (dateStr) => new Date(dateStr).toLocaleString();

enum VERSION_TYPES {
	CURRENT = 'current',
	ARCHIVED = 'archived',
}

interface CreateDialogValues {
	expireAt: string | null;
	versionOption: VERSION_TYPES;
	archivedProjectId: string | null;
}

const createDialogInitialValues: CreateDialogValues = {
	expireAt: null,
	versionOption: VERSION_TYPES.CURRENT,
	archivedProjectId: null,
};

const CreateShareableCodeDialog = ({ resolve, projectArchives, visible, ...props }) => {
	const {
		control,
		watch,
		handleSubmit: withFormValues,
		formState: { isValid, isSubmitted },
	} = useForm({
		defaultValues: createDialogInitialValues,
	});

	const menuItems = projectArchives.map(({ versionName, _id }) => ({
		value: _id,
		label: versionName,
	}));

	const versionOptions = useMemo(
		() => [
			{
				label: 'Current',
				value: VERSION_TYPES.CURRENT,
			},
			{
				label: 'Archived',
				value: VERSION_TYPES.ARCHIVED,
				disabled: projectArchives.length === 0,
			},
		],
		[projectArchives]
	);

	const handleSubmit = withFormValues((values) => resolve(values));

	return (
		<Dialog open={visible} onClose={() => resolve(null)} fullWidth {...props}>
			<DialogTitle>Create sharing code</DialogTitle>
			<DialogContent
				dir='column'
				css={`
					display: flex;
					flex-direction: column;
					row-gap: ${(props) => props.theme.spacing(1)}px;
				`}
			>
				<RHFRadioGroupField
					control={control}
					label='Version'
					options={versionOptions}
					name='versionOption'
					row
					required
				/>
				<RHFSelectField
					label='Select archived version'
					name='archivedProjectId'
					control={control}
					menuItems={menuItems}
					disabled={watch('versionOption') !== VERSION_TYPES.ARCHIVED}
					inline
				/>
				<RHFReactDatePicker
					control={control}
					label='Expiration Date'
					name='expireAt'
					portalId='expiration-date-portal'
				/>
				<div
					id='expiration-date-portal'
					css={`
						position: fixed;
						z-index: 1;
					`}
				/>
				<Typography variant='body2' color='textSecondary'>
					Anyone with this code can import the project
				</Typography>
			</DialogContent>
			<DialogActions>
				<Button onClick={() => resolve(null)}>Cancel</Button>
				<Button
					variant='contained'
					color='primary'
					disabled={!isValid && isSubmitted}
					onClick={handleSubmit}
					{...getTaggingProp('shareableCode', 'create')}
				>
					Create
				</Button>
			</DialogActions>
		</Dialog>
	);
};

const MoreInfoDialogContainer = ({ resolve, shareableCode, visible, ...props }) => {
	return (
		<Dialog onClose={() => resolve(null)} open={visible} fullWidth {...props}>
			<DialogTitle>Code used by</DialogTitle>
			<DialogContent>
				<List>
					{shareableCode.imports.length > 0 ? (
						shareableCode.imports.map(({ createdAt, user, tenant }) => (
							<ListItem key={user.email}>
								<ListItemText
									primary={`${getNameOrEmail(user)} from ${tenant}`}
									secondary={`at ${humanTime(createdAt)}`}
								/>
							</ListItem>
						))
					) : (
						<ListItem>
							<ListItemText primary='No uses yet' />
						</ListItem>
					)}
				</List>
			</DialogContent>
			<DialogActions>
				<Button onClick={() => resolve(null)}>Close</Button>
			</DialogActions>
		</Dialog>
	);
};

const DeleteDialogContainer = ({ resolve, shareableCode, visible, ...props }) => {
	return (
		<Dialog title='Are you sure?' onClose={() => resolve(null)} open={visible} {...props}>
			<DialogTitle>Are you sure?</DialogTitle>
			<DialogContent>
				<Typography variant='body1'>Are you sure you want to delete this code?</Typography>
				<Typography variant='body2'>{shareableCode.code}</Typography>
			</DialogContent>
			<DialogActions>
				<Button onClick={() => resolve(null)}>Cancel</Button>
				<Button onClick={() => resolve(true)} color='error'>
					Delete
				</Button>
			</DialogActions>
		</Dialog>
	);
};

const ShareableDataTableMenu = ({ shareableCode, deleteShareableCode, viewShareableCode }) => {
	const { canDelete: canDeleteShareableCode, canView: canViewShareableCode } = usePermissionsBuilder(
		SUBJECTS.ShareableCodes
	);
	const menuItems = [
		{
			leftIcon: <Icon color='primary'>{faInfo}</Icon>,
			primaryText: 'More info',
			handleOnClick: () => viewShareableCode(shareableCode._id),
			disabled: !canViewShareableCode(shareableCode),
		},
		{
			leftIcon: <Icon color='error'>{faTrash}</Icon>,
			primaryText: 'Delete',
			handleOnClick: () => deleteShareableCode(shareableCode._id),
			disabled: !canDeleteShareableCode(shareableCode),
		},
	];

	return (
		<MenuIconButton icon={faEllipsisV} size='small'>
			{menuItems.map((menuItem, idx) => (
				<Fragment key={idx}>
					<MenuItem key={menuItem.primaryText} onClick={menuItem.handleOnClick}>
						<ListItemIcon>{menuItem.leftIcon}</ListItemIcon>
						<ListItemText>{menuItem.primaryText}</ListItemText>
					</MenuItem>
					{idx !== menuItems.length - 1 && <Divider dir='horizontal' />}
				</Fragment>
			))}
		</MenuIconButton>
	);
};

const ShareableCodeRow = ({
	shareableCode,
	findArchivedProjectById,
	index,
	updateShareableCode,
	deleteShareableCode,
	viewShareableCode,
}) => {
	const { project } = useAlfa();

	const {
		_id,
		createdAt,
		code,
		user,
		expireAt,
		enabled,
		imports,
		archivedProject: archivedProjectId,
	} = shareableCode;

	const { canUpdate: canUpdateShareableCode } = usePermissionsBuilder(SUBJECTS.ShareableCodes);

	const [isUpdating, setIsUpdating] = useState(false);

	const enabledSwitchOnChange = async (checked) => {
		setIsUpdating(true);

		updateShareableCode(_id, {
			enabled: checked,
		});

		try {
			await shareableCodesApi.updateOne(project?._id, _id, {
				enabled: checked,
			});

			confirmationAlert('Changes saved');
		} catch (e) {
			// rollback
			updateShareableCode(_id, {
				enabled: !checked,
			});

			genericErrorAlert(e);
		}

		setIsUpdating(false);
	};

	const archivedProject = findArchivedProjectById(archivedProjectId);
	const version = archivedProject ? `Archived: ${archivedProject.versionName}` : 'Current';

	return (
		<TableRow>
			<TableCell>{index + 1}</TableCell>
			<TableCell>{code}</TableCell>
			<TableCell>{version}</TableCell>
			<TableCell>{getNameOrEmail(user)}</TableCell>
			<TableCell>{humanDate(createdAt)}</TableCell>
			<TableCell>{expireAt ? humanDate(expireAt) : 'Never'}</TableCell>
			<TableCell>{imports.length}</TableCell>
			<TableCell>
				<Switch
					checked={enabled}
					disabled={isUpdating || !canUpdateShareableCode(shareableCode)}
					onChange={(ev) => enabledSwitchOnChange(ev.target.checked)}
				/>
			</TableCell>
			<TableCell>
				<ShareableDataTableMenu
					shareableCode={shareableCode}
					deleteShareableCode={deleteShareableCode}
					viewShareableCode={viewShareableCode}
				/>
			</TableCell>
		</TableRow>
	);
};

const ShareableCodesTable = ({
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	shareableCodes = [] as any[],
	findArchivedProjectById,
	updateShareableCode,
	viewShareableCode,
	deleteShareableCode,
}) => {
	return (
		<TableContainer>
			<Table>
				<TableHead>
					<TableRow>
						<TableCell>#</TableCell>
						<TableCell>Code</TableCell>
						<TableCell>Version</TableCell>
						<TableCell>Created by</TableCell>
						<TableCell>Created at</TableCell>
						<TableCell>Expires at</TableCell>
						<TableCell>Times used</TableCell>
						<TableCell>Active</TableCell>
						<TableCell>Actions</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{shareableCodes.map((shareableCode, index) => (
						<ShareableCodeRow
							key={shareableCode._id}
							index={index}
							updateShareableCode={updateShareableCode}
							viewShareableCode={viewShareableCode}
							deleteShareableCode={deleteShareableCode}
							shareableCode={shareableCode}
							findArchivedProjectById={findArchivedProjectById}
						/>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

const ShareableCodes = () => {
	const { project } = useAlfa();
	const theme = useTheme();

	const [createShareableCodeDialog, showCreateShareableCodeDialog] = useDialog(CreateShareableCodeDialog);
	const [deleteShareableCodeDialog, showDeleteShareableCodeDialog] = useDialog(DeleteDialogContainer);
	const [moreInfoDialog, showMoreInfoDialog] = useDialog(MoreInfoDialogContainer);

	const {
		shareableCodes,
		isLoading: loadingShareableCodes,
		mutate: setShareableCodes,
	} = shareableCodesApi.useShareableCodes(project?._id);

	const { data: archivedProjectsResults, isLoading: loadingProjectArchives } = useQuery(
		['shareable-codes', 'archived-projects'],
		() =>
			restoreDialogAPI.getArchives({
				projectId: project?._id,
			})
	);

	const createShareableCode = async () => {
		const results = (await showCreateShareableCodeDialog({
			projectArchives: archivedProjectsResults?.items,
		})) as CreateDialogValues;

		if (!results) {
			return;
		}

		const { expireAt, versionOption, archivedProjectId } = results;

		const shareableCode = await shareableCodesApi.createOne(project?._id, {
			expireAt,
			versionOption,
			archivedProjectId,
		});

		setShareableCodes(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			produce((draft: any) => {
				draft.push({ imports: [], ...shareableCode });
			})
		);
	};

	const updateShareableCode = (shareableCodeId, params) => {
		setShareableCodes(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			produce((draft: any) => {
				const shareableCodeIndex = draft.findIndex(({ _id }) => _id === shareableCodeId);

				if (shareableCodeIndex !== -1) {
					Object.assign(draft[shareableCodeIndex], params);
				}
			})
		);
	};

	const deleteShareableCode = async (shareableCodeId) => {
		const shareableCode = shareableCodes.find(({ _id }) => _id === shareableCodeId);

		const results = await showDeleteShareableCodeDialog({
			shareableCode,
		});

		if (!results) {
			return;
		}

		try {
			await shareableCodesApi.deleteOne(project?._id, shareableCodeId);

			confirmationAlert('Sharing code deleted');

			setShareableCodes(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				produce((draft: any) => {
					const shareableCodeIndex = draft.findIndex(({ _id }) => _id === shareableCodeId);

					if (shareableCodeIndex !== -1) {
						draft.splice(shareableCodeIndex, 1);
					}
				})
			);
		} catch (e) {
			genericErrorAlert(e);
		}
	};

	const viewShareableCode = async (shareableCodeId) => {
		const shareableCode = shareableCodes.find(({ _id }) => _id === shareableCodeId);

		showMoreInfoDialog({
			shareableCode,
		});
	};

	const findArchivedProjectById = (archiveId) => archivedProjectsResults?.items.find(({ _id }) => _id === archiveId);

	useLoadingBar(loadingShareableCodes || loadingProjectArchives);

	const { canCreate: canCreateShareableCode } = usePermissionsBuilder(SUBJECTS.ShareableCodes);
	const canCreateShareableCodes = canCreateShareableCode({ project: project?._id });

	return (
		<div
			css={`
				margin: 1rem;
			`}
		>
			{createShareableCodeDialog}
			{deleteShareableCodeDialog}
			{moreInfoDialog}
			{!(loadingShareableCodes || loadingProjectArchives) && (
				<Card raised className='md-block-centered'>
					<CardContent>
						<div
							css={`
								display: flex;
								align-items: center;
								justify-content: space-between;
								width: 100%;
							`}
						>
							<div>
								<Typography css={{ ...theme.typography.h4 } as CSSProp}>Sharing Codes</Typography>
								<Typography
									css={
										{
											...theme.typography.subtitle2,
											color: theme.palette.text.hint,
										} as CSSProp
									}
								>
									View, Add, Delete, Edit Sharing Codes
								</Typography>
							</div>
							<Button
								color='primary'
								variant='contained'
								onClick={createShareableCode}
								disabled={!canCreateShareableCodes && PERMISSIONS_TOOLTIP_MESSAGE}
							>
								Create Code
							</Button>
						</div>
						<div
							css={`
								margin-top: ${(props) => props.theme.spacing(4)}px;
							`}
						>
							{shareableCodes.length > 0 ? (
								<ShareableCodesTable
									shareableCodes={shareableCodes}
									deleteShareableCode={deleteShareableCode}
									viewShareableCode={viewShareableCode}
									updateShareableCode={updateShareableCode}
									findArchivedProjectById={findArchivedProjectById}
								/>
							) : (
								<p>You have not created any code yet.</p>
							)}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
};

export default ShareableCodes;
