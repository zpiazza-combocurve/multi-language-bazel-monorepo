import produce from 'immer';
import { capitalize } from 'lodash';
import _ from 'lodash-es';
import { useContext, useMemo } from 'react';
import { useMutation } from 'react-query';

import { ACTIONS, AbilityContext, PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS, subject } from '@/access-policies/Can';
import { Button as DefaultButton } from '@/components';
import { muiTooltiped } from '@/components/tooltipped';
import { KEYS as gridChartApiKeys, useWellForecastStatus } from '@/forecasts/api';
import { useForecastStatus } from '@/forecasts/charts/components/ChartTitle';
import { DEFAULT_STATUS_OBJ } from '@/forecasts/charts/components/graphProperties';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { genericErrorAlert, warningAlert, withLoadingBar } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { queryClient } from '@/helpers/query-cache';
import { putApi } from '@/helpers/routing';
import { phases } from '@/helpers/zing';
import {
	FORECAST_STATUSES_LIST,
	ForecastStatus,
	nextForecastStatus,
} from '@/inpt-shared/display-templates/forecast/shared';

const Button = muiTooltiped(DefaultButton);

const updateStatusQuery = ({
	forecastId,
	wellId,
	phase,
	value,
}: {
	forecastId: string;
	wellId: string;
	phase: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	value: any;
}) =>
	queryClient.setQueryData(
		gridChartApiKeys.status(forecastId, wellId),
		produce<object>((draft) => {
			draft[phase] = value;
		})
	);

const useForecastStatusActions = ({ forecastId, wellId }: { forecastId: string; wellId: string }) => {
	const { project } = useAlfa();

	const { data: queryStatus, isLoading: isLoadingStatus } = useWellForecastStatus(forecastId, wellId);
	const statuses = queryStatus ?? DEFAULT_STATUS_OBJ;

	const ability = useContext(AbilityContext);
	const permittedStatuses: string[] = useMemo(
		() =>
			_.reduce(
				FORECAST_STATUSES_LIST,
				(ret: string[], status) => {
					if (
						ability.can(
							ACTIONS.Forecast,
							subject(SUBJECTS.ForecastApprovals, {
								project: project?._id,
								status: {
									from: null,
									to: status,
								},
							})
						)
					) {
						ret.push(status);
					}

					return ret;
				},
				[]
			),
		[ability, project?._id]
	);

	const { mutateAsync: cycleStatus, isLoading: updatingStatus } = useMutation(async (phase: Phase) => {
		const curStatus = FORECAST_STATUSES_LIST.includes(statuses?.[phase]) ? statuses[phase] : 'in_progress';
		const newStatus = nextForecastStatus(curStatus, permittedStatuses as ForecastStatus[]);
		if (newStatus === curStatus) {
			warningAlert('Unable to change status');
		} else {
			try {
				updateStatusQuery({ forecastId, wellId, phase, value: newStatus });
				await withLoadingBar(
					putApi(`/forecast/${forecastId}/update-many-status`, {
						phases: [phase],
						status: newStatus,
						wellIds: [wellId],
					})
				);
			} catch (error) {
				updateStatusQuery({ forecastId, wellId, phase, value: curStatus });
				genericErrorAlert(error);
			}
		}
	});

	return {
		cycleStatus,
		data: queryStatus,
		isLoadingStatus,
		permittedStatuses,
		subjectProject: project?._id,
		updatingStatus,
	};
};

const PhaseStatusButtons = (props) => {
	const {
		cycleStatus: parentCycleStatus,
		enableTooltip = false,
		forecastId,
		phases: parentPhases,
		small,
		statuses: parentStatuses,
		wellId,
	} = props;

	const ability = useContext(AbilityContext);

	const {
		cycleStatus: cycleSinglePhaseStatus,
		data,
		isLoadingStatus,
		permittedStatuses,
		subjectProject,
	} = useForecastStatusActions({ forecastId, wellId });

	const { statusTemplate, loaded: statusTemplateLoaded } = useForecastStatus();

	const statuses = parentStatuses ?? data ?? DEFAULT_STATUS_OBJ;

	const { mutateAsync: cycleStatus, isLoading: updatingStatus } = useMutation(
		async ({ phase, curStatus }: { phase: Phase; curStatus: string }) => {
			if (parentCycleStatus) {
				parentCycleStatus(phase, curStatus);
			} else {
				await cycleSinglePhaseStatus(phase);
			}
		}
	);

	if (!statusTemplateLoaded || isLoadingStatus || !statuses) {
		return null;
	}

	return (parentPhases ?? phases).map(({ value: phase }) => {
		const curStatus = FORECAST_STATUSES_LIST.includes(statuses?.[phase]) ? statuses[phase] : 'in_progress';
		const { label, longLabel } = statusTemplate?.[curStatus] ?? { label: 'IP', longLabel: 'In Progress' };
		const colorStyle = { [`${phase}Color`]: true };

		const nextStatus = nextForecastStatus(curStatus, permittedStatuses as ForecastStatus[]);
		const canUpdateForecastStatus = ability.can(
			ACTIONS.Forecast,
			subject(SUBJECTS.ForecastApprovals, {
				project: subjectProject,
				status: {
					from: curStatus,
					to: nextStatus,
				},
			})
		);

		const tooltipProps = enableTooltip
			? {
					tooltipLabel: canUpdateForecastStatus
						? `${capitalize(phase)}: ${longLabel}`
						: PERMISSIONS_TOOLTIP_MESSAGE,
					tooltipPosition: 'left',
			  }
			: {};

		return (
			<Button
				key={phase}
				{...colorStyle}
				{...tooltipProps}
				disabled={!canUpdateForecastStatus || updatingStatus}
				onClick={() => cycleStatus({ phase, curStatus })}
				placement='left'
				small={small}
				smallFont
				underlined
			>
				{label}
			</Button>
		);
	});
};

export default PhaseStatusButtons;
export { updateStatusQuery, useForecastStatusActions };
