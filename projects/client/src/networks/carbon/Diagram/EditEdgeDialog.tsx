import { yupResolver } from '@hookform/resolvers/yup';
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button, RHFForm, RHFTextField } from '@/components/v2';
import { DialogProps } from '@/helpers/dialog';

import { FacilityEdgeSchema, StandardEdgeSchema } from '../schemas';
import { AnyEdge, EdgeType, StandardEdge as StandardEdgeType } from '../types';
import StandardEdgeForm from './forms/StandardEdgeForm';
import { useTimeSeriesInputStore } from './helpers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
interface EditEdgeDialogProps extends DialogProps<any> {
	edge: AnyEdge;
	type: EdgeType;
}

const facilityLinkForm = () => <RHFTextField name='name' fullWidth />;

function EditEdgeDialog({ visible, onHide, resolve, edge, type }: EditEdgeDialogProps) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const form = useForm<any>({
		defaultValues: {
			name: edge.name,
			description: edge.description,
			...(type === EdgeType.standard && { ...(edge as StandardEdgeType).params }),
		},
		resolver: yupResolver(type === EdgeType.standard ? StandardEdgeSchema : FacilityEdgeSchema),
	});

	const {
		handleSubmit: formSubmit,
		formState: { errors },
	} = form;
	const [setErrors] = useTimeSeriesInputStore((state) => [state.setErrors]);

	const handleSubmit = (values) => {
		const { name, description, ...params } = values;
		resolve({
			name,
			description,
			params,
		});
	};

	useEffect(() => {
		setErrors(errors);
	}, [errors, setErrors]);

	return (
		<Dialog open={visible} onClose={onHide} maxWidth='sm' fullWidth>
			<DialogTitle>Edit Edge</DialogTitle>
			<DialogContent>
				<RHFForm form={form} onSubmit={handleSubmit}>
					{type === EdgeType.standard ? <StandardEdgeForm /> : facilityLinkForm()}
				</RHFForm>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide} color='secondary' variant='contained'>
					Cancel
				</Button>
				<Button color='secondary' variant='contained' onClick={formSubmit(handleSubmit)}>
					Apply
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default EditEdgeDialog;
