import { useMutation } from 'react-query';

import { PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/access-policies/Can';
import { usePermissions } from '@/access-policies/usePermissions';
import { alerts } from '@/components/v2';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { confirmationAlert, createConfirmAddWells, genericErrorAlert, useLoadingBar } from '@/helpers/alerts';
import { putApi } from '@/helpers/routing';
import { pluralize } from '@/helpers/text';
import WellsPageWithSingleWellViewDialog from '@/manage-wells/WellsPageWithSingleWellViewDialog';
import { useCurrentProject } from '@/projects/api';
import { useCurrentScenario } from '@/scenarios/api';
import { showWellFilter } from '@/well-filter/well-filter';

const api = {
	addWells: (scenarioId, projectId, wells) =>
		putApi(`/scenarios/${scenarioId}/addWells`, { ids: wells, project: projectId }),
	removeWells: (scenarioId, wells) => putApi(`/scenarios/${scenarioId}/removeWells`, { ids: wells }),
};

export function ScenarioWells() {
	const { scenario } = useCurrentScenario();
	const { project, reload: reloadProject } = useCurrentProject();
	const { update: updateScenario } = useCurrentScenario();
	const { isWellsCollectionsEnabled } = useLDFeatureFlags();

	const filterWells = showWellFilter;

	const { isLoading: addingWells, mutateAsync: addWells } = useMutation(async (wells) => {
		const { scenario: newScenario } = await api.addWells(scenario._id, project._id, wells);
		confirmationAlert('New Wells Added');
		updateScenario({ ...scenario, wells: newScenario.wells });
		reloadProject();
	});

	const { isLoading: removingWells, mutateAsync: removeWells } = useMutation(async (wells) => {
		const { scenario: newScenario } = await api.removeWells(scenario._id, wells);
		confirmationAlert(`Successfully removed wells from scenario`);
		updateScenario({ ...scenario, wells: newScenario.wells });
		reloadProject();
	});

	const handleAdd = async (existingWells) => {
		try {
			const wells = await filterWells({
				wells: project.wells,
				type: 'add',
				existingWells,
				confirm: createConfirmAddWells('scenario', isWellsCollectionsEnabled),
			});

			if (wells) {
				await addWells(wells);
			}
		} catch (error) {
			genericErrorAlert(error);
		}
	};

	const handleRemove = async (selectedWells) => {
		try {
			const wells = selectedWells;

			if (
				!(await alerts.confirmRemoveWells({
					module: 'scenario',
					wellsCount: wells.length,
					points: [
						{
							label: 'Scenario',
							desc: 'Removed wells will be removed from scenario, economics, qualifiers, and unique well econ models',
						},
					],
				}))
			) {
				return;
			}

			await removeWells(wells);
		} catch (error) {
			genericErrorAlert(error);
		}
	};

	const updating = addingWells || removingWells;

	const { canUpdate: canUpdateScenario } = usePermissions(SUBJECTS.Scenarios, scenario.project._id);

	useLoadingBar(updating);

	if (!scenario) {
		return <span className='md-text'>No Scenario</span>;
	}

	return (
		<WellsPageWithSingleWellViewDialog
			wellIds={scenario.wells}
			padded
			addWellsProps={{
				onAdd: handleAdd,
				disabled: (updating && 'Adding Wells') || (!canUpdateScenario && PERMISSIONS_TOOLTIP_MESSAGE),
				restButtonProps: { tooltipTitle: 'Add wells to the scenario' },
			}}
			removeWellsProps={{
				onRemove: handleRemove,
				disabled: (selectedWells) =>
					updating || (!canUpdateScenario && PERMISSIONS_TOOLTIP_MESSAGE) || !selectedWells.length,
				getTooltipTitle: (selectedWells) =>
					`Remove ${pluralize(selectedWells.length, 'well', 'wells')} from scenario`,
			}}
			addRemoveWellsCollectionWells
		/>
	);
}
