import _ from 'lodash';
import { useCallback } from 'react';
import * as React from 'react';
import { useQueryClient } from 'react-query';

import { getTaggingProp } from '@/analytics/tagging';
import { ChoosePSeriesDialog } from '@/components/ChoosePSeriesDialog';
import { SimpleSelectDialog } from '@/components/SimpleSelectDialog';
import { useCallbackRef } from '@/components/hooks';
import GridItemDialog from '@/cost-model/models/GridItemDialog';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { confirmationAlert, warningAlert, withLoadingBar } from '@/helpers/alerts';
import { toLocalDate } from '@/helpers/dates';
import { DialogProps, useDialog } from '@/helpers/dialog';
import { getApi } from '@/helpers/routing';
import { capitalize } from '@/helpers/text';
import { fullNameAndLocalDate } from '@/helpers/user';
import { AssumptionKey, MAX_FORECAST_NAME_VISIBLE_CHARACTERS } from '@/inpt-shared/constants';
import { showRequestCarbonDemoDialog } from '@/networks/carbon/RequestCarbonDemoDialog';
import { NetworkModel } from '@/networks/carbon/types';
import * as api from '@/scenarios/api';
import { updateEconGroup } from '@/scenarios/api';
import { getAssumptionLabel } from '@/scenarios/shared';

const CONFIRM_DURATION = 5000;

function showAssignConfirm({ total, actual, name, feat }) {
	const differentIds = total - actual;
	if (differentIds) {
		warningAlert(
			`${feat} ${name} assigned to ${actual} properties. ${differentIds} properties did not exist in this ${feat}`,
			CONFIRM_DURATION
		);
		return;
	}
	if (total === 1) {
		confirmationAlert(`${feat} ${name} assigned to property`, CONFIRM_DURATION);
		return;
	}

	confirmationAlert(`${feat} ${name} assigned to ${actual} properties`, CONFIRM_DURATION);
}

function showMassAssignLatestNetworkConfirm({ total, actual }) {
	const differentIds = total - actual;
	if (differentIds) {
		warningAlert(
			`Networks assigned to ${actual} properties. ${differentIds} properties did not exist in any networks`,
			CONFIRM_DURATION
		);
		return;
	}
	if (total === 1) {
		confirmationAlert(`Network assigned to property`, CONFIRM_DURATION);
		return;
	}

	confirmationAlert(`Networks assigned to ${actual} properties`, CONFIRM_DURATION);
}

function GridItemTransition({
	onHide,
	...props
}: DialogProps<null> & Omit<React.ComponentPropsWithoutRef<typeof GridItemDialog>, 'hideDialog'>) {
	return <GridItemDialog hideDialog={onHide} {...props} />;
}

export function useGridItemDialog({
	lookupTables,
	tcLookupTables,
	projectId,
	updateAssignments,
	reloadAssignments,
	scenarioId,
	selectedAssignmentIds,
	selectedWellIds,
	reloadRequiredFields,
	econGroupIds,
}) {
	const { scenario, update } = api.useScenario(scenarioId);

	const queryClient = useQueryClient();
	const [gridItemDialog, promptGridItemDialog] = useDialog(GridItemTransition);

	const getAssignmentsToUpdate = useCallback(
		(assignment) => (assignment ? [assignment] : selectedAssignmentIds),
		[selectedAssignmentIds]
	);

	const chooseGeneralOptions = useCallback(
		async ({ model, assignmentId, assumptionKey }) => {
			if (!scenario) {
				return;
			}
			const { _id: generalOptionsId, name } = model;
			await api.setGeneralOptions(scenarioId, generalOptionsId);
			confirmationAlert(`${name} assigned`);
			queryClient.invalidateQueries(scenario._id);
			update({ ...scenario, general_options: generalOptionsId });
			await promptGridItemDialog({
				data: {
					chooseModel: chooseGeneralOptions,
					key: assumptionKey,
					initialAssignmentId: assignmentId,
					allAssignmentIds: [],
					selectedModels: { general_options: generalOptionsId },
					onModelUpdated: (assumptionKey) => {
						reloadAssignments(undefined, [assumptionKey]);
					},
				},
				scenarioId: scenario._id,
			});
		},
		[scenarioId, scenario, queryClient, update, promptGridItemDialog, reloadAssignments]
	);

	const massAssignLastestNetworks = useCallback(async () => {
		const { nModified } = await withLoadingBar(api.massAssignLastestNetworks(scenarioId, selectedAssignmentIds));
		queryClient.invalidateQueries(['scen-well-assignment-build']);
		reloadAssignments(selectedAssignmentIds, ['network']);
		showMassAssignLatestNetworkConfirm({
			total: selectedAssignmentIds.length,
			actual: nModified,
		});
	}, [selectedAssignmentIds, scenarioId, queryClient, reloadAssignments]);

	const onUpdateAssignment = useCallback(
		async ({ assignmentId, assumptionKey, value, isGroupCase = false }) => {
			const type = Object.keys(value)[0] as undefined | 'model' | 'lookup' | 'tcLookup';
			if (!assumptionKey || !type) {
				return;
			}
			const model = value[type];

			if (!model) return;

			const assignmentIds = getAssignmentsToUpdate(assignmentId);

			const { nModified } = await withLoadingBar(
				api.updateAssignments({
					scenarioId,
					column: assumptionKey,
					assignmentIds,
					value: assumptionKey === AssumptionKey.forecastPSeries ? model : model._id,
					type,
					isGroupCase,
				})
			);

			queryClient.invalidateQueries(['scen-well-assignment-build']);

			reloadRequiredFields();

			if (nModified == null || assignmentIds?.length === nModified)
				updateAssignments(assignmentIds, assumptionKey, value);
			else reloadAssignments(assignmentIds, [assumptionKey]);

			showAssignConfirm({
				total: assignmentIds.length,
				actual: nModified,
				name: model?.name ?? model,
				feat: getAssumptionLabel(assumptionKey),
			});
		},
		[getAssignmentsToUpdate, scenarioId, updateAssignments, reloadAssignments, reloadRequiredFields, queryClient]
	);

	const [simpleSelectDialog, simpleSelect] = useDialog(SimpleSelectDialog);
	const selectForecast = useCallback(
		async (forecasts: Inpt.Forecast[]): Promise<Inpt.Forecast | null> => {
			const items = (forecasts || []).map((forecast) => ({
				value: forecast,
				key: forecast._id,
				primaryText: _.truncate(forecast.name, { length: MAX_FORECAST_NAME_VISIBLE_CHARACTERS }),
				secondaryText: [
					`Forecasted: ${toLocalDate(forecast.runDate, 'Never')}`,
					forecast.type && capitalize(forecast.type),
				]
					.filter(Boolean)
					.join(' | '),
			}));

			return simpleSelect({
				title: 'Choose Forecast',
				items,
				applyButtonProps: getTaggingProp('scenario', 'applyForecast'),
			}) as Promise<Inpt.Forecast | null>;
		},
		[simpleSelect]
	);

	const chooseForecast = useCallback(
		async ({ assignment, assumptionKey }) => {
			const validWellIds = selectedWellIds.map((wellId) => typeof wellId === 'string' && wellId).filter(Boolean);
			const forecasts = assignment
				? assignment.forecasts
				: await api.getForecastsFromWells(projectId, validWellIds);

			const forecast = await selectForecast(forecasts);

			onUpdateAssignment({ assignmentId: assignment?.id, assumptionKey, value: { model: forecast } });
		},
		[onUpdateAssignment, projectId, selectedWellIds, selectForecast]
	);

	const { isCarbonEnabled } = useLDFeatureFlags();

	const selectNetwork = useCallback(
		async (models: NetworkModel[]) => {
			if (!isCarbonEnabled) {
				showRequestCarbonDemoDialog({});
				return;
			}
			const items = (models || []).map((model) => ({
				value: model,
				key: model._id,
				primaryText: _.truncate(model.name, { length: MAX_FORECAST_NAME_VISIBLE_CHARACTERS }),
			}));
			return simpleSelect({
				title: 'Choose Carbon Network',
				items,
				applyButtonProps: { ...getTaggingProp('scenario', 'applyCarbon') },
			}) as Promise<NetworkModel | null>;
		},
		[simpleSelect, isCarbonEnabled]
	);

	const chooseNetwork = useCallback(
		async ({ assignment, assumptionKey }) => {
			const models = await api.getNetworkModelsForScenarioPage(
				assignment ? { projectId, wellId: assignment.well } : { projectId }
			);

			const model = await selectNetwork(models);

			onUpdateAssignment({ assignmentId: assignment?.id, assumptionKey, value: { model } });
		},
		[onUpdateAssignment, projectId, selectNetwork]
	);

	const selectSchedule = useCallback(
		async (wellId?: Inpt.ObjectId) => {
			const itemsFn = async () => {
				const schedules = await (wellId
					? getApi('/schedules/getWellSchedules', { projectId, wellId })
					: getApi('/schedules/getProjectSchedules', { projectId }));

				const sorted = _.sortBy(schedules, [({ createdAt }) => -new Date(createdAt).getTime()]);

				return sorted.map((schedule) => ({
					value: schedule,
					key: schedule._id,
					primaryText: schedule.name,
					secondaryText: fullNameAndLocalDate(schedule.createdBy, schedule.createdAt),
				}));
			};

			return simpleSelect({
				title: 'Select Schedule',
				items: itemsFn,
				applyButtonProps: getTaggingProp('scenario', 'applySchedule'),
			}) as Promise<Inpt.Schedule | null>;
		},
		[simpleSelect, projectId]
	);

	const chooseSchedule = useCallback(
		async ({ assignment, assumptionKey }) => {
			const schedule = await selectSchedule();

			onUpdateAssignment({ assignmentId: assignment?.id, assumptionKey, value: { model: schedule } });
		},
		[onUpdateAssignment, selectSchedule]
	);

	const updateModel = useCallback(
		async ({ assumptionKey, assignmentId, value, isGroupCase }) => {
			await onUpdateAssignment({ assignmentId, assumptionKey, value, isGroupCase });
		},
		[onUpdateAssignment]
	);

	const chooseAssModel = useCallback(
		async ({ assumptionKey, assignment, selectedModels, isModularScenario }) => {
			if (assumptionKey === AssumptionKey.emission && !isCarbonEnabled) {
				showRequestCarbonDemoDialog({});
				return;
			}
			await promptGridItemDialog({
				data: {
					chooseModel:
						assumptionKey === AssumptionKey.generalOptions
							? chooseGeneralOptions
							: ({ assignmentId, assumptionKey, model }) => {
									// queryClient.invalidateQueries('scen-well-assignment-build');
									updateModel({
										assumptionKey,
										assignmentId,
										value: { model },
										isGroupCase: !!assignment?.isGroupCase,
									});
							  },
					key: assumptionKey,
					initialAssignmentId: assignment?._id,
					allAssignmentIds: assignment?.isGroupCase ? econGroupIds : selectedAssignmentIds,
					selectedModels: assumptionKey === AssumptionKey.generalOptions ? selectedModels : undefined, // only pass selectedModels for scenario general options, for individual wells assignments the econ models dialog select the model automatically
					isModularScenario,
					onModelUpdated: (assumptionKey) => {
						reloadAssignments(undefined, [assumptionKey]);
					},
					isGroupCase: assignment?.isGroupCase ?? false,
				},
				scenarioId,
			});
		},
		[
			promptGridItemDialog,
			chooseGeneralOptions,
			econGroupIds,
			selectedAssignmentIds,
			scenarioId,
			updateModel,
			reloadAssignments,
			isCarbonEnabled,
		]
	);

	const [choosePSeriesDialog, showChoosePSeriesDialog] = useDialog(ChoosePSeriesDialog);

	const choosePSeries = useCallback(
		async ({ assignment, assumptionKey }) => {
			const [name, isLookup] = (() => {
				const { model, lookup } = assignment?.[assumptionKey] || {};
				return [(model || lookup)?.name, !!lookup]; // wtf
			})();
			const initialPSeries = isLookup ? null : name;
			const pSeries = await showChoosePSeriesDialog({ pSeries: initialPSeries });

			if (!pSeries) {
				return;
			}

			onUpdateAssignment({ assignmentId: assignment?.id, assumptionKey, value: { model: pSeries } });
		},
		[showChoosePSeriesDialog, onUpdateAssignment]
	);

	const onChooseModel = useCallbackRef((props: { assignment?; assumptionKey; selectedModels? }) => {
		const { assumptionKey } = props;

		({
			[assumptionKey]: chooseAssModel,
			[AssumptionKey.forecast]: chooseForecast,
			[AssumptionKey.schedule]: chooseSchedule,
			[AssumptionKey.forecastPSeries]: choosePSeries,
			[AssumptionKey.carbonNetwork]: chooseNetwork,
		})[assumptionKey](props);
	});

	const removeAssignment = useCallbackRef(async ({ assumptionKey, assignment }) => {
		const assignmentIds = getAssignmentsToUpdate(assignment?._id);

		if (assignment?.isGroupCase) {
			const updatedGroup = {
				_id: assignment._id,
				[assumptionKey]: {},
			};
			await withLoadingBar(updateEconGroup(scenarioId, updatedGroup));
		} else {
			await withLoadingBar(
				api.removeAssignments({
					scenarioId,
					column: assumptionKey,
					assignmentIds,
				})
			);
		}

		await updateAssignments(assignmentIds, assumptionKey, null);
		confirmationAlert();
		reloadRequiredFields();
	});

	const chooseLookupTable = useCallbackRef(async ({ assumptionKey, assignment }) => {
		const selectedLookupTable = (await simpleSelect({
			title: 'Choose Lookup Table',
			items: lookupTables?.map((lt) => ({ value: lt, key: lt._id, primaryText: lt.name })),
		})) as Inpt.LookupTable | null;

		onUpdateAssignment({ assignmentId: assignment?._id, assumptionKey, value: { lookup: selectedLookupTable } });
	});

	const chooseTCLookupTable = useCallbackRef(async ({ assumptionKey, assignment }) => {
		const selectedLookupTable = (await simpleSelect({
			title: 'Choose Type Curve Lookup Table',
			items: tcLookupTables?.map((lt) => ({ value: lt, key: lt._id, primaryText: lt.name })),
			applyButtonProps: getTaggingProp('scenario', 'applyTCLookupTable'),
		})) as Inpt.LookupTable | null;

		onUpdateAssignment({ assignmentId: assignment?._id, assumptionKey, value: { tcLookup: selectedLookupTable } });
	});

	return {
		gridItemDialog,
		simpleSelectDialog,
		chooseModel: onChooseModel,
		updateModel,
		chooseLookupTable,
		chooseTCLookupTable,
		removeAssignment,
		choosePSeriesDialog,
		massAssignLastestNetworks,
	};
}
