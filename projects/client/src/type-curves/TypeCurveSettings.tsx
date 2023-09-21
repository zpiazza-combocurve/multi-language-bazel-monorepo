import _ from 'lodash';
import { useMemo, useReducer, useState } from 'react';
import { useMutation, useQuery } from 'react-query';

import { PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/access-policies/Can';
import usePermissions from '@/access-policies/usePermissions';
import { SimpleSelectDialog } from '@/components/SimpleSelectDialog';
import { Divider, alerts } from '@/components/v2';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { fetchForecast, fetchProjectForecasts, fetchWellsAndCollections } from '@/forecasts/api';
import { ProjectForecastItem } from '@/forecasts/types';
import {
	confirmationAlert,
	createConfirmAddWells,
	createConfirmRemoveWells,
	genericErrorAlert,
	useLoadingBar,
} from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { useDialog } from '@/helpers/dialog';
import { deleteApi, postApi, putApi } from '@/helpers/routing';
import {
	AdditionalSettingsContainer,
	InputContainer,
	InputRadioGroupField,
	InputSelectField,
	SettingsButton,
	SettingsContainer,
	SettingsDeleteButton,
	SettingsInfoContainer,
	SettingsTextField,
} from '@/helpers/settings-page';
import { hasNonWhitespace, pluralize } from '@/helpers/text';
import { fullNameAndLocalDate } from '@/helpers/user';
import { assert } from '@/helpers/utilities';
import { forecastSeries as BASE_FORECAST_SERIES, phases } from '@/helpers/zing';
import { MAX_WELLS_PERFORMANCE_TYPECURVE } from '@/inpt-shared/constants';
import AssignTagsSettingsButton from '@/tags/AssignTagsSettingsButton';
import SettingsTagsList from '@/tags/SettingsTagsList';
import { TC_REGRESSION_TYPES, TC_TYPES, WELL_VALIDATION_OPTIONS } from '@/type-curves/shared/formProperties';
import { getModuleListRoute } from '@/urls';
import { showWellFilter } from '@/well-filter/well-filter';

import { TC_QUERY_KEY_PREFIX, cacheTcData, useTypeCurve } from './api';

export const NO_FORECAST_MESSAGE = 'Add associated forecast to enable this button';

function additionalSettingsReducer(state, action) {
	switch (action.type) {
		case 'tcType':
			return {
				...state,
				basePhase: action.value === 'ratio' ? 'oil' : null,
				tcType: action.value,
				phaseType: { oil: 'rate', gas: 'rate', water: 'rate' },
			};
		case 'basePhase':
			return { ...state, phaseType: { ...state.phaseType, [action.value]: 'rate' }, basePhase: action.value };
		case 'phaseType':
			return { ...state, phaseType: { ...state.phaseType, [action.phaseValue]: action.value } };
		case 'regressionType':
			return { ...state, regressionType: action.value };
		default:
			throw new Error('Invalid action');
	}
}

export function useTypeCurveSettings(id) {
	const reload = () => cacheTcData(id, true);

	const { isLoading: updatingName, mutateAsync: updateName } = useMutation(
		(name: string) => putApi(`/type-curve/${id}/updateTypeCurveName`, { name }),
		{ onSuccess: reload }
	);
	const { isLoading: addingWells, mutateAsync: addWells } = useMutation(
		(wells) => putApi(`/type-curve/${id}/addTypeCurveWells`, { wells }),
		{ onSuccess: reload }
	);
	const { isLoading: removingWells, mutateAsync: removeWells } = useMutation(
		(wells) => putApi(`/type-curve/${id}/removeTypeCurveWells`, { wells }),
		{ onSuccess: reload }
	);

	const copyTypeCurve = async () => {
		try {
			await postApi(`/type-curve/${id}/copy`);
		} catch (err) {
			genericErrorAlert(err, 'Error occured on copy');
		}
	};

	const { isLoading: removingTypeCurve, mutateAsync: removeTypeCurve } = useMutation(
		() => deleteApi(`/type-curve/${id}`),
		{ onSuccess: reload }
	);

	const { isLoading: updatingAdditionalSettings, mutateAsync: updateAdditionalSettings } = useMutation(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		(body: any) => putApi(`/type-curve/${id}/updateTypeCurveAdditionalSettings`, body),
		{ onSuccess: reload }
	);

	const { isLoading: removingAssociatedForecast, mutateAsync: removeAssociatedForecast } = useMutation(
		() => putApi(`/type-curve/removeAssociatedForecast/${id}`),
		{ onSuccess: reload }
	);

	const updating =
		addingWells ||
		removingAssociatedForecast ||
		removingTypeCurve ||
		removingWells ||
		updatingAdditionalSettings ||
		updatingName;

	return {
		addWells,
		copyTypeCurve,
		reload,
		removeAssociatedForecast,
		removeTypeCurve,
		removeWells,
		updateAdditionalSettings,
		updateName,
		updating,
	};
}

export const TYPE_CURVE_RESOLUTION_PREFERENCES = [
	{ label: 'Daily Preference', value: 'daily_preference' },
	{ label: 'Monthly Preference', value: 'monthly_preference' },
	{ label: 'Daily Data', value: 'daily_only' },
	{ label: 'Monthly Data', value: 'monthly_only' },
	{ label: 'Whichever Used To Generate The Forecast', value: 'forecast' },
];

export default function TypeCurveSettings({ typeCurveId: id }) {
	const { isCumTypeCurveFitEnabled } = useLDFeatureFlags();
	const { data: typeCurve } = useTypeCurve(id);

	const {
		addWells,
		copyTypeCurve,
		reload,
		removeAssociatedForecast,
		removeWells,
		updateAdditionalSettings,
		updateName,
		updating,
	} = useTypeCurveSettings(id);

	assert(typeCurve);
	const forecastQueryResult = useQuery([...TC_QUERY_KEY_PREFIX, id, 'forecast', typeCurve.forecast], () =>
		fetchForecast(typeCurve.forecast)
	);
	const forecast = forecastQueryResult.data;

	const { isFetched: projectForecastsFetched, data: projectForecasts } = useQuery<ProjectForecastItem[]>(
		['forecast', 'all-forecast-in-project', typeCurve.project],
		() => fetchProjectForecasts(typeCurve.project)
	);

	const { data: forecastWellsAndCollections, isLoading: forecastWellsLoading } = useQuery(
		['type-curves', 'forecast-wells-and-collections', typeCurve.forecast],
		() => fetchWellsAndCollections(typeCurve.forecast)
	);

	const forecastWells = useMemo(() => {
		if (!forecastWellsAndCollections) {
			return [];
		}
		return forecastWellsAndCollections.wellIds || [];
	}, [forecastWellsAndCollections]);

	const [forecastSeries, setForecastSeries] = useState<string>(typeCurve.forecastSeries ?? 'best');
	const [name, setName] = useState<string>(typeCurve.name);
	const [resolutionPreference, setResolutionPreference] = useState<string>(
		typeCurve.resolutionPreference ?? 'forecast'
	);
	const [wellValidationCriteria, setWellValidationCriteria] = useState<string>(
		typeCurve?.wellValidationCriteria ?? 'must_have_prod_and_forecast'
	);

	const [{ basePhase, phaseType, regressionType, tcType }, dispatch] = useReducer(additionalSettingsReducer, {
		basePhase: typeCurve.basePhase,
		phaseType: typeCurve.phaseType,
		regressionType: typeCurve.regressionType,
		tcType: typeCurve.tcType,
	});

	const [simpleSelectForecastDialog, openSimpleSelectForecastDialog] = useDialog(
		SimpleSelectDialog<ProjectForecastItem>,
		{
			title: 'Select Forecast',
			items:
				projectForecastsFetched && projectForecasts
					? projectForecasts
							.filter((forecastItem) => forecastItem._id !== typeCurve?.forecast)
							.map((forecastItem) => ({
								value: forecastItem,
								key: forecastItem._id,
								primaryText: forecastItem.name,
							}))
					: [],
		}
	);

	const { isLoading: changingForecast, mutateAsync: changeForecast } = useMutation(
		async () => {
			const newForecast = await openSimpleSelectForecastDialog();
			if (newForecast) {
				try {
					await postApi(`/type-curve/${typeCurve._id}/change-associated-forecast`, {
						newForecastId: newForecast._id,
					});
					confirmationAlert('Associated forecast changed successfully');
				} catch (error) {
					genericErrorAlert(error);
				}
			}

			return null;
		},
		{ onSuccess: reload }
	);

	const { mutateAsync: handleSaveName } = useMutation(async () => {
		const msg = await updateName(name);
		confirmationAlert(msg);
	});

	const { mutateAsync: handleAddWells } = useMutation(async () => {
		const selectedWells = await showWellFilter({
			wells: forecastWells,
			existingWells: typeCurve.wells,
			type: 'add',
			confirm: createConfirmAddWells('type curve'),
			wellsPerformanceThreshold: MAX_WELLS_PERFORMANCE_TYPECURVE,
		});
		if (!selectedWells) {
			return;
		}

		const { msg } = await addWells(selectedWells);
		confirmationAlert(msg);
	});

	const { mutateAsync: handleRemoveWells } = useMutation(async () => {
		const selectedWells = await showWellFilter({
			wells: typeCurve.wells,
			type: 'remove',
			confirm: createConfirmRemoveWells('type curve'),
			wellsPerformanceThreshold: MAX_WELLS_PERFORMANCE_TYPECURVE,
		});
		if (!selectedWells) {
			return;
		}

		const { msg } = await removeWells(selectedWells);
		confirmationAlert(msg);
	});

	const { mutateAsync: handleCopyTypeCurve } = useMutation(async () => {
		const confirmed = await alerts.confirm({
			title: 'Are you sure you want to copy this type curve?',
			confirmText: 'Copy',
		});

		if (!confirmed) {
			return;
		}

		await copyTypeCurve();
	});

	const { mutateAsync: handleRemoveAssociatedForecast } = useMutation(async () => {
		const confirmed = await alerts.confirm({
			title: 'Are you sure you want to remove the associated forecast?',
			confirmText: 'Delete',
			confirmColor: 'error',
		});

		if (!confirmed) {
			return;
		}

		try {
			await removeAssociatedForecast();
			confirmationAlert('Associated forecast changed successfully');
		} catch (error) {
			genericErrorAlert(error);
		}
	});

	const { mutateAsync: handleSaveAdditionalSettings } = useMutation(async () => {
		const deletePhases =
			typeCurve.regressionType !== regressionType
				? ['oil', 'gas', 'water']
				: _.reduce(
						phaseType,
						(acc, value, key) => {
							if (
								typeCurve.phaseType?.[key] !== value ||
								(value === 'ratio' && basePhase !== typeCurve?.basePhase)
							) {
								acc.push(key);
							}
							return acc;
						},
						[] as Array<string>
				  );

		let update = true;
		if (deletePhases.length) {
			update = await alerts.confirm({
				title: 'Delete Saved Fits',
				children: `The phase type, base phase, or regression type has changed for ${deletePhases.join(
					', '
				)}. The saved fit for ${pluralize(
					deletePhases.length,
					'this phase',
					'these phases',
					false
				)} will be deleted.`,
			});
		}

		if (update) {
			const { message } = await updateAdditionalSettings({
				basePhase,
				deletePhases,
				forecastSeries,
				phaseType,
				regressionType,
				resolutionPreference,
				tcType,
				wellValidationCriteria,
			});
			confirmationAlert(message);
		}
	});

	const edittedBasePhase = basePhase !== typeCurve.basePhase;
	const edittedForecastSeries = forecastSeries !== typeCurve.forecastSeries;
	const edittedPhaseType = !!Object.keys(phaseType).find((key) => typeCurve.phaseType?.[key] !== phaseType?.[key]);
	const editedRegressionType = regressionType !== typeCurve.regressionType;
	const edittedResolutionPreference = resolutionPreference !== typeCurve.resolutionPreference;
	const edittedTcType = tcType !== typeCurve.tcType;
	const edittedWellValidationCriteria = wellValidationCriteria !== typeCurve?.wellValidationCriteria;

	const areAdditionalSettingsEdited =
		edittedBasePhase ||
		edittedForecastSeries ||
		edittedPhaseType ||
		editedRegressionType ||
		edittedResolutionPreference ||
		edittedTcType ||
		edittedWellValidationCriteria;

	const loading = forecastQueryResult.isLoading || forecastWellsLoading || updating;

	useLoadingBar(loading);

	const { project } = useAlfa();

	const { canUpdate: canUpdateTypeCurve, canDelete: canDeleteTypeCurve } = usePermissions(
		SUBJECTS.TypeCurves,
		project?._id
	);

	return (
		<SettingsContainer>
			<SettingsInfoContainer>
				<SettingsTextField disabled={!typeCurve} label='Type Curve Name' value={name} onChange={setName} />
				<SettingsTextField disabled label='Associated Forecast' value={forecast?.name ?? 'N/A'} />
				<SettingsTextField
					disabled
					label='Created By'
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
					// @ts-expect-error
					value={fullNameAndLocalDate(typeCurve.createdBy, typeCurve.createdAt)}
				/>
				<SettingsTextField disabled label='Wells In Type Curve' value={typeCurve.wells?.length ?? 'N/A'} />
				<SettingsTagsList feat='typeCurve' featId={typeCurve._id} />
			</SettingsInfoContainer>
			{typeCurve.name !== name && (
				<>
					<SettingsButton
						primary
						disabled={name === '' || !hasNonWhitespace(name ?? '') || !canUpdateTypeCurve || loading}
						tooltipLabel={!canUpdateTypeCurve && PERMISSIONS_TOOLTIP_MESSAGE}
						onClick={handleSaveName}
						label='Save Name'
						info={[`From - ${typeCurve.name}`, `To - ${name}`]}
					/>
					<Divider />
				</>
			)}
			<SettingsButton
				primary
				disabled={!canUpdateTypeCurve || loading || !forecast}
				tooltipLabel={
					(!canUpdateTypeCurve && PERMISSIONS_TOOLTIP_MESSAGE) || (!forecast && NO_FORECAST_MESSAGE)
				}
				onClick={handleAddWells}
				label='Add Wells'
				info={[
					'Add available wells to this type curve',
					'Added wells will be available to any user viewing this type curve',
				]}
			/>

			<SettingsButton
				warning
				disabled={!canUpdateTypeCurve || loading || !forecast}
				tooltipLabel={
					(!canUpdateTypeCurve && PERMISSIONS_TOOLTIP_MESSAGE) || (!forecast && NO_FORECAST_MESSAGE)
				}
				onClick={handleRemoveWells}
				label='Remove Wells'
				info={['Remove wells from this type curve']}
			/>

			<Divider />

			<SettingsButton
				primary
				disabled={!canUpdateTypeCurve || loading || changingForecast}
				tooltipLabel={!canUpdateTypeCurve && PERMISSIONS_TOOLTIP_MESSAGE}
				onClick={changeForecast}
				label='Choose Forecast'
				info={[
					'Change associated forecast for this type curve',
					'Only wells that overlap between the current type curve and the new forecast will be kept',
					'Representative status and normalization multiplier will be kept for the remaining wells',
				]}
			/>

			{simpleSelectForecastDialog}

			<SettingsButton
				warning
				disabled={!canUpdateTypeCurve || loading || changingForecast || !forecast}
				tooltipLabel={
					(!canUpdateTypeCurve && PERMISSIONS_TOOLTIP_MESSAGE) || (!forecast && NO_FORECAST_MESSAGE)
				}
				onClick={handleRemoveAssociatedForecast}
				label='Remove Forecast'
				info={[
					'Remove dependency of this TC from the associated forecast',
					'All wells will be removed from the TC',
				]}
			/>

			<Divider />

			<SettingsButton
				primary
				disabled={!canUpdateTypeCurve || loading}
				tooltipLabel={!canUpdateTypeCurve && PERMISSIONS_TOOLTIP_MESSAGE}
				onClick={handleCopyTypeCurve}
				label='Copy Type Curve'
				info={[
					'Copies type curve and all of its contents',
					'Associated type curve economic assumptions will not be copied',
				]}
			/>

			<AssignTagsSettingsButton
				tooltipLabel={!canUpdateTypeCurve ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
				disabled={!canUpdateTypeCurve}
				feat='typeCurve'
				featId={typeCurve._id}
			/>

			<SettingsDeleteButton
				feat='Type Curve'
				disabled={!canDeleteTypeCurve}
				tooltipLabel={!canDeleteTypeCurve && PERMISSIONS_TOOLTIP_MESSAGE}
				onDelete={() => deleteApi(`/type-curve/${typeCurve._id}`)}
				name={typeCurve.name}
				info={['Deletes type curve and all of its contents', 'Deletes all associated economic assumptions']}
				requireName
				redirectTo={getModuleListRoute('typeCurves', project?._id)}
			/>

			<Divider />

			<AdditionalSettingsContainer>
				<InputContainer>
					<InputSelectField
						disabled={loading || forecast?.type === 'deterministic'}
						label='Series'
						menuItems={BASE_FORECAST_SERIES}
						onChange={(ev) => setForecastSeries(ev.target.value)}
						value={forecastSeries}
					/>

					<InputSelectField
						disabled={loading}
						label='Data Used To Generate Type Curve'
						menuItems={TYPE_CURVE_RESOLUTION_PREFERENCES}
						onChange={(ev) => setResolutionPreference(ev.target.value)}
						value={resolutionPreference}
					/>
					<InputSelectField
						label='Well Validation Criteria'
						menuItems={WELL_VALIDATION_OPTIONS}
						onChange={(ev) => setWellValidationCriteria(ev.target.value)}
						value={wellValidationCriteria}
					/>

					{isCumTypeCurveFitEnabled && (
						<InputSelectField
							menuItems={TC_REGRESSION_TYPES}
							label='Regression Type'
							onChange={(ev) => dispatch({ type: 'regressionType', value: ev.target.value })}
							value={regressionType}
						/>
					)}
				</InputContainer>

				<Divider flexItem orientation='vertical' />

				<InputContainer>
					<InputRadioGroupField
						label='Fit Type'
						onChange={(ev) => dispatch({ type: 'tcType', value: ev.target.value })}
						options={TC_TYPES}
						value={tcType}
						size='small'
					/>

					{tcType === 'ratio' && (
						<>
							<InputSelectField
								label='Base Phase'
								menuItems={phases}
								onChange={(ev) => dispatch({ type: 'basePhase', value: ev.target.value })}
								value={basePhase}
							/>

							<div
								css={`
									display: flex;
									justify-content: space-between;
								`}
							>
								{phases.map(({ value: phaseValue, label: phaseLabel }) => (
									<InputRadioGroupField
										key={`${phaseValue}-phaseType__RadioGroup`}
										disabled={basePhase === phaseValue}
										label={phaseLabel}
										onChange={(ev) =>
											dispatch({ type: 'phaseType', phaseValue, value: ev.target.value })
										}
										options={TC_TYPES}
										value={phaseType[phaseValue]}
										size='small'
									/>
								))}
							</div>
						</>
					)}
				</InputContainer>
			</AdditionalSettingsContainer>

			<SettingsButton
				primary
				disabled={!canUpdateTypeCurve || loading || !areAdditionalSettingsEdited}
				tooltipLabel={!canUpdateTypeCurve && PERMISSIONS_TOOLTIP_MESSAGE}
				onClick={handleSaveAdditionalSettings}
				label='Save Settings'
				info={[
					'Can change type curve type',
					'Ratio type curves must have one selected base phase',
					'Base phase must utilize rate based forecast',
					'Changing the regression type, phase type, or base phase will remove saved fits',
				]}
			/>
		</SettingsContainer>
	);
}
