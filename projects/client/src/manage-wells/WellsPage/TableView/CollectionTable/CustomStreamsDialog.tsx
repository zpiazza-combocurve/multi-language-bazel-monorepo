import { RowNode } from 'ag-grid-community';
import produce from 'immer';
import _ from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { useMutation } from 'react-query';

import { PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS, usePermissions } from '@/access-policies/usePermissions';
import AgGrid_, { withAgGridSelection } from '@/components/AgGrid';
import { useMap, useSelection } from '@/components/hooks';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@/components/v2';
import { confirm } from '@/components/v2/alerts';
import { confirmationAlert, genericErrorAlert, useDoggo } from '@/helpers/alerts';
import { DialogProps } from '@/helpers/dialog';
import { useCustomFields } from '@/helpers/headers';
import {
	CUSTOM_STREAM_COLORS,
	ProjectCustomStream,
	deleteProjectCustomStreams,
	getProjectCustomStreamsQueryKey,
	updateProjectCustomStreamsConfiguration,
	useProjectCustomStreamsQuery,
} from '@/helpers/project-custom-streams';
import { queryClient } from '@/helpers/query-cache';
import { theme } from '@/helpers/styled';
import { pluralize, titleize } from '@/helpers/text';
import { getAutoIncrementedName } from '@/helpers/utilities';
import {
	MAX_PROJECT_CUSTOM_STREAMS,
	PROJECT_CUSTOM_STREAM_KEY_PREFIX,
} from '@/inpt-shared/project/project-custom-streams/constants';
import ColorPickerEditor from '@/scheduling/ScheduleLandingPage/components/AgGrid/Editors/ColorPickerEditor';
import ColoredCircleRenderer from '@/scheduling/ScheduleLandingPage/components/AgGrid/Renderers/ColoredCircleRenderer';

import { DAILY_PRODUCTION_HEADERS, MONTHLY_PRODUCTION_HEADERS } from './shared';

const AgGrid = withAgGridSelection(AgGrid_);

type NewProjectCustomStream = ProjectCustomStream & { newStream: true };

type CustomStreamsDialogProps = DialogProps<{ newStreams: string[] }> & {
	projectId: Inpt.ObjectId<'project'>;
};

const MAX_LABEL_LENGTH = 30;
const MAX_UNIT_LENGTH = 10;

const PRODUCTION_DATA_COLUMN_NAMES = [
	...new Set([
		...Object.values(DAILY_PRODUCTION_HEADERS).map((v) => v.toLocaleLowerCase()),
		...Object.values(MONTHLY_PRODUCTION_HEADERS).map((v) => v.toLocaleLowerCase()),
	]),
];

function CustomStreamsDialog({ visible, onHide, resolve, projectId }: CustomStreamsDialogProps) {
	const {
		canCreate: canCreateProjectStreams,
		canCreate: canDeleteProjectStreams,
		canUpdate: canUpdateProjectStreams,

		// TODO: change subject to ProjectCustomStreams when it will be added
	} = usePermissions(SUBJECTS.ProjectCustomHeaders, projectId);

	const { data: monthlyCompany } = useCustomFields('monthly-productions');
	const { data: dailyCompany } = useCustomFields('daily-productions');

	const allExistingColumnNames = useMemo(
		() => [
			...new Set([
				...PRODUCTION_DATA_COLUMN_NAMES,
				...Object.values(monthlyCompany ?? {}).map((v) => (v as string).toLocaleLowerCase()),
				...Object.values(dailyCompany ?? {}).map((v) => (v as string).toLocaleLowerCase()),
			]),
		],
		[dailyCompany, monthlyCompany]
	);

	const projectCustomStreamsQuery = useProjectCustomStreamsQuery(projectId);

	const {
		state: oldColumnsChanges,
		setState: setOldColumnsChanges,
		set: setOldColumn,
	} = useMap<string, { label: string; color: string; unit: string }>();

	const oldColumns = useMemo(
		() =>
			projectCustomStreamsQuery.data?.streams.map((col) => {
				const newLabel = oldColumnsChanges.get(col.name)?.label;
				if (newLabel != null) {
					return { ...col, label: newLabel };
				}
				return col;
			}) ?? [],
		[oldColumnsChanges, projectCustomStreamsQuery.data?.streams]
	);

	const [newColumns, setNewColumns] = useState<NewProjectCustomStream[]>([]);

	const invalidate = () => {
		queryClient.invalidateQueries(getProjectCustomStreamsQueryKey(projectId));
	};

	// TODO make the mutation optimistic
	const saveMutation = useMutation(
		async () =>
			updateProjectCustomStreamsConfiguration(projectId, {
				newStreams: newColumns,
				modifiedStreams: Object.fromEntries(oldColumnsChanges),
			}),
		{
			onSuccess: () => {
				confirmationAlert('Columns updated!');
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
		async ({ streamsNames }: { streamsNames: string[] }) => deleteProjectCustomStreams(projectId, streamsNames),
		{
			onSuccess: () => {
				confirmationAlert('Columns successfully deleted!');
			},
			onSettled: invalidate,
		}
	);

	const handleAddColumn = () => {
		const existingColors = _.map([...oldColumns, ...newColumns], 'color');
		const newColor = CUSTOM_STREAM_COLORS.find((color) => !existingColors.includes(color));

		if (newColor) {
			const existingNames = _.map([...oldColumns, ...newColumns], 'name');
			const newName = getAutoIncrementedName(PROJECT_CUSTOM_STREAM_KEY_PREFIX, existingNames, '_');

			setNewColumns((p) => [
				...p,
				{ name: newName, label: titleize(newName), newStream: true, unit: '', color: newColor },
			]);
		}
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
								{pluralize(amountSelected, 'column', 'columns', false)} (production data records)
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

		const selectedSavedColumns = oldColumns.filter((stream) => selection.isSelected(stream.name)) ?? [];
		if (selectedSavedColumns.length) {
			deleteMutation.mutate({ streamsNames: _.map(selectedSavedColumns, 'name') });
		}
		selection.deselectAll();
	};

	const handleSave = () => saveMutation.mutateAsync().then(() => resolve({ newStreams: _.map(newColumns, 'name') }));

	const isMutating = saveMutation.isLoading || deleteMutation.isLoading;

	const isNodeEditable = useCallback(
		(node: RowNode, field: string) => {
			if (isMutating) {
				return false;
			}
			if (field === 'label' || field === 'color' || field === 'unit') {
				return true;
			}
			return !!node.data.newStream;
		},
		[isMutating]
	);

	const columnsWithValidation = useMemo(() => {
		const allColumns = _.reverse([...oldColumns, ...newColumns]);

		const labelCount = {} as Record<string, number>;
		[...allExistingColumnNames, ..._.map(oldColumns, 'label'), ..._.map(newColumns, 'label')].forEach((value) => {
			labelCount[value.toLowerCase()] ??= 0;
			labelCount[value.toLowerCase()]++;
		});

		const colorCount = {} as Record<string, number>;
		[..._.map(oldColumns, 'color'), ..._.map(newColumns, 'color')].forEach((value) => {
			colorCount[value.toLowerCase()] ??= 0;
			colorCount[value.toLowerCase()]++;
		});

		return allColumns.map((currentCol) => {
			return {
				...currentCol,
				error: (() => {
					if (allExistingColumnNames.includes(currentCol?.label?.toLocaleLowerCase())) {
						return 'Name is already taken';
					}
					if (labelCount[currentCol?.label?.toLowerCase()] > 1) {
						return 'Name is not unique';
					}
					if (currentCol?.label === '') {
						return 'Name is empty';
					}
					if (currentCol?.label?.length > MAX_LABEL_LENGTH) {
						return `Name cannot exceed ${MAX_LABEL_LENGTH} characters`;
					}
					return '';
				})(),
				colorError: (() => {
					if (colorCount[currentCol?.color?.toLowerCase()] > 1) {
						return 'Color is not unique';
					}
					return '';
				})(),
				unitError: (() => {
					if (currentCol?.unit?.length > MAX_UNIT_LENGTH) {
						return `Unit cannot exceed ${MAX_UNIT_LENGTH} characters`;
					}
					return '';
				})(),
			};
		});
	}, [allExistingColumnNames, newColumns, oldColumns]);

	const hasErrors = useMemo(
		() => !!columnsWithValidation.find((column) => column.error !== '' || column.colorError !== ''),
		[columnsWithValidation]
	);

	useDoggo(saveMutation.isLoading);

	const tooManyStreams = columnsWithValidation.length > MAX_PROJECT_CUSTOM_STREAMS;

	return (
		<Dialog onClose={onHide} open={visible} fullWidth>
			<DialogTitle>Project Custom Streams</DialogTitle>
			<DialogContent css={{ '& > *:not(:first-child)': { marginTop: '1rem' } }}>
				<div css={{ display: 'flex', justifyContent: 'space-between' }}>
					<Button
						variant='contained'
						color='secondary'
						onClick={handleAddColumn}
						disabled={
							(!canCreateProjectStreams && PERMISSIONS_TOOLTIP_MESSAGE) ||
							columnsWithValidation.length >= MAX_PROJECT_CUSTOM_STREAMS
						}
					>
						Add Column
					</Button>
					<Button
						color='secondary'
						disabled={
							(!canDeleteProjectStreams && PERMISSIONS_TOOLTIP_MESSAGE) ||
							selection.selectedSet.size === 0 ||
							isMutating
						}
						onClick={handleDeleteSelectedColumns}
					>
						Delete
					</Button>
				</div>
				<AgGrid
					css={`
						height: 20rem;
						width: 100%;

						.color-cell .ag-react-container {
							height: 100%;

							> div {
								height: 100%;
								margin-left: 0;
							}
						}
					`}
					suppressReactUi
					rowData={columnsWithValidation}
					getRowNodeId='name'
					selection={selection}
					rowSelection='multiple'
					suppressRowClickSelection
					suppressLastEmptyLineOnPaste // fixes excel issue https://www.ag-grid.com/javascript-data-grid/grid-properties/#reference-clipboard
					defaultColDef={{
						// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
						cellStyle: (params): any => {
							if (!params.colDef.field) {
								return {};
							}
							if (!isNodeEditable(params.node, params.colDef.field)) {
								return { color: theme.grey };
							}
							if (
								(params.node.data.error && params.colDef.field === 'label') ||
								(params.node.data.colorError && params.colDef.field === 'color') ||
								(params.node.data.unitError && params.colDef.field === 'unit')
							) {
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
							headerName: 'Color',
							width: 90,
							field: 'color',
							tooltipField: 'colorError',
							cellRenderer: ColoredCircleRenderer,
							cellEditor: ColorPickerEditor,
							cellEditorParams: {
								presetColors: CUSTOM_STREAM_COLORS,
							},
							cellClass: ['color-cell'],
						},
						{
							headerName: 'Name',
							field: 'label',
							tooltipField: 'error',
						},
						{
							headerName: 'Unit',
							field: 'unit',
							tooltipField: 'unitError',
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
								})
							);
						} else {
							const old =
								oldColumnsChanges.get(ev.node.id) ?? _.pick(ev.data, ['label', 'color', 'unit']);

							if (old) {
								setOldColumn(ev.node.id, {
									...old,
									[key]: ev.newValue?.trim(),
								});
							}
						}
					}}
				/>
				{tooManyStreams && (
					<ul>
						<li>
							<Typography color='error'>
								Cannot create more than {MAX_PROJECT_CUSTOM_STREAMS} columns
							</Typography>
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
						(!canUpdateProjectStreams && PERMISSIONS_TOOLTIP_MESSAGE) ||
						(newColumns.length === 0 && oldColumnsChanges.size === 0) ||
						isMutating ||
						hasErrors ||
						tooManyStreams
					}
				>
					Save
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default CustomStreamsDialog;
