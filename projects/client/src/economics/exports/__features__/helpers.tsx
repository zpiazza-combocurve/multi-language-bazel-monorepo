import { faker } from '@faker-js/faker';
import { render } from '@testing-library/react';

import { TestWrapper } from '@/helpers/testing';
import { projectRoutes } from '@/projects/routes';

import { ExportButton } from '../ExportButton';

export function renderApp({
	hasReservesGroups = false,
	scenarioTableHeaders = [],
	runningEconomics = false,
	hasOneLiner = true,
} = {}) {
	const projectId = faker.database.mongodbObjectId();
	const scenarioId = faker.database.mongodbObjectId();
	const runId = faker.database.mongodbObjectId();
	const ghgRunId = faker.database.mongodbObjectId();
	render(
		<TestWrapper
			initialEntries={[projectRoutes.project(projectId).scenario(scenarioId).view]}
			path={projectRoutes.project(':projectId').scenario(':scenarioId').view}
		>
			<ExportButton
				{...{
					runId,
					hasReservesGroups,
					scenarioTableHeaders,
					runningEconomics,
					ghgRunId,
					scenarioId,
					hasOneLiner,
				}}
			/>
		</TestWrapper>
	);
	return { projectId, scenarioId, runId, ghgRunId };
}
