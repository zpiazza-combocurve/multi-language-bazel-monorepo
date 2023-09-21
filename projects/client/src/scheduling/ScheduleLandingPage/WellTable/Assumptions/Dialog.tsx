import _ from 'lodash';
import { useCallback, useMemo } from 'react';
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
import { capitalize } from '@/helpers/text';
import { AssumptionKey, MAX_FORECAST_NAME_VISIBLE_CHARACTERS } from '@/inpt-shared/constants';
import { showRequestCarbonDemoDialog } from '@/networks/carbon/RequestCarbonDemoDialog';
import { NetworkModel } from '@/networks/carbon/types';
import * as api from '@/scenarios/api';
import { getAssumptionLabel } from '@/scenarios/shared';

import { AssignmentsApi } from './../api/AssignmentsApi';

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

function GridItemTransition({
	onHide,
	...props
}: DialogProps<null> & Omit<React.ComponentPropsWithoutRef<typeof GridItemDialog>, 'hideDialog'>) {
	return <GridItemDialog hideDialog={onHide} {...props} />;
}

export function useGridItemDialog({
	scheduleId,
	lookupTables,
	tcLookupTables,
	projectId,
	updateAssignments,
	reloadAssignments,
	selectedWellIds,
	tabs,
}: {
	scheduleId: Inpt.ObjectId<'schedule'>;
	lookupTables: Inpt.LookupTable[];
	tcLookupTables: Inpt.LookupTable[];
	projectId: Inpt.ObjectId<'project'>;
	updateAssignments: (rows: { _id: string; [key: string]: string | null }[]) => void;
	reloadAssignments: (assignmentIds, assumptions: string[]) => void;
	selectedWellIds: string[];
	tabs?: { key: string; canUse: boolean }[];
}) {
	const assignmentsApi = useMemo(() => new AssignmentsApi(scheduleId), [scheduleId]);

	const queryClient = useQueryClient();
	const [gridItemDialog, promptGridItemDialog] = useDialog(GridItemTransition, { tabs });

	const getAssignmentsToUpdate = useCallback((well) => (well ? [well] : selectedWellIds), [selectedWellIds]);

	const onUpdateAssignment = useCallback(
		async ({ assignmentId, assumptionKey, value }) => {
			const type = Object.keys(value)[0] as undefined | 'model' | 'lookup' | 'tcLookup';
			if (!assumptionKey || !type) {
				return;
			}
			const model = value[type];

			if (!model) return;

			const assignmentIds = getAssignmentsToUpdate(assignmentId);

			const { nModified } = await withLoadingBar(
				assignmentsApi.update({
					column: assumptionKey,
					wellIds: assignmentIds,
					type,
					value: assumptionKey === AssumptionKey.forecastPSeries ? model : model._id,
				})
			);

			queryClient.invalidateQueries(['schedule-well-assignment-build']);

			if (nModified) reloadAssignments(assignmentIds, [assumptionKey]);

			showAssignConfirm({
				total: assignmentIds.length,
				actual: nModified,
				name: model?.name ?? model,
				feat: getAssumptionLabel(assumptionKey),
			});
		},
		[getAssignmentsToUpdate, assignmentsApi, queryClient, reloadAssignments]
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

			return simpleSelect({ title: 'Choose Forecast', items }) as Promise<Inpt.Forecast | null>;
		},
		[simpleSelect]
	);

	const chooseForecast = useCallback(
		async ({ assignment, assumptionKey }) => {
			const validWellIds = selectedWellIds
				.map((wellId) => typeof wellId === 'string' && wellId)
				.filter(Boolean) as string[];
			const forecasts = assignment
				? assignment.forecasts
				: await api.getForecastsFromWells(projectId, validWellIds as Inpt.ObjectId<'well'>[]);

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

	const updateModel = useCallback(
		async ({ assumptionKey, assignmentId, value }) => {
			await onUpdateAssignment({ assignmentId, assumptionKey, value });
		},
		[onUpdateAssignment]
	);

	const chooseAssModel = useCallback(
		async ({ assumptionKey, assignment, isModularScenario }) => {
			if (assumptionKey === AssumptionKey.emission && !isCarbonEnabled) {
				showRequestCarbonDemoDialog({});
				return;
			}
			await promptGridItemDialog({
				data: {
					chooseModel: ({ assignmentId, assumptionKey, model }) => {
						updateModel({
							assumptionKey,
							assignmentId,
							value: { model },
						});
					},
					key: assumptionKey,
					initialAssignmentId: assignment?._id,
					allAssignmentIds: selectedWellIds,
					isModularScenario,
					onModelUpdated: ({ assumptionKey }) => {
						reloadAssignments(undefined, [assumptionKey]);
					},
				},
				scheduleId,
			});
		},
		[isCarbonEnabled, promptGridItemDialog, selectedWellIds, scheduleId, updateModel, reloadAssignments]
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
			[AssumptionKey.forecastPSeries]: choosePSeries,
			[AssumptionKey.carbonNetwork]: chooseNetwork,
		})[assumptionKey](props);
	});

	const removeAssignment = useCallbackRef(async ({ assumptionKey, assignment }) => {
		const wellIds = getAssignmentsToUpdate(assignment?._id);

		updateAssignments(wellIds.map((well: string) => ({ _id: well, [assumptionKey]: null })));

		await withLoadingBar(
			assignmentsApi.remove({
				column: assumptionKey,
				wellIds,
			})
		);

		confirmationAlert();
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
	};
}
