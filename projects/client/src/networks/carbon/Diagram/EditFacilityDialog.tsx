import { yupResolver } from '@hookform/resolvers/yup';
import { Dialog, DialogActions, DialogContent, DialogTitle, Grid } from '@material-ui/core';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';

import { Placeholder } from '@/components';
import { Button, RHFForm, Stack } from '@/components/v2';
import { DialogProps } from '@/helpers/dialog';

import NetworkModelFacilityView from '../Facility/View';
import { useNetworkModelFacilityQuery } from '../api';
import { FacilitySchema } from '../schemas';
import { FacilityNode, NetworkModelFacility } from '../types';
import { FormTextField } from './forms/shared-components';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
interface EditEdgeDialogProps extends DialogProps<any> {
	node: FacilityNode;
	facilityId: string;
}

function EditFacilityDialog({ node, visible, onHide, resolve, facilityId }: EditEdgeDialogProps) {
	const form = useForm({
		defaultValues: {
			...node.params,
			name: node.name,
			description: node.description,
		},
		resolver: yupResolver(FacilitySchema),
	});
	const { handleSubmit: formSubmit } = form;

	const handleSave = useCallback(
		(values) => {
			resolve(values);
		},
		[resolve]
	);

	const networkModelFacilityQuery = useNetworkModelFacilityQuery(facilityId);

	if (networkModelFacilityQuery.isLoading) {
		return <Placeholder loading main />;
	}

	return (
		<Dialog open={visible} onClose={onHide} maxWidth='xl' fullWidth disableEnforceFocus>
			<DialogTitle>Edit Facility</DialogTitle>
			<DialogContent>
				<RHFForm form={form} onSubmit={handleSave}>
					<Stack spacing={2}>
						<Grid container spacing={2}>
							<Grid item xs={6}>
								<FormTextField name='name' label='Name' />
							</Grid>
							<Grid item xs={6}>
								<FormTextField name='description' label='Description' />
							</Grid>
						</Grid>
					</Stack>
				</RHFForm>
				<NetworkModelFacilityView
					fixedHeight='75vh'
					networkModel={networkModelFacilityQuery.data as NetworkModelFacility}
					afterSave={formSubmit(handleSave)}
					invalidateNetworkModel={networkModelFacilityQuery.invalidate}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide} color='secondary' variant='contained'>
					Cancel
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default EditFacilityDialog;
