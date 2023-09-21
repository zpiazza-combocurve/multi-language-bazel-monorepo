import { faQuestion, faTimes, faUserCog } from '@fortawesome/pro-regular-svg-icons';
import { useTheme } from '@material-ui/core';
import produce from 'immer';
import _ from 'lodash-es';
import { Dispatch, SetStateAction, useEffect, useMemo } from 'react';
import { useMutation } from 'react-query';

import { getTaggingProp } from '@/analytics/tagging';
import { EVENTS, useTrackAnalytics } from '@/analytics/useTrackAnalytics';
import { useCallbackRef, useDerivedState } from '@/components/hooks';
import { Button, CheckboxField, Divider, IconButton, Tab, Tabs } from '@/components/v2';
import { InfoTooltipWrapper, LabeledFieldContainer } from '@/components/v2/misc';
import SelectField from '@/components/v2/misc/SelectField';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { confirmationAlert, warningAlert, withLoadingBar } from '@/helpers/alerts';
import { DEFAULT_QUERY_OPTIONS, queryClient } from '@/helpers/query-cache';
import { postApi } from '@/helpers/routing';
import { labelWithUnit } from '@/helpers/text';
import { numberWithCommas } from '@/helpers/utilities';
import { MAX_AUTO_PROXIMITY_WELLS } from '@/inpt-shared/constants';
import useZoho, { ZOHO_ARTICLE_IDS } from '@/knowledge-base/useZoho';
import { useWellsHeadersMap } from '@/manage-wells/shared/utils';

import { VALID_PHASES } from '../charts/components/graphProperties';
import { ForecastToolbarTheme } from '../deterministic/layout';
import { ParametersTitleWithSubtext } from '../shared/ForecastParameters';
import AutomaticForecastForm from './automatic-form/AutomaticForecastForm';
import { ForecastFormResolution, Phase } from './automatic-form/types';
import {
	DEFAULT_FORM_RESOLUTION,
	UseAutomaticForecastReturn,
	resolutionItems,
} from './automatic-form/useAutomaticForecast';
import { mapConfig } from './forecastConfig';
import {
	ChipLabel,
	ConfigurationLabel,
	FieldLabel,
	FormFooter,
	FormToolbar,
	ScrolledContent,
	StyledFloater,
	TabsContainer,
} from './phase-form/layout';
import ProximityForecastForm from './proximity-form/ProximityForecastForm';
import useProximityBinning from './proximity-form/useProximityBinning';
import { UseProximityForecastReturn } from './proximity-form/useProximityForecast';
import { UseForecastFormConfigurationReturn } from './useForecastFormConfiguration';

const DEFAULT_SCOPE_OBJECT = { auto: true, proximity: false };
const DEFAULT_FORM_TYPE = 'auto';

export type ForecastScope = 'auto' | 'proximity' | 'both';
export type ForecastFormType = 'auto' | 'proximity';
export type ForecastScopeObj = { auto: boolean; proximity: boolean };

const MAX_PROXIMITY_WELLS_ERROR = `Exceeded auto proximity maximum of ${numberWithCommas(
	MAX_AUTO_PROXIMITY_WELLS
)} wells`;

const formTypes: Array<{ label: string; value: ForecastFormType; disabledTooltip: string }> = [
	{ label: 'Auto Forecast', value: 'auto', disabledTooltip: "Enable by checking 'Run Auto Forecast' above." },
	{
		label: 'Proximity Forecast',
		value: 'proximity',
		disabledTooltip: "Enable by checking 'Run Proximity Forecast' above.",
	},
];

const getForecastScopeString = (scope: ForecastScopeObj): undefined | ForecastScope => {
	if (scope.auto && scope.proximity) return 'both';
	else if (scope.proximity) return 'proximity';
	else if (scope.auto) return 'auto';
	return undefined;
};

export const getEnabledPhases = (phases): Array<Phase> =>
	(phases ? Object.keys(phases).filter((curPhase) => phases[curPhase]) : [...VALID_PHASES]) as Array<Phase>;

const useForecastScopeAndType = ({
	configurationProps,
}: {
	configurationProps: UseForecastFormConfigurationReturn;
}) => {
	const { isProximityForecastEnabled } = useLDFeatureFlags();

	const { activeForecastScope, activeForecastFormType } = configurationProps;

	const [forecastScope, _setForecastScope] = useDerivedState<ForecastScopeObj>(
		() => (_.isString(activeForecastScope) || !activeForecastScope ? DEFAULT_SCOPE_OBJECT : activeForecastScope),
		[activeForecastScope]
	);

	const [forecastFormType, setForecastFormType] = useDerivedState<ForecastFormType>(
		() => (isProximityForecastEnabled ? activeForecastFormType ?? DEFAULT_FORM_TYPE : DEFAULT_FORM_TYPE),
		[activeForecastFormType]
	);

	const setForecastScope = useCallbackRef(({ forecastType, checked }) => {
		_setForecastScope(
			produce((draft) => {
				draft[forecastType] = checked;
				if (draft.auto && !draft.proximity) setForecastFormType('auto');
				else if (!draft.auto && draft.proximity) setForecastFormType('proximity');
			})
		);
	});

	return { forecastScope, forecastFormType, setForecastScope, setForecastFormType };
};

const FORM_FLOATER_HANDLE = 'forecast-form-floater';

const ForecastFormContainer = ({
	automaticForecastProps,
	configurationProps,
	disabled,
	forecastFormType,
	forecastId,
	forecastingCallback,
	forecastScope,
	handleToggle = _.noop,
	proximityForecastProps,
	resolution,
	setForecastFormType,
	setForecastScope,
	setResolution,
	wellIds,
}: {
	automaticForecastProps: UseAutomaticForecastReturn;
	configurationProps: UseForecastFormConfigurationReturn;
	disabled?: boolean | string;
	forecastFormType: ForecastFormType;
	forecastId: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	forecastingCallback?: (values: any) => void;
	forecastScope: ForecastScopeObj;
	handleToggle: () => void;
	proximityForecastProps: UseProximityForecastReturn;
	resolution: ForecastFormResolution;
	setForecastFormType: Dispatch<SetStateAction<ForecastFormType>>;
	setForecastScope: ({ forecastType, checked }: { forecastType: ForecastFormType; checked: boolean }) => void;
	setResolution: (value: ForecastFormResolution) => void;
	wellIds: Array<string>;
}) => {
	const theme = useTheme();
	const track = useTrackAnalytics();

	const { isProximityForecastEnabled } = useLDFeatureFlags();
	const { openArticle } = useZoho();

	const { activeConfigName, configDialog, showConfigDialog: _showConfigDialog } = configurationProps;

	const {
		form: autoForm,
		formError: autoFormError,
		getSubmissionBody: getAutoBody,
		handleApplyAllChange: autoHandleApplyAll,
	} = automaticForecastProps;

	const {
		form: proximityForm,
		formError: proximityFormError,
		getSubmissionBody: getProximityBody,
		handleApplyAllChange: proximityHandleApplyAll,
		isLoadingUniqueWellCount,
	} = proximityForecastProps;

	const { setValue: autoSetValue, watch: watchAuto } = autoForm;
	const { setValue: proximitySetValue, watch: watchProximity } = proximityForm;

	const [autoApplyAll, autoOverwriteManual] = watchAuto(['applyAll', 'shared.overwrite_manual']);
	const [proximityApplyAll, proximityOverwriteManual, selectedProximityForecasts] = watchProximity([
		'applyAll',
		'overwriteManual',
		'forecasts',
	]);

	const singleWell = wellIds?.length === 1;
	const formTypeIsAuto = forecastFormType === 'auto';

	const wellHeaderQuery = useWellsHeadersMap(wellIds ?? [], {
		...DEFAULT_QUERY_OPTIONS,
		enabled: singleWell,
	});

	const {
		data: binningData,
		isLoading: binningIsLoading,
		isFetching: binningIsFetching,
	} = useProximityBinning({
		forecastId,
		form: proximityForm,
		forecastScope,
		resolution,
		wells: wellIds,
	});

	const wellCounts = useMemo(() => {
		const totalWells = wellIds.length;
		const { autoWells, proximityWells } = binningData;

		if (forecastScope.auto && forecastScope.proximity) {
			return { auto: autoWells.length, proximity: proximityWells.length };
		}
		if (forecastScope.auto) {
			return { auto: totalWells, proximity: 0 };
		}
		if (forecastScope.proximity) {
			return { auto: 0, proximity: totalWells };
		}
		return { auto: 0, proximity: 0 };
	}, [binningData, forecastScope.auto, forecastScope.proximity, wellIds.length]);

	const { data: wellHeaderMap, isFetching } = wellHeaderQuery;

	const wellLabel = useMemo(() => {
		if (isFetching) {
			return 'Loading...';
		}
		if (singleWell) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			const well = (wellHeaderMap as any)?.get(wellIds[0]);
			return well ? `${well.well_name}` : '';
		}
		return '';
	}, [isFetching, wellHeaderMap, wellIds, singleWell]);

	const wellNumber = useMemo(() => {
		if (isFetching) {
			return 'Loading...';
		}
		if (singleWell) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			const well = (wellHeaderMap as any)?.get(wellIds[0]);
			return well ? `${well?.well_number ?? ''}` : '';
		}
		return '';
	}, [isFetching, wellHeaderMap, wellIds, singleWell]);

	const showConfigDialog = useCallbackRef(() => {
		// blur field element if active; some fields cast values onBlur
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		(document?.activeElement as any)?.blur?.();
		const newConfig = {
			forecastFormType,
			forecastScope,
			proximitySettings: proximityForm.getValues(),
			resolution,
			settings: mapConfig(autoForm.getValues()),
		};
		_showConfigDialog(newConfig);
	});

	const { mutateAsync: handleSubmit, isLoading: isSubmitting } = useMutation(async () => {
		const autoBody = getAutoBody();
		const proximityBody = getProximityBody();

		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			const body: Record<string, any> = {
				auto: autoBody,
				proximity: proximityBody,
				resolution,
				scope: [],
				wells: wellIds,
			};

			// force auto scope if proximity feature is disabled
			if (forecastScope.auto || !isProximityForecastEnabled) {
				body.scope.push('auto');
			}
			if (forecastScope.proximity && isProximityForecastEnabled) {
				body.scope.push('proximity');
			}

			track(EVENTS.forecast.run, _.omit(body, ['wells']));
			const { createdTask, task, ranForecast } = await withLoadingBar(
				postApi(`/forecast/${forecastId}/autoFullForecast`, body)
			);

			if (ranForecast) {
				confirmationAlert('Forecast completed successfully');
			}

			forecastingCallback?.({ createdTask, taskId: task, ranForecast, formProps: { values: autoBody } });
			handleToggle();
		} catch (error) {
			warningAlert(error);
		}
	});

	const forecastScopeString = getForecastScopeString(forecastScope);

	const disabledRunMessage = useMemo(() => {
		if (disabled) {
			return disabled;
		}
		if (isSubmitting) {
			return 'Submitting forecast form';
		}

		if (binningIsLoading || binningIsFetching) {
			return 'Determining proximity wells';
		}

		if (isLoadingUniqueWellCount) {
			return 'Loading unique well count';
		}

		const hasAutoError = Boolean(autoFormError);
		const hasProximityError = Boolean(proximityFormError);

		const proximityEnabled = forecastScope.proximity;
		const autoEnabled = forecastScope.auto;

		if ((proximityEnabled || autoEnabled) && (hasAutoError || hasProximityError)) {
			return (
				<div css='display: flex; flex-direction: column;'>
					{hasAutoError && forecastScope.auto && <span>Auto Forecast: {autoFormError}</span>}
					{hasProximityError && forecastScope.proximity && (
						<span>Proximity Forecast: {proximityFormError}</span>
					)}
				</div>
			);
		}
		if (proximityEnabled) {
			if (selectedProximityForecasts?.length < 1) {
				return 'Cannot have 0 selected forecasts for proximity';
			}
			// check against binned wells
			if (autoEnabled && binningData?.proximityWells?.length > MAX_AUTO_PROXIMITY_WELLS) {
				return MAX_PROXIMITY_WELLS_ERROR;
			}
			// check against all wells
			if (!autoEnabled && wellIds?.length > MAX_AUTO_PROXIMITY_WELLS) {
				return MAX_PROXIMITY_WELLS_ERROR;
			}
		}
		// only check if proximity feature is enabled
		if (isProximityForecastEnabled && !(proximityEnabled || autoEnabled)) {
			return "Select 'Run Auto Forecast', 'Run Proximity Forecast', or both";
		}
		if (isLoadingUniqueWellCount) {
			return 'Loading unique well count';
		}
		return false;
	}, [
		autoFormError,
		binningData?.proximityWells?.length,
		binningIsLoading,
		binningIsFetching,
		disabled,
		isProximityForecastEnabled,
		forecastScope.auto,
		forecastScope.proximity,
		isLoadingUniqueWellCount,
		isSubmitting,
		proximityFormError,
		selectedProximityForecasts?.length,
		wellIds?.length,
	]);

	const scrolledContentRender = useMemo(
		() => (
			<ScrolledContent>
				{!isProximityForecastEnabled && (
					<LabeledFieldContainer>
						<FieldLabel>Forecast Resolution</FieldLabel>
						<SelectField
							menuItems={resolutionItems}
							onChange={(ev) => setResolution(ev.target.value as ForecastFormResolution)}
							size='small'
							value={resolution}
							variant='outlined'
						/>
					</LabeledFieldContainer>
				)}

				{forecastFormType === 'auto' && (
					<AutomaticForecastForm {...automaticForecastProps} forecastId={forecastId} />
				)}

				{forecastFormType === 'proximity' && (
					<ProximityForecastForm {...proximityForecastProps} forecastScope={forecastScopeString} />
				)}
			</ScrolledContent>
		),
		[
			automaticForecastProps,
			isProximityForecastEnabled,
			forecastFormType,
			forecastId,
			forecastScopeString,
			proximityForecastProps,
			resolution,
			setResolution,
		]
	);

	return (
		<section
			css={`
				display: flex;
				flex-direction: column;
				height: 100%;
				width: 100%;
			`}
		>
			<ForecastToolbarTheme>
				<FormToolbar id={FORM_FLOATER_HANDLE}>
					<div
						css={`
							align-items: flex-start;
							column-gap: 1rem;
							display: flex;
							height: 100%;
						`}
					>
						{singleWell && (
							<>
								<ParametersTitleWithSubtext
									fontSize='1.25rem'
									maxCharacters={15}
									title={wellLabel}
									subText='Well Name'
								/>

								<Divider orientation='vertical' />

								<ParametersTitleWithSubtext
									fontSize='1.25rem'
									maxCharacters={15}
									title={wellNumber || 'N/A'}
									subText='Well Number'
								/>
							</>
						)}

						{!singleWell && (
							<div
								css={`
									font-size: 1.25rem;
									font-weight: 800;
								`}
							>
								Forecast Settings
							</div>
						)}
					</div>

					<div
						css={`
							align-items: center;
							column-gap: 0.5rem;
							display: flex;
							overflow: hidden;
						`}
					>
						{activeConfigName?.length && (
							<ConfigurationLabel tooltipTitle={activeConfigName}>
								{_.truncate(activeConfigName, { length: formTypeIsAuto && autoApplyAll ? 20 : 50 })}
							</ConfigurationLabel>
						)}

						<IconButton
							disabled={(Boolean(autoFormError) || Boolean(proximityFormError)) && 'Form has errors'}
							onClick={() => showConfigDialog()}
							tooltipTitle='Form Configurations'
						>
							{faUserCog}
						</IconButton>

						<IconButton
							onClick={() => openArticle({ articleId: ZOHO_ARTICLE_IDS.DeterministicForecastSetttings })}
							tooltipTitle='Help'
						>
							{faQuestion}
						</IconButton>

						<IconButton tooltipTitle='Close Form' onClick={handleToggle}>
							{faTimes}
						</IconButton>
					</div>
				</FormToolbar>

				{isProximityForecastEnabled ? (
					<TabsContainer>
						<section
							css={`
								display: flex;
								column-gap: 1rem;
								width: ${forecastFormType === 'auto' && !autoApplyAll ? '33%' : '100%'};
							`}
						>
							<div css='flex-grow: 1;'>
								<LabeledFieldContainer>
									<FieldLabel>Forecast Scope</FieldLabel>

									<div css='display: flex; align-items: center; justify-content: space-between;'>
										<CheckboxField
											checked={forecastScope.auto}
											label='Run Auto Forecast'
											labelPlacement='end'
											onChange={(_ev, newValue) =>
												setForecastScope({ forecastType: 'auto', checked: newValue })
											}
											size='small'
										/>

										<ChipLabel tooltipTitle='Wells going to Auto Forecast'>
											{numberWithCommas(wellCounts.auto)}
										</ChipLabel>
									</div>

									<div css='display: flex; align-items: center; justify-content: space-between;'>
										<CheckboxField
											checked={forecastScope.proximity}
											label='Run Proximity Forecast'
											labelPlacement='end'
											onChange={(_ev, newValue) =>
												setForecastScope({ forecastType: 'proximity', checked: newValue })
											}
											size='small'
										/>

										<ChipLabel tooltipTitle='Wells going to Proximity Forecast'>
											{numberWithCommas(wellCounts.proximity)}
										</ChipLabel>
									</div>
								</LabeledFieldContainer>
							</div>

							<div css='width: 50%; padding-right: 8px'>
								<LabeledFieldContainer>
									<FieldLabel>Forecast Resolution</FieldLabel>
									<SelectField
										menuItems={resolutionItems}
										onChange={(ev) => setResolution(ev.target.value as ForecastFormResolution)}
										size='small'
										value={resolution}
										variant='outlined'
									/>
								</LabeledFieldContainer>
							</div>
						</section>

						<Tabs
							indicatorColor='secondary'
							onChange={(_ev, newValue) => {
								if (forecastScopeString === 'both' || forecastScopeString === newValue)
									setForecastFormType(newValue);
							}}
							textColor='secondary'
							value={forecastFormType}
							TabIndicatorProps={{
								style: { backgroundColor: !forecastScopeString ? 'unset' : undefined },
							}}
						>
							{formTypes.map(({ label, value, disabledTooltip }) => {
								const thisError = value === 'auto' ? autoFormError : proximityFormError;
								const tooltipTitle = forecastScope[value] ? thisError : undefined;
								return (
									<Tab
										key={value}
										css={`
											min-width: unset;
											text-transform: unset;
										`}
										disabled={!forecastScope[value] && disabledTooltip}
										label={
											<InfoTooltipWrapper tooltipTitle={tooltipTitle}>
												<span css='display: flex; column-gap: 0.5rem; align-items: center;'>
													{label}
													{value === 'proximity' && (
														<ChipLabel
															css={`
																background-color: ${theme.palette.primary.main};
																color: ${theme.palette[
																	theme.palette.type === 'light'
																		? 'secondary'
																		: 'primary'
																].contrastText};
															`}
															tooltipTitle={
																forecastScope?.proximity &&
																'Proximity is currently in a limited technical release for your organization. Some runs might terminate incompletely, so multiple attempts may be required. Contact Customer Success for feedback.'
															}
														>
															New
														</ChipLabel>
													)}
												</span>
											</InfoTooltipWrapper>
										}
										value={value}
									/>
								);
							})}
						</Tabs>

						<Divider css='margin-top: -0.5rem;' />

						{scrolledContentRender}
					</TabsContainer>
				) : (
					scrolledContentRender
				)}
			</ForecastToolbarTheme>

			<Divider />

			<FormFooter>
				<ForecastToolbarTheme>
					<div
						css={`
							display: flex;
							flex-direction: column;
						`}
					>
						<CheckboxField
							checked={formTypeIsAuto ? autoApplyAll : proximityApplyAll}
							label='Apply Settings To All Phases'
							labelPlacement='end'
							onChange={(_ev, newValue) =>
								(formTypeIsAuto ? autoHandleApplyAll : proximityHandleApplyAll)(newValue)
							}
							size='small'
						/>

						<CheckboxField
							checked={formTypeIsAuto ? autoOverwriteManual : proximityOverwriteManual}
							label='Overwrite Manual'
							labelPlacement='end'
							onChange={(_ev, newValue) =>
								formTypeIsAuto
									? autoSetValue('shared.overwrite_manual', newValue)
									: proximitySetValue('overwriteManual', newValue)
							}
							size='small'
						/>
					</div>
				</ForecastToolbarTheme>

				<div
					css={`
						align-items: center;
						column-gap: 1rem;
						display: flex;
						margin-left: auto;
					`}
				>
					<Button color='secondary' onClick={handleToggle} size='small'>
						Cancel
					</Button>

					<Button
						color='secondary'
						disabled={disabledRunMessage}
						onClick={() => handleSubmit()}
						size='small'
						variant='contained'
						{...getTaggingProp('forecast', 'run')}
					>
						{labelWithUnit('Run', (wellIds?.length ?? 0) > 1 ? wellIds?.length.toString() : undefined)}
					</Button>
				</div>
			</FormFooter>

			{configDialog}
		</section>
	);
};

const ForecastFormFloater = ({
	automaticForecastProps,
	configurationProps,
	forecastFormType,
	forecastId,
	forecastingCallback,
	forecastScope,
	handleToggle,
	proximityForecastProps,
	resolution: parentResolution = DEFAULT_FORM_RESOLUTION,
	setForecastFormType,
	setForecastScope,
	setResolution: setParentResolution,
	visible,
	wellIds = [],
}: ReturnType<typeof useForecastScopeAndType> & {
	automaticForecastProps: UseAutomaticForecastReturn;
	configurationProps: UseForecastFormConfigurationReturn;
	forecastId: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	forecastingCallback: (values: any) => void;
	handleToggle: () => void;
	proximityForecastProps: UseProximityForecastReturn;
	resolution?: ForecastFormResolution;
	setResolution?: Dispatch<SetStateAction<ForecastFormResolution>>;
	visible: boolean;
	wellIds?: Array<string>;
}) => {
	const [resolution, _setResolution] = useDerivedState<ForecastFormResolution>(parentResolution);

	const { watch } = automaticForecastProps.form;
	const applyAll = watch('applyAll');

	const setResolution = useCallbackRef((newValue: ForecastFormResolution) =>
		(setParentResolution ?? _setResolution)(newValue)
	);

	// refresh proximityList queries on mount
	useEffect(() => {
		queryClient.invalidateQueries(['forecast', 'proximityList']);
	}, []);

	// if form is rendered but not visible, it will break the sync with quick edit;
	return visible ? (
		<StyledFloater
			detached
			disableToolbar
			handle={FORM_FLOATER_HANDLE}
			onToggle={handleToggle}
			visible={visible}
			width={forecastFormType === 'auto' && !applyAll ? '70vw' : '30vw'}
		>
			<ForecastFormContainer
				automaticForecastProps={automaticForecastProps}
				configurationProps={configurationProps}
				forecastFormType={forecastFormType}
				forecastId={forecastId}
				forecastingCallback={forecastingCallback}
				forecastScope={forecastScope}
				handleToggle={handleToggle}
				proximityForecastProps={proximityForecastProps}
				resolution={resolution}
				setForecastFormType={setForecastFormType}
				setForecastScope={setForecastScope}
				setResolution={setResolution}
				wellIds={wellIds}
			/>
		</StyledFloater>
	) : null;
};

export default ForecastFormContainer;
export { ForecastFormFloater, useForecastScopeAndType };
