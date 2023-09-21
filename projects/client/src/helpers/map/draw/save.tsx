import { useAbility } from '@casl/react';
import { faSave } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { yupResolver } from '@hookform/resolvers/yup';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Feature, Geometry } from 'geojson';
import _ from 'lodash';
import { Map } from 'mapbox-gl';
import { Dispatch, ReactNode, SetStateAction, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from 'react-query';
import * as yup from 'yup';

import { ACTIONS, AbilityContext, SUBJECTS, subject } from '@/access-policies/Can';
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	RHFColorPickerField,
	RHFMultiSelectField,
	RHFRadioGroupField,
	RHFSelectField,
	RHFTextField,
	Stack,
} from '@/components/v2';
import { confirmationAlert, useLoadingBar } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { useDebouncedValue } from '@/helpers/debounce';
import { DialogProps, useDialog } from '@/helpers/dialog';
import { getApi, postApi } from '@/helpers/routing';
import { colorsArray } from '@/helpers/zing';
import { WellMapTheme } from '@/map/MapboxGL';
import { useCurrentProject } from '@/projects/api';

import { fixFeatureIfPolygon } from '../helpers';
import { useMapStore } from './mapPortals';

const GEOMETRY_TYPES = [
	{ label: 'Points', types: ['Point'] },
	{ label: 'Lines', types: ['LineString'] },
	{ label: 'Polygons', types: ['Polygon', 'MultiPolygon'] },
] as const;

type GeometryType = (typeof GEOMETRY_TYPES)[number]['label'];
type SupportedGeoJsonGeometryType = (typeof GEOMETRY_TYPES)[number]['types'][number];

const GEOMETRY_TYPES_MAP = Object.fromEntries(
	GEOMETRY_TYPES.map(({ label, types }) => types.map((t) => [t, label])).flat()
) as Record<SupportedGeoJsonGeometryType, GeometryType>;

interface SaveAsLayerProps {
	selectedFeatures: Feature[];
}

interface SaveSelectedDrawsAsLayerProps {
	draw: MapboxDraw;
	map: Map;
}

interface FormValues {
	layerType?: GeometryType;
	name: string;
	description: string;
	color: string;
	projectIds: Inpt.ObjectId<'project'>[];
	scope: string;
}

interface CreateShapefileValues {
	name: string;
	description: string;
	color: string;
	projectIds: Inpt.ObjectId<'project'>[];
	scope: string;
	tileset: string;
	features: Feature[];
}

interface SaveAsLayerDialogProps {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	projects: any[];
	allowedLayerTypes: Set<GeometryType>;
}

export const RESERVED_LAYER_NAMES = ['Wells'];

function isNotUndefined<T>(value?: T): value is T {
	return value !== undefined;
}

const NewLayerSchema = yup.object().shape({
	layerType: yup
		.string()
		.required()
		.oneOf(GEOMETRY_TYPES.map(({ label }) => label)),
	name: yup
		.string()
		.required('Please enter a layer name')
		.min(2, 'Cannot be shorter than ${min} characters')
		.max(64, 'Cannot be longer than ${max} characters')
		.matches(/^[\w- ]*$/, 'Cannot contain special characters')
		.matches(/^[^ ].*[^ ]$/, 'Cannot start or end in a space')
		.when(['$reservedNames'], ([reservedNames], schema) =>
			schema.notOneOf(reservedNames, 'A layer with this name already exists')
		),
	color: yup.string().required('Please select a color'),
	description: yup.string(),
	scope: yup.string(),
	projectIds: yup.array().when('scope', {
		is: 'project',
		then: (schema) => schema.min(1, 'Must select at least one project for "Project" scope'),
	}),
});

const SaveAsLayerDialog = ({
	resolve,
	onHide,
	visible,
	projects,
	allowedLayerTypes,
}: DialogProps<FormValues> & SaveAsLayerDialogProps) => {
	const { project } = useCurrentProject();

	const ability = useAbility(AbilityContext);
	const canCreateCompanyShapefile = ability.can(ACTIONS.Create, SUBJECTS.CompanyShapefiles);

	const currentProjectInOptions = projects.find((p) => p._id === project?._id);

	const initialValues: FormValues = {
		layerType: allowedLayerTypes.size === 1 ? [...allowedLayerTypes][0] : undefined,
		name: '',
		description: '',
		color: '#a0a0a0',
		projectIds: project && currentProjectInOptions ? [project._id] : [],
		scope: project ? 'project' : 'company',
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const [extraErrors, setExtraErrors] = useState<Partial<Record<keyof FormValues, any>>>({});

	const {
		control,
		formState: { isValidating, isValid, isSubmitted, errors, touchedFields },
		handleSubmit: withFormValues,
		watch,
		trigger,
	} = useForm({
		defaultValues: initialValues,
		context: {
			reservedNames: [...RESERVED_LAYER_NAMES],
		},
		mode: 'onTouched',
		resolver: async (...args) => {
			const yupResult = await yupResolver(NewLayerSchema)(...args);
			return { ...yupResult, errors: { ...extraErrors, ...yupResult.errors } };
		},
	});
	useEffect(() => {
		if (touchedFields.name) {
			trigger('name');
		}
	}, [extraErrors.name, touchedFields.name, trigger]);

	const scope = watch('scope');
	const name = watch('name');

	useEffect(() => setExtraErrors((v) => _.omit(v, 'name')), [name]);

	const debouncedName = useDebouncedValue(name, 200);

	const { isLoading: checkingName } = useQuery(
		['shapefiles', 'check-name', debouncedName],
		() => postApi<{ valid: boolean; reason: string }>('/shapefiles/check-name', { name: debouncedName }),
		{
			enabled: !!touchedFields.name && (!errors.name || errors.name?.type === 'server-validation'),
			onSuccess: ({ valid, reason }) => {
				if (!valid) {
					setExtraErrors((v) => ({ ...v, name: { type: 'server-validation', message: reason } }));
				}
			},
		}
	);

	const handleSubmit = withFormValues((values) => resolve(values));

	return (
		<Dialog onClose={onHide} open={visible} fullWidth maxWidth='sm'>
			<DialogTitle>Save As Layer</DialogTitle>
			<DialogContent>
				<Stack spacing={3}>
					<RHFSelectField
						control={control}
						menuItems={GEOMETRY_TYPES.map(({ label }) => ({
							label,
							value: label,
							disabled: !allowedLayerTypes.has(label),
						}))}
						label='Layer Type'
						name='layerType'
						required
					/>

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
				</Stack>
			</DialogContent>

			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button
					color='primary'
					disabled={isValidating || checkingName || !isValid || isSubmitted}
					onClick={handleSubmit}
				>
					Save
				</Button>
			</DialogActions>
		</Dialog>
	);
};

function SaveAsLayer({ selectedFeatures }: SaveAsLayerProps) {
	const { project } = useCurrentProject();
	const { user } = useAlfa();
	const { data: projectsData } = useQuery(['projects'], () => getApi('/projects/withName', { limit: 100000 }));
	const projects = projectsData?.items ?? (project ? [project] : []);

	const ability = useAbility(AbilityContext);
	const projectsAllowed = projects.filter(({ _id }) =>
		ability.can(ACTIONS.Create, subject(SUBJECTS.ProjectShapefiles, { _id: null, projectIds: [_id] }))
	);
	const canCreateShapefile = ability.can(ACTIONS.Create, SUBJECTS.CompanyShapefiles) || projectsAllowed.length > 0;

	const allowedLayerTypes = useMemo(
		() =>
			new Set(
				selectedFeatures
					.map<GeometryType | undefined>(({ geometry }) => GEOMETRY_TYPES_MAP[geometry.type])
					.filter(isNotUndefined)
			),
		[selectedFeatures]
	);
	const [newLayerDialog, promptNewLayerDialog] = useDialog(SaveAsLayerDialog, {
		projects: projectsAllowed,
		allowedLayerTypes,
	});

	const saveAsLayerMutation = useMutation((data: CreateShapefileValues) => postApi('/shapefiles/geojson', data));
	useLoadingBar(saveAsLayerMutation.isLoading);

	const openNewLayerDialog = async () => {
		const results = await promptNewLayerDialog();

		if (!results) {
			return;
		}

		const { layerType, name, description, color, projectIds, scope } = results;

		const wantedGeometryTypes: readonly Geometry['type'][] =
			GEOMETRY_TYPES.find(({ label }) => label === layerType)?.types ?? [];

		const data = {
			name,
			description,
			color,
			projectIds,
			scope,
			tileset: `devadmin.CC${user._id.toString().substring(24 - 15)}${+new Date()}`,
			features: selectedFeatures
				.filter(({ geometry }) => wantedGeometryTypes.includes(geometry.type))
				.map(({ type, properties, geometry }, i) => ({
					type,
					properties: { ...properties, id: i + 1 },
					geometry,
				}))
				.map(fixFeatureIfPolygon),
		};
		await saveAsLayerMutation.mutateAsync(data);
		confirmationAlert(`Layer ${name} is being created. Check your notifications.`);
	};

	return (
		<>
			<WellMapTheme>
				<button
					title='Save Selection As Layer'
					className='mapbox-gl-draw_ctrl-draw-btn custom-mapbox-control'
					disabled={!canCreateShapefile || !selectedFeatures.length}
					onClick={openNewLayerDialog}
				>
					<FontAwesomeIcon icon={faSave} />
				</button>
			</WellMapTheme>
			{newLayerDialog}
		</>
	);
}

function SaveSelectedDrawsAsLayer({ draw, map }: SaveSelectedDrawsAsLayerProps) {
	const [selectedFeatures, setSelectedFeatures] = useState(draw.getSelected().features);

	useEffect(() => {
		map.on('draw.selectionchange', ({ features }) => setSelectedFeatures(features));
		map.on('draw.update', () => setSelectedFeatures(draw.getSelected().features));
		map.on('draw.delete', () => setSelectedFeatures(draw.getSelected().features));
	}, [draw, map]);

	return <SaveAsLayer selectedFeatures={selectedFeatures} />;
}

export const getSaveButton = (draw: MapboxDraw, map: Map, setMapPortals?: Dispatch<SetStateAction<ReactNode[]>>) => {
	const container = document.createElement('div');

	const el = ReactDOM.createPortal(<SaveSelectedDrawsAsLayer draw={draw} map={map} />, container);

	if (setMapPortals) {
		setMapPortals((prev) => [...prev, el]);
	} else {
		useMapStore.getState().addComponent(el);
	}

	return container;
};
