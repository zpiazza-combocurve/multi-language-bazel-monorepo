import {
	faAngleLeft,
	faAngleRight,
	faDownload,
	faExpandArrowsAlt,
	faPlus,
	faRedo,
	faTimes,
	faUndo,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dispatch, RefObject, SetStateAction, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';

import { getTaggingProp } from '@/analytics/tagging';
import { CTRL_OR_COMMAND_KEY, CTRL_OR_COMMAND_TEXT } from '@/components';
import { ROW_ID_KEY } from '@/components/AdvancedTable/constants';
import { AdvancedTableRef, AdvancedTableRow, EXPORTS } from '@/components/AdvancedTable/types';
import KeyboardShortcutsButton, { Block, KeyboardShortcutsButtonRef } from '@/components/KeyboardShortcutsButton';
import { tryCatchFalse, useHotkey } from '@/components/hooks';
import { Button, ButtonItem, Divider, MenuButton, Stack } from '@/components/v2';
import { confirmationAlert, failureAlert } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { unsavedWorkContinue } from '@/helpers/unsaved-work';
import { ASSUMPTION_LABELS } from '@/inpt-shared/constants';
import { SaveAsEmbeddedLookupTableDialog } from '@/lookup-tables/embedded-lookup-tables/SaveAsEmbeddedLookupTableDialog';
import { useCreateEmbeddedLookupTableMutation } from '@/lookup-tables/embedded-lookup-tables/mutations';
import { URLS } from '@/urls';

import { EconModelStateCache, EconModelV2Ref } from '../EconModelV2';

export const ToolBarButton = styled(Button).attrs({
	size: 'small',
})({
	textTransform: 'unset',
	margin: '0 5px',
	minWidth: 'unset',
});

interface AdvancedModelToolbarProps<T extends AdvancedTableRow> {
	addRowLabel: string;
	addRowButtonDisabled?: boolean;
	assumptionKey: string;
	// Refs
	econModelRef?: RefObject<EconModelV2Ref>;
	tableRef: RefObject<AdvancedTableRef<T>>;
	// State booleans
	sidebarOpened?: boolean;
	canUndo: boolean;
	canRedo: boolean;
	// State actions
	setSidebarOpened?: Dispatch<SetStateAction<boolean>>;
	// Other props
	onToggleV2?: (stateCache?: EconModelStateCache) => void;
	handleAddRow: () => void;
	onClearData?: () => void;
	organizeRows?: { label: string; onClick: (rowData: T[]) => T[] };
	enableCollapsibleRows?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	eltModeContext?: any;
	shortcutsInfo: Block[];
	hotkeysScope: string;
	/** HideLookupRows hides lookup row button. */
	hideLookupRows?: boolean;
}

const AdvancedModelToolbar = <T extends AdvancedTableRow>({
	addRowLabel,
	addRowButtonDisabled = false,
	assumptionKey,
	tableRef,
	setSidebarOpened,
	canUndo,
	canRedo,
	onToggleV2,
	sidebarOpened,
	econModelRef,
	handleAddRow,
	onClearData,
	organizeRows,
	enableCollapsibleRows = true,
	shortcutsInfo,
	eltModeContext,
	hotkeysScope,
	hideLookupRows = false,
}: AdvancedModelToolbarProps<T>) => {
	const eltMode = !!eltModeContext;

	const keyboardShortcutsButtonRef = useRef<KeyboardShortcutsButtonRef>(null);

	const handleAddLookupRow = () => {
		tableRef.current?.setRowData((p) => [
			...p,
			{
				[ROW_ID_KEY]: uuidv4(),
				isELTRow: true,
			} as T,
		]);
	};

	const handleResetColumns = () => tableRef.current?.resetColumns();

	const handleCollapseAll = () => {
		if (enableCollapsibleRows) {
			tableRef.current?.collapseAll();
		}
	};

	const handleExpandAll = () => {
		if (enableCollapsibleRows) {
			tableRef.current?.expandAll();
		}
	};

	const handleOrganizeRows = () => {
		if (organizeRows) {
			tableRef.current?.setRowData((rowData) => organizeRows.onClick(rowData));
		}
	};

	const handleClearData = () => {
		if (onClearData) {
			return onClearData();
		}
	};

	const handleOpenShortcutsMenu = () => {
		keyboardShortcutsButtonRef.current?.toggleMenu();
	};

	const handleToggleV2 = async () => {
		if (econModelRef?.current?.hasValidOptions) {
			onToggleV2?.(econModelRef?.current?.getStateCache());
		} else if (await unsavedWorkContinue()) {
			onToggleV2?.(undefined);
		}
	};

	const handleDeleteSelectedRows = () => {
		tableRef.current?.deleteSelectedRows();
	};

	const navigate = useNavigate();

	const createEmbeddedLookupTableMutation = useCreateEmbeddedLookupTableMutation({
		onSuccess: (data: Inpt.EmbeddedLookupTable) => {
			confirmationAlert('Embedded Lookup Table Created');
			eltModeContext?.setSelectedLinesWithLTs([]);

			if (eltModeContext?.onSaveAs) {
				eltModeContext?.onSaveAs(eltModeContext?.elt._id, data);
			} else {
				navigate(URLS.project(data.project).embeddedLookupTable(data._id).edit);
			}
		},
	});

	const [saveAsEmbeddedLookupTableDialog, showSaveAsEmbeddedLookupTableDialog] = useDialog(
		SaveAsEmbeddedLookupTableDialog
	);

	const wrappedSaveELTOperation = useCallback(
		async (operation: () => Promise<void>) => {
			if (await eltModeContext?.onValidateLookupRulesValues()) {
				await operation();
			} else {
				failureAlert('Lookup Rules Values should be fixed.');
			}
		},
		[eltModeContext]
	);

	const handleELTSaveAs = useCallback(
		() =>
			wrappedSaveELTOperation(async () => {
				const result = await showSaveAsEmbeddedLookupTableDialog();

				if (!result) {
					return;
				}

				eltModeContext?.setWaitingOnSaveAsComplete?.(true);

				await createEmbeddedLookupTableMutation.mutateAsync({
					assumptionKey: eltModeContext?.elt.assumptionKey,
					project: eltModeContext?.elt.project,
					name: result?.name,
					...eltModeContext?.getCurrentRulesAndLines(),
					configuration: {
						...eltModeContext?.elt.configuration,
						selectedHeaders: eltModeContext?.chosenHeaders,
						selectedHeadersMatchBehavior: eltModeContext?.headersMatchBehavior,
					},
				});
			}),
		[
			createEmbeddedLookupTableMutation,
			eltModeContext,
			showSaveAsEmbeddedLookupTableDialog,
			wrappedSaveELTOperation,
		]
	);

	const isELTSaveAsDisabled =
		eltModeContext?.editing || !eltModeContext?.rulesAreValid || !eltModeContext?.linesAreValid;

	const isELTSaveDisabled = isELTSaveAsDisabled || !eltModeContext?.hasBeenEdited;

	const handleELTSave = useCallback(async () => {
		// checks for disable for hotkey usage
		if (!isELTSaveDisabled) {
			await wrappedSaveELTOperation(async () => {
				const data = eltModeContext?.getDataToSave();

				await eltModeContext?.updateEmbeddedLookupTableMutation.mutateAsync({
					eltId: eltModeContext?.elt._id,
					data,
				});

				eltModeContext?.setSelectedLinesWithLTs([]);
			});
		}
	}, [eltModeContext, isELTSaveDisabled, wrappedSaveELTOperation]);

	useHotkey('shift+c', hotkeysScope, tryCatchFalse(handleCollapseAll));

	useHotkey('shift+e', hotkeysScope, tryCatchFalse(handleExpandAll));

	useHotkey('shift+r', hotkeysScope, tryCatchFalse(handleOrganizeRows));

	useHotkey('shift+k', hotkeysScope, tryCatchFalse(handleOpenShortcutsMenu));

	useHotkey(`${CTRL_OR_COMMAND_KEY}+s`, hotkeysScope, tryCatchFalse(handleELTSave));

	useHotkey(
		`${CTRL_OR_COMMAND_KEY}+shift+=,${CTRL_OR_COMMAND_KEY}+num_add,${CTRL_OR_COMMAND_KEY}+=`,
		hotkeysScope,
		tryCatchFalse(handleAddRow)
	);

	useHotkey('shift+x', hotkeysScope, tryCatchFalse(handleClearData));

	return (
		<Stack
			direction='row'
			spacing={1}
			css={`
				display: flex;
				height: 2rem;
				justify-content: space-between;
			`}
		>
			<div
				css={`
					display: flex;
				`}
			>
				{eltMode && saveAsEmbeddedLookupTableDialog}
				{setSidebarOpened ? (
					<ToolBarButton onClick={() => setSidebarOpened((sidebar) => !sidebar)}>
						<FontAwesomeIcon icon={sidebarOpened ? faAngleLeft : faAngleRight} size='1x' />
					</ToolBarButton>
				) : null}

				<ToolBarButton
					color='secondary'
					variant='outlined'
					tooltipTitle={`${CTRL_OR_COMMAND_TEXT} + "Plus Sign"`}
					onClick={handleAddRow}
					disabled={addRowButtonDisabled}
				>
					<FontAwesomeIcon
						icon={faPlus}
						css={`
							margin-right: 0.5rem;
						`}
					/>
					{addRowLabel}
				</ToolBarButton>
				{!eltMode && !hideLookupRows ? (
					<ToolBarButton
						color='secondary'
						variant='outlined'
						onClick={handleAddLookupRow}
						{...getTaggingProp('econModel', `add-${assumptionKey}-lookupRow`)}
					>
						<FontAwesomeIcon
							icon={faPlus}
							css={`
								margin-right: 0.5rem;
							`}
						/>
						Lookup Row
					</ToolBarButton>
				) : null}
				{organizeRows && (
					<ToolBarButton onClick={handleOrganizeRows} tooltipTitle='Shift + R'>
						{organizeRows.label}
					</ToolBarButton>
				)}
				<Divider
					css={`
						margin: 0 5px;
					`}
					orientation='vertical'
					flexItem
				/>
				<ToolBarButton onClick={handleResetColumns}>Reset</ToolBarButton>
				<ToolBarButton
					onClick={handleDeleteSelectedRows}
					tooltipTitle={`${CTRL_OR_COMMAND_TEXT} + -`}
					{...(eltMode ? {} : getTaggingProp('econModel', `deleteAdvanced-${assumptionKey}-model-rows`))}
				>
					Delete
				</ToolBarButton>
			</div>
			<div
				css={`
					display: flex;
				`}
			>
				{enableCollapsibleRows && (
					<>
						<ToolBarButton onClick={handleExpandAll} tooltipTitle='Shift + E'>
							Expand
						</ToolBarButton>
						<ToolBarButton onClick={handleCollapseAll} tooltipTitle='Shift + C'>
							Collapse
						</ToolBarButton>
					</>
				)}
				<ToolBarButton
					onClick={() => tableRef.current?.undoActions?.prevState()}
					disabled={!canUndo}
					tooltipTitle={`${CTRL_OR_COMMAND_TEXT} + Z`}
				>
					<FontAwesomeIcon icon={faUndo} size='1x' />
				</ToolBarButton>
				<ToolBarButton
					onClick={() => tableRef.current?.undoActions?.nextState()}
					disabled={!canRedo}
					tooltipTitle={`${CTRL_OR_COMMAND_TEXT} + Y`}
				>
					<FontAwesomeIcon icon={faRedo} size='1x' />
				</ToolBarButton>
				<Divider
					css={`
						margin: 0 5px;
					`}
					orientation='vertical'
					flexItem
				/>
				<MenuButton
					css={`
						height: 100%;
					`}
					label={<FontAwesomeIcon icon={faDownload} size='1x' />}
				>
					<ButtonItem
						label='Export to CSV'
						onClick={() => tableRef.current?.exportData(EXPORTS.CSV, ASSUMPTION_LABELS[assumptionKey])}
					/>

					<ButtonItem
						label='Export to Excel'
						onClick={() => tableRef.current?.exportData(EXPORTS.Excel, ASSUMPTION_LABELS[assumptionKey])}
					/>
				</MenuButton>
				<div css='flex: 1' />
				{shortcutsInfo.length > 0 && (
					<KeyboardShortcutsButton
						ref={keyboardShortcutsButtonRef}
						size='small'
						css={`
							margin: 0 7px 0 5px;
						`}
						panelWidth='30rem'
						portal
						blocks={shortcutsInfo}
						titlePostfix={eltMode ? '(Embedded Lookup Table)' : '(Advanced Model)'}
					/>
				)}
				{eltMode && (
					<>
						<Divider
							css={`
								margin: 0 5px;
							`}
							orientation='vertical'
							flexItem
						/>

						<ToolBarButton disabled={isELTSaveAsDisabled} color='secondary' onClick={handleELTSaveAs}>
							Save As
						</ToolBarButton>

						<ToolBarButton
							disabled={isELTSaveDisabled}
							color='secondary'
							variant='contained'
							onClick={handleELTSave}
						>
							Save
						</ToolBarButton>
						{/* Disabling this for now */}
						{false && !eltModeContext?.detached && eltModeContext?.onDetach && (
							<ToolBarButton onClick={eltModeContext?.onDetach}>
								<FontAwesomeIcon icon={faExpandArrowsAlt} size='lg' />
							</ToolBarButton>
						)}
						{!eltModeContext?.detached && eltModeContext?.onClose && (
							// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
							<ToolBarButton onClick={eltModeContext.onClose}>
								<FontAwesomeIcon icon={faTimes} size='lg' />
							</ToolBarButton>
						)}
					</>
				)}
				{!eltMode && !!onToggleV2 ? (
					<ToolBarButton
						color='secondary'
						variant='outlined'
						className='standard-view'
						onClick={handleToggleV2}
					>
						STANDARD VIEW
					</ToolBarButton>
				) : null}
			</div>
		</Stack>
	);
};

export default AdvancedModelToolbar;
