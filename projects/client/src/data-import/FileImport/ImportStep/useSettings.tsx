/* eslint react-hooks/exhaustive-deps: warn */
import { useMemo } from 'react';
import { TextField } from 'react-md';
import { useQuery } from 'react-query';
import styled from 'styled-components';

import { Button, Checkbox } from '@/components';
import { useDerivedState } from '@/components/hooks';
import { Box } from '@/components/v2';
import { downloadFile, postApi } from '@/helpers/routing';
import { theme } from '@/helpers/styled';
import { useSelectedHeaders } from '@/manage-wells/shared/ChooseHeadersDialog';

const Note = styled.p`
	color: ${theme.warningAlternativeColor};
`;

const scenarioLimits = [
	{
		maxWells: 1000,
		limitScenarios: 5,
	},
	{
		maxWells: 100,
		limitScenarios: 10,
	},
];
const FALLBACK_SCENARIO_LIMIT = 3;

function getMaxScenarios(wellCount?: number) {
	if (wellCount === undefined) {
		return null;
	}
	let maxScenarios = FALLBACK_SCENARIO_LIMIT;
	scenarioLimits.forEach(({ maxWells, limitScenarios }) => {
		if (wellCount < maxWells) {
			maxScenarios = limitScenarios;
		}
	});
	return maxScenarios;
}

function useSetupSelection({ setups, setupList, disabled, applyTaggingProp = {} }) {
	const [selectedSetups, selectSetups] = useSelectedHeaders({
		title: 'Search Setup',
		feat: 'setups',
		initialKeys: setups,
		allKeys: setupList,
		maxHeaders: 1, // temporally limitted to 1 max setup // TODO check up on this
		disabled,
		applyTaggingProp,
	});
	return [selectedSetups, selectSetups];
}

function useScenarioSelection({
	scenarios,
	scenarioList,
	wellCount,
	disabled,
	searchType = 'Scenario',
	applyTaggingProp = {},
}) {
	const maxScenarios = getMaxScenarios(wellCount);
	const [selectedScenarios, selectScenarios] = useSelectedHeaders({
		title: `Search ${searchType}`,
		feat: 'scenarios',
		initialKeys: scenarios,
		allKeys: scenarioList,
		maxHeaders: maxScenarios,
		disabled,
		applyTaggingProp,
	});
	return [selectedScenarios, selectScenarios];
}

function useImportProject(project) {
	const { data: settingProjectName } = useQuery(['project', project], async () => {
		const projectNames = await postApi('/projects/getProjectNames', { projectIds: [project] });
		return projectNames?.[0]?.name;
	});

	const [projectName, setProjectName] = useDerivedState(settingProjectName);
	return [projectName, setProjectName];
}

const EMPTY_ARRAY = [];

export function useSettings(
	project,
	scenarioApplyTaggingProp = {},
	setupApplyTaggingProp = {},
	ariesSetting?,
	disabled?
) {
	const {
		errorReportId,
		allScenarios: scenarioList = EMPTY_ARRAY as string[],
		allSetups: setupList = EMPTY_ARRAY as string[],
		wellCount,
		onlyForecast: fileImportOnlyForecast,
		createElts: fileImportCreateElts,
		scenarios,
		setups,
	} = ariesSetting || {};

	const [selectedScenarios, selectScenarios] = useScenarioSelection({
		scenarios,
		scenarioList,
		wellCount,
		disabled,
		applyTaggingProp: scenarioApplyTaggingProp,
	});
	const [selectedSetups, selectSetups] = useSetupSelection({
		setups,
		setupList,
		disabled,
		applyTaggingProp: setupApplyTaggingProp,
	});

	const [projectName, setProjectName] = useImportProject(project);
	const [onlyForecast, setOnlyForecast] = useDerivedState(fileImportOnlyForecast);
	const [createElts, setCreateElts] = useDerivedState(fileImportCreateElts);

	const options = useMemo(
		() => (
			<>
				<Note>ARIES import will only import to a brand new project</Note>
				<TextField
					css='margin-bottom: 1.5rem;'
					value={projectName}
					onChange={setProjectName}
					label='ComboCurve Project Name'
					placeholder='Enter a Project Name'
					disabled={disabled}
				/>
				<Button css='margin-right: 1.5rem;' primary raised disabled={disabled} onClick={selectScenarios}>
					{disabled ? 'See' : 'Select '} Scenarios ({selectedScenarios.length})
				</Button>
				{!!setupList?.length && (
					<Box clone ml={1}>
						<Button primary raised disabled={disabled} onClick={selectSetups}>
							{disabled ? 'See' : 'Select '} Setups ({selectedSetups.length})
						</Button>
					</Box>
				)}
				<Checkbox
					css='margin-top: 1rem;'
					label='Only import forecast'
					value={onlyForecast}
					onChange={setOnlyForecast}
					disabled={disabled}
				/>
				<Checkbox
					label='Create ELTs on Import'
					value={createElts}
					onChange={setCreateElts}
					disabled={disabled}
				/>
			</>
		),
		// eslint-disable-next-line react-hooks/exhaustive-deps -- TODO eslint fix later
		[
			onlyForecast,
			createElts,
			projectName,
			selectScenarios,
			selectedScenarios,
			selectedSetups,
			disabled,
			setCreateElts,
			setOnlyForecast,
			setProjectName,
		]
	);

	const downloadReport = useMemo(
		() =>
			errorReportId
				? () => {
						downloadFile(errorReportId, 'ARIES Import Error Report');
				  }
				: null,
		[errorReportId]
	);

	return {
		projectName,
		onlyForecast,
		createElts,
		selectedScenarios,
		selectedSetups,
		options,
		downloadReport,
	};
}

export function usePhdwinSettings(project, settings, disabled?) {
	const { errorReportId, wellCount, scenarios, allScenarios: scenarioList = EMPTY_ARRAY as string[] } = settings;

	const [projectName, setProjectName] = useImportProject(project);
	const [selectedScenarios, selectScenarios] = useScenarioSelection({
		scenarios,
		scenarioList,
		wellCount,
		disabled,
		searchType: 'Partnership',
	});

	const options = useMemo(
		() => (
			<>
				<Note>PHDWIN import will only import to a brand new project</Note>
				<TextField
					css='margin-bottom: 1.5rem;'
					value={projectName}
					onChange={setProjectName}
					label='ComboCurve Project Name'
					placeholder='Enter a Project Name'
					disabled={disabled}
				/>
				<Button primary raised disabled={disabled} onClick={selectScenarios}>
					{disabled ? 'See' : 'Select '} Partnerships ({selectedScenarios.length})
				</Button>
			</>
		),
		// eslint-disable-next-line react-hooks/exhaustive-deps -- TODO eslint fix later
		[projectName, disabled, setProjectName, selectedScenarios]
	);

	const downloadReport = useMemo(
		() =>
			errorReportId
				? () => {
						downloadFile(errorReportId, 'PHDWIN Import Error Report');
				  }
				: null,
		[errorReportId]
	);

	return {
		projectName,
		options,
		downloadReport,
		selectedScenarios,
	};
}
