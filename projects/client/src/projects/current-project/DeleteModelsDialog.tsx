import { PropTypes } from '@material-ui/core';
import { CellClickedEvent, ICellRendererParams } from 'ag-grid-community';
import { AgGridColumn } from 'ag-grid-react';
import produce from 'immer';
import { omit } from 'lodash';
import { useCallback, useState } from 'react';
import { useQuery } from 'react-query';

import AgGrid from '@/components/AgGrid';
import { Button, CheckboxField, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@/components/v2';
import { withLoadingBar } from '@/helpers/alerts';
import { DialogProps } from '@/helpers/dialog';
import { getApi } from '@/helpers/routing';
import { AssumptionKey } from '@/inpt-shared/constants';
import { QUALIFIER_FIELDS } from '@/qualifiers/fields';

interface DeleteModelOptions {
	assignedNormal?: boolean;
	unassignedNormal?: boolean;
	assignedUnique?: boolean;
	unassignedUnique?: boolean;
}

interface AssumptionModelsUsingCounts {
	assignedNormal: number;
	unassignedNormal: number;
	assignedUnique: number;
	unassignedUnique: number;
}

type DeleteModelsDialogDialogProps = DialogProps<Record<string, DeleteModelOptions>> & {
	projectId: Inpt.ObjectId<'project'>;
};

const PROJECT_DELETABLE_MODELS = {
	[AssumptionKey.escalation]: 'Escalation',
	[AssumptionKey.depreciation]: 'Depreciation',
	[AssumptionKey.generalOptions]: 'General Options',
	[AssumptionKey.fluidModel]: 'Fluid Model',
};
const DELETABLE_MODELS = {
	...omit(QUALIFIER_FIELDS, [AssumptionKey.forecast, AssumptionKey.forecastPSeries, AssumptionKey.schedule]),
	...PROJECT_DELETABLE_MODELS,
};

const SELECTABLE_COLUMNS = [
	{
		key: 'assignedUnique',
		label: 'Assigned Unique',
	},
	{
		key: 'unassignedUnique',
		label: 'Unassigned Unique',
	},
	{
		key: 'assignedNormal',
		label: 'Assigned Model',
	},
	{
		key: 'unassignedNormal',
		label: 'Unassigned Model',
	},
];

const ROWS = Object.entries(DELETABLE_MODELS).map(([assKey, assLabel]) => ({
	assumptionKey: assKey,
	assumption: assLabel,
	assignedNormal: false,
	unassignedNormal: false,
	assignedUnique: false,
	unassignedUnique: false,
}));

const getProjectEconModelsCountsQueryKey = (projectId: Inpt.ObjectId<'project'>) => [
	`project-econ-models-counts-${projectId}`,
];

const staticHeader = (headerName: string, align: PropTypes.Alignment = 'left') => (
	<Typography align={align} display='block' css='font-weight: 600; width: 100%'>
		{headerName}
	</Typography>
);

const renderLeftAlignedStaticHeader = ({
	column: {
		colDef: { headerName },
	},
}) => staticHeader(headerName);

const renderRightAlignedStaticHeader = ({
	column: {
		colDef: { headerName },
	},
}) => staticHeader(headerName, 'right');

const renderStaticCell = (props: ICellRendererParams) => (
	<Typography css='line-height: 38px;'>{props.value}</Typography>
);

const DeleteModelsDialog = ({ resolve, onHide, visible, projectId, ...props }: DeleteModelsDialogDialogProps) => {
	const [options, setOptions] = useState<Record<string, DeleteModelOptions>>({});
	const [rowData] = useState(ROWS);
	const [counts, setCounts] = useState<Record<string, AssumptionModelsUsingCounts>>({});

	useQuery(
		getProjectEconModelsCountsQueryKey(projectId),
		async () => {
			const assumptionKeys = Object.keys(DELETABLE_MODELS);
			const promises: Promise<AssumptionModelsUsingCounts>[] = assumptionKeys.map((ak) =>
				getApi(`/projects/${projectId}/models/${ak}`)
			);

			const modelsCounts = await withLoadingBar(Promise.all(promises));

			const calculatedCounts: Record<string, AssumptionModelsUsingCounts> = {};
			assumptionKeys.forEach((assKey, index) => {
				calculatedCounts[assKey] = modelsCounts[index];
			});

			return calculatedCounts;
		},
		{
			onSuccess: (calculatedCounts) => {
				setCounts(calculatedCounts);
			},
		}
	);

	const onChangeSelection = useCallback((assumption: string, field: string, checked: boolean) => {
		setOptions(
			produce((draft) => {
				draft[assumption] = draft[assumption] || {};
				draft[assumption][field] = checked;
			})
		);
	}, []);

	const toggleAll = useCallback((field: string, checked: boolean) => {
		setOptions(
			produce((draft) => {
				Object.keys(DELETABLE_MODELS).forEach((q) => {
					draft[q] = draft[q] || {};
					draft[q][field] = checked;
				});
			})
		);
	}, []);

	const renderHeader = ({
		column: {
			colDef: { field, headerName },
		},
	}) => {
		const allChecked = !Object.keys(DELETABLE_MODELS).find((q) => !options[q]?.[field]);

		return (
			<CheckboxField
				css={`
					.MuiFormControlLabel-label {
						font-weight: 600;
					}
				`}
				label={headerName}
				checked={allChecked}
				onChange={(e) => toggleAll(field, e.target.checked)}
			/>
		);
	};

	const cellRenderer = (props: ICellRendererParams) => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		const field = props.colDef!.field!;
		const assumptionKey = props.data.assumptionKey;
		const checked = options[assumptionKey]?.[field];

		return (
			<>
				<CheckboxField
					css='display: block; position: absolute; top: -2px'
					label=''
					checked={checked}
					onChange={(e) => {
						e.stopPropagation();
						onChangeSelection(assumptionKey, field, e.target.checked);
					}}
				/>
				{checked && counts[assumptionKey] && (
					<Typography css='display: block; position: absolute; left: 45px; top: 8px;'>
						{counts[assumptionKey][field]}
					</Typography>
				)}
			</>
		);
	};

	const totalCellRenderer = (props: ICellRendererParams) => {
		const assumptionKey = props.data.assumptionKey;
		const checkedModels = options[assumptionKey];
		const modelsCounts = counts[assumptionKey];
		let total = 0;

		if (checkedModels && modelsCounts) {
			if (checkedModels.assignedNormal) {
				total += modelsCounts.assignedNormal;
			}

			if (checkedModels.unassignedNormal) {
				total += modelsCounts.unassignedNormal;
			}

			if (checkedModels.assignedUnique) {
				total += modelsCounts.assignedUnique;
			}

			if (checkedModels.unassignedUnique) {
				total += modelsCounts.unassignedUnique;
			}
		}

		return (
			<Typography css='line-height: 38px;' align='right'>
				{total}
			</Typography>
		);
	};

	const onCellClicked = (event: CellClickedEvent) => {
		onChangeSelection(
			event.data.assumptionKey,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			event.colDef.field!,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			!options[event.data.assumptionKey]?.[event.colDef.field!]
		);
	};

	const isDeleteEnabled = () => {
		return Object.keys(options).find((assumption) => Object.values(options[assumption]).find((flag) => flag));
	};

	return (
		<Dialog onClose={onHide} open={visible} maxWidth='lg' fullWidth {...props}>
			<DialogTitle>Delete Models</DialogTitle>
			<DialogContent>
				<AgGrid
					rowData={rowData}
					css='height: 515px;'
					suppressContextMenu
					suppressMovableColumns
					onGridReady={(params) => {
						params.api.sizeColumnsToFit();
					}}
				>
					<AgGridColumn
						key='assumption'
						field='assumption'
						headerName='Assumption'
						suppressMenu
						headerComponent={renderLeftAlignedStaticHeader}
						cellRenderer={renderStaticCell}
					/>
					{SELECTABLE_COLUMNS.map(({ key, label }) => (
						<AgGridColumn
							cellStyle={{ cursor: 'pointer' }}
							key={key}
							field={key}
							headerName={label}
							cellRenderer={cellRenderer}
							headerComponent={renderHeader}
							onCellClicked={onCellClicked}
						/>
					))}
					<AgGridColumn
						key='total'
						field='total'
						headerName='Total'
						cellRenderer={totalCellRenderer}
						headerComponent={renderRightAlignedStaticHeader}
						suppressMenu
					/>
				</AgGrid>
			</DialogContent>
			<DialogActions css='padding: 12px 16px;'>
				<Button onClick={onHide}>Cancel</Button>
				<Button color='error' onClick={() => resolve(options)} disabled={!isDeleteEnabled()}>
					Delete
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default DeleteModelsDialog;
