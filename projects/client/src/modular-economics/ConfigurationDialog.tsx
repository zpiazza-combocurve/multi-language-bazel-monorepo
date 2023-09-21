import { faStar, faTrash } from '@fortawesome/pro-regular-svg-icons';
import { faStar as faStarFilled } from '@fortawesome/pro-solid-svg-icons';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@/components/v2';

const ManageConfigurationsDialog = ({ visible, onHide, configurations, onDelete, onToggleDefaultFlag }) => {
	return (
		<Dialog open={visible} onClose={onHide} maxWidth='md' fullWidth>
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
							{configurations?.length ? (
								configurations.map((configuration) => {
									return (
										<TableRow hover key={configuration._id}>
											<TableCell component='th' scope='row'>
												{configuration.name}
											</TableCell>
											<TableCell align='right'>
												{onToggleDefaultFlag && (
													<IconButton
														onClick={() => onToggleDefaultFlag(configuration)}
														tooltipTitle={
															configuration.default
																? 'Remove default mark'
																: 'Set as default'
														}
													>
														{configuration.default ? faStarFilled : faStar}
													</IconButton>
												)}

												{onDelete && (
													<IconButton
														onClick={() => onDelete(configuration)}
														tooltipTitle='Delete Configuration'
													>
														{faTrash}
													</IconButton>
												)}
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
				<Button onClick={onHide}>Close</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ManageConfigurationsDialog;
