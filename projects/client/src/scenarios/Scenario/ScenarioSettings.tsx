import { useEffect, useState } from 'react';
import { Divider } from 'react-md';

import { ACTIONS, Can, PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS, subject } from '@/access-policies/Can';
import { Placeholder } from '@/components';
import { alerts } from '@/components/v2';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import {
	confirmationAlert,
	createConfirmAddWells,
	createConfirmRemoveWells,
	genericErrorAlert,
	withDoggo,
	withLoadingBar,
} from '@/helpers/alerts';
import { postApi, putApi } from '@/helpers/routing';
import {
	SettingsButton,
	SettingsContainer,
	SettingsDeleteButton,
	SettingsInfoContainer,
	SettingsTextField,
} from '@/helpers/settings-page';
import { hasNonWhitespace, pluralize } from '@/helpers/text';
import { fullNameAndLocalDate } from '@/helpers/user';
import { assert } from '@/helpers/utilities';
import { useCurrentProject } from '@/projects/api';
import { deleteScenario, useCurrentScenario } from '@/scenarios/api';
import AssignTagsSettingsButton from '@/tags/AssignTagsSettingsButton';
import SettingsTagsList from '@/tags/SettingsTagsList';
import { getModuleListRoute } from '@/urls';
import { showWellFilter } from '@/well-filter/well-filter';

const ScenarioSettings = () => {
	const [name, setName] = useState('');
	const {
		scenario,
		isLoading: isLoadingScenario,
		partialUpdate: updateScenarioPartial,
		reload: reloadScenario,
	} = useCurrentScenario();
	const { project, isLoading: isLoadingProject, updateProject } = useCurrentProject();
	const { isWellsCollectionsEnabled } = useLDFeatureFlags();

	const applyAddWells = async (wells) => {
		assert(scenario && project, 'Expected scenario and project to be in context');

		try {
			const { scenario: newScenario } = await withDoggo(
				putApi(`/scenarios/${scenario._id}/addWells`, {
					ids: wells,
					project: project._id,
				}),
				'Adding Wells...'
			);

			const addedCount = newScenario.wells.length - scenario.wells.length;
			const pluralWells = pluralize(addedCount, 'New Well', 'New Wells');
			confirmationAlert(`${pluralWells} Added`);

			updateScenarioPartial({ wells: newScenario.wells });
		} catch (error) {
			genericErrorAlert(error);
		}
	};

	const confirmDelete = async (wells) => {
		const removalItems = [
			{ value: 'scenario', label: 'Scenario', desc: 'removes wells from this scenario' },
			{
				value: 'assumptions',
				label: 'Econ Models',
				desc: 'removes all unique Econ Models made for these wells in this scenario',
			},
		];

		return alerts.confirm({
			title: 'Remove Wells',
			confirmText: 'Remove',
			confirmColor: 'error',
			helperText: `Are you sure you want to remove ${wells.length} wells from this scenario?`,
			children: removalItems.map((item) => (
				<div key={item.value}>
					<h5>{item.label}</h5>
					<ul>
						<li>{item.desc}</li>
					</ul>
				</div>
			)),
		});
	};

	const applyRemoveWells = async (wells: string[]) => {
		assert(scenario, 'Expected scenario to be in context');

		if (await confirmDelete(wells)) {
			try {
				const { scenario: newScenario } = await withDoggo(
					putApi(`/scenarios/${scenario._id}/removeWells`, {
						ids: wells,
					}),
					'Removing Wells...'
				);
				const removedCount = scenario.wells.length - newScenario.wells.length;
				confirmationAlert(`Successfully removed ${removedCount} wells from scenario`);

				updateScenarioPartial({ wells: newScenario.wells });
			} catch (error) {
				genericErrorAlert(error);
			}
		}
	};

	const handleSaveName = async () => {
		assert(scenario, 'Expected scenario to be in context');

		await withLoadingBar(postApi(`/scenarios/${scenario._id}/changeName`, { name }));
		confirmationAlert('New name was saved');

		updateScenarioPartial({ name });
	};

	const handleAddWells = async () => {
		assert(scenario && project, 'Expected scenario and project to be in context');

		const selection = await showWellFilter({
			totalWellsText: 'Total Wells',
			type: 'add',
			wells: project.wells,
			existingWells: scenario.wells,
			confirm: createConfirmAddWells('scenario', isWellsCollectionsEnabled),
		});

		if (!selection) return;

		await applyAddWells(selection);
	};

	const handleRemoveWells = async () => {
		assert(scenario, 'Expected scenario to be in context');

		const selection = await showWellFilter({
			totalWellsText: 'Total Wells',
			type: 'remove',
			wells: scenario.wells,
			confirm: createConfirmRemoveWells('scenario'),
		});

		await applyRemoveWells(selection);
	};

	const handleCopyScenario = async () => {
		const confirmed = await alerts.confirm({
			title: 'Copy Scenario',
			children: 'Are you sure you want to copy this scenario?',
			helperText: 'Files related to economics will not be copied.',
			confirmText: 'Copy',
		});

		if (!confirmed) {
			return;
		}

		assert(scenario, 'Expected scenario to be in context');

		try {
			await postApi(`/scenarios/${scenario._id}/copy`);
		} catch (err) {
			genericErrorAlert(err, 'Error occurred during copy');
		}
	};

	useEffect(() => {
		if (scenario) {
			setName(scenario.name);
		}
	}, [scenario]);

	if (isLoadingProject || isLoadingScenario) {
		return <Placeholder loading />;
	}

	assert(project, 'Expected project to be in context');

	return (
		<SettingsContainer>
			<SettingsInfoContainer>
				<SettingsTextField
					value={name}
					id='scenario-name'
					disabled={!scenario}
					label='Scenario Name'
					onChange={(newName) => setName(newName)}
				/>

				<SettingsTextField
					disabled
					label='Created'
					id='scenario-created'
					value={fullNameAndLocalDate(scenario.createdBy, scenario.createdAt)}
				/>

				<SettingsTextField
					disabled
					id='scenario-wells'
					label='Wells In Scenario'
					value={scenario ? scenario.wells.length : ''}
				/>

				<SettingsTagsList feat='scenario' featId={scenario._id} />
			</SettingsInfoContainer>

			<Can do={ACTIONS.Update} on={subject(SUBJECTS.Scenarios, { project: project._id })} passThrough>
				{(allowed) => (
					<>
						{scenario.name !== name && (
							<>
								<SettingsButton
									primary
									disabled={name === '' || !allowed || !hasNonWhitespace(name)}
									tooltipLabel={!allowed ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
									onClick={async () => {
										await handleSaveName();
									}}
									label='Save Name'
									info={[`From - ${scenario.name}`, `To - ${name}`]}
								/>
								<Divider className='divider' />
							</>
						)}
						<SettingsButton
							primary
							onClick={handleAddWells}
							label='Add Wells'
							disabled={!allowed}
							tooltipLabel={!allowed ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
							info={[
								'Add available wells to this scenario',
								'Added wells will be available to any user viewing this scenario',
							]}
						/>
						<SettingsButton
							warning
							onClick={handleRemoveWells}
							label='Remove Wells'
							tooltipLabel={!allowed ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
							disabled={scenario.wells.length === 0 || !allowed}
							info={[
								'Remove wells from this scenario',
								'Removed wells will be removed from scenario, economics, qualifiers, and unique well econ models',
							]}
						/>

						<AssignTagsSettingsButton
							tooltipLabel={!allowed ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
							disabled={!allowed}
							feat='scenario'
							featId={scenario._id}
						/>
					</>
				)}
			</Can>

			<Divider className='divider' />

			<Can do={ACTIONS.Create} on={subject(SUBJECTS.Scenarios, { project: project._id })} passThrough>
				{(allowed) => (
					<SettingsButton
						primary
						label='Copy Scenario'
						tooltipLabel={!allowed ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
						disabled={!allowed}
						onClick={handleCopyScenario}
						info={['Copies scenario and all of its contents', 'Economic files will not be copied']}
					/>
				)}
			</Can>

			<Can do={ACTIONS.Delete} on={subject(SUBJECTS.Scenarios, { project: project._id })} passThrough>
				{(allowed) => (
					<SettingsDeleteButton
						feat='Scenario'
						tooltipLabel={!allowed ? PERMISSIONS_TOOLTIP_MESSAGE : undefined}
						disabled={!allowed}
						redirectTo={getModuleListRoute('scenarios', project?._id)}
						info={['Deletes scenario and all of its contents']}
						onDelete={async () => {
							await deleteScenario(scenario._id);
							updateProject({
								...project,
								scenarios: project.scenarios.filter((s) => s !== scenario._id),
							});
							reloadScenario();
						}}
						name={scenario.name}
						requireName
					/>
				)}
			</Can>
		</SettingsContainer>
	);
};

export default ScenarioSettings;
