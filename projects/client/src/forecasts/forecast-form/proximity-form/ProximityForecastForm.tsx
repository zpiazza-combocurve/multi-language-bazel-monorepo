import { useTheme } from '@material-ui/core';
import _ from 'lodash';
import { useState } from 'react';
import { useQuery } from 'react-query';
import styled from 'styled-components';

import { Sortable } from '@/components';
import { CheckboxItem, Divider, List, ListItem, MenuButton, RHFForm } from '@/components/v2';
import { Autocomplete, FieldHeader } from '@/components/v2/misc';
import { VALID_PHASES } from '@/forecasts/charts/components/graphProperties';
import { useLoadingBar } from '@/helpers/alerts';
import { useDebouncedValue } from '@/helpers/debounce';
import { getApi } from '@/helpers/routing';
import { pluralize } from '@/helpers/text';
import { numberWithCommas } from '@/helpers/utilities';
import { MAX_AUTO_PROXIMITY_BACKGROUND_WELLS } from '@/inpt-shared/constants';
import { useCurrentProjectId } from '@/projects/routes';

import ForecastFormControl from '../ForecastFormControl';
import { ForecastScope } from '../ForecastFormV2';
import { FormPhase } from '../automatic-form/types';
import { FormCollapse, FormHeader, ProximityFormContent, SectionContainer } from '../phase-form/layout';
import ProximityOptionsFields from './ProximityOptionsFields';
import ProximityPhaseForm from './ProximityPhaseForm';
import SelectedForecastItem from './SelectedForecastItem';
import { UseProximityForecastReturn } from './useProximityForecast';

const MenuContainer = styled.div`
	padding: 0.5rem 0;
	width: 250px;
	max-height: 500px;
`;

const ProximityForecastForm = ({
	forecastScope,
	form,
	handleAdjustForecasts,
	handlePhaseTypeChange,
	isLoadingUniqueWellCount,
	uniqueWellCount,
}: UseProximityForecastReturn & { forecastScope: ForecastScope | undefined }) => {
	const curProjectId = useCurrentProjectId();
	const theme = useTheme();
	const countColor =
		uniqueWellCount > MAX_AUTO_PROXIMITY_BACKGROUND_WELLS ? theme.palette.error.main : theme.palette.secondary.main;

	const [open, setOpen] = useState(true);

	const { setValue, watch } = form;
	const [applyAll, proxForecasts] = watch(['applyAll', 'forecasts']);

	const phases: Array<FormPhase> = applyAll ? ['shared'] : VALID_PHASES;

	const [selectedProject, setSelectedProject] = useState<{ label: string; value: string }>({
		value: curProjectId,
		label: 'Current Project',
	});

	const [searchQuery, setSearchQuery] = useState<string>('');
	const debouncedSearchBody = useDebouncedValue({ search: searchQuery }, 500);

	const { data: projects = [], isLoading: isLoadingProjects } = useQuery(
		['allProjects', debouncedSearchBody],
		() => getApi('/projects', debouncedSearchBody),
		{
			enabled: Boolean(debouncedSearchBody.search.length),
			initialData: [{ value: curProjectId, label: 'Current Project' }],
			select: (projectData) =>
				_.uniqBy(
					[
						selectedProject.value !== curProjectId && { value: curProjectId, label: 'Current Project' },
						// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
						..._.map((projectData as Record<string, any>).items, (item) => ({
							value: item._id,
							label: item.name,
						})),
					].filter(Boolean),
					'value'
				),
		}
	);

	const { data: projectForecasts = [], isLoading: isLoadingForecasts } = useQuery(
		['projectForecasts', selectedProject.value],
		() => getApi(`/forecast/project/${selectedProject.value}/all`),
		{
			enabled: Boolean(selectedProject?.value.length),
			select: (forecastData) =>
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				_.map(forecastData as Record<string, any>, (forecast) =>
					_.pick(forecast, ['name', 'project', '_id', 'wells'])
				),
		}
	);

	useLoadingBar(isLoadingProjects || isLoadingForecasts);

	return (
		<RHFForm
			css={`
				display: flex;
				flex-direction: column;
				row-gap: 0.5rem;
				width: 100%;
			`}
			form={form}
		>
			<FormHeader>
				<ForecastFormControl
					disabled={forecastScope !== 'both'}
					inlineLabel='Threshold (# of Data Points)'
					label='Apply to wells with less than'
					name='dataThreshold'
					rules={{ min: { value: 0, message: 'Value must be greater than or equal to 0' } }}
					tooltip={
						forecastScope !== 'both'
							? 'Filtering on production is only available when forecasting on auto and proximity'
							: undefined
					}
					type='number'
				/>

				<Divider />

				<FieldHeader
					label={
						<div css='display: flex; justify-content: space-between;'>
							<span>{pluralize(proxForecasts.length, 'Selected Forecast', 'Selected Forecasts')}</span>
							<span
								css={`
									color: ${countColor};
								`}
							>
								{isLoadingUniqueWellCount
									? 'Loading...'
									: `${numberWithCommas(uniqueWellCount)} Unique Wells`}
							</span>
						</div>
					}
					open={open}
					toggleOpen={() => setOpen((p) => !p)}
				/>

				<FormCollapse in={open}>
					<SectionContainer>
						<Autocomplete
							autoComplete
							disableClearable
							filterOptions={(x) => x}
							filterSelectedOptions
							getOptionLabel={(option) => option.label}
							includeInputInList
							noOptionsText='No Projects'
							onChange={(_ev, newOption) => setSelectedProject(newOption)}
							onInputChange={(_ev, newValue) => setSearchQuery(newValue)}
							options={projects}
							size='small'
							value={selectedProject}
							variant='outlined'
						/>

						<MenuButton
							css={`
								height: 100%;

								// needed to match height of autocomplete input
								padding-top: 8px;
								padding-bottom: 8px;
							`}
							color='secondary'
							disabled={isLoadingForecasts}
							fullWidth
							label='Select Forecasts'
							variant='outlined'
						>
							<MenuContainer>
								{_.map(projectForecasts, (forecast) => {
									const { _id, name } = forecast;
									return (
										<CheckboxItem
											key={_id}
											label={name}
											onChange={(checked) => handleAdjustForecasts(checked, _id)}
											value={proxForecasts.includes(_id)}
										/>
									);
								})}
							</MenuContainer>
						</MenuButton>
					</SectionContainer>

					<List css='margin-top: 1rem;'>
						<ListItem>
							<section
								css={`
									align-items: center;
									display: grid;
									grid-template-columns: repeat(2, 1fr) repeat(2, 0.25fr);
									row-gap: 0.5rem;
									width: 100%;
								`}
							>
								<div css='font-size: 14px; font-weight: 500;'>Selected Forecast</div>
								<div css='font-size: 14px; font-weight: 500;'>Project</div>
								<div css='font-size: 14px; font-weight: 500; display: flex; justify-content: flex-end;'>
									Wells
								</div>
							</section>
						</ListItem>

						<Divider css='margin: 0.25rem 0 0.5rem 0;' />

						<Sortable
							items={proxForecasts}
							onSort={(newSortedArray) => setValue('forecasts', newSortedArray)}
							renderItem={({ item: forecastId, dragRef, dropRef }) => (
								<SelectedForecastItem
									dragRef={dragRef}
									dropRef={dropRef}
									forecastId={forecastId}
									remove={() => handleAdjustForecasts(false, forecastId)}
								/>
							)}
						/>
					</List>
				</FormCollapse>

				<Divider />

				<ProximityOptionsFields />

				<ProximityFormContent>
					{phases.map((phase) => (
						<ProximityPhaseForm key={phase} handlePhaseTypeChange={handlePhaseTypeChange} phase={phase} />
					))}
				</ProximityFormContent>
			</FormHeader>
		</RHFForm>
	);
};

export default ProximityForecastForm;
