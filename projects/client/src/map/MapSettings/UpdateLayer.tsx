import { useAbility } from '@casl/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Typography } from '@material-ui/core';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from 'react-query';
import * as yup from 'yup';

import { ACTIONS, AbilityContext, PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS, subject } from '@/access-policies/Can';
import {
	Box,
	Button,
	RHFColorPickerField,
	RHFMultiSelectField,
	RHFRadioGroupField,
	RHFSelectField,
	RHFSliderField,
	RHFTextField,
	Stack,
} from '@/components/v2';
import { useDialog } from '@/helpers/dialog';
import { getApi } from '@/helpers/routing';
import { colorsArray } from '@/helpers/zing';

import { layerIsSelectable } from '../helpers';
import { Layer, LayerExportFormat } from '../types';
import ExportLayerDialog from './ExportLayerDialog';

interface Values {
	description: string;
	scope: string;
	label: string | null;
	tooltipFields: string[];
	opacity: number;
	color: string;
	projectIds: Inpt.ObjectId<'project'>[];
}

interface UpdateLayerProps {
	className?: string;
	layer: Layer;
	exportLayer: (shapefileId: string, fileName: string, format: LayerExportFormat) => void;
	removeLayer: (layer: Layer) => void;
	updateLayer: (layer: Layer) => void;
	onSelectedLayerChange: (layer: Partial<Layer>) => void;
}

const NewLayerSchema = yup.object().shape({
	color: yup.string().required('Please select a color'),
	description: yup.string(),
	scope: yup.string(),
	projectIds: yup.array().when('scope', {
		is: 'project',
		then: (schema) => schema.min(1, 'Must select at least one project for "Project" scope'),
	}),
});

const UpdateLayer = (props: UpdateLayerProps) => {
	const { onSelectedLayerChange, layer, exportLayer, removeLayer, updateLayer, className } = props;

	const ability = useAbility(AbilityContext);
	const canDeleteShapefile = useMemo(
		() =>
			layer.visibility.includes('company')
				? ability.can(ACTIONS.Delete, SUBJECTS.CompanyShapefiles)
				: layer.projectIds.every((project) =>
						ability.can(
							ACTIONS.Delete,
							subject(SUBJECTS.ProjectShapefiles, { ...layer, projectIds: [project] })
						)
				  ),
		[layer, ability]
	);
	const canUpdateShapefile = useMemo(
		() =>
			layer.visibility.includes('company')
				? ability.can(ACTIONS.Update, SUBJECTS.CompanyShapefiles)
				: layer.projectIds.every((project) =>
						ability.can(
							ACTIONS.Update,
							subject(SUBJECTS.ProjectShapefiles, { ...layer, projectIds: [project] })
						)
				  ),
		[layer, ability]
	);

	const canExportShapefile = useMemo(
		() =>
			layer.visibility.includes('company')
				? ability.can(ACTIONS.Update, SUBJECTS.CompanyShapefiles)
				: layer.projectIds.every((project) =>
						ability.can(
							ACTIONS.View,
							subject(SUBJECTS.ProjectShapefiles, { ...layer, projectIds: [project] })
						)
				  ),
		[layer, ability]
	);

	const canUpdateCompanyShapefile = ability.can(ACTIONS.Update, SUBJECTS.CompanyShapefiles);

	const { data: projects } = useQuery(['projects'], () => getApi('/projects/withName', { limit: 100000 }));

	const { name, fields } = layer;

	const initialValues = useMemo(() => {
		const { description, label, projectIds, opacity, color, visibility, tooltipFields } = layer;

		return {
			description,
			color,
			projectIds,
			scope: visibility.includes('company') ? 'company' : 'project',
			label: label === '' ? null : label,
			tooltipFields: tooltipFields ?? [],
			opacity,
		};
	}, [layer]);

	const {
		control,
		watch,
		formState: { isDirty: dirty, isValid },
		handleSubmit: withSubmitValues,
		reset,
	} = useForm<Values>({
		mode: 'all',
		defaultValues: initialValues,
		resolver: yupResolver(NewLayerSchema),
	});

	const handleReset = () => reset(initialValues);
	const handleSubmit = withSubmitValues(({ scope, ...values }) =>
		updateLayer({ ...layer, ...values, visibility: [scope] })
	);

	const values = watch();

	const [opacity, color, label, tooltipFields] = watch(['opacity', 'color', 'label', 'tooltipFields']);

	useEffect(() => {
		onSelectedLayerChange({ opacity, color, label, tooltipFields });
	}, [opacity, color, label, tooltipFields, onSelectedLayerChange]);

	useEffect(() => {
		reset(initialValues);
	}, [initialValues, reset]);

	const [exportLayerDialog, promptExportLayerDialog] = useDialog(ExportLayerDialog, { layer });
	const openExportLayerDialog = async () => {
		const results = await promptExportLayerDialog();
		if (!results) {
			return;
		}
		const { shapefileId, fileName, format } = results;
		exportLayer(shapefileId, fileName, format);
	};

	return (
		<>
			{exportLayerDialog}
			<Stack
				spacing={1}
				className={className}
				css={{ overflowY: 'auto', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
			>
				<Stack css={{ padding: '0 1rem' }}>
					<Typography variant='h6'>Layer Settings</Typography>

					<Box display='flex' justifyContent='space-between'>
						<Typography color='primary' variant='h6' css={{ 'overflow-wrap': 'break-word', width: '100%' }}>
							{name}
						</Typography>
					</Box>
				</Stack>

				<Stack css={{ overflowY: 'auto', flex: 1, padding: '0 1rem', minHeight: '5rem' }} spacing={3}>
					<RHFTextField control={control} label='Description' name='description' fullWidth />
					<RHFColorPickerField
						control={control}
						label='Color'
						name='color'
						presetColors={colorsArray}
						displayColorHint
						fullWidth
					/>
					<RHFRadioGroupField
						control={control}
						options={[
							{
								label: 'Company',
								value: 'company',
								disabled: !canUpdateCompanyShapefile,
							},
							{
								label: 'Project',
								value: 'project',
							},
						]}
						label='Scope'
						name='scope'
						row
					/>
					{values.scope === 'project' && (
						<RHFMultiSelectField
							control={control}
							label='Project Scope'
							name='projectIds'
							menuItems={(projects?.items ?? []).map((p) => ({
								value: p._id,
								label: p.name,
							}))}
							required={values.scope === 'project'}
							fullWidth
						/>
					)}
					<RHFSelectField
						control={control}
						label='Label'
						name='label'
						menuItems={[{ name: 'None' }, ...(fields ?? [])].map(({ name }) => ({
							label: name,
							value: name,
						}))}
						fullWidth
					/>
					<RHFMultiSelectField
						control={control}
						label='Tooltip Fields'
						name='tooltipFields'
						menuItems={(fields ?? []).map(({ name }) => ({
							label: name,
							value: name,
						}))}
						fullWidth
					/>
					<RHFSliderField
						control={control}
						label='Opacity'
						name='opacity'
						valueLabelDisplay='on'
						min={1}
						max={100}
						adjustSliderSize
					/>
				</Stack>

				<Box display='flex' justifyContent='flex-end'>
					<Button
						disabled={
							(!layerIsSelectable(layer) && 'This layer cannot be exported') ||
							(!canExportShapefile && PERMISSIONS_TOOLTIP_MESSAGE)
						}
						color='secondary'
						onClick={openExportLayerDialog}
					>
						Export
					</Button>

					<Button
						disabled={!canDeleteShapefile && PERMISSIONS_TOOLTIP_MESSAGE}
						color='error'
						onClick={() => removeLayer(layer)}
					>
						Delete
					</Button>

					<Button onClick={handleReset} disabled={!dirty}>
						Reset
					</Button>

					<Button
						color='primary'
						disabled={!canUpdateShapefile ? PERMISSIONS_TOOLTIP_MESSAGE : !isValid || !dirty}
						onClick={() => handleSubmit()}
					>
						Update
					</Button>
				</Box>
			</Stack>
		</>
	);
};

export default UpdateLayer;
