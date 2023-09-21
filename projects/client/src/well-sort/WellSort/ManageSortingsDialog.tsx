import { faEdit, faStar, faTrash } from '@fortawesome/pro-regular-svg-icons';
import { faStar as faStarFilled } from '@fortawesome/pro-solid-svg-icons';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core';
import { produce } from 'immer';
import { useState } from 'react';
import { useMutation } from 'react-query';

import { PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/access-policies/Can';
import usePermissions from '@/access-policies/usePermissions';
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FocusableTextField,
	IconButton,
} from '@/components/v2';
import { confirmationAlert } from '@/helpers/alerts';
import { putApi } from '@/helpers/routing';
import { hasNonWhitespace } from '@/helpers/text';
import { useSortings } from '@/well-sort/WellSort/api';

export function ManageSortingsDialog({
	visible,
	onClose,
	sortings,
	onEdit,
	onDelete,
	onSetDefault,
	projectId,
}: {
	visible: boolean;
	onClose(): void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	sortings: any[];
	onEdit(sortingId: Inpt.ObjectId): void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onDelete(sorting: any): void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onSetDefault(sorting: any, remove: boolean): void;
	projectId: Inpt.ObjectId<'project'>;
}) {
	const [labels, setLabels] = useState({});

	const { reload } = useSortings(projectId);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const { mutate: rename } = useMutation((sorting: any) => putApi(`/sortings/${sorting._id}`, sorting), {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		onSuccess: () => confirmationAlert() as any, // TODO check why this is failing without `as any`
		onSettled: () => reload(),
	});

	const { canUpdate: canUpdateSortings, canDelete: canDeleteSortings } = usePermissions(SUBJECTS.Sortings, projectId);

	return (
		<Dialog open={visible} onClose={onClose} maxWidth='md' fullWidth>
			<DialogTitle>Manage Well Sortings</DialogTitle>
			<DialogContent>
				<TableContainer>
					<Table size='small'>
						<TableHead>
							<TableRow>
								<TableCell>Name</TableCell>
								<TableCell align='right'>Actions</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{sortings?.length ? (
								sortings.map((sorting) => {
									return (
										<TableRow hover key={sorting.id}>
											<TableCell component='th' scope='row'>
												{canUpdateSortings ? (
													<FocusableTextField
														defaultValue={labels[sorting.id] ?? sorting.label}
														getError={(value) =>
															!hasNonWhitespace(value) && "Name can't be empty"
														}
														onChange={(value) =>
															setLabels(
																produce((draft) => {
																	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
																	rename({ _id: sorting.id, name: value } as any);
																	draft[sorting.id] = value;
																})
															)
														}
													/>
												) : (
													sorting.label
												)}
											</TableCell>
											<TableCell align='right'>
												<IconButton
													onClick={() => onSetDefault(sorting, sorting.isDefault)}
													tooltipTitle={
														sorting.isDefault ? 'Remove default mark' : 'Set as default'
													}
												>
													{sorting.isDefault ? faStarFilled : faStar}
												</IconButton>

												<IconButton
													disabled={!canUpdateSortings && PERMISSIONS_TOOLTIP_MESSAGE}
													onClick={() => onEdit(sorting.id)}
													tooltipTitle='Edit sorting'
												>
													{faEdit}
												</IconButton>

												<IconButton
													disabled={!canDeleteSortings && PERMISSIONS_TOOLTIP_MESSAGE}
													onClick={() => onDelete(sorting)}
													tooltipTitle='Delete sorting'
												>
													{faTrash}
												</IconButton>
											</TableCell>
										</TableRow>
									);
								})
							) : (
								<TableRow hover>
									<TableCell colSpan={2}>No saved sortings</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</TableContainer>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Close</Button>
			</DialogActions>
		</Dialog>
	);
}
