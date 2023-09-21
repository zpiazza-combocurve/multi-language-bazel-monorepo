/* eslint react/jsx-key: warn */
import _ from 'lodash';
import { useCallback } from 'react';
import { useMutation } from 'react-query';
import styled from 'styled-components';

import { SelectList } from '@/components';
import { DEFAULT_IDENTIFIER, WellIdentifierSelect } from '@/components/misc/WellIdentifierSelect';
import { useWizard } from '@/components/misc/Wizard';
import { InfoTooltip } from '@/components/tooltipped';
import { Box, Button, CheckboxField, Dialog, DialogActions, DialogContent, DialogTitle } from '@/components/v2';
import { fetchProjectForecasts } from '@/forecasts/api';
import { ProjectForecastItem } from '@/forecasts/types';
import { confirmationAlert, genericErrorAlert, withLoadingBar } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { DialogProps } from '@/helpers/dialog';
import { WithQuery } from '@/helpers/query';
import { getApi, putApi } from '@/helpers/routing';
import { theme } from '@/helpers/styled';
import { fullNameAndLocalDate } from '@/helpers/user';
import { phases as DEFAULT_PHASES } from '@/helpers/zing';
import { pluralize } from '@/inpt-shared/helpers/text-utils';

const FieldContainer = styled.section`
	align-items: center;
	display: flex;
	justify-content: space-between;
	width: 100%;
`;

const FormLabel = styled.span`
	font-size: 1rem;
`;

const descriptions = {
	project: {
		description: 'Select Project',
		tooltip: 'Replaces current forecast from another project',
	},
	forecast: {
		description: 'Select Forecast',
		tooltip: 'Replaces current forecast with the selected forecast',
	},
	identifier: {
		description: 'Select Well Identifier',
		tooltip: 'Choose a matching well identifier from both forecasts',
	},
	phases: {
		description: 'Select Phases',
		tooltip: 'Choose the following phases to replace',
	},
};

interface Project {
	_id: string;
	createdAt: string;
	createdBy: { firstName: string; lastName: string };
	forecastsLength: number;
	name: string;
	updatedAt: string;
}

function ReplaceFitParametersDialog({
	forecastId,
	onHide,
	resolve,
	visible,
	wellIds,
}: DialogProps & { forecastId: string; wellIds: string[] }) {
	const { project: currentProject } = useAlfa();

	type WizardValues = {
		forecast: string;
		identifier: string;
		phases: { oil: boolean; gas: boolean; water: boolean };
		project: { _id: string };
	};

	const { isLoading: replacingParameters, mutateAsync: replaceParameters } = useMutation(
		async ({ forecast, identifier, phases }: WizardValues) => {
			const body = {
				copyForecastId: forecast,
				phases: Object.entries(phases)
					.map(([phase, phaseValue]) => (phaseValue ? phase : false))
					.filter(Boolean),
				wellIds,
				identifier,
			};

			try {
				const { taskCreated } = await withLoadingBar(
					putApi(`/forecast/${forecastId}/replace-parameters`, body)
				);
				if (!taskCreated) {
					confirmationAlert('Successfully Replaced Parameters');
				}
				resolve(!taskCreated);
			} catch (error) {
				genericErrorAlert(error);
			}
		}
	);

	const {
		children,
		isDisabled,
		isFirstStep,
		isLastStep,
		key,
		next,
		prev,
		resetSteps,
		values: wizardValues,
		setValues,
	} = useWizard<WizardValues>({
		initialValues: {
			identifier: DEFAULT_IDENTIFIER,
			phases: { oil: true, gas: true, water: true },
		},
		steps: [
			{
				key: 'project',
				// eslint-disable-next-line react/no-unstable-nested-components -- TODO eslint fix later
				children: ({ state, select }) => (
					<WithQuery
						queryKey={['forecast-replace-params', 'projects-list', forecastId]}
						queryFn={() => getApi('/forecast/getForecastsCountByProject') as Promise<Project[]>}
						select={(projects) =>
							_.orderBy(projects, [
								(proj) => (proj._id === currentProject?._id ? 0 : 1),
								(proj) => new Date(proj.updatedAt).getTime(),
							])
						}
					>
						{(projectsQuery) => (
							<SelectList
								label='Search Projects'
								value={state}
								onChange={select}
								listItems={projectsQuery.data?.map((project) => ({
									primaryText: project.name,
									secondaryText: [
										fullNameAndLocalDate(project.createdBy, project.createdAt),
										pluralize(project.forecastsLength, 'forecast', 'forecasts'),
									].join(' | '),
									// highlight is using currentProject instead of values.project because values.project is initially null
									highlight: project._id === currentProject?._id,
									value: project,
								}))}
								withSearch
								getKey='_id'
							/>
						)}
					</WithQuery>
				),
				validate: () => !wellIds?.length,
			},
			{
				key: 'forecast',
				// eslint-disable-next-line react/no-unstable-nested-components -- TODO eslint fix later
				children: ({ values, state, select }) => {
					const projectId = values.project?._id;
					return (
						<WithQuery
							queryKey={['project-forecasts', projectId]}
							queryFn={() => fetchProjectForecasts(projectId) as Promise<ProjectForecastItem[]>}
							select={(forecasts) => _.filter(forecasts, _.negate(_.matches({ _id: forecastId })))}
						>
							{(forecastsQuery) => (
								<SelectList
									label='Search Forecasts'
									value={state}
									onChange={select}
									listItems={forecastsQuery.data?.map((forecastItem) => ({
										primaryText: forecastItem.name,
										secondaryText: [
											fullNameAndLocalDate(forecastItem.user, forecastItem.createdAt),
											_.capitalize(forecastItem.type),
										].join(' | '),
										value: forecastItem._id,
									}))}
									withSearch
									getKey='_id'
								/>
							)}
						</WithQuery>
					);
				},
			},
			{
				key: 'identifier',
				// eslint-disable-next-line react/no-unstable-nested-components -- TODO eslint fix later
				children: ({ state, setState }) => (
					<WellIdentifierSelect value={state} onChange={(newValue) => setState(newValue)} />
				),
			},
			{
				key: 'phases',
				// eslint-disable-next-line react/no-unstable-nested-components -- TODO eslint fix later
				children: ({ state, setState }) => (
					<FieldContainer>
						<FormLabel>Phases:</FormLabel>
						{DEFAULT_PHASES.map(({ label, value: phase }) => (
							// eslint-disable-next-line react/jsx-key -- TODO eslint fix later
							<CheckboxField
								checked={state[phase]}
								disabled={replacingParameters}
								label={label}
								name={phase}
								onChange={(ev) => setState({ ...state, [phase]: ev.target.checked })}
							/>
						))}
					</FieldContainer>
				),
				validate: (values) => !Object.values(values).filter(Boolean).length,
			},
		],
	});

	const onCancel = useCallback(() => {
		onHide(false);
		resetSteps();
	}, [onHide, resetSteps]);

	// This function gets around setting project = currentProject in the wizard's initial values
	// SelectList component will set project = null if wizard.project value === SelectList.ListItem value (onClick)
	const onClickNext = useCallback(() => {
		if (key === 'project' && !wizardValues.project) {
			setValues((p) => ({ ...p, project: currentProject }));
		}
		next();
	}, [currentProject, key, next, setValues, wizardValues.project]);

	return (
		<Dialog open={visible} onClose={onCancel} maxWidth='sm' fullWidth>
			<DialogTitle>
				<Box display='flex' flexDirection='column'>
					Replace Forecast Parameters
					<Box alignItems='center' color={theme.grayColorAccent} display='flex' fontSize='1rem'>
						<Box marginRight='0.25rem'>
							<InfoTooltip labelTooltip={descriptions[key].tooltip} />
						</Box>

						{descriptions[key].description}
					</Box>
				</Box>
			</DialogTitle>

			<DialogContent css={['identifier', 'phases'].includes(key) ? 'height: 15vh;' : 'height: 100vh;'}>
				{children}
			</DialogContent>

			<DialogActions>
				<Button onClick={onCancel}>Cancel</Button>

				{!isFirstStep && <Button onClick={prev}>Back</Button>}

				{isLastStep ? (
					<Button
						disabled={isDisabled || replacingParameters}
						onClick={async () => {
							await replaceParameters(wizardValues);
							resetSteps();
						}}
						color='primary'
						variant='contained'
					>
						{`Replace (${wellIds?.length ?? 0})`}
					</Button>
				) : (
					<Button
						disabled={isDisabled || replacingParameters}
						onClick={onClickNext}
						color='primary'
						variant='contained'
					>
						{`Next (${wellIds?.length ?? 0})`}
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
}

export default ReplaceFitParametersDialog;
