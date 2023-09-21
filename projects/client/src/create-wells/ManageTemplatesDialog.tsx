import { faStar, faTrash } from '@fortawesome/pro-regular-svg-icons';
import { faStar as faStarFilled } from '@fortawesome/pro-solid-svg-icons';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@/components/v2';

import { CreateGenericWellsModel } from './models';

const ManageTemplatesDialog = ({
	visible,
	onClose,
	templates,
	onDelete,
	onToggleDefaultFlag,
}: {
	visible: boolean;
	onClose(): void;
	templates: CreateGenericWellsModel[] | undefined;
	onDelete(template: CreateGenericWellsModel): void;
	onToggleDefaultFlag(template: CreateGenericWellsModel): void;
}) => {
	return (
		<Dialog open={visible} onClose={onClose} maxWidth='md' fullWidth>
			<DialogTitle>Manage Configurations</DialogTitle>
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
							{templates?.length ? (
								templates.map((template) => {
									return (
										<TableRow hover key={template._id}>
											<TableCell component='th' scope='row'>
												{template.name}
											</TableCell>
											<TableCell align='right'>
												<IconButton
													onClick={() => onToggleDefaultFlag(template)}
													tooltipTitle={
														template.default ? 'Remove default mark' : 'Set as default'
													}
												>
													{template.default ? faStarFilled : faStar}
												</IconButton>

												<IconButton
													onClick={() => onDelete(template)}
													tooltipTitle='Delete Configuration'
												>
													{faTrash}
												</IconButton>
											</TableCell>
										</TableRow>
									);
								})
							) : (
								<TableRow hover>
									<TableCell colSpan={2}>No saved Configurations</TableCell>
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
};

export default ManageTemplatesDialog;
