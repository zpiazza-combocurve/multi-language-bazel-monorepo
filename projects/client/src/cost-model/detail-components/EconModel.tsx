// TODO find and destroy mutations, and remove uncessary clones afterwards
import hotkeys from 'hotkeys-js';
import produce from 'immer';
import { cloneDeep } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getTaggingProp } from '@/analytics/tagging';
import { RenderProp, renderProp } from '@/components/shared';
import { Box, Button } from '@/components/v2';
import { unsavedWorkContinue } from '@/helpers/unsaved-work';
import { AssumptionKey } from '@/inpt-shared/constants';

import EconModelV2, { DEFAULT_ECON_MODEL_HOTKEYS_SCOPE, EconModelStateCache, EconModelV2Ref } from './EconModelV2';
import { ApplyPriceDecksButton } from './EconModelsList';
import { GenerateNewModelHeaders, createEconFunction, getModelState, isValid, priceDecksToData } from './gen-data';
import { Assumption, useTableSelection } from './shared';

const defaultPrepareBody = ({ body, fields }) =>
	produce(body, (draft) => {
		draft.econ_function = createEconFunction(cloneDeep(draft.options), Object.keys(fields));
	});

interface EconModelProps {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	templateFields: any;
	assumptionKey: string;
	assumptionName: string;
	/** List of ids of tables, useful for keyboard navigation */
	tableKeys: string[];
	initialOmitSection?: Record<string, boolean>;
	readOnly?: boolean;
	wellAssignment?: Inpt.Api.Scenario.WellAssignmentBuild;
	unique?: boolean;
	className?: string;
	header?: string;
	tablesContainerClassName?: string;
	children?: RenderProp<{
		fields;
		handleOptionChange;
		omitSection: Record<string, boolean>;
		onSelect;
		options;
		selected;
		setFields;
		toggleSection;
	}>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	prepareBody({ fields, body, omitSection }): any;
	initialModelId?: string;
	onUseModel?: (params: { assignmentId?: string; assumptionKey: string; model: Assumption }) => void;
	allAssignmentIds: string[];
	onNextWell?(): void;
	onPrevWell?(): void;
	onToggleV2?(stateCache?: EconModelStateCache): void;
	invalidateModelTemplateQuery?: () => void;
	fetchingModelTemplate?: boolean;
}

export type SharedEconModelProps = Pick<
	EconModelProps,
	| 'allAssignmentIds'
	| 'onUseModel'
	| 'initialModelId'
	| 'onNextWell'
	| 'onPrevWell'
	| 'readOnly'
	| 'unique'
	| 'wellAssignment'
	| 'onToggleV2'
>;

function EconModel(props: EconModelProps) {
	const {
		templateFields,
		className,
		tablesContainerClassName,
		header,
		children,
		assumptionKey,
		initialOmitSection,
		tableKeys,
		prepareBody = defaultPrepareBody,
		onToggleV2,
		invalidateModelTemplateQuery,
		fetchingModelTemplate,
	} = props;

	const { selected, onSelect } = useTableSelection(tableKeys);

	const econModelRef = useRef<EconModelV2Ref>(null);

	const defaultState = useMemo(
		() => ({
			omitSection: initialOmitSection ?? {},
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			options: GenerateNewModelHeaders(templateFields),
		}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[
			// TODO we shouldn't omit this parameter, instead fix in parent components
			// initialOmitSection,
			templateFields,
		]
	);

	const [state, setState] = useState(defaultState);

	const stateCopy = useMemo(() => cloneDeep(state), [state]); // HACK somewhere these values are being mutated (options)

	const toggleSection = useCallback((section: string, value: boolean) => {
		setState((p) => ({ ...p, omitSection: { ...p.omitSection, [section]: value } })); // NOTE be careful here to not use immer, it's breaking somehow, perhaps the child components are mutating the state
	}, []);

	const [fields, setFields] = useState(() => cloneDeep(templateFields));

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const handleOptionChange = (value: any, key: string) => {
		setState((p) => ({ ...p, options: { ...p.options, [key]: value } }));
	};

	const applyPriceDecks = async (products) => {
		setState((p) => ({ ...p, options: priceDecksToData({ products, assumptionKey, options: p.options }) }));
	};

	const stateIsValid = useCallback((state) => isValid(state, fields), [fields]);

	const getAssumptionFromState = useCallback(
		({ options, omitSection }) =>
			prepareBody({
				fields,
				omitSection,
				body: { options },
			}),

		[fields, prepareBody]
	);

	const getStateFromAssumption = useCallback(
		(ass) => {
			const { omitSection: newOmitSection, ...modelOptions } = getModelState({
				fieldsObj: templateFields,
				model: ass,
			});

			return { options: modelOptions, omitSection: newOmitSection };
		},
		[templateFields]
	);

	const handleToggleV2 = async () => {
		if (econModelRef.current?.hasValidOptions) {
			onToggleV2?.(econModelRef.current?.getStateCache());
		} else if (await unsavedWorkContinue()) {
			onToggleV2?.(undefined);
		}
	};

	const getTaggingPropByAssumptionKey = (assumptionKey: string) => {
		if (assumptionKey === AssumptionKey.expenses) {
			return getTaggingProp('scenario', 'advancedViewExpenses');
		} else if (assumptionKey === AssumptionKey.capex) {
			return getTaggingProp('scenario', 'advancedViewCapex');
		}

		return {};
	};

	useEffect(() => {
		setFields(cloneDeep(templateFields));
	}, [templateFields]);

	useEffect(() => {
		hotkeys.setScope(DEFAULT_ECON_MODEL_HOTKEYS_SCOPE);
	}, []);

	return (
		<EconModelV2
			ref={econModelRef}
			{...props}
			id='cost-model-detail'
			className={className}
			stateIsValid={stateIsValid}
			state={state}
			setState={setState}
			defaultValue={defaultState}
			getAssumptionFromState={getAssumptionFromState}
			getStateFromAssumption={getStateFromAssumption}
			extraActions={
				// TODO This is only needed for price and differentials, move it there
				<ApplyPriceDecksButton assumptionKey={assumptionKey} applyCME={applyPriceDecks} />
			}
			invalidateModelTemplateQuery={invalidateModelTemplateQuery}
			fetchingModelTemplate={fetchingModelTemplate}
			advancedView={false}
		>
			<div
				css={`
					display: flex;
					flex-direction: column;
					height: 100%;
					overflow: auto;
				`}
			>
				{header && (
					<Box display='flex' flex='0 0 auto' alignItems='center'>
						<h2
							css={{
								margin: '0',
								marginLeft: '20px',
							}}
						>
							{header}
						</h2>
						<div css='flex: 1' />
						{onToggleV2 && (
							<Button
								size='small'
								variant='outlined'
								color='secondary'
								onClick={handleToggleV2}
								{...getTaggingPropByAssumptionKey(assumptionKey)}
							>
								Advanced View
							</Button>
						)}
					</Box>
				)}
				<Box flex='1 1 0' display='flex' flexDirection='row' overflow='auto'>
					<div id='cost-model-detail-sheets-container' className={tablesContainerClassName} css='flex: 1'>
						{renderProp(children, {
							...stateCopy,
							fields,
							handleOptionChange,
							onSelect,
							selected,
							setFields,
							toggleSection,
						})}
					</div>
				</Box>
			</div>
		</EconModelV2>
	);
}

export default EconModel;
