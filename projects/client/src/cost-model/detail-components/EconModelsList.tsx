import type { User } from '@combocurve/types/client';
import { faAngleLeft, faAngleRight, faCheck, faSearch, faTrash } from '@fortawesome/pro-regular-svg-icons';
import { formatISO } from 'date-fns';
import { isObject } from 'lodash';
import * as React from 'react';
import { useMutation } from 'react-query';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as ReactWindowList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import styled from 'styled-components';

import { PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS } from '@/access-policies/Can';
import usePermissions, { usePermissionsBuilder } from '@/access-policies/usePermissions';
import { getTaggingProp } from '@/analytics/tagging';
import { useScopedSelectCache } from '@/components/ScopedSelectDialog';
import {
	Box,
	Divider,
	Icon,
	IconButton,
	InputAdornment,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Button as MUButton,
	Tab,
	Tabs,
	TextField,
	Tooltip,
	Typography,
	alerts,
} from '@/components/v2';
import { useDoggo } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { useDialog } from '@/helpers/dialog';
import { FeatureIcons } from '@/helpers/features';
import { getApi } from '@/helpers/routing';
import { hasNonWhitespace } from '@/helpers/text';
import { AssumptionKey } from '@/inpt-shared/constants';
import { selectByProject } from '@/projects/selectByProject';
import { EconGroupData } from '@/scenarios/Scenario/ScenarioPage/groups/group-configurations/types';

import { SelectCMEDialog } from './SelectCME';
import { Assumption, ListType } from './shared';

// Added for fixing react-query useMutation TS errors.
interface CME {
	code: number; // unique code
	product: 'oil' | 'gas'; // others
	type: 'price' | 'differentials'; // model
	name: string;
	link: string; // link to page
}

export type ApplyCMEProps = {
	products: CME[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	date: any;
};

export const Button = (props: React.ComponentPropsWithoutRef<typeof MUButton>) => (
	<MUButton variant='outlined' color='secondary' size='small' {...props} />
);

const NO_NAME_MESSAGE = 'Missing Model Name';
const NO_MODEL_SELECTED_MESSAGE = 'No Model selected';
const UNSAVED_CHANGES_MESSAGE = 'Model has unsaved changes';
const INVALID_MESSAGE = 'Invalid model';

/**
 * @example
 * 	formatUserInfo({ firstName: 'John', lastName: 'Doe' }, model.createdBy); // "John D.  |  Fri Apr 23 2021"
 */
export const formatUserInfo = (user: Pick<User, 'firstName' | 'lastName'>, date: string | Date) => {
	const name = `${user.firstName} ${user.lastName.charAt(0).toUpperCase()}.`;
	const formattedDate = new Date(date).toDateString();
	return `${name}  |  ${formattedDate}`;
};

const ActionsGroup = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	grid-auto-rows: auto;
	gap: 0.5rem;
`;

export const SidebarContainer = styled.div`
	flex: 1;
	max-width: 30rem;
	min-width: 25rem;
	display: flex;
	margin-right: 15px;
	flex-direction: column;
	padding: 1rem;
	height: 100%;
	overflow-y: auto;

	border-radius: 0;
	position: relative;
	box-shadow: 0 2px 1px 1px rgba(0, 0, 0, 0.1), 0 0 0 0 rgba(0, 0, 0, 0.12), 0 3px 1px -2px rgba(0, 0, 0, 0.2) !important;

	& > *:not(:first-child) {
		margin-top: 1rem;
	}
`;

const KEY_TO_CME = {
	[AssumptionKey.pricing]: 'price',
	[AssumptionKey.differentials]: AssumptionKey.differentials,
};

export function ApplyPriceDecksButton({ assumptionKey, applyCME: modelApplyCME }) {
	const [cmeDialog, confirmCME] = useDialog(SelectCMEDialog, { type: KEY_TO_CME[assumptionKey] });

	const { isLoading: applyingCME, mutateAsync: applyCME } = useMutation(async ({ products, date }: ApplyCMEProps) => {
		const productCodes = products.map(({ code }) => code);
		const result = await getApi('/price-imports/last-trading', { productCodes, date: formatISO(date) }, false);
		modelApplyCME(
			result.products.map(({ code, settlements }) => ({
				...products.find((cme) => code === cme.code),
				settlements,
				code,
			}))
		);
	});

	const handleApplyCME = async () => {
		const codes = await confirmCME();
		if (codes) {
			applyCME(codes);
		}
	};

	useDoggo(applyingCME, 'Applying Price Decks');

	return (
		<>
			{cmeDialog}
			{KEY_TO_CME[assumptionKey] && <Button onClick={handleApplyCME}>Price Decks</Button>}
		</>
	);
}

function SelectFromOtherProjectsButton({ assumptionKey, project, applyModel }) {
	const { user } = useAlfa();
	const projectId = project?._id;
	const cache = useScopedSelectCache();

	const handleSelect = async () => {
		const modelId = await selectByProject(
			'econ-model',
			{ userId: user?._id, projectId, extra: { assumptionKey }, cache },
			{ nested: true } // HACK make dialog nested so navbar style doesn't break
		);

		if (modelId) {
			let saveDependencies = false;

			// TODO: this shpuld be improved in the future
			if (assumptionKey === AssumptionKey.expenses || assumptionKey === AssumptionKey.capex) {
				saveDependencies = await alerts.confirm({
					title: `Import to the current project dependencies used in the chosen model?`,
					confirmText: 'Yes',
					cancelText: 'No',
				});
			}

			applyModel(modelId, saveDependencies);
		}
	};

	return (
		<Button
			onClick={handleSelect}
			tooltipTitle='Search models in other projects'
			color='secondary'
			variant='outlined'
		>
			Other Projects
		</Button>
	);
}

/** Actual model list */
function ActualModelList({
	list,
	onChangeName,
	onSelect,
	selectedId,
	canDelete,
	onDelete,
	initialModelId,
	onScrollBottom,
	totalItems,
	listType,
	wellAssignment,
	assumptionKey,
}: {
	list: Assumption[];
	selectedId: string | undefined | null;
	onChangeName(model: Assumption, newName: string): void;
	onSelect(model: Assumption): void;
	onDelete(model: Assumption): void;
	canDelete: boolean;
	initialModelId?: string;
	onScrollBottom: (startIndex: number, stopIndex: number) => void;
	totalItems: number;
	listType: 'unique' | 'project';
	wellAssignment?: Inpt.Api.Scenario.WellAssignmentBuild | EconGroupData;
	assumptionKey: string;
}) {
	const { canUpdate: canUpdateAssumption } = usePermissionsBuilder(SUBJECTS.Assumptions);

	// itemCount calculation is required for cases where a unique model is selected, but user is in project list view
	// (and vice versa). Will add 1 to the total items count because we always add the selected model to a list regardless
	// of whether or not they fall under the correct criteria (unique or project). If not accounted for, the list will
	// not populate all of the models.

	const initialModel = list.find((model) => model._id === initialModelId);
	const initialModelIsUnique = !!initialModel?.unique;
	const itemCount = !initialModel || initialModelIsUnique === (listType === 'unique') ? totalItems : totalItems + 1;
	const isCheckMarkVisible = (id: string) =>
		(!!wellAssignment || assumptionKey === AssumptionKey.generalOptions) && id === initialModelId;

	return (
		<List
			css={`
				flex: 1;
				overflow-y: auto;
			`}
			dense
		>
			<AutoSizer>
				{({ height, width }) => (
					<InfiniteLoader
						isItemLoaded={(i) => !!list[i]}
						itemCount={itemCount}
						loadMoreItems={onScrollBottom}
					>
						{({ onItemsRendered }) => (
							<ReactWindowList
								height={height}
								itemCount={list.length}
								onItemsRendered={onItemsRendered}
								itemSize={80} // TODO: get this value from MUI
								width={width}
							>
								{({ index, style }) => {
									const m = list[index];
									if (!m) return <div style={style}>loading</div>;
									return (
										<div style={style}>
											<ListItem
												id={m._id}
												key={index}
												onClick={() => onSelect(m)}
												selected={m._id === selectedId}
												css={`
													height: 100%;
													justify-content: space-between;
												`}
											>
												<Tooltip title={m.name} placement='top'>
													<ListItemText
														css={`
															flex: 1;
														`}
														primary={
															<TextField
																label='Name'
																value={m.name}
																fullWidth
																onChange={(ev) => {
																	if (
																		ev.target.value &&
																		ev.target.value !== m.name &&
																		hasNonWhitespace(ev.target.value)
																	) {
																		onChangeName(m, ev.target.value);
																		return;
																	}

																	return false; // false resets the input
																}}
																InputProps={{ readOnly: !canUpdateAssumption(m) }}
																onFocus={(ev) => ev.target.select()}
																variant='outlined'
																size='small'
																nativeOnChange
															/>
														}
														secondary={formatUserInfo(m.createdBy, m.createdAt)}
													/>
												</Tooltip>
												<div
													css={`
														align-items: start;
														display: flex;
														margin-left: 1rem;
														margin-top: 1.5rem;
														height: 100%;
													`}
												>
													{isCheckMarkVisible(m._id) && (
														<ListItemIcon
															css={`
																display: flex;
																min-width: unset;
																margin-right: 0.5rem;
																margin-top: 0.25rem;
															`}
														>
															<Tooltip title='Applied Model' placement='left'>
																<Icon>{faCheck}</Icon>
															</Tooltip>
														</ListItemIcon>
													)}
													{canDelete && (
														<Tooltip title='Delete Model' placement='left'>
															<IconButton
																color='error'
																edge='end'
																size='small'
																onClick={() => onDelete(m)}
															>
																{faTrash}
															</IconButton>
														</Tooltip>
													)}
												</div>
											</ListItem>
										</div>
									);
								}}
							</ReactWindowList>
						)}
					</InfiniteLoader>
				)}
			</AutoSizer>
		</List>
	);
}

const withCount = (text: string, length?: number) => (Number.isFinite(length) ? `${text} (${length})` : text);
const getModelViewType = (advancedView: boolean) => (advancedView ? 'Advanced' : 'Standard');

interface EconModelsListProps {
	allAssignmentIds: string[];
	assumptionKey: string;
	hasUnsavedWork: boolean;
	isValid: boolean;
	listType: ListType;
	modelsList: Assumption[];
	newModelName: string;
	onApplyModel(modelId: string, saveDependencies: boolean): void;
	onChangeListType(newType: ListType): void;
	onChangeModelName(m: Assumption, newName: string): void;
	onChangeNewModelName(newName: string): void;
	onChangeSearch(newValue: string): void;
	onCreateProjectModel(): void;
	onCreateUniqueModel(): void;
	onDelete(m: Assumption): void;
	onNewModel(): void;
	onNextWell?(): void;
	onPrevWell?(): void;
	onReset(): void;
	onRunEconomics(): void;
	onSaveModel(): void;
	onSelect(m: Assumption): void;
	onUseModel?(): void;
	onScrollBottom(from: number, to: number): Promise<void>;
	search: string;
	selectedModel: Assumption | undefined;
	wellAssignment: Inpt.Api.Scenario.WellAssignmentBuild | undefined | EconGroupData;
	disableSave?: boolean;
	extraActions?: React.ReactNode;
	initialModelId?: string;
	totalItems?: number;
	isModularScenario?: boolean;
	useModelTaggingProp?: Record<string, string>;
	advancedView: boolean;
}

export default function EconModelsList({
	allAssignmentIds,
	assumptionKey,
	hasUnsavedWork,
	isValid,
	listType,
	modelsList,
	newModelName,
	onApplyModel,
	onChangeListType,
	onChangeModelName,
	onChangeNewModelName,
	onChangeSearch,
	onCreateProjectModel,
	onCreateUniqueModel,
	onDelete,
	onNewModel,
	onNextWell,
	onPrevWell,
	onReset,
	onRunEconomics,
	onSaveModel,
	onSelect,
	onUseModel,
	onScrollBottom,
	totalItems,
	search,
	selectedModel,
	wellAssignment,
	disableSave,
	extraActions,
	initialModelId,
	isModularScenario,
	useModelTaggingProp = {},
	advancedView,
}: EconModelsListProps) {
	const { project } = useAlfa();

	const {
		canCreate: canCreateAssumption,
		canDelete: canDeleteAssumption,
		canUpdate: canUpdateAssumption,
	} = usePermissions(SUBJECTS.Assumptions, project?._id);

	const { canUpdate: canUpdateScenario } = usePermissions(SUBJECTS.Scenarios, project?._id);

	const isWellAssignment = isObject(wellAssignment) && !wellAssignment.isGroupCase;

	const sidebarAssignmentTitle = (() => {
		if (wellAssignment?.isGroupCase) return wellAssignment?.name;
		if (wellAssignment?.isWellsCollectionCase) return wellAssignment?.well?.well_name;
		return `${wellAssignment?.well?.well_name} - ${wellAssignment?.well?.well_number}`;
	})();

	return (
		<SidebarContainer>
			{wellAssignment && (
				<Box display='flex' justifyContent='space-between'>
					<div>
						<Typography variant='subtitle1' component='h1'>
							{sidebarAssignmentTitle}
						</Typography>
						{allAssignmentIds && (
							<Typography variant='subtitle2' component='h2'>
								Current {isWellAssignment ? 'Well' : 'Group'} (
								{allAssignmentIds.indexOf(wellAssignment._id) + 1} / {allAssignmentIds.length})
							</Typography>
						)}
					</div>
					<div>
						<IconButton color='secondary' onClick={onPrevWell} disabled={!onPrevWell}>
							{faAngleLeft}
						</IconButton>
						<IconButton color='secondary' onClick={onNextWell} disabled={!onNextWell}>
							{faAngleRight}
						</IconButton>
					</div>
				</Box>
			)}

			<ActionsGroup>
				<Button
					color={hasUnsavedWork ? 'error' : 'secondary'}
					disabled={!canCreateAssumption && PERMISSIONS_TOOLTIP_MESSAGE}
					onClick={onNewModel}
				>
					Clear
				</Button>

				<Button
					color={hasUnsavedWork ? 'error' : 'secondary'}
					onClick={onReset}
					disabled={!selectedModel && NO_MODEL_SELECTED_MESSAGE}
				>
					Undo Changes
				</Button>

				<Button
					tooltipTitle='Save New Project Model'
					disabled={
						(!canCreateAssumption && PERMISSIONS_TOOLTIP_MESSAGE) ||
						((!newModelName || !hasNonWhitespace(newModelName)) && NO_NAME_MESSAGE) ||
						(!isValid && INVALID_MESSAGE) ||
						disableSave
					}
					onClick={onCreateProjectModel}
					{...getTaggingProp('econModel', `saveAs${getModelViewType(advancedView)}-${assumptionKey}-model`)}
				>
					Save As
				</Button>
				{wellAssignment && assumptionKey !== AssumptionKey.generalOptions && (
					<Button
						onClick={onCreateUniqueModel}
						disabled={
							(!canCreateAssumption && PERMISSIONS_TOOLTIP_MESSAGE) ||
							((!newModelName || !hasNonWhitespace(newModelName)) && NO_NAME_MESSAGE) ||
							(!isValid && INVALID_MESSAGE) ||
							disableSave
						}
						tooltipTitle='Save as new Unique Model'
					>
						Save Unique
					</Button>
				)}

				<Button
					variant='outlined'
					color={hasUnsavedWork ? 'warning' : 'secondary'}
					onClick={() => onSaveModel()}
					tooltipTitle='Save Selected Model'
					disabled={
						(!canUpdateAssumption && PERMISSIONS_TOOLTIP_MESSAGE) ||
						(!isValid && INVALID_MESSAGE) ||
						(!selectedModel && NO_MODEL_SELECTED_MESSAGE) ||
						disableSave
					}
					{...getTaggingProp('econModel', `save${getModelViewType(advancedView)}-${assumptionKey}-model`)}
				>
					Save
				</Button>

				{extraActions}
			</ActionsGroup>

			<TextField
				fullWidth
				debounce // HACK to improve performance a bit
				margin='dense'
				variant='outlined'
				label='Model Name'
				placeholder='Enter Model Name'
				value={newModelName}
				onChange={(ev) => onChangeNewModelName(ev.target.value)}
				error={!selectedModel && (!newModelName || !hasNonWhitespace(newModelName))}
				InputLabelProps={{ shrink: true }}
			/>

			{onUseModel && (
				<>
					<Divider />

					<ActionsGroup>
						<Button
							onClick={onUseModel}
							color='secondary'
							variant='outlined'
							disabled={
								(!canUpdateScenario && PERMISSIONS_TOOLTIP_MESSAGE) ||
								(!selectedModel && NO_MODEL_SELECTED_MESSAGE) ||
								(hasUnsavedWork && UNSAVED_CHANGES_MESSAGE)
							}
							{...(Object.keys(useModelTaggingProp ?? {}).length > 0
								? useModelTaggingProp
								: getTaggingProp('econModel', `use-${assumptionKey}-model`))}
						>
							{assumptionKey === AssumptionKey.generalOptions
								? 'Use Model'
								: withCount('Use Model', wellAssignment ? undefined : allAssignmentIds?.length)}
						</Button>

						{isWellAssignment && !isModularScenario && (
							<Button
								color='secondary'
								onClick={onRunEconomics}
								disabled={
									(!selectedModel && NO_MODEL_SELECTED_MESSAGE) ||
									(hasUnsavedWork && UNSAVED_CHANGES_MESSAGE)
								}
								variant='outlined'
								startIcon={FeatureIcons.economics}
							>
								Run Economics
							</Button>
						)}
					</ActionsGroup>
				</>
			)}

			<Divider />

			<ActionsGroup>
				<SelectFromOtherProjectsButton
					assumptionKey={assumptionKey}
					project={project}
					applyModel={onApplyModel}
				/>
			</ActionsGroup>

			{!!wellAssignment && (
				<Tabs
					indicatorColor='secondary'
					textColor='secondary'
					value={listType}
					onChange={(_ev, newValue) => onChangeListType(newValue)}
					variant='fullWidth'
				>
					<Tab value='project' label='Current Project' tooltipTitle='Models in the current project' />
					<Tab value='unique' label='Unique Models' tooltipTitle='Models only applied to current well' />
				</Tabs>
			)}

			<TextField
				placeholder='Search In Project'
				margin='dense'
				value={search}
				onChange={(ev) => onChangeSearch(ev.target.value)}
				debounce
				InputProps={{
					endAdornment: (
						<InputAdornment position='end'>
							<Icon fontSize='small' color='primary'>
								{faSearch}
							</Icon>
						</InputAdornment>
					),
				}}
			/>

			<ActualModelList
				canDelete={canDeleteAssumption}
				list={modelsList}
				listType={listType}
				onChangeName={onChangeModelName}
				onDelete={onDelete}
				onSelect={onSelect}
				selectedId={selectedModel?._id}
				initialModelId={initialModelId}
				wellAssignment={wellAssignment}
				onScrollBottom={onScrollBottom}
				totalItems={totalItems ?? 0}
				assumptionKey={assumptionKey}
			/>
		</SidebarContainer>
	);
}
