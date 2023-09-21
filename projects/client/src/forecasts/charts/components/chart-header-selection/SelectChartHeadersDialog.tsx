import { faPlus, faUserCog } from '@fortawesome/pro-regular-svg-icons';
import { DialogActions, DialogContent, DialogTitle } from '@material-ui/core';
import produce from 'immer';
import { useCallback, useContext } from 'react';

import { useDerivedState } from '@/components/hooks';
import { Box, Button, Dialog, IconButton } from '@/components/v2';
import { ChartHeaderContext } from '@/forecasts/charts/components/chart-header-selection/ChartHeaderContext';
import { DialogProps } from '@/helpers/dialog';
import { useProjectWellColumns, useWellColumns } from '@/well-sort/WellSort';
import { SortableColumnList } from '@/well-sort/WellSort/WellSortingDialog/SortableColumnList';
import { useAvailableWellColumns } from '@/well-sort/WellSort/shared';

// exclusionary array for fields that will be included in the ChartTitle by default
const EXCLUDE_HEADERS: string[] = [];

const excludeFieldCriteria = (field: string) => EXCLUDE_HEADERS.includes(field);

const SelectChartHeadersDialog = ({ onHide, resolve: _resolve, visible }: DialogProps<void>) => {
	const { chartHeaders, projectChartHeaders, setChartHeaders, setProjectChartHeaders, showConfigDialog } =
		useContext(ChartHeaderContext);

	const [sortedColumns, setSortedColumns] = useDerivedState(chartHeaders);
	const [sortedProjectColumns, setSortedProjectColumns] = useDerivedState(projectChartHeaders);

	const onCancel = useCallback(() => {
		// ensure that the headers reset from temporary state (ex if the user removes a header but does not apply)
		setSortedColumns(chartHeaders);
		setSortedProjectColumns(projectChartHeaders);
		onHide();
	}, [chartHeaders, onHide, projectChartHeaders, setSortedColumns, setSortedProjectColumns]);

	const onApply = useCallback(() => {
		setChartHeaders(sortedColumns);
		setProjectChartHeaders(sortedProjectColumns);
		onHide();
	}, [onHide, setChartHeaders, setProjectChartHeaders, sortedColumns, sortedProjectColumns]);

	const columns = useWellColumns(excludeFieldCriteria);
	const projectColumns = useProjectWellColumns();

	const availableColumnsKey = useAvailableWellColumns(columns, sortedColumns);
	const availableProjectColumnsKey = useAvailableWellColumns(projectColumns, sortedProjectColumns);

	const addColumn = () => {
		setSortedColumns(
			produce((draft) => {
				if (availableColumnsKey?.length) {
					draft.push({ field: availableColumnsKey[0], selected: false });
				}
			})
		);
	};

	const addProjectColumn = () => {
		setSortedProjectColumns(
			produce((draft) => {
				if (availableProjectColumnsKey?.length) {
					draft.push({ field: availableProjectColumnsKey[0], selected: false });
				}
			})
		);
	};

	return (
		<Dialog fullWidth open={visible} maxWidth='md'>
			<DialogTitle>
				<Box alignItems='center' display='flex' justifyContent='space-between' width='100%'>
					Select Chart Headers
					<IconButton
						color='primary'
						onClick={() => showConfigDialog(sortedColumns)}
						tooltipTitle='Saved Configurations'
					>
						{faUserCog}
					</IconButton>
				</Box>
			</DialogTitle>

			<DialogContent css='height: 750px'>
				<SortableColumnList
					allowEmpty={false}
					availableColumnsKey={availableColumnsKey}
					columns={columns}
					selectable
					selectTooltipLabel='Show All Characters'
					setSortedColumns={setSortedColumns}
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					sortedColumns={sortedColumns as any}
					usesDirections={false}
				/>

				<SortableColumnList
					allowEmpty
					availableColumnsKey={availableProjectColumnsKey}
					columns={projectColumns}
					headersLabel='Project Headers'
					selectable
					selectTooltipLabel='Show All Characters'
					setSortedColumns={setSortedProjectColumns}
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					sortedColumns={sortedProjectColumns as any}
					usesDirections={false}
				/>
			</DialogContent>

			<DialogActions>
				<Box display='flex' justifyContent='space-between' width='100%'>
					<div>
						<Button
							css='margin-right: 0.5rem;'
							color='secondary'
							disabled={!availableColumnsKey?.length}
							endIcon={faPlus}
							onClick={addColumn}
							variant='contained'
						>
							Add Field
						</Button>

						<Button
							color='secondary'
							disabled={!availableProjectColumnsKey?.length}
							endIcon={faPlus}
							onClick={addProjectColumn}
							variant='contained'
						>
							Add Project Field
						</Button>
					</div>

					<div>
						<Button css='margin-right: 0.5rem;' onClick={onCancel}>
							Cancel
						</Button>

						<Button color='primary' disabled={!sortedColumns?.length} onClick={onApply}>
							Apply
						</Button>
					</div>
				</Box>
			</DialogActions>
		</Dialog>
	);
};

export default SelectChartHeadersDialog;
