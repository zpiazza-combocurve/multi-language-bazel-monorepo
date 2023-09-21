import { subject } from '@casl/ability';
import produce from 'immer';
import { useCallback } from 'react';
import { useMutation } from 'react-query';
import { useMatch } from 'react-router-dom';

import { ACTIONS, Can, PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/access-policies/Can';
import { Placeholder } from '@/components';
import { useCallbackRef, useDerivedState } from '@/components/hooks';
import { Divider, alerts } from '@/components/v2';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { KEYS, useForecast } from '@/forecasts/api';
import ConvertForecastDialog, { Values as ConvertForecastValues } from '@/forecasts/shared/ConvertForecastDialog';
import {
	confirmationAlert,
	createConfirmAddWells,
	createConfirmRemoveWells,
	genericErrorAlert,
	warningAlert,
	withLoadingBar,
} from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { queryClient } from '@/helpers/query-cache';
import { deleteApi, postApi, putApi } from '@/helpers/routing';
import {
	SettingsButton,
	SettingsContainer,
	SettingsDeleteButton,
	SettingsInfoContainer,
	SettingsTextField,
} from '@/helpers/settings-page';
import { hasNonWhitespace } from '@/helpers/text';
import { fullNameAndLocalDate } from '@/helpers/user';
import { assert } from '@/helpers/utilities';
import { MAX_WELLS_PERFORMANCE_FORECAST } from '@/inpt-shared/constants';
import { useCurrentProject } from '@/projects/api';
import { projectRoutes } from '@/projects/routes';
import AssignTagsSettingsButton from '@/tags/AssignTagsSettingsButton';
import SettingsTagsList from '@/tags/SettingsTagsList';
import { getModuleListRoute } from '@/urls';
import { showWellFilter } from '@/well-filter/well-filter';

const getConvertForecastType = (forecast) => {
	const fromForecastType = forecast?.type;
	if (fromForecastType) {
		const toForecastType = fromForecastType === 'probabilistic' ? 'deterministic' : 'probabilistic';
		return { fromForecastType, toForecastType };
	}
	return { fromForecastType: '', toForecastType: '' };
};

const ForecastSettings = ({ toggleAll }) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const match = useMatch<any, any>(`${projectRoutes.project(':projectId').forecast(':id').root}/*`);
	const { isWellsCollectionsEnabled } = useLDFeatureFlags();

	assert(match);

	const forecastId = match.params.id;
	const { data: forecast, isLoading } = useForecast(forecastId);
	const [convertForecastDialog, promptConvertForecastDialog] = useDialog(ConvertForecastDialog);

	const { project } = useCurrentProject();
	assert(project);

	const [name, setName] = useDerivedState<string>(forecast.name);

	const updateForecastQuery = useCallbackRef((draftFunc) =>
		queryClient.setQueryData(KEYS.forecastDocument(forecastId), (curForecast) => produce(curForecast, draftFunc))
	);

	const { mutateAsync: handleSaveForecastName } = useMutation(async () => {
		const msg = await withLoadingBar(putApi(`/forecast/${forecast._id}/updateForecastName`, { name }));
		confirmationAlert(msg);
		updateForecastQuery((draft) => {
			draft.name = name;
		});
	});

	const handleShowWellFilter = useCallback(
		(props) =>
			showWellFilter({
				project,
				totalWellsText: 'Total Wells',
				wellsPerformanceThreshold: MAX_WELLS_PERFORMANCE_FORECAST,
				...props,
			}),
		[project]
	);

	const { mutateAsync: handleAddWells } = useMutation(async () => {
		const selectedWells = await handleShowWellFilter({
			confirm: createConfirmAddWells('forecast', isWellsCollectionsEnabled),
			existingWells: forecast.wells,
			type: 'add',
			wells: project.wells,
		});

		if (selectedWells) {
			const { wellsIds, message } = await withLoadingBar(
				putApi(`/forecast/${forecast._id}/addForecastWells`, {
					wells: selectedWells,
				})
			);

			if (wellsIds?.length) {
				confirmationAlert(message);
				updateForecastQuery((draft) => {
					draft.wells = wellsIds;
				});
			} else {
				warningAlert(message);
			}
		}
	});

	const { mutateAsync: handleRemoveWells } = useMutation(async () => {
		const selectedWells = await handleShowWellFilter({
			confirm: createConfirmRemoveWells('forecast'),
			type: 'remove',
			wells: forecast.wells,
		});

		if (selectedWells) {
			const { wells, msg } = await withLoadingBar(
				putApi(`/forecast/${forecast._id}/removeForecastWells`, {
					wells: selectedWells,
				})
			);

			confirmationAlert(msg);
			toggleAll({ checked: false, wellIds: selectedWells, suppressConfirmation: true });
			updateForecastQuery((draft) => {
				draft.wells = wells;
			});
		}
	});

	const { mutateAsync: handleCopyForecast } = useMutation(async () => {
		const confirmed = await alerts.confirm({
			children: 'Are you sure you want to copy this forecast?',
			confirmText: 'Copy',
			helperText: 'Type curves related to this forecast will not be copied.',
			title: 'Copy Forecast',
		});

		if (!confirmed) {
			return;
		}

		try {
			await postApi(`/forecast/${forecast._id}/copy`);
		} catch (e) {
			genericErrorAlert(e, 'Error occurred during copy');
		}
	});

	const { mutateAsync: handleConvertForecast } = useMutation(async () => {
		const { fromForecastType, toForecastType } = getConvertForecastType(forecast);
		const result = await promptConvertForecastDialog({
			initialName: `${forecast.name} (Type-Conversion)`,
			title: `From ${fromForecastType} To ${toForecastType}`,
		});

		if (!result) {
			return;
		}

		const { name } = result as ConvertForecastValues;
		try {
			await postApi(`/forecast/${forecast._id}/convert`, { newForecastName: name });
		} catch (e) {
			genericErrorAlert(e);
		}
	});

	const { fromForecastType, toForecastType } = getConvertForecastType(forecast);

	if (isLoading) {
		return <Placeholder loading main loadingText='Loading Forecast' />;
	}

	return (
		<SettingsContainer>
			{convertForecastDialog}
			<SettingsInfoContainer>
				<SettingsTextField
					id='forecast-name'
					disabled={!forecast}
					label='Forecast Name'
					onChange={(val) => setName(val)}
					value={name}
				/>

				<SettingsTextField
					id='created-by'
					disabled
					label='Created By'
					value={fullNameAndLocalDate(forecast.user, forecast.createdAt)}
				/>

				<SettingsTextField
					id='forecast-wells'
					disabled
					label='Wells In Forecast'
					value={forecast?.wells?.length ?? ''}
				/>

				<SettingsTagsList feat='forecast' featId={forecast._id} />
			</SettingsInfoContainer>

			<Can do={ACTIONS.Update} on={subject(SUBJECTS.Forecasts, { project: project._id })} passThrough>
				{(canUpdateForecast) => (
					<>
						{forecast.name !== name && (
							<>
								<SettingsButton
									primary
									onClick={handleSaveForecastName}
									disabled={name === '' || !hasNonWhitespace(name) || !canUpdateForecast}
									tooltipLabel={!canUpdateForecast ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
									label='Save Name'
									info={[`From - ${forecast.name}`, `To - ${name}`]}
								/>
								<Divider />
							</>
						)}

						<SettingsButton
							primary
							onClick={handleAddWells}
							disabled={!canUpdateForecast}
							tooltipLabel={!canUpdateForecast ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
							label='Add Wells'
							info={[
								'Add available wells to this forecast',
								'Added wells will be available to any user viewing this forecast',
							]}
						/>
						<SettingsButton
							warning
							onClick={handleRemoveWells}
							disabled={!canUpdateForecast}
							tooltipLabel={!canUpdateForecast ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
							label='Remove Wells'
							info={['Remove wells from this forecast AND from associated type curves']}
						/>

						<Divider />

						<SettingsButton
							secondary
							disabled={!canUpdateForecast}
							tooltipLabel={!canUpdateForecast ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
							onClick={handleCopyForecast}
							label='Copy Forecast'
							info={[
								'Copies forecast and all of its contents',
								'Associated type curves will not be copied',
							]}
						/>

						<Can do={ACTIONS.Delete} on={subject(SUBJECTS.Forecasts, { project: project._id })} passThrough>
							{(canDeleteForecast) => (
								<SettingsDeleteButton
									feat='Forecast'
									redirectTo={getModuleListRoute('forecasts', project?._id)}
									onDelete={(deleteTypeCurves) =>
										deleteApi(`/forecast/${forecast._id}?deleteTypeCurves=${deleteTypeCurves}`)
									}
									tooltipLabel={!canDeleteForecast ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
									disabled={!canDeleteForecast}
									name={forecast.name}
									info={['Deletes forecast and all of its contents']}
									extraOption={{
										enabled: true,
										info: 'Delete all associated type curves',
									}}
									requireName
								/>
							)}
						</Can>

						<SettingsButton
							secondary
							disabled={!canUpdateForecast}
							tooltipLabel={!canUpdateForecast ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
							onClick={handleConvertForecast}
							label='Convert Forecast'
							info={[
								`Convert from ${fromForecastType} to ${toForecastType}`,
								'This forecast will be kept',
								'Conversion will create a new forecast',
							]}
						/>

						<AssignTagsSettingsButton
							tooltipLabel={!canUpdateForecast ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
							disabled={!canUpdateForecast}
							feat='forecast'
							featId={forecast._id}
						/>
					</>
				)}
			</Can>
		</SettingsContainer>
	);
};

export default ForecastSettings;
