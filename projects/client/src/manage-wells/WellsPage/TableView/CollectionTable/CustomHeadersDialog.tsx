import { RowNode } from 'ag-grid-community';
import produce from 'immer';
import _ from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { useMutation } from 'react-query';

import { PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS, usePermissions } from '@/access-policies/usePermissions';
import AgGrid_, { Editors, withAgGridSelection } from '@/components/AgGrid';
import { useMap, useSelection } from '@/components/hooks';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@/components/v2';
import { confirm } from '@/components/v2/alerts';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { confirmationAlert, genericErrorAlert, useDoggo } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { DialogProps } from '@/helpers/dialog';
import { useWellHeaders } from '@/helpers/headers';
import {
	ProjectCustomHeader,
	deleteProjectCustomHeaders,
	getProjectCustomHeadersQueryKey,
	updateProjectCustomHeadersConfiguration,
	useProjectCustomHeadersQuery,
} from '@/helpers/project-custom-headers';
import { queryClient } from '@/helpers/query-cache';
import { theme } from '@/helpers/styled';
import { pluralize, titleize } from '@/helpers/text';
import { getAutoIncrementedName } from '@/helpers/utilities';
import { PROJECT_CUSTOM_HEADER_KEY_PREFIX } from '@/inpt-shared/project/project-custom-headers/constants';
import { useWellsCollectionsQuery } from '@/wells-collections/queries';

const AgGrid = withAgGridSelection(AgGrid_);

type NewProjectCustomHeader = ProjectCustomHeader & { newHeader: true };

type CustomHeadersDialogProps = DialogProps<{ newHeaders: string[] }>;

const MAX_HEADERS = 50;
const MAX_LABEL_LENGTH = 30;
const COLUMN_TYPE_OPTIONS = {
	'multi-select': 'string',
	number: 'number',
	boolean: 'boolean',
	date: 'date',
	percent: 'percent',
};

function CustomHeadersDialog({
	visible,
	onHide,
	resolve,
	isWellHeader,
}: CustomHeadersDialogProps & { isWellHeader: (name: string) => boolean }) {
	const { project } = useAlfa();

	if (!project) {
		throw new Error('Custom Headers Dialog can only be called inside a project');
	}

	const {
		canCreate: canCreateProjectHeaders,
		canCreate: canDeleteProjectHeaders,
		canUpdate: canUpdateProjectHeaders,
	} = usePermissions(SUBJECTS.ProjectCustomHeaders, project?._id);

	const { wellHeadersLabels } = useWellHeaders();

	const { isWellsCollectionsEnabled: wellsCollectionsEnabled } = useLDFeatureFlags();
	const projectCustomHeadersQuery = useProjectCustomHeadersQuery(project._id);
	const { invalidate: invalidateWellsCollections } = useWellsCollectionsQuery(project._id, true);

	const {
		state: oldColumnsChanges,
		setState: setOldColumnsChanges,
		set: setOldColumn,
	} = useMap<string, { label: string }>();

	const oldColumns = useMemo(
		() =>
			projectCustomHeadersQuery.data?.headers.map((col) => {
				const newLabel = oldColumnsChanges.get(col.name)?.label;
				if (newLabel != null) {
					return { ...col, label: newLabel };
				}
				return col;
			}) ?? [],
		[oldColumnsChanges, projectCustomHeadersQuery.data?.headers]
	);

	const [newColumns, setNewColumns] = useState<NewProjectCustomHeader[]>([]);

	const invalidate = () => {
		queryClient.invalidateQueries(getProjectCustomHeadersQueryKey(project._id));
		invalidateWellsCollections();
	};

	// TODO make the mutation optimistic
	const saveMutation = useMutation(
		async () =>
			updateProjectCustomHeadersConfiguration(project._id, {
				newHeaders: newColumns,
				modifiedHeaders: Object.fromEntries(oldColumnsChanges),
			}),
		{
			onSuccess: () => {
				confirmationAlert('Columns configuration updated');
				setOldColumnsChanges(new Map());
			},
			onError: (error) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				genericErrorAlert(error as any);
			},
			onSettled: () => {
				setNewColumns([]);
				invalidate();
			},
		}
	);

	// TODO make the mutation optimistic
	const deleteMutation = useMutation(
		async ({ headersNames }: { headersNames: string[] }) => deleteProjectCustomHeaders(project._id, headersNames),
		{
			onSuccess: () => {
				confirmationAlert('Headers Successfully Deleted');
			},
			onSettled: invalidate,
		}
	);

	const handleAddColumn = () => {
		const existingNames = _.map([...oldColumns, ...newColumns], 'name');
		const newName = getAutoIncrementedName(PROJECT_CUSTOM_HEADER_KEY_PREFIX, existingNames, '_');
		setNewColumns((p) => [
			...p,
			{ name: newName, headerType: { type: 'multi-select' }, label: titleize(newName), newHeader: true },
		]);
	};

	const selection = useSelection();

	const handleDeleteSelectedColumns = async () => {
		const amountSelected = selection.selectedSet.size;

		if (
			!(await confirm({
				title: 'Are you sure?',
				children: (
					<>
						<p>
							Deleting {pluralize(amountSelected, 'this column', 'these columns', false)} will have the
							following effects:
						</p>
						<ul>
							<li>
								Removing all values assigned to the{' '}
								{pluralize(amountSelected, 'column', 'columns', false)} (wells)
							</li>
							{wellsCollectionsEnabled && (
								<li>
									Removing all values assigned to the{' '}
									{pluralize(amountSelected, 'column', 'columns', false)} (wells collections)
								</li>
							)}
							<li>
								Removing <b>all rules</b> for embedded lookup tables that use the{' '}
								{pluralize(amountSelected, 'column', 'columns', false)}.
							</li>
						</ul>
						<p>Are you sure you want to proceed?</p>
					</>
				),
				confirmText: 'Delete',
				confirmColor: 'error',
			}))
		) {
			return;
		}

		// needs to divide new columns from saved columns to: 1- delete new columns from the state, 2- delete saved columns from the db
		const notSelectedColumns = newColumns.filter((column) => !selection.isSelected(column.name));
		setNewColumns(notSelectedColumns);

		const selectedSavedColumns = oldColumns.filter((header) => selection.isSelected(header.name)) ?? [];
		if (selectedSavedColumns.length) {
			deleteMutation.mutate({ headersNames: _.map(selectedSavedColumns, 'name') });
		}
		selection.deselectAll();
	};

	const handleSave = () => saveMutation.mutateAsync().then(() => resolve({ newHeaders: _.map(newColumns, 'name') }));

	const isMutating = saveMutation.isLoading || deleteMutation.isLoading;

	const isNodeEditable = useCallback(
		(node: RowNode, field: string) => {
			if (isMutating) {
				return false;
			}
			if (field === 'label') {
				return true;
			}
			return !!node.data.newHeader;
		},
		[isMutating]
	);

	const columnsWithValidation = useMemo(() => {
		const allColumns = _.reverse([...oldColumns, ...newColumns]);

		const labelCount = {} as Record<string, number>;
		[
			...(_.map(wellHeadersLabels) as string[]),
			..._.map(oldColumns, 'label'),
			..._.map(newColumns, 'label'),
		].forEach((value) => {
			labelCount[value.toLowerCase()] ??= 0;
			labelCount[value.toLowerCase()]++;
		});

		return allColumns.map((currentCol) => {
			return {
				...currentCol,
				error: (() => {
					if (isWellHeader(currentCol?.label)) {
						return 'Name cannot be well header';
					}
					if (labelCount[currentCol.label.toLowerCase()] > 1) {
						return 'Name is not unique';
					}
					if (currentCol.label === '') {
						return 'Name is empty';
					}
					if (currentCol.label.length > MAX_LABEL_LENGTH) {
						return 'Name cannot exceed 30 characters';
					}
					return '';
				})(),
				typeError: (() => {
					if (!currentCol?.headerType.type) {
						return 'Type is empty';
					}
					return '';
				})(),
			};
		});
	}, [newColumns, oldColumns, wellHeadersLabels, isWellHeader]);

	const hasErrors = useMemo(
		() => !!columnsWithValidation.find((column) => column.error !== '' || column.typeError !== ''),
		[columnsWithValidation]
	);

	useDoggo(saveMutation.isLoading);

	const tooManyHeaders = columnsWithValidation.length > MAX_HEADERS;

	return (
		<Dialog onClose={onHide} open={visible} fullWidth>
			<DialogTitle>Project Custom Headers</DialogTitle>
			<DialogContent css={{ '& > *:not(:first-child)': { marginTop: '1rem' } }}>
				<div css={{ display: 'flex', justifyContent: 'space-between' }}>
					<Button
						variant='contained'
						color='secondary'
						onClick={handleAddColumn}
						disabled={
							(!canCreateProjectHeaders && PERMISSIONS_TOOLTIP_MESSAGE) ||
							columnsWithValidation.length >= MAX_HEADERS
						}
					>
						Add Column
					</Button>
					<Button
						color='secondary'
						disabled={
							(!canDeleteProjectHeaders && PERMISSIONS_TOOLTIP_MESSAGE) ||
							selection.selectedSet.size === 0 ||
							isMutating
						}
						onClick={handleDeleteSelectedColumns}
					>
						Delete
					</Button>
				</div>
				<AgGrid
					css={{ height: '20rem' }}
					suppressReactUi
					rowData={columnsWithValidation}
					getRowNodeId='name'
					selection={selection}
					rowSelection='multiple'
					suppressRowClickSelection
					suppressLastEmptyLineOnPaste // fixes excel issue https://www.ag-grid.com/javascript-data-grid/grid-properties/#reference-clipboard
					stopEditingWhenCellsLoseFocus
					defaultColDef={{
						flex: 1,
						// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
						cellStyle: (params): any => {
							if (!params.colDef.field) {
								return {};
							}
							if (!isNodeEditable(params.node, params.colDef.field)) {
								return { color: theme.grey };
							}
							if (params.node.data.error && params.colDef.field === 'label') {
								return { 'border-color': 'red' };
							}
							if (params.node.data.typeError && params.colDef.field === 'headerType.type') {
								return { 'border-color': 'red' };
							}
							return {};
						},
						editable: (params) =>
							params.colDef.field ? isNodeEditable(params.node, params.colDef.field) : false,
					}}
					tooltipShowDelay={50}
					columnDefs={[
						{
							flex: 0,
							width: 60,
							headerName: '',
							field: '',
							headerCheckboxSelection: true,
							checkboxSelection: true,
							editable: false,
							lockPosition: true,
							suppressMenu: true,
						},
						{
							headerName: 'Column Name',
							field: 'label',
							tooltipField: 'error',
						},
						{
							headerName: 'Column Type',
							field: 'headerType.type',
							valueFormatter: ({ value }) => COLUMN_TYPE_OPTIONS[value],
							tooltipField: 'typeError',
							cellEditor: Editors.AutocompleteEditor,
							cellEditorParams: {
								options: Object.keys(COLUMN_TYPE_OPTIONS),
								getOptionLabel: (key) => COLUMN_TYPE_OPTIONS[key],
								disableClearable: true,
							},
						},
					]}
					onCellValueChanged={(ev) => {
						if (!ev.node.id) {
							return;
						}
						const key = ev.colDef.field;
						if (!key) {
							return;
						}
						if (_.find(newColumns, { name: ev.node.id })) {
							setNewColumns((p) =>
								produce(p, (draft) => {
									const newColumn = draft[_.findIndex(p, { name: ev.node.id })];
									newColumn[key] = ev.newValue;
									if (key === 'headerType.type' && ev.newValue === 'date') {
										newColumn['headerType.kind'] = 'date';
									}
								})
							);
						} else {
							// saved "old" headers
							setOldColumn(ev.node.id, { label: ev.newValue?.trim() });
						}
					}}
				/>
				{tooManyHeaders && (
					<ul>
						<li>
							<Typography color='error'>Cannot create more than {MAX_HEADERS} columns</Typography>
						</li>
					</ul>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Close</Button>
				<Button
					variant='contained'
					color='secondary'
					onClick={handleSave}
					disabled={
						(!canUpdateProjectHeaders && PERMISSIONS_TOOLTIP_MESSAGE) ||
						(newColumns.length === 0 && oldColumnsChanges.size === 0) ||
						isMutating ||
						hasErrors ||
						tooManyHeaders
					}
				>
					Save
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default CustomHeadersDialog;
