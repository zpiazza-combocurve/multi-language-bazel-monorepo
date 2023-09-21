import { useContext, useEffect, useState } from 'react';
import { useMutation } from 'react-query';

import { AbilityContext, SUBJECTS, subject } from '@/access-policies/Can';
import { ButtonItem, CheckboxSelectItems, Divider, MenuButton, alerts } from '@/components/v2';
import { Phase } from '@/forecasts/forecast-form/automatic-form/types';
import { forecastStatusItems } from '@/forecasts/shared/ForecastMenuItems';
import InfoMenuItem from '@/forecasts/shared/InfoMenuItem';
import { confirmationAlert, genericErrorAlert, withDoggo } from '@/helpers/alerts';
import { putApi } from '@/helpers/routing';
import { phases as All_PHASES } from '@/helpers/zing';
import { ACTIONS } from '@/inpt-shared/access-policies/shared';

import { VALID_PHASES } from '../charts/components/graphProperties';

function UpdateStatusMenuBtn({
	forecastId,
	onComplete,
	phase,
	project,
	wells,
	...rest
}: {
	forecastId: string;
	onComplete?: () => void;
	phase: Phase | 'all';
	project: { _id: string };
	wells: Array<string>;
}) {
	const [phases, setPhases] = useState<Phase[]>(['oil']);

	const subjectProject = project?._id;

	const { mutateAsync: updateWellsStatus } = useMutation(
		async ({ status, label }: { status: string; label: string }) => {
			const wellStr = wells.length === 1 ? 'well' : 'wells';

			const confirmed = await alerts.confirm({
				title: 'Update Approval',
				children: `Are you sure you want to update ${wells.length} ${wellStr} to ${label}?`,
				confirmText: 'Update Approval',
				confirmColor: 'error',
			});

			if (confirmed) {
				const body = {
					phases,
					status,
					wellIds: wells,
				};

				try {
					const { message } = await withDoggo(
						putApi(`/forecast/${forecastId}/update-many-status`, body),
						`Setting status of all wells to ${label}...`
					);
					confirmationAlert(message);
					onComplete?.();
				} catch (error) {
					genericErrorAlert(error);
				}
			}
		}
	);

	const ability = useContext(AbilityContext);

	useEffect(() => {
		if (phase !== 'all') {
			setPhases([phase]);
		} else {
			setPhases(VALID_PHASES);
		}
	}, [phase]);

	const canUpdateForecastStatus = (forecastStatus) =>
		ability.can(
			ACTIONS.Forecast,
			subject(SUBJECTS.ForecastApprovals, {
				project: subjectProject,
				status: {
					from: null,
					to: forecastStatus,
				},
			})
		);

	return (
		<MenuButton {...rest} label='Approval'>
			<InfoMenuItem>Adjust Status For All Wells</InfoMenuItem>

			<Divider />

			<CheckboxSelectItems value={phases} onChange={(inputPhases) => setPhases(inputPhases)} items={All_PHASES} />

			<Divider />

			<InfoMenuItem>Apply Status Category</InfoMenuItem>

			<Divider />
			{forecastStatusItems.map((item) => (
				<ButtonItem
					key={item.value}
					label={item.label}
					onClick={() => updateWellsStatus({ status: item.value, label: item.label })}
					disabled={!canUpdateForecastStatus(item.value)}
				/>
			))}
		</MenuButton>
	);
}

export default UpdateStatusMenuBtn;
