import { useAbility } from '@casl/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { ACTIONS, AbilityContext, SUBJECTS } from '@/access-policies/Can';
import { getTaggingProp } from '@/analytics/tagging';
import { DropBoxFileInput } from '@/components';
import { useFileUpload } from '@/components/hooks/useFileUpload';
import { withRHFControl } from '@/components/react-hook-form-helpers';
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	RHFColorPickerField,
	RHFMultiSelectField,
	RHFRadioGroupField,
	RHFTextField,
	Stack,
	Typography,
} from '@/components/v2';
import { DialogProps } from '@/helpers/dialog';
import { theme } from '@/helpers/styled';
import { colorsArray } from '@/helpers/zing';
import { useCurrentProject } from '@/projects/api';

interface FileInputFieldProps {
	className?: string;
	error?: string;
	value?: File;
	progress: number;
	uploading: boolean;
	onChange?: (file: File | undefined) => void;
}

export const RESERVED_LAYER_NAMES = ['Wells'];
// https://docs.mapbox.com/help/troubleshooting/uploads/#accepted-file-types-and-transfer-limits
const FILE_SIZE_LIMIT = 260 * 1024 * 1024; // bytes

function FileInputField({ className, error, value, progress, uploading, onChange }: FileInputFieldProps) {
	return (
		<Box className={className}>
			<DropBoxFileInput
				fullWidth
				fileName={value?.name}
				accept='.zip'
				onChange={(files) => onChange?.(files?.[0])}
				limit={FILE_SIZE_LIMIT / 1024 / 1024}
				progress={progress}
				uploading={uploading}
			/>
			{error && (
				<Box mt={2} color={theme.warningColor}>
					{error}
				</Box>
			)}
		</Box>
	);
}

const RHFFileInputField = withRHFControl(FileInputField, {
	getPropsFromFieldState: (fieldState) => ({ error: fieldState.error?.message }),
});

const NewLayerSchema = yup.object().shape({
	name: yup
		.string()
		.required('Please enter a layer name')
		.min(2, 'Cannot be shorter than ${min} characters')
		.max(64, 'Cannot be longer than ${max} characters')
		.matches(/^[\w- ]*$/, 'Cannot contain special characters')
		.matches(/^[^ ].*[^ ]$/, 'Cannot start or end in a space')
		.when(['$reservedNames'], ([reservedNames], schema) =>
			schema.notOneOf(reservedNames, 'A layer with this name already exists.')
		),
	color: yup.string().required('Please select a color'),
	description: yup.string(),
	file: yup.mixed().required('Please select a file to upload'),
	scope: yup.string(),
	projectIds: yup.array().when('scope', {
		is: 'project',
		then: (schema) => schema.min(1, 'Must select at least one project for "Project" scope'),
	}),
});
interface Values {
	name: string;
	description: string;
	color: string;
	projectIds: Inpt.ObjectId<'project'>[];
	scope: string;
}

interface FormValues extends Values {
	file: File | undefined;
}

interface DialogValues extends Values {
	file: FileDocument;
}

const NewLayerDialog = ({
	resolve,
	onHide,
	visible,
	projects,
	currentLayers,
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
DialogProps<DialogValues> & { projects: any[]; currentLayers: string[] }) => {
	const { project } = useCurrentProject();

	const ability = useAbility(AbilityContext);
	const canCreateCompanyShapefile = ability.can(ACTIONS.Create, SUBJECTS.CompanyShapefiles);

	const currentProjectInOptions = projects.find((p) => p._id === project?._id);

	const { upload, status: uploadStatus, progress: uploadProgress, fileDocument } = useFileUpload();

	const initialValues: FormValues = {
		name: '',
		description: '',
		color: '#a0a0a0',
		projectIds: project && currentProjectInOptions ? [project._id] : [],
		scope: project ? 'project' : 'company',
		file: undefined,
	};

	const {
		control,
		formState: { isValid, isSubmitted },
		handleSubmit: withFormValues,
		watch,
	} = useForm({
		defaultValues: initialValues,
		context: {
			reservedNames: [...RESERVED_LAYER_NAMES, ...currentLayers],
		},
		mode: 'all',
		resolver: yupResolver(NewLayerSchema),
	});

	const scope = watch('scope');

	const uploadFile = withFormValues((values) => values.file && upload(values.file));

	useEffect(() => {
		if (uploadStatus === 'complete' && fileDocument) {
			const handleSubmit = withFormValues((values) => resolve({ ...values, file: fileDocument }));
			handleSubmit();
		}
	}, [uploadStatus, fileDocument, resolve, withFormValues]);

	return (
		<Dialog onClose={onHide} open={visible} fullWidth maxWidth='sm'>
			<DialogTitle>New Custom Layer</DialogTitle>
			<DialogContent>
				<Stack spacing={3}>
					<RHFTextField control={control} label='Name' name='name' required fullWidth />

					<RHFTextField control={control} label='Description' name='description' fullWidth />

					<RHFColorPickerField
						control={control}
						label='Color'
						name='color'
						presetColors={colorsArray}
						fullWidth
						displayColorHint
					/>

					<RHFRadioGroupField
						control={control}
						options={[
							{ label: 'Company', value: 'company', disabled: !canCreateCompanyShapefile },
							{ label: 'Project', value: 'project' },
						]}
						label='Scope'
						name='scope'
						row
					/>

					{scope === 'project' && (
						<RHFMultiSelectField
							control={control}
							label='Project Scope'
							name='projectIds'
							menuItems={projects.map((p) => ({
								value: p._id,
								label: p.name,
							}))}
							required={scope === 'project'}
							fullWidth
						/>
					)}

					<RHFFileInputField
						control={control}
						name='file'
						progress={uploadProgress}
						uploading={uploadStatus === 'uploading'}
					/>

					<Typography variant='caption'>
						<b>Requirements:</b>
						<br />
						The file must be <b>.zip</b>
						<br />
						The zip should only contain one shape file
						<br />
						Must include all of the <b>.shp .dbf .prj .shx</b> files
						<br />
					</Typography>
				</Stack>
			</DialogContent>

			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button
					color='primary'
					disabled={isSubmitted && !isValid}
					onClick={uploadFile}
					{...getTaggingProp('map', 'addLayerUpload')}
				>
					Upload
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default NewLayerDialog;
