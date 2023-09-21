import { faChevronDoubleLeft, faChevronDoubleRight } from '@fortawesome/pro-regular-svg-icons';
import _ from 'lodash';
import { forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import { SUBJECTS } from '@/access-policies/Can';
import usePermissions from '@/access-policies/usePermissions';
import { useHotkey } from '@/components/hooks';
import { Box, IconButton, Stack, alerts } from '@/components/v2';
import { confirmationAlert, warningAlert, withLoadingBar } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { FeatureIcons } from '@/helpers/features';
import { usePrevious } from '@/helpers/hooks';
import { queryClient } from '@/helpers/query-cache';
import { postApi } from '@/helpers/routing';
import { unsavedWorkContinue, useUnsavedWork } from '@/helpers/unsaved-work';
import { SetStateFunction } from '@/helpers/utilities';
import { AssumptionKey } from '@/inpt-shared/constants';
import { useCurrentScenario } from '@/scenarios/api';

import EconomicsRunCard from './EconModel/EconomicsRunCard';
import EconModelsList from './EconModelsList';
import { getEconModelById } from './api';
import { EconRunContext } from './econ-run';
import { getModelEmissionKey } from './emission/AppendEmissionsDialog';
import { Assumption, ListType, getModelsCount, getModelsList } from './shared';

const ECON_DIALOG_SCOPE = Symbol('econ-dialog');
export const DEFAULT_ECON_MODEL_HOTKEYS_SCOPE = 'econ-model-dialog';

/** This is the floating arrow to bring up the economics output tables when clicked */
function EconomicsOutputMark({ children, visibility, onChangeVisibility }) {
	if (visibility === 'closed') {
		return (
			<Box position='absolute' top='10px' right='0px' bgcolor='background.opaque'>
				<IconButton color='secondary' onClick={() => onChangeVisibility('open')}>
					{faChevronDoubleLeft}
				</IconButton>
			</Box>
		);
	}
	// TODO check if really needed, but it probably does
	// eslint-disable-next-line react/jsx-no-useless-fragment
	return <>{children}</>;
}

export type EconModelStateCache = Partial<Assumption>;

export interface SharedEconModelProps {
	allAssignmentIds: string[];
	onUseModel?: (params: { assignmentId?: string; assumptionKey: string; model: Assumption }) => void;
	initialModelId?: string;
	onNextWell?: (params: { onSuccess?: () => void }) => void;
	onPrevWell?: (params: { onSuccess?: () => void }) => void;
	unique?: boolean;
	wellAssignment?: Inpt.Api.Scenario.WellAssignmentBuild;
	stateCache?: EconModelStateCache;
	clearStateCache?: () => void;
	hotkeysScope?: string;
	useModelTaggingProp?: Record<string, string>;
}

export interface AdvancedEconModelProps extends SharedEconModelProps {
	onToggleV2: (stateCache?: EconModelStateCache) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
interface EconModelProps<T = any> extends SharedEconModelProps {
	/** Optional id to the container element */
	id?: string;
	state: T;
	setState: SetStateFunction<T>;
	assumptionKey: string;
	assumptionName: string;
	className?: string;
	defaultValue: T;
	children?: React.ReactNode;
	/**
	 * Generally uses `econ_function` or `options` to get the state
	 *
	 * @note function should be memoized
	 */
	getStateFromAssumption: (model: Assumption) => T;
	/**
	 * Should return `options` and `econ_function`
	 *
	 * @note function should be memoized
	 */
	getAssumptionFromState: (state: T, assumption?: Partial<Assumption>) => Partial<Assumption>;
	/**
	 * Should return if state is valid
	 *
	 * @note should be memoized
	 */
	stateIsValid: (state: T) => boolean;
	/**
	 * Function used to check if state has been modified, by default is _.isEqual
	 *
	 * @note should be memoized
	 */
	stateIsEqual?: (state: T, selectedModelValue: T) => boolean;
	setUndoStates?: (states: T[]) => void;
	disableSave?: boolean;
	extraActions?: React.ReactNode;
	invalidateModelTemplateQuery?: () => void;
	fetchingModelTemplate?: boolean;
	invalidateELTsQuery?: () => void;
	fetchingELTs?: boolean;
	isModularScenario?: boolean;
	onModelUpdated?(assumptionKey): void;
	advancedView?: boolean;
}

export type EconModelV2Ref = {
	getStateCache(): EconModelStateCache | undefined;
	hasValidOptions: boolean;
	handleSaveModel(): Promise<boolean | void>;
};

function EconModelV2(props: EconModelProps, ref: React.ForwardedRef<EconModelV2Ref>) {
	const {
		id,
		state: value,
		setState: setValue,
		wellAssignment,
		unique,
		className,
		children,
		assumptionKey,
		assumptionName,
		onUseModel,
		onModelUpdated,
		initialModelId,
		allAssignmentIds,
		onNextWell,
		onPrevWell,
		defaultValue,
		getStateFromAssumption,
		getAssumptionFromState,
		stateIsValid,
		stateIsEqual = _.isEqual,
		setUndoStates,
		disableSave,
		extraActions,
		stateCache,
		invalidateModelTemplateQuery,
		fetchingModelTemplate,
		invalidateELTsQuery,
		fetchingELTs,
		isModularScenario,
		clearStateCache,
		hotkeysScope = DEFAULT_ECON_MODEL_HOTKEYS_SCOPE,
		useModelTaggingProp = {},
		advancedView = true,
	} = props;
	const { project } = useAlfa();
	const { scenario } = useCurrentScenario();

	const [selectedWellAssignmentId, setSelectedWellAssignmentId] = useState(wellAssignment?._id);
	const previousSelectedWellAssignmentId = usePrevious(selectedWellAssignmentId);
	const [selectedModelId, setSelectedModelId] = useState(initialModelId);
	const previousSelectedModelId = usePrevious(selectedModelId);
	const [selectedModel, setSelectedModel] = useState<Assumption | undefined>();
	const [selectedModelValue, setSelectedModelValue] = useState(defaultValue);

	useEffect(() => {
		const newSelectedModelValue = selectedModel ? getStateFromAssumption(selectedModel) : defaultValue;
		setSelectedModelValue(newSelectedModelValue);
	}, [defaultValue, getStateFromAssumption, selectedModel]);

	useEffect(() => {
		setSelectedModelId(initialModelId);
		setSelectedWellAssignmentId(wellAssignment?._id);
	}, [initialModelId, wellAssignment?._id]);

	const [listType, setListType] = useState<ListType>(unique ? 'unique' : 'project');
	const [search, setSearch] = useState('');
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const [loadedModelList, setLoadedModelList] = useState([] as any[]);

	const [totalModelCount, setTotalModelCount] = useState(0);

	useEffect(() => {
		(async () => {
			const { count } = await getModelsCount({ search, listType, wellAssignment, assumptionKey, project });
			const models = await getModelsList({
				search,
				listType,
				wellAssignment,
				assumptionKey,
				initialModelId,
				startAt: 0,
				limit: 20,
				project,
			});
			setTotalModelCount(count);
			setLoadedModelList(models);
		})();
	}, [search, listType, wellAssignment, assumptionKey, project, initialModelId]);

	const modelIsSelected = !!initialModelId;
	const handleLoadMoreModels = useCallback(
		async (from, to) => {
			const omitSelectedModel = modelIsSelected && from > 0; // selected model is always first item. adding this flag here ensures it doesnt get included in the list when fetching extra models
			const models = await getModelsList({
				search,
				listType,
				wellAssignment,
				assumptionKey,
				initialModelId,
				startAt: from,
				limit: Math.max(to - from + 1, 0),
				project,
				omitSelectedModel,
			});

			setLoadedModelList((prevList) => {
				const newList = [...prevList];
				newList.splice(from, models.length, ...models);
				return newList;
			});
		},
		[search, listType, wellAssignment, assumptionKey, initialModelId, project, modelIsSelected]
	);

	const getModelsData = async () => {
		const { count } = await getModelsCount({ search, listType, wellAssignment, assumptionKey, project });
		const list = await getModelsList({
			search,
			listType,
			wellAssignment,
			assumptionKey,
			initialModelId,
			project,
		});

		setTotalModelCount(count);
		setLoadedModelList([...list]);
	};

	const [newModelName, setNewModelName] = useState('');

	const clearState = useCallback(
		(newValue = defaultValue) => {
			setNewModelName('');
			setSelectedModelId(undefined);
			setSelectedModel(undefined);
			setValue(newValue);
			setTimeout(() => {
				setUndoStates?.([]);
			}, 1);
		},
		[defaultValue, setUndoStates, setValue]
	);

	const onDelete = async (model: Assumption) => {
		const confirmed = await alerts.confirm({
			title: 'Are you sure?',
			children: 'Model will be deleted from every scenario in the project',
			confirmText: 'Delete',
			confirmColor: 'error',
		});

		if (!confirmed) {
			return;
		}

		await withLoadingBar(
			postApi(`/projects/${model.project}/deleteAssumption`, {
				projId: model.project,
				assId: model._id,
				assType: model.assumptionKey,
			})
		);
		getModelsData();
		confirmationAlert('Model Deleted');
		clearState();

		onModelUpdated?.(assumptionKey);
	};

	const selectModel = useCallback(
		(newModel: Assumption, newValue = getStateFromAssumption(newModel)) => {
			setValue(newValue);
			setSelectedModel(newModel);
			setNewModelName('');
			setListType(newModel.unique ? 'unique' : 'project');
			setTimeout(() => {
				setUndoStates?.([]);
			}, 1);
		},
		[getStateFromAssumption, setUndoStates, setValue]
	);

	const getPreparedBody = (name: string, createUnique: boolean) => {
		const result = getAssumptionFromState(value, selectedModel);

		if (result == null) return null;

		return {
			project: project?._id,
			assumptionKey,
			assumptionName,
			unique: createUnique,
			...(createUnique && { scenario: scenario?._id, well: wellAssignment?.well._id }),
			...result,
			name,
		};
	};

	const createModel = async (createUnique: boolean) => {
		const trimmedModelName = newModelName.trim();
		const body = getPreparedBody(trimmedModelName, createUnique);
		if (body === null) {
			return;
		}
		const savedModel = await withLoadingBar(
			postApi(`/scenarios/setUniqueWellAssumption`, body) as Promise<Assumption>,
			createUnique
				? `Saved New Unique Model: ${trimmedModelName}`
				: `Saved New Project Model: ${trimmedModelName}`
		);
		getModelsData();
		selectModel(savedModel);
	};

	const createProjectModel = () => createModel(false);

	const createUniqueModel = () => createModel(true);

	const { canUpdate: canUpdateAssumptions } = usePermissions(SUBJECTS.Assumptions, project?._id);

	const hasValidOptions = useMemo(() => stateIsValid(value), [stateIsValid, value]);

	const handleSaveModel = async () => {
		if (!canUpdateAssumptions) return false;

		if (!hasValidOptions) {
			warningAlert('Invalid Model');
			return false;
		}
		if (!selectedModel) {
			warningAlert('Cannot save when no model is selected');
			return false;
		}
		const preparedName = newModelName.trim() || selectedModel.name.trim();
		const preparedBody = getPreparedBody(preparedName, selectedModel.unique);

		if (preparedBody === null) {
			return;
		}
		const body = {
			...preparedBody,
			_id: selectedModel._id,
		};
		const result = await withLoadingBar(
			postApi(`cost-model/saveModel/${selectedModel._id}`, body),
			`${body.name} Saved`
		);
		getModelsData();
		selectModel(result);
		onModelUpdated?.(assumptionKey);
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const [modelAwaitingForTemplate, setModelAwaitingForTemplate] = useState<any>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const [modelAwaitingForApply, setModelAwaitingForApply] = useState<any>(null);

	const isApplyingRef = useRef(false); // HACK: useEffect is being called while in between setState calls

	const _applyModel = useCallback(
		(modelToApply) => {
			isApplyingRef.current = true;
			setNewModelName('');
			setValue(getStateFromAssumption(modelToApply));
			setSelectedModel(undefined);
			setSelectedModelId(undefined);
			isApplyingRef.current = false;
			setTimeout(() => {
				// HACK needed sometimes
				setUndoStates?.([]);
			}, 1);
		},
		[getStateFromAssumption, setUndoStates, setValue]
	);

	useEffect(() => {
		if (fetchingModelTemplate && modelAwaitingForTemplate) {
			setModelAwaitingForApply(modelAwaitingForTemplate);
		}
	}, [modelAwaitingForTemplate, fetchingModelTemplate]);

	useEffect(() => {
		if (!fetchingModelTemplate && !fetchingELTs && modelAwaitingForApply) {
			(async () => {
				await _applyModel(modelAwaitingForApply);
				setModelAwaitingForTemplate(null);
				setModelAwaitingForApply(null);
			})();
		}
	}, [_applyModel, modelAwaitingForApply, fetchingModelTemplate, fetchingELTs]);

	const handleApplyModel = async (modelId: string, saveDependencies: boolean) => {
		const shouldSaveDependencies =
			(assumptionKey === AssumptionKey.expenses || assumptionKey === AssumptionKey.capex) &&
			invalidateModelTemplateQuery &&
			invalidateELTsQuery &&
			saveDependencies;

		const model = await withLoadingBar(
			postApi(`/cost-model/${modelId}/apply`, {
				modelId,
				projectId: project?._id,
				scenarioId: scenario?._id,
				assumptionKey,
				saveDependencies: shouldSaveDependencies,
			})
		);

		if (shouldSaveDependencies) {
			invalidateModelTemplateQuery();
			invalidateELTsQuery();
			setModelAwaitingForTemplate(model);
		} else {
			await _applyModel(model);
		}
	};

	const handleChangeModelName = async (listModel: Assumption, newName: string) => {
		const newModelName = newName.trim();
		setNewModelName(newModelName);
		// TODO use mutations instead
		await withLoadingBar(
			postApi(`/cost-model/${listModel._id}/changeModelName`, { _id: listModel._id, name: newModelName }),
			'Model name changed'
		);
		getModelsData();
		if (selectedModel?._id === listModel._id) {
			setSelectedModel({
				...listModel,
				name: newModelName,
			});
		}

		onModelUpdated?.(assumptionKey);
	};

	const handleReset = () => {
		if (selectedModel) {
			selectModel({ ...selectedModel }); // HACK need to spread the selected model to make a shallow copy and force a state change
		} else {
			clearState();
		}
	};

	useEffect(() => {
		(async () => {
			if (stateCache) {
				if (stateCache._id) {
					const newModel = await getEconModelById(stateCache._id);
					const tempModel = { ...newModel, ...stateCache };
					selectModel(newModel, getStateFromAssumption(tempModel));
				} else {
					clearState(getStateFromAssumption(stateCache as Assumption)); // TODO possible sneaky errors here
				}

				//as stateCache is set on the mode switch, we should clean it right after applying to avoid unexpected bugs
				clearStateCache?.();
				return;
			}

			// HACK: previousSelectedModelId and previousSelectedWellAssignmentId resolving the issue when getStateFromAssumption
			// changes, but we don't want to select model, e.g. Create ELT directly from the grid cell
			if (
				!isApplyingRef.current &&
				selectedModelId &&
				(selectedModelId !== previousSelectedModelId ||
					selectedWellAssignmentId !== previousSelectedWellAssignmentId ||
					!selectedModel)
			) {
				selectModel(await getEconModelById(selectedModelId));
				clearStateCache?.();
			}
		})();
	}, [
		clearState,
		getStateFromAssumption,
		selectModel,
		setValue,
		stateCache,
		selectedModelId,
		previousSelectedModelId,
		selectedModel,
		clearStateCache,
		selectedWellAssignmentId,
		previousSelectedWellAssignmentId,
	]);

	const handleSelectModel = useCallback(
		async (model) => {
			if (model?._id !== selectedModel?._id && (await unsavedWorkContinue([ECON_DIALOG_SCOPE]))) {
				selectModel(model);
			}
		},
		[selectModel, selectedModel?._id]
	);

	const econRunContext = useContext(EconRunContext);

	if (!econRunContext) {
		throw new Error('Expected to have econ run context');
	}

	const { econRun, runEconomics, visibility, setVisibility } = econRunContext;

	// needs to be undefined if onUseModel is undefined for the econ model list to not display the button
	const handleUseModel = onUseModel
		? () => {
				if (!selectedModel) {
					throw new Error('Trying to assign undefined Assignment');
				}

				onUseModel?.({
					assignmentId: wellAssignment?._id,
					assumptionKey,
					model: selectedModel,
				});
		  }
		: undefined;

	const handleRunEconomics = () => {
		if (wellAssignment && !isModularScenario) {
			runEconomics([wellAssignment]);
		}
	};

	const hasUnsavedWork = useMemo(() => {
		const areEqual = stateIsEqual(value, selectedModelValue);
		return !areEqual;
	}, [selectedModelValue, stateIsEqual, value]);

	const handleClearState = () => {
		clearState();
	};

	const handleMoveToPreviousWell = useCallback(async () => {
		if (onPrevWell) {
			onPrevWell({ onSuccess: clearState });
		}
	}, [clearState, onPrevWell]);

	const handleMoveToNextWell = useCallback(async () => {
		if (onNextWell) {
			onNextWell({ onSuccess: clearState });
		}
	}, [clearState, onNextWell]);

	// when loadedModelList changes, need to invalidate the emission models used in AppendEmissionDialog.tsx
	useEffect(() => {
		if (assumptionKey === 'emission') {
			queryClient.invalidateQueries(getModelEmissionKey(project?._id));
		}
	}, [loadedModelList, assumptionKey, project]);

	useUnsavedWork(hasUnsavedWork, [ECON_DIALOG_SCOPE]);

	useImperativeHandle(ref, () => ({
		getStateCache: () => ({ ...getAssumptionFromState(value, selectedModel), _id: selectedModel?._id }),
		hasValidOptions,
		handleSaveModel,
	}));

	useHotkey('shift+enter', 'all', () => {
		handleRunEconomics();
		return false;
	});

	useHotkey('ctrl+s', hotkeysScope, () => {
		handleSaveModel();
		return false;
	});

	useHotkey('shift+x', hotkeysScope, () => {
		handleClearState();
		return false;
	});

	const hasEconRun = scenario && wellAssignment && econRun;

	return (
		<Stack id={id} className={className} direction='row' css={{ height: '100%' }}>
			<EconModelsList
				isModularScenario={isModularScenario}
				disableSave={disableSave}
				allAssignmentIds={allAssignmentIds}
				assumptionKey={assumptionKey}
				hasUnsavedWork={hasUnsavedWork}
				isValid={hasValidOptions}
				listType={listType}
				modelsList={loadedModelList}
				newModelName={newModelName.trimStart()}
				onApplyModel={handleApplyModel}
				onChangeListType={setListType}
				onChangeModelName={handleChangeModelName}
				onChangeNewModelName={setNewModelName}
				onChangeSearch={setSearch}
				onCreateProjectModel={createProjectModel}
				onCreateUniqueModel={createUniqueModel}
				onDelete={onDelete}
				onNewModel={handleClearState}
				onNextWell={handleMoveToNextWell}
				onPrevWell={handleMoveToPreviousWell}
				onReset={handleReset}
				onRunEconomics={handleRunEconomics}
				onSaveModel={handleSaveModel}
				onSelect={handleSelectModel}
				onUseModel={handleUseModel}
				onScrollBottom={handleLoadMoreModels}
				totalItems={totalModelCount ?? 0}
				search={search}
				selectedModel={selectedModel}
				wellAssignment={wellAssignment}
				extraActions={extraActions}
				initialModelId={initialModelId}
				useModelTaggingProp={useModelTaggingProp}
				advancedView={advancedView}
			/>
			<div
				css={`
					flex: 3;
					height: 100%;
					display: flex;
					flex-direction: row;
					overflow: auto;
					.standard-view {
						margin-right: ${hasEconRun ? '3rem' : '0'};
						text-transform: unset;
					}
				`}
			>
				<div
					css={{ flex: 1, overflow: 'auto' }}
					style={{ display: visibility === 'expanded' ? 'none' : 'flex' }}
				>
					{children}
				</div>
				{hasEconRun && (
					<EconomicsOutputMark visibility={visibility} onChangeVisibility={setVisibility}>
						<EconomicsRunCard
							css='flex: 1; height: 100%; overflow-y: auto;'
							monthly={econRun?.monthly}
							oneLiner={econRun?.oneLiner}
							scenario={scenario}
							wellName={wellAssignment.well.well_name}
							wellId={wellAssignment.well._id}
							startActions={
								<IconButton size='small' onClick={() => setVisibility('closed')} color='secondary'>
									{faChevronDoubleRight}
								</IconButton>
							}
							endActions={
								<IconButton
									size='small'
									onClick={() => setVisibility((p) => (p === 'expanded' ? 'open' : 'expanded'))}
								>
									{visibility === 'expanded' ? FeatureIcons.compress : FeatureIcons.expand}
								</IconButton>
							}
						/>
					</EconomicsOutputMark>
				)}
			</div>
		</Stack>
	);
}

export default forwardRef(EconModelV2);
