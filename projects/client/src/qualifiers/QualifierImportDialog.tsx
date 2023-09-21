import _ from 'lodash';
import { useState } from 'react';

import { SelectList } from '@/components';
import { DEFAULT_IDENTIFIER, WellIdentifierSelect } from '@/components/misc/WellIdentifierSelect';
import { useWizard } from '@/components/misc/Wizard';
import {
	Button,
	CheckboxField,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	Tab,
	Tabs,
} from '@/components/v2';
import { genericErrorAlert } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { DialogProps } from '@/helpers/dialog';
import { WithQuery } from '@/helpers/query';
import { getApi, postApi } from '@/helpers/routing';
import { pluralize } from '@/helpers/text';
import { fullNameAndLocalDate } from '@/helpers/user';
import { AssumptionKey } from '@/inpt-shared/constants';
import { useCurrentScenario } from '@/scenarios/api';

const COMPANY_LEVEL_AVAILABLE_ASSUMPTIONS = [AssumptionKey.ownershipReversion];

interface Project {
	_id: string;
	name: string;
	createdBy: { firstName: string; lastName: string };
	createdAt: string;
	updatedAt: string;
	scenariosLength: number;
}

interface Scenario {
	_id: string;
	name: string;
	qualifiersLength: number;
}

interface Qualifier {
	name: string;
	createdAt: string;
	column: string;
	key: string;
	active: boolean;
}

const QUALIFIERS_LIMIT = 20;

function ProjectLevelQualifiers({
	selectedAssignmentIds,
	resolve,
	column,
	onHide,
	scope,
	setScope,
	canCreateNewQualifiers,
}: DialogProps & {
	scope;
	setScope;
	column: AssumptionKey;
	selectedAssignmentIds: string[];
	canCreateNewQualifiers: boolean;
}) {
	const { project: currentProject } = useAlfa();
	const { scenario } = useCurrentScenario();
	const scenarioId = scenario?._id;

	const importQualifier = async ({
		scenario: selectedScenario,
		qualifier: selectedQualifier,
		import: { replace, wellIdentifier },
	}) => {
		try {
			await postApi('/scenarios/importQualifier', {
				sourceScenarioId: selectedScenario._id,
				projectId: currentProject?._id,
				targetScenarioId: scenarioId,
				column,
				key: selectedQualifier.key,
				name: selectedQualifier.name,
				assignmentIds: [...selectedAssignmentIds],
				identifyingField: wellIdentifier,
				replace,
			});

			resolve(true);
		} catch (err) {
			genericErrorAlert(err, 'Error occurered during import');
		}
	};

	const {
		isDisabled,
		children,
		isFirstStep,
		isLastStep,
		next,
		prev,
		values: wizardValues,
	} = useWizard({
		initialValues: { import: { wellIdentifier: DEFAULT_IDENTIFIER, replace: false }, scenario: {}, qualifier: {} },
		steps: [
			{
				key: 'project',
				// eslint-disable-next-line react/no-unstable-nested-components -- TODO eslint fix later
				children: ({ state, select }) => (
					<WithQuery
						queryKey={['projects-list-with-scenarios-count', column]}
						queryFn={() => getApi('/scenarios/getScenariosCountByProject') as Promise<Project[]>}
						select={(projects) =>
							_.orderBy(projects, [
								(proj) => (proj._id === currentProject?._id ? 0 : 1),
								(proj) => new Date(proj.updatedAt).getTime(),
							])
						}
					>
						{(projectsQuery) => (
							<SelectList
								label='Search Projects'
								value={state}
								onChange={select}
								listItems={projectsQuery.data?.map((project) => ({
									primaryText: project.name,
									secondaryText: [
										fullNameAndLocalDate(project.createdBy, project.createdAt),
										pluralize(project.scenariosLength, 'scenario', 'scenarios'),
									].join(' | '),
									highlight: project._id === currentProject?._id,
									value: project,
								}))}
								getKey='_id'
								withSearch
							/>
						)}
					</WithQuery>
				),
			},
			{
				key: 'scenario',
				// eslint-disable-next-line react/no-unstable-nested-components -- TODO eslint fix later
				children: ({ values, state, select }) => (
					<WithQuery
						queryKey={['scenario-list-with-qualifier-count', column]}
						queryFn={() =>
							getApi('/scenarios/getScenariosAndQualifiersCount', {
								column,
								project: values.project?._id,
							}) as Promise<Scenario[]>
						}
						select={(scenarios) => _.filter(scenarios, _.negate(_.matches({ _id: scenarioId })))}
					>
						{(scenariosQuery) => (
							<SelectList
								label='Search Scenarios'
								value={state}
								onChange={select}
								listItems={scenariosQuery.data?.map((scenarioItem) => ({
									primaryText: scenarioItem.name,
									secondaryText: pluralize(scenarioItem.qualifiersLength, 'qualifier', 'qualifiers'),
									value: scenarioItem,
								}))}
								getKey='_id'
								withSearch
							/>
						)}
					</WithQuery>
				),
			},
			{
				key: 'qualifier',
				// eslint-disable-next-line react/no-unstable-nested-components -- TODO eslint fix later
				children: ({ values, state, select }) => (
					<WithQuery
						queryKey={['scenario-qualifiers', values.scenario._id, column]}
						queryFn={() =>
							getApi(`/scenarios/${values.scenario?._id}/getQualifiers`, { column }) as Promise<
								Qualifier[]
							>
						}
					>
						{(qualifiersQuery) => (
							<SelectList
								label='Search Qualifiers'
								value={state}
								onChange={select}
								listItems={qualifiersQuery.data?.map((qualifier) => ({
									primaryText: qualifier.name,
									value: qualifier,
								}))}
								withSearch
								getKey='_id'
							/>
						)}
					</WithQuery>
				),
			},
			{
				key: 'import',
				// eslint-disable-next-line react/no-unstable-nested-components -- TODO eslint fix later
				children: ({ state, setState }) => (
					<>
						<WellIdentifierSelect
							value={state.wellIdentifier}
							onChange={(newValue) => setState({ ...state, wellIdentifier: newValue })}
						/>
						<Divider variant='middle' />
						<CheckboxField
							name='replace'
							checked={state.replace}
							onChange={(ev) => setState({ ...state, replace: ev.target.checked })}
							label='Replace Qualifiers'
						/>
					</>
				),
			},
		],
	});

	return (
		<>
			<DialogTitle>Import Qualifier</DialogTitle>
			<DialogContent css='height: 100vh;'>
				{COMPANY_LEVEL_AVAILABLE_ASSUMPTIONS.includes(column) && (
					<Tabs
						value={scope}
						onChange={(ev, newScope) => setScope(newScope)}
						textColor='secondary'
						indicatorColor='secondary'
						variant='scrollable'
					>
						<Tab label='Project Level' value='project' />
						<Tab label='External Qualifiers' value='company' />
					</Tabs>
				)}
				{children}
			</DialogContent>
			<DialogActions>
				{isFirstStep ? <Button onClick={onHide}>Cancel</Button> : <Button onClick={prev}>Back</Button>}
				{isLastStep ? (
					<Button
						disabled={
							isDisabled ||
							(!canCreateNewQualifiers &&
								!wizardValues.import.replace &&
								`Cannot create more than ${QUALIFIERS_LIMIT} qualifiers`)
						}
						onClick={() => importQualifier(wizardValues)}
						color='primary'
						variant='contained'
					>
						Import
					</Button>
				) : (
					<Button disabled={isDisabled} onClick={next} color='primary' variant='contained'>
						Next
					</Button>
				)}
			</DialogActions>
		</>
	);
}

function CompanyLevelQualifiers({
	selectedAssignmentIds,
	column,
	resolve,
	onHide,
	scope,
	setScope,
	canCreateNewQualifiers,
}: DialogProps & {
	scope;
	setScope;
	column: string;
	selectedAssignmentIds: string[];
	canCreateNewQualifiers: boolean;
}) {
	const { scenario } = useCurrentScenario();
	const scenarioId = scenario?._id;

	const importQualifier = async ({ qualifier, import: { replace, wellIdentifier } }) => {
		try {
			await postApi(`/scenarios/${scenarioId}/importOwnershipQualifier`, {
				scenarioId,
				assignmentIds: [...selectedAssignmentIds],
				key: qualifier,
				identifyingField: wellIdentifier,
				replace,
			});
			resolve(true);
		} catch (err) {
			genericErrorAlert(err, 'Error occurred during import');
		}
	};

	const {
		isDisabled,
		children,
		isFirstStep,
		isLastStep,
		next,
		prev,
		values: wizardValues,
	} = useWizard({
		initialValues: { import: { wellIdentifier: DEFAULT_IDENTIFIER, replace: false }, qualifier: '' },
		steps: [
			{
				key: 'qualifier',
				// eslint-disable-next-line react/no-unstable-nested-components -- TODO eslint fix later
				children: ({ state, select }) => (
					<WithQuery
						queryKey={['ownership-qualifiers', column]}
						queryFn={() => getApi(`/scenarios/getOwnershipQualifiers`) as Promise<string[]>}
					>
						{(qualifiersQuery) => (
							<SelectList
								label='Search Qualifiers'
								value={state}
								onChange={select}
								listItems={qualifiersQuery.data?.map((qualifier) => ({
									primaryText: qualifier,
									value: qualifier,
								}))}
								withSearch
								getKey='_id'
							/>
						)}
					</WithQuery>
				),
			},
			{
				key: 'import',
				// eslint-disable-next-line react/no-unstable-nested-components -- TODO eslint fix later
				children: ({ state, setState }) => (
					<>
						<WellIdentifierSelect
							value={state.wellIdentifier}
							onChange={(newValue) => setState({ ...state, wellIdentifier: newValue })}
						/>
						<Divider variant='middle' />
						<CheckboxField
							name='replace'
							checked={state.replace}
							onChange={(ev) => setState({ ...state, replace: ev.target.checked })}
							label='Replace Qualifiers'
						/>
					</>
				),
			},
		],
	});

	return (
		<>
			<DialogTitle>Import Qualifier</DialogTitle>
			<DialogContent css='height: 100vh;'>
				<Tabs
					value={scope}
					onChange={(ev, newScope) => setScope(newScope)}
					textColor='secondary'
					indicatorColor='secondary'
					variant='scrollable'
				>
					<Tab label='Project Level' value='project' />
					<Tab label='External Qualifiers' value='company' />
				</Tabs>
				{children}
			</DialogContent>
			<DialogActions>
				{isFirstStep ? <Button onClick={onHide}>Cancel</Button> : <Button onClick={prev}>Back</Button>}
				{isLastStep ? (
					<Button
						disabled={
							isDisabled ||
							(!canCreateNewQualifiers &&
								!wizardValues.import.replace &&
								`Cannot create more than ${QUALIFIERS_LIMIT} qualifiers`)
						}
						onClick={() => importQualifier(wizardValues)}
						color='primary'
						variant='contained'
					>
						Import
					</Button>
				) : (
					<Button disabled={isDisabled} onClick={next} color='primary' variant='contained'>
						Next
					</Button>
				)}
			</DialogActions>
		</>
	);
}

// TODO wtf is this code clean it up later
export default function QualifierImportDialog(
	props: DialogProps & {
		scenarioId?: string;
		column: AssumptionKey;
		selectedAssignmentIds: string[];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		qualifiers?: { [key: string]: any };
	}
) {
	const [scope, setScope] = useState<'project' | 'company'>('project');
	const { visible, onHide, column, qualifiers } = props;

	const canCreateNewQualifiers = Object.keys(qualifiers || {}).length < QUALIFIERS_LIMIT;

	return (
		<Dialog open={visible} onClose={onHide} maxWidth='sm' fullWidth>
			{scope === 'project' || !COMPANY_LEVEL_AVAILABLE_ASSUMPTIONS.includes(column) ? (
				<ProjectLevelQualifiers {...props} {...{ scope, setScope, canCreateNewQualifiers }} />
			) : (
				<CompanyLevelQualifiers {...props} {...{ scope, setScope, canCreateNewQualifiers }} />
			)}
		</Dialog>
	);
}
