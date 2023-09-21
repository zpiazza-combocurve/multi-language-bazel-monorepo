import { faExclamationTriangle } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { yupResolver } from '@hookform/resolvers/yup';
import { Divider, Grid, Typography } from '@material-ui/core';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import styled from 'styled-components';

import { getTaggingProp } from '@/analytics/tagging';
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	RHFRadioGroupField,
	RHFSelectField,
	RHFTextField,
} from '@/components/v2';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { ProjectForecastItem } from '@/forecasts/types';
import { confirmationAlert, genericErrorAlert, getPerformanceWarningText } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { DialogProps } from '@/helpers/dialog';
import { postApi } from '@/helpers/routing';
import yup from '@/helpers/yup-helpers';
import { forecastSeries as BASE_FORECAST_SERIES, phases } from '@/helpers/zing';
import { MAX_WELLS_IN_TYPECURVE, MAX_WELLS_PERFORMANCE_TYPECURVE } from '@/inpt-shared/constants';
import { useFilteredByWellFilter } from '@/well-filter/hooks';

import { TYPE_CURVE_RESOLUTION_PREFERENCES } from '../TypeCurveSettings';
import { TC_TYPES, WELL_VALIDATION_OPTIONS } from '../shared/formProperties';
import { SelectForecast } from './SelectForecast';

const FieldTitle = styled.div`
	margin: 0 0 10px 0;
`;

const WarningItem = ({ text, mb = 1 }) => (
	<Box
		p={1}
		mb={mb}
		css={`
			display: flex;
			align-items: center;
			border-radius: 0.25rem;
			background: ${({ theme }) => theme.palette.background.opaque};
			line-height: 1.25rem;
		`}
	>
		<FontAwesomeIcon size='lg' css='margin: 0 0.5rem 0 0' color='orange' icon={faExclamationTriangle} />
		{text}
	</Box>
);

const CreateTypeCurveSchema = yup.object().shape({
	name: yup.string().required('This field is required.'),
});

export function CreateTypeCurveDialog({ visible, onHide, resolve }: DialogProps<Inpt.ObjectId<'type-curve'>>) {
	const { project } = useAlfa();
	const [allWells, setAllWells] = useState<string[]>([]);
	const [wells, handleFilterWells] = useFilteredByWellFilter(allWells);

	const { isCumTypeCurveFitEnabled } = useLDFeatureFlags();
	const defaultRegressionType = isCumTypeCurveFitEnabled ? 'cum' : 'rate';

	const {
		control,
		handleSubmit,
		setValue,
		watch,
		formState: { isValid },
	} = useForm({
		defaultValues: {
			selectedForecast: null as ProjectForecastItem | null,
			name: '',
			forecastSeries: 'best',
			tcType: 'rate',
			basePhase: 'oil' as string | null,
			phaseType: {
				oil: 'rate',
				gas: 'rate',
				water: 'rate',
			},
			wellValidationCriteria: 'either_have_prod_or_forecast',
			regressionType: defaultRegressionType,
			resolutionPreference: 'forecast',
		},
		mode: 'all',
		resolver: yupResolver(CreateTypeCurveSchema),
	});

	const createTypeCurveMutation = useMutation(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		async (values: any) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			return postApi('/type-curve', values) as Promise<any>;
		},
		{
			onSuccess: (typeCurve) => {
				confirmationAlert(`Successfully created type curve: ${typeCurve.name}`);
				resolve(typeCurve._id);
			},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			onError: (err: any) => genericErrorAlert(err),
		}
	);

	const handleCreate = handleSubmit(
		({
			basePhase,
			forecastSeries,
			name,
			phaseType,
			regressionType,
			resolutionPreference,
			selectedForecast,
			tcType,
			wellValidationCriteria,
		}) =>
			createTypeCurveMutation.mutate({
				basePhase,
				forecastSeries,
				phaseType,
				tcType,
				forecast: selectedForecast?._id,
				name,
				project: project?._id,
				regressionType,
				resolutionPreference,
				wells,
				wellValidationCriteria,
			})
	);

	useEffect(() => {
		const subscription = watch((values, { name: field }) => {
			switch (field) {
				case 'selectedForecast':
					if (values.selectedForecast?.type === 'deterministic') {
						setValue('forecastSeries', 'best');
					}
					break;
				case 'tcType':
					setValue('basePhase', values[field] === 'ratio' ? 'oil' : null);
					setValue('phaseType', { oil: 'rate', gas: 'rate', water: 'rate' });
					break;
				case 'basePhase':
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					setValue(`phaseType.${values[field]}` as any, 'rate');
					break;
				default:
					break;
			}
		});
		return () => subscription.unsubscribe();
	}, [watch, setValue]);

	const [tcType, basePhase, selectedForecast] = watch(['tcType', 'basePhase', 'selectedForecast']);

	const handleSelectForecast = (forecast: ProjectForecastItem | null) => {
		setValue('selectedForecast', forecast);
		setAllWells(forecast?.wells ?? []);
	};

	const warnings = useMemo(() => {
		const tooManyPerformanceWells = wells.length > MAX_WELLS_PERFORMANCE_TYPECURVE;
		const tooManyWells = wells.length > MAX_WELLS_IN_TYPECURVE;

		return (
			<Box>
				{selectedForecast && tooManyWells && (
					<WarningItem text={`Representative wells are greater than ${MAX_WELLS_IN_TYPECURVE}`} />
				)}

				{selectedForecast && tooManyPerformanceWells && (
					<WarningItem
						mb={0}
						text={getPerformanceWarningText('type curve', MAX_WELLS_PERFORMANCE_TYPECURVE)}
					/>
				)}

				{selectedForecast && selectedForecast.wellsCollectionsCount > 0 && (
					<WarningItem text='Well Collections cannot be used as representative wells and will not be available in Type Curve' />
				)}

				{!selectedForecast && <WarningItem text='Type Curve will be created without associated forecast' />}
			</Box>
		);
	}, [selectedForecast, wells]);

	return (
		<Dialog fullWidth maxWidth='md' open={visible}>
			<DialogTitle
				disableTypography
				css={`
					padding: 1rem;
					font-weight: 400;
					font-size: 1.5rem;
					line-height: 2.5rem;
				`}
			>
				Create Type Curve
			</DialogTitle>

			<DialogContent
				css={`
					height: 70vh;
					padding: 0 1rem;
				`}
			>
				<Grid container spacing={4} style={{ height: '100%' }}>
					<Grid
						item
						xs={6}
						css={`
							&.MuiGrid-item {
								padding-bottom: 0;
							}
							display: flex;
							flex-direction: column;
							max-height: 100%;
						`}
					>
						<Box mb={2}>
							<FieldTitle>
								<Typography variant='body2'>Type Curve Name</Typography>
							</FieldTitle>
							<RHFTextField
								control={control}
								fullWidth
								label='Name'
								name='name'
								variant='outlined'
								size='small'
								required
							/>
						</Box>
						<Box mb={2}>
							<FieldTitle>
								<Typography variant='caption'>Project</Typography>
							</FieldTitle>
							<FieldTitle>
								<Typography variant='body2'>{project?.name}</Typography>
							</FieldTitle>
							<Divider />
						</Box>
						<Box>
							<FieldTitle>
								<Typography variant='body2'>Select forecast</Typography>
							</FieldTitle>
						</Box>
						<Box
							css='{
								display: flex;
								flex-direction: column;
								overflow: hidden;
							}'
						>
							<SelectForecast
								value={selectedForecast}
								filteredWellsCount={wells.length}
								onChange={handleSelectForecast}
							/>
						</Box>
					</Grid>
					<Divider orientation='vertical' flexItem style={{ marginRight: '-1px' }} />
					<Grid item xs={6}>
						<Box mb={2}>
							<FieldTitle style={{ marginBottom: '1rem' }}>
								<Typography variant='body2'>Settings</Typography>
							</FieldTitle>
						</Box>
						<Box mb={2}>
							<FieldTitle>
								<Typography variant='body2'>Series</Typography>
							</FieldTitle>
							<RHFSelectField
								control={control}
								name='forecastSeries'
								variant='outlined'
								size='small'
								fullWidth
								disabled={selectedForecast?.type !== 'probabilistic'}
								menuItems={BASE_FORECAST_SERIES}
							/>
						</Box>
						<Box mb={2}>
							<Typography variant='body2'>Fit Type</Typography>
							<RHFRadioGroupField control={control} name='tcType' options={TC_TYPES} />
							{tcType === 'ratio' && (
								<Box>
									<FieldTitle>
										<Typography variant='body2'>Base Phase</Typography>
									</FieldTitle>
									<RHFSelectField
										control={control}
										name='basePhase'
										menuItems={phases}
										fullWidth
										size='small'
										variant='outlined'
									/>

									{phases.map(({ value: phaseValue, label: phaseLabel }) => (
										<Box
											css='width: 33%; display: inline-block; margin-top: 10px;'
											key={phaseValue}
										>
											<FieldTitle>
												<Typography variant='body2'>{phaseLabel}</Typography>
											</FieldTitle>
											<RHFRadioGroupField
												control={control}
												name={`phaseType.${phaseValue}`}
												disabled={phaseValue === basePhase}
												options={TC_TYPES}
											/>
										</Box>
									))}
								</Box>
							)}
						</Box>
						<Box mb={2}>
							<RHFSelectField
								control={control}
								label='Data Used To Generate Type Curve'
								name='resolutionPreference'
								variant='outlined'
								size='small'
								fullWidth
								required
								menuItems={TYPE_CURVE_RESOLUTION_PREFERENCES}
							/>
						</Box>
						<Box mb={2}>
							<RHFSelectField
								control={control}
								label='Well Validation Criteria'
								name='wellValidationCriteria'
								variant='outlined'
								size='small'
								fullWidth
								required
								menuItems={WELL_VALIDATION_OPTIONS}
							/>
						</Box>
						{warnings}
					</Grid>
				</Grid>
			</DialogContent>
			<Divider css='margin: 0 1rem;' />
			<DialogActions
				css={`
					padding: 1rem;
				`}
			>
				<Button onClick={() => onHide()}>Cancel</Button>

				<Button color='secondary' onClick={() => handleFilterWells()}>
					Filter Wells
				</Button>

				<Button
					color='secondary'
					disabled={!isValid || createTypeCurveMutation.isLoading || wells.length > MAX_WELLS_IN_TYPECURVE}
					onClick={handleCreate}
					variant='contained'
					{...getTaggingProp('typeCurve', 'create')}
				>
					Create
				</Button>
			</DialogActions>
		</Dialog>
	);
}
